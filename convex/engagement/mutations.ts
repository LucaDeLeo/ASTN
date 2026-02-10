import { v } from 'convex/values'
import { internalMutation, mutation } from '../_generated/server'
import { getUserId } from '../lib/auth'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

// Level validator for Convex
const levelValidator = v.union(
  v.literal('highly_engaged'),
  v.literal('moderate'),
  v.literal('at_risk'),
  v.literal('new'),
  v.literal('inactive'),
)

/**
 * Save engagement score (upsert)
 * Internal use by compute action
 */
export const saveEngagementScore = internalMutation({
  args: {
    userId: v.string(),
    orgId: v.id('organizations'),
    level: levelValidator,
    adminExplanation: v.string(),
    userExplanation: v.string(),
    signals: v.object({
      eventsAttended90d: v.number(),
      lastAttendedAt: v.optional(v.number()),
      rsvpCount90d: v.number(),
      profileUpdatedAt: v.optional(v.number()),
      joinedAt: v.number(),
    }),
    modelVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      orgId,
      level,
      adminExplanation,
      userExplanation,
      signals,
      modelVersion,
    } = args

    // Check if engagement record exists
    const existing = await ctx.db
      .query('memberEngagement')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', userId).eq('orgId', orgId),
      )
      .first()

    if (existing) {
      // Update existing record (preserve override if set)
      await ctx.db.patch('memberEngagement', existing._id, {
        level,
        adminExplanation,
        userExplanation,
        signals,
        computedAt: Date.now(),
        modelVersion,
      })
      return existing._id
    } else {
      // Insert new record
      return await ctx.db.insert('memberEngagement', {
        userId,
        orgId,
        level,
        adminExplanation,
        userExplanation,
        signals,
        computedAt: Date.now(),
        modelVersion,
      })
    }
  },
})

/**
 * Clear expired override from engagement record
 * Called during computation when override has expired
 */
export const clearExpiredOverride = internalMutation({
  args: { engagementId: v.id('memberEngagement') },
  handler: async (ctx, { engagementId }) => {
    const engagement = await ctx.db.get('memberEngagement', engagementId)
    if (!engagement) return

    // Only clear if override exists and has an expiry
    if (engagement.override && engagement.override.expiresAt) {
      // Remove override by setting to undefined
      await ctx.db.patch('memberEngagement', engagementId, {
        override: undefined,
      })
    }
  },
})

// Helper: Require current user is an admin of the given org
async function requireOrgAdmin(ctx: MutationCtx, orgId: Id<'organizations'>) {
  const userId = await getUserId(ctx)
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('orgId'), orgId))
    .first()

  if (!membership) {
    throw new Error('Not a member of this organization')
  }

  if (membership.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return membership
}

/**
 * Override a member's engagement level (admin only)
 * Requires notes for audit trail
 */
export const overrideEngagement = mutation({
  args: {
    engagementId: v.id('memberEngagement'),
    newLevel: levelValidator,
    notes: v.string(), // Required per CONTEXT.md
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { engagementId, newLevel, notes, expiresAt }) => {
    // Get the engagement record to verify orgId
    const engagement = await ctx.db.get('memberEngagement', engagementId)
    if (!engagement) {
      throw new Error('Engagement record not found')
    }

    // Verify admin access
    const adminMembership = await requireOrgAdmin(ctx, engagement.orgId)

    // Validate notes (required)
    if (!notes.trim()) {
      throw new Error('Notes are required for engagement overrides')
    }

    // Record previous level (could be from override or computed)
    const previousLevel = engagement.override?.level || engagement.level

    // Save to history before update
    await ctx.db.insert('engagementOverrideHistory', {
      engagementId,
      userId: engagement.userId,
      orgId: engagement.orgId,
      previousLevel,
      newLevel,
      notes,
      action: 'override',
      performedBy: adminMembership._id,
      performedAt: Date.now(),
    })

    // Update engagement with override
    await ctx.db.patch('memberEngagement', engagementId, {
      override: {
        level: newLevel,
        notes,
        overriddenBy: adminMembership._id,
        overriddenAt: Date.now(),
        expiresAt,
      },
    })

    return { success: true }
  },
})

/**
 * Clear an engagement override (admin only)
 * Member returns to computed level
 */
export const clearOverride = mutation({
  args: { engagementId: v.id('memberEngagement') },
  handler: async (ctx, { engagementId }) => {
    // Get the engagement record to verify orgId
    const engagement = await ctx.db.get('memberEngagement', engagementId)
    if (!engagement) {
      throw new Error('Engagement record not found')
    }

    // Verify admin access
    const adminMembership = await requireOrgAdmin(ctx, engagement.orgId)

    // Only proceed if there's an override to clear
    if (!engagement.override) {
      throw new Error('No override to clear')
    }

    // Save to history
    await ctx.db.insert('engagementOverrideHistory', {
      engagementId,
      userId: engagement.userId,
      orgId: engagement.orgId,
      previousLevel: engagement.override.level,
      newLevel: engagement.level, // Reverting to computed level
      notes: 'Override cleared',
      action: 'clear',
      performedBy: adminMembership._id,
      performedAt: Date.now(),
    })

    // Remove override
    await ctx.db.patch('memberEngagement', engagementId, {
      override: undefined,
    })

    return { success: true }
  },
})
