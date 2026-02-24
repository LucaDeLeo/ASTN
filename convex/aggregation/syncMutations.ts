import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { log } from '../lib/logging'
import { isSimilarOpportunity } from './dedup'
import type { Id } from '../_generated/dataModel'

const opportunityValidator = v.object({
  sourceId: v.string(),
  source: v.union(
    v.literal('80k_hours'),
    v.literal('aisafety_com'),
    v.literal('aisafety_events'),
    v.literal('manual'),
  ),
  title: v.string(),
  organization: v.string(),
  location: v.string(),
  isRemote: v.boolean(),
  roleType: v.string(),
  experienceLevel: v.optional(v.string()),
  description: v.string(),
  requirements: v.optional(v.array(v.string())),
  salaryRange: v.optional(v.string()),
  deadline: v.optional(v.number()),
  sourceUrl: v.string(),
  postedAt: v.optional(v.number()),
  opportunityType: v.optional(v.union(v.literal('job'), v.literal('event'))),
  eventType: v.optional(v.string()),
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
})

export const upsertOpportunities = internalMutation({
  args: {
    opportunities: v.array(opportunityValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let inserted = 0
    let updated = 0
    let merged = 0

    // Phase 1: Check exact sourceId matches, collect unmatched opps
    const unmatchedOpps: Array<(typeof args.opportunities)[number]> = []

    for (const opp of args.opportunities) {
      const existing = await ctx.db
        .query('opportunities')
        .withIndex('by_source_id', (q) => q.eq('sourceId', opp.sourceId))
        .unique()

      if (existing) {
        // Update existing opportunity, protecting LLM-enriched fields
        const enrichedFields = existing.enrichedFields || []
        const patch: Record<string, unknown> = {
          title: opp.title,
          organization: opp.organization,
          description: opp.description,
          requirements: opp.requirements,
          salaryRange: opp.salaryRange,
          deadline: opp.deadline,
          postedAt: opp.postedAt,
          sourceUrl: opp.sourceUrl,
          opportunityType: opp.opportunityType,
          eventType: opp.eventType,
          startDate: opp.startDate,
          endDate: opp.endDate,
          lastVerified: Date.now(),
          updatedAt: Date.now(),
        }

        const updatedEnrichedFields = [...enrichedFields]

        if (enrichedFields.includes('location')) {
          const isPlaceholder =
            !opp.location ||
            opp.location.toLowerCase().includes('not specified')
          if (!isPlaceholder) {
            patch.location = opp.location
            const idx = updatedEnrichedFields.indexOf('location')
            if (idx !== -1) updatedEnrichedFields.splice(idx, 1)
          }
        } else {
          patch.location = opp.location
        }

        if (enrichedFields.includes('experienceLevel')) {
          if (opp.experienceLevel) {
            patch.experienceLevel = opp.experienceLevel
            const idx = updatedEnrichedFields.indexOf('experienceLevel')
            if (idx !== -1) updatedEnrichedFields.splice(idx, 1)
          }
        } else {
          patch.experienceLevel = opp.experienceLevel
        }

        if (enrichedFields.includes('roleType')) {
          if (opp.roleType && opp.roleType !== 'other') {
            patch.roleType = opp.roleType
            const idx = updatedEnrichedFields.indexOf('roleType')
            if (idx !== -1) updatedEnrichedFields.splice(idx, 1)
          }
        } else {
          patch.roleType = opp.roleType
        }

        if (enrichedFields.includes('isRemote')) {
          patch.isRemote = opp.isRemote
          const idx = updatedEnrichedFields.indexOf('isRemote')
          if (idx !== -1) updatedEnrichedFields.splice(idx, 1)
        } else {
          patch.isRemote = opp.isRemote
        }

        patch.enrichedFields = updatedEnrichedFields

        await ctx.db.patch('opportunities', existing._id, patch)
        updated++
      } else {
        unmatchedOpps.push(opp)
      }
    }

    // Phase 2: Pre-load org data for all unique orgs from unmatched set
    const uniqueOrgs = new Set(unmatchedOpps.map((o) => o.organization))
    const orgMap = new Map<
      string,
      Array<{
        _id: Id<'opportunities'>
        title: string
        organization: string
        alternateSources?: Array<{
          sourceId: string
          source: string
          sourceUrl: string
        }>
      }>
    >()

    for (const org of uniqueOrgs) {
      const orgOpps = await ctx.db
        .query('opportunities')
        .withIndex('by_organization', (q) => q.eq('organization', org))
        .collect()
      orgMap.set(
        org,
        orgOpps.map((o) => ({
          _id: o._id,
          title: o.title,
          organization: o.organization,
          alternateSources: o.alternateSources,
        })),
      )
    }

    // Phase 3: Process unmatched opps against pre-loaded org map
    for (const opp of unmatchedOpps) {
      const sameOrg = orgMap.get(opp.organization) || []

      const duplicate = sameOrg.find((existingOpp) =>
        isSimilarOpportunity(
          {
            title: existingOpp.title,
            organization: existingOpp.organization,
          },
          { title: opp.title, organization: opp.organization },
        ),
      )

      if (duplicate) {
        const alternateSources = duplicate.alternateSources || []
        const alreadyListed = alternateSources.some(
          (s) => s.sourceId === opp.sourceId,
        )

        if (!alreadyListed) {
          await ctx.db.patch('opportunities', duplicate._id, {
            alternateSources: [
              ...alternateSources,
              {
                sourceId: opp.sourceId,
                source: opp.source,
                sourceUrl: opp.sourceUrl,
              },
            ],
            lastVerified: Date.now(),
            updatedAt: Date.now(),
          })
          // Update the in-memory entry so later opps in same batch see it
          duplicate.alternateSources = [
            ...alternateSources,
            {
              sourceId: opp.sourceId,
              source: opp.source,
              sourceUrl: opp.sourceUrl,
            },
          ]
          merged++
        }
      } else {
        // Insert new opportunity
        const newId = await ctx.db.insert('opportunities', {
          sourceId: opp.sourceId,
          source: opp.source,
          title: opp.title,
          organization: opp.organization,
          location: opp.location,
          isRemote: opp.isRemote,
          roleType: opp.roleType,
          experienceLevel: opp.experienceLevel,
          description: opp.description,
          requirements: opp.requirements,
          salaryRange: opp.salaryRange,
          deadline: opp.deadline,
          postedAt: opp.postedAt,
          sourceUrl: opp.sourceUrl,
          opportunityType: opp.opportunityType,
          eventType: opp.eventType,
          startDate: opp.startDate,
          endDate: opp.endDate,
          status: 'active',
          lastVerified: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        // Add to orgMap so later opps in same batch detect this as duplicate
        const orgList = orgMap.get(opp.organization) || []
        orgList.push({
          _id: newId,
          title: opp.title,
          organization: opp.organization,
        })
        orgMap.set(opp.organization, orgList)
        inserted++
      }
    }

    log('info', 'Upsert complete', { inserted, updated, merged })
    return null
  },
})

export const archiveMissing = internalMutation({
  args: {
    currentSourceIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const sourceIdSet = new Set(args.currentSourceIds)

    // Get all active non-manual opportunities
    const activeOpportunities = await ctx.db
      .query('opportunities')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect()

    let archived = 0
    for (const opp of activeOpportunities) {
      // Don't archive manual entries or opportunities still in source
      if (opp.source === 'manual' || sourceIdSet.has(opp.sourceId)) {
        continue
      }

      // Also check if any alternate source is still active
      const hasActiveAlternate = opp.alternateSources?.some((alt) =>
        sourceIdSet.has(alt.sourceId),
      )

      if (!hasActiveAlternate) {
        await ctx.db.patch('opportunities', opp._id, {
          status: 'archived',
          updatedAt: Date.now(),
        })
        archived++
      }
    }

    if (archived > 0) {
      log('info', 'Archived stale opportunities', { archived })
    }
  },
})
