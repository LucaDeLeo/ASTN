import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'
import { log } from '../lib/logging'

export const getUnenrichedOpportunities = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('opportunities'),
      title: v.string(),
      organization: v.string(),
      location: v.string(),
      isRemote: v.boolean(),
      roleType: v.string(),
      experienceLevel: v.optional(v.string()),
      description: v.string(),
      requirements: v.optional(v.array(v.string())),
      opportunityType: v.optional(
        v.union(v.literal('job'), v.literal('event')),
      ),
      eventType: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const opportunities = await ctx.db
      .query('opportunities')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect()

    const unenriched = opportunities.filter(
      (opp) => opp.enrichedAt === undefined,
    )

    return unenriched.map((opp) => ({
      _id: opp._id,
      title: opp.title,
      organization: opp.organization,
      location: opp.location,
      isRemote: opp.isRemote,
      roleType: opp.roleType,
      experienceLevel: opp.experienceLevel,
      description: opp.description,
      requirements: opp.requirements,
      opportunityType: opp.opportunityType,
      eventType: opp.eventType,
    }))
  },
})

const enrichmentValidator = v.object({
  opportunityId: v.string(),
  location: v.optional(v.string()),
  experienceLevel: v.optional(v.string()),
  roleType: v.optional(v.string()),
  isRemote: v.optional(v.boolean()),
})

export const applyEnrichments = internalMutation({
  args: {
    enrichments: v.array(enrichmentValidator),
    batchIds: v.array(v.id('opportunities')),
  },
  returns: v.object({
    applied: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, { enrichments, batchIds }) => {
    let applied = 0
    let skipped = 0

    const enrichmentMap = new Map(enrichments.map((e) => [e.opportunityId, e]))

    for (const oppId of batchIds) {
      const opp = await ctx.db.get('opportunities', oppId)
      if (!opp || opp.status !== 'active') {
        skipped++
        continue
      }

      const enrichment = enrichmentMap.get(oppId)
      const fieldsToUpdate: Record<string, unknown> = {}
      const enrichedFields: Array<string> = []

      if (enrichment) {
        // Only apply location if current value is a placeholder
        if (
          enrichment.location &&
          opp.location.toLowerCase().includes('not specified')
        ) {
          fieldsToUpdate.location = enrichment.location
          enrichedFields.push('location')
        }

        // Only apply experienceLevel if currently missing
        if (enrichment.experienceLevel && !opp.experienceLevel) {
          fieldsToUpdate.experienceLevel = enrichment.experienceLevel
          enrichedFields.push('experienceLevel')
        }

        // Only apply roleType if current is "other" or new is more specific
        if (
          enrichment.roleType &&
          enrichment.roleType !== 'other' &&
          opp.roleType === 'other'
        ) {
          fieldsToUpdate.roleType = enrichment.roleType
          enrichedFields.push('roleType')
        }

        // Only apply isRemote if LLM disagrees with current value
        if (
          enrichment.isRemote !== undefined &&
          enrichment.isRemote !== opp.isRemote
        ) {
          fieldsToUpdate.isRemote = enrichment.isRemote
          enrichedFields.push('isRemote')
        }
      }

      // Mark as enriched regardless (so it's not reprocessed)
      await ctx.db.patch('opportunities', oppId, {
        ...fieldsToUpdate,
        enrichedAt: Date.now(),
        enrichedFields:
          enrichedFields.length > 0
            ? [...(opp.enrichedFields || []), ...enrichedFields]
            : opp.enrichedFields || [],
        updatedAt: Date.now(),
      })

      if (enrichedFields.length > 0) {
        applied++
      } else {
        skipped++
      }
    }

    log('info', 'Applied enrichments', { applied, skipped })
    return { applied, skipped }
  },
})
