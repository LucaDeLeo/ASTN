import { v } from 'convex/values'
import { components, internal } from '../_generated/api'
import { mutation, query } from '../_generated/server'
import { requirePlatformAdmin } from '../lib/auth'
import { debouncedSchedule } from '../lib/debouncer'
import { computeProfileCompleteness } from '../profiles'

/**
 * List all profiles with summary data for the admin users table.
 * Sorted by createdAt desc. Full table scan is fine at 50-100 profiles.
 */
export const listAllProfiles = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx)

    const profiles = await ctx.db.query('profiles').collect()

    const results = profiles.map((profile) => {
      const completeness = computeProfileCompleteness(
        profile as unknown as Record<string, unknown>,
      )
      return {
        _id: profile._id,
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        location: profile.location,
        headline: profile.headline,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        completenessPercentage: completeness.percentage,
        hasAgentThread: !!profile.agentThreadId,
        hasEnrichmentConversation: !!profile.hasEnrichmentConversation,
        skillCount: profile.skills?.length ?? 0,
      }
    })

    // Sort by createdAt desc
    results.sort((a, b) => b.createdAt - a.createdAt)
    return results
  },
})

/**
 * Get full profile detail for a single user, including org memberships and match tier counts.
 */
export const getProfileDetail = query({
  args: {
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { userId }) => {
    await requirePlatformAdmin(ctx)

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) return null

    // Fetch org memberships with org names
    const memberships = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const orgs = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db.get('organizations', m.orgId)
        return {
          orgId: m.orgId,
          orgName: org?.name ?? 'Unknown',
          role: m.role,
          joinedAt: m.joinedAt,
        }
      }),
    )

    // Fetch match tier counts
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect()

    const matchCounts: Record<string, number> = {
      great: 0,
      good: 0,
      exploring: 0,
    }
    for (const match of matches) {
      if (match.tier in matchCounts) {
        matchCounts[match.tier]++
      }
    }

    const completeness = computeProfileCompleteness(
      profile as unknown as Record<string, unknown>,
    )

    return {
      ...profile,
      orgMemberships: orgs,
      matchCounts,
      completeness,
    }
  },
})

/**
 * Get all matches for a profile with joined opportunity data.
 * Sorted by tier priority (great → good → exploring), then score desc.
 */
export const getUserMatches = query({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.any(),
  handler: async (ctx, { profileId }) => {
    await requirePlatformAdmin(ctx)

    const matches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    const enriched = await Promise.all(
      matches.map(async (match) => {
        const opp = await ctx.db.get('opportunities', match.opportunityId)
        return {
          _id: match._id,
          tier: match.tier,
          score: match.score,
          status: match.status ?? 'active',
          explanation: match.explanation,
          recommendations: match.recommendations,
          isNew: match.isNew,
          computedAt: match.computedAt,
          modelVersion: match.modelVersion,
          opportunity: opp
            ? {
                title: opp.title,
                organization: opp.organization,
                location: opp.location,
                isRemote: opp.isRemote,
                roleType: opp.roleType,
                experienceLevel: opp.experienceLevel,
                salaryRange: opp.salaryRange,
                deadline: opp.deadline,
                sourceUrl: opp.sourceUrl,
              }
            : null,
        }
      }),
    )

    // Filter out matches where opportunity was deleted
    const valid = enriched.filter((m) => m.opportunity !== null)

    // Sort by tier priority, then score desc
    const tierOrder: Record<string, number> = {
      great: 0,
      good: 1,
      exploring: 2,
    }
    valid.sort((a, b) => {
      const tierDiff = (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3)
      if (tierDiff !== 0) return tierDiff
      return b.score - a.score
    })

    return valid
  },
})

/**
 * Get agent thread messages for a profile (read-only admin view).
 * Uses the @convex-dev/agent component's internal query.
 */
export const getAgentMessages = query({
  args: {
    threadId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { threadId }) => {
    await requirePlatformAdmin(ctx)

    const result = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      {
        threadId,
        order: 'asc',
        paginationOpts: {
          cursor: null,
          numItems: 500,
        },
      },
    )

    return result.page
  },
})

/**
 * Get legacy enrichment messages for a profile.
 */
export const getEnrichmentMessages = query({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.any(),
  handler: async (ctx, { profileId }) => {
    await requirePlatformAdmin(ctx)

    return await ctx.db
      .query('enrichmentMessages')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

/**
 * Get agent tool calls for a thread.
 */
export const getAgentToolCalls = query({
  args: {
    threadId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { threadId }) => {
    await requirePlatformAdmin(ctx)

    return await ctx.db
      .query('agentToolCalls')
      .withIndex('by_thread_and_createdAt', (q) => q.eq('threadId', threadId))
      .collect()
  },
})

/**
 * Admin action: recompute matches for a user's profile.
 * Sets matchesStaleAt to force a full recompute and schedules the computation.
 */
export const recomputeMatches = mutation({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.null(),
  handler: async (ctx, { profileId }) => {
    await requirePlatformAdmin(ctx)

    const profile = await ctx.db.get('profiles', profileId)
    if (!profile) throw new Error('Profile not found')

    // Mark matches as stale to force full recompute
    await ctx.db.patch('profiles', profileId, {
      matchesStaleAt: Date.now(),
    })

    // Debounce match computation — fixed mode absorbs double-clicks
    await debouncedSchedule(
      ctx,
      'match-computation',
      profileId,
      internal.matching.compute.computeMatchesForProfile,
      { profileId },
      { delay: 2000, mode: 'fixed' },
    )

    return null
  },
})
