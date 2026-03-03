import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUserId } from './lib/auth'

/**
 * Get auto-email config for an opportunity.
 */
export const getConfig = query({
  args: { opportunityId: v.id('orgOpportunities') },
  returns: v.union(
    v.object({
      _id: v.id('opportunityAutoEmails'),
      opportunityId: v.id('orgOpportunities'),
      orgId: v.id('organizations'),
      enabled: v.boolean(),
      triggers: v.array(v.string()),
      subject: v.string(),
      markdownBody: v.string(),
      requiresPoll: v.boolean(),
      createdBy: v.string(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { opportunityId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const opportunity = await ctx.db.get('orgOpportunities', opportunityId)
    if (!opportunity) throw new ConvexError('Opportunity not found')

    // Verify admin role
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), opportunity.orgId))
      .first()
    if (!membership || membership.role !== 'admin') {
      throw new ConvexError('Admin access required')
    }

    const config = await ctx.db
      .query('opportunityAutoEmails')
      .withIndex('by_opportunity', (q) =>
        q.eq('opportunityId', opportunityId),
      )
      .first()

    if (!config) return null

    return {
      _id: config._id,
      opportunityId: config.opportunityId,
      orgId: config.orgId,
      enabled: config.enabled,
      triggers: config.triggers,
      subject: config.subject,
      markdownBody: config.markdownBody,
      requiresPoll: config.requiresPoll,
      createdBy: config.createdBy,
      updatedAt: config.updatedAt,
    }
  },
})

/**
 * Upsert auto-email config for an opportunity.
 */
export const saveConfig = mutation({
  args: {
    opportunityId: v.id('orgOpportunities'),
    enabled: v.boolean(),
    triggers: v.array(v.string()),
    subject: v.string(),
    markdownBody: v.string(),
    requiresPoll: v.boolean(),
  },
  returns: v.id('opportunityAutoEmails'),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const opportunity = await ctx.db.get('orgOpportunities', args.opportunityId)
    if (!opportunity) throw new ConvexError('Opportunity not found')

    // Verify admin role
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), opportunity.orgId))
      .first()
    if (!membership || membership.role !== 'admin') {
      throw new ConvexError('Admin access required')
    }

    const existing = await ctx.db
      .query('opportunityAutoEmails')
      .withIndex('by_opportunity', (q) =>
        q.eq('opportunityId', args.opportunityId),
      )
      .first()

    if (existing) {
      await ctx.db.patch('opportunityAutoEmails', existing._id, {
        enabled: args.enabled,
        triggers: args.triggers,
        subject: args.subject,
        markdownBody: args.markdownBody,
        requiresPoll: args.requiresPoll,
        updatedAt: Date.now(),
      })
      return existing._id
    }

    return await ctx.db.insert('opportunityAutoEmails', {
      opportunityId: args.opportunityId,
      orgId: opportunity.orgId,
      enabled: args.enabled,
      triggers: args.triggers,
      subject: args.subject,
      markdownBody: args.markdownBody,
      requiresPoll: args.requiresPoll,
      createdBy: userId,
      updatedAt: Date.now(),
    })
  },
})

/**
 * Get recent auto-email log entries for an opportunity.
 */
export const getLog = query({
  args: { opportunityId: v.id('orgOpportunities') },
  returns: v.array(
    v.object({
      _id: v.id('autoEmailLog'),
      _creationTime: v.number(),
      recipientEmail: v.string(),
      recipientName: v.string(),
      trigger: v.string(),
      subject: v.string(),
      sentAt: v.number(),
      status: v.union(v.literal('sent'), v.literal('failed')),
      error: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, { opportunityId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const opportunity = await ctx.db.get('orgOpportunities', opportunityId)
    if (!opportunity) throw new ConvexError('Opportunity not found')

    // Verify admin role
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), opportunity.orgId))
      .first()
    if (!membership || membership.role !== 'admin') {
      throw new ConvexError('Admin access required')
    }

    const logs = await ctx.db
      .query('autoEmailLog')
      .withIndex('by_opportunity', (q) =>
        q.eq('opportunityId', opportunityId),
      )
      .order('desc')
      .take(50)

    return logs.map((log) => ({
      _id: log._id,
      _creationTime: log._creationTime,
      recipientEmail: log.recipientEmail,
      recipientName: log.recipientName,
      trigger: log.trigger,
      subject: log.subject,
      sentAt: log.sentAt,
      status: log.status,
      error: log.error,
    }))
  },
})
