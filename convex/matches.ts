import { ConvexError, v } from 'convex/values'
import { action, internalMutation, mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { getUserId } from './lib/auth'
import { debouncedSchedule } from './lib/debouncer'
import { rateLimiter } from './lib/rateLimiter'
import { isProfileMatchReady } from './profiles'
import type { Id } from './_generated/dataModel'

// Type for match computation result (chained scheduled action architecture)
interface MatchComputationResult {
  matchCount?: number
  message?: string
  totalBatches?: number
}

// Get all matches for current user, grouped by tier
export const getMyMatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) {
      return null
    }

    // Get user's profile
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      return {
        matches: { great: [], good: [], exploring: [] },
        savedMatches: [],
        needsProfile: true,
      }
    }

    // Check profile completeness before matching
    const readiness = isProfileMatchReady(
      profile as unknown as Record<string, unknown>,
    )
    if (!readiness.ready) {
      // Check if there are any existing matches (user may have had matches before editing profile)
      const existingMatches = await ctx.db
        .query('matches')
        .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
        .first()

      return {
        matches: { great: [], good: [], exploring: [] },
        savedMatches: [],
        needsProfile: false,
        needsComputation: false,
        needsCompleteness: true,
        completeness: readiness,
        hasExistingMatches: existingMatches !== null,
        profileId: profile._id,
      }
    }

    // Get matches for this profile
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect()

    if (matches.length === 0) {
      return {
        matches: { great: [], good: [], exploring: [] },
        savedMatches: [],
        needsProfile: false,
        needsComputation: true,
        profileId: profile._id,
      }
    }

    // Enrich matches with opportunity data (use denormalized snapshot when available)
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        // Use denormalized snapshot if available (avoids N+1 reads)
        if (match.opportunitySnapshot) {
          const snap = match.opportunitySnapshot
          // Supplement postedAt/opportunityType from live data if missing from older snapshots
          if (
            snap.postedAt === undefined ||
            snap.opportunityType === undefined
          ) {
            const opp = await ctx.db.get('opportunities', match.opportunityId)
            if (opp) {
              snap.postedAt = snap.postedAt ?? opp.postedAt
              snap.opportunityType = snap.opportunityType ?? opp.opportunityType
            }
          }
          return {
            ...match,
            opportunity: {
              _id: match.opportunityId,
              ...snap,
            },
          }
        }
        // Fallback: read live opportunity for pre-migration matches
        const opportunity = await ctx.db.get(
          'opportunities',
          match.opportunityId,
        )
        return {
          ...match,
          opportunity: opportunity
            ? {
                _id: opportunity._id,
                title: opportunity.title,
                organization: opportunity.organization,
                location: opportunity.location,
                isRemote: opportunity.isRemote,
                roleType: opportunity.roleType,
                experienceLevel: opportunity.experienceLevel,
                salaryRange: opportunity.salaryRange,
                sourceUrl: opportunity.sourceUrl,
                deadline: opportunity.deadline,
                postedAt: opportunity.postedAt,
                opportunityType: opportunity.opportunityType,
              }
            : null,
        }
      }),
    )

    // Filter out matches where opportunity was deleted
    // Type guard to ensure opportunity is non-null
    const validMatches = enrichedMatches.filter(
      (m): m is typeof m & { opportunity: NonNullable<typeof m.opportunity> } =>
        m.opportunity !== null,
    )

    // Separate saved matches from active matches (exclude applied — they show in Applied section)
    const savedMatches = validMatches
      .filter((m) => m.status === 'saved' && !m.appliedAt)
      .sort((a, b) => b.score - a.score)

    // Applied matches (cross-cutting view — shown regardless of saved/active status)
    const appliedMatches = validMatches
      .filter((m) => m.appliedAt != null)
      .sort((a, b) => (b.appliedAt ?? 0) - (a.appliedAt ?? 0))

    // Filter to only active matches (exclude dismissed and saved)
    const activeMatches = validMatches.filter(
      (m) => m.status !== 'dismissed' && m.status !== 'saved',
    )

    // Group active matches by tier and sort by score
    const grouped = {
      great: activeMatches
        .filter((m) => m.tier === 'great')
        .sort((a, b) => b.score - a.score),
      good: activeMatches
        .filter((m) => m.tier === 'good')
        .sort((a, b) => b.score - a.score),
      exploring: activeMatches
        .filter((m) => m.tier === 'exploring')
        .sort((a, b) => b.score - a.score),
    }

    // Count new matches for badge (from active matches only)
    const newMatchCount = activeMatches.filter((m) => m.isNew).length

    // Get staleness (oldest computation time)
    const computedAt =
      matches.length > 0 ? Math.min(...matches.map((m) => m.computedAt)) : null

    // Aggregate recommendations from ALL matches (including dismissed) for growth areas
    // Growth areas represent overall development needs, not just active opportunities
    const allRecommendations = validMatches.flatMap((m) => m.recommendations)

    return {
      matches: grouped,
      savedMatches,
      appliedMatches,
      allRecommendations,
      newMatchCount,
      computedAt,
      matchesStaleAt: profile.matchesStaleAt ?? null,
      needsProfile: false,
      needsComputation: false,
      profileId: profile._id,
    }
  },
})

// Lightweight progress query — separate from getMyMatches so progress
// updates don't cause re-renders of the full match list
export const getMatchProgress = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      totalBatches: v.number(),
      completedBatches: v.number(),
      totalOpportunities: v.number(),
      startedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) return null

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    return profile?.matchProgress ?? null
  },
})

// Get a single match by ID with full details
export const getMatchById = query({
  args: { matchId: v.id('matches') },
  handler: async (ctx, { matchId }) => {
    const userId = await getUserId(ctx)
    if (!userId) {
      return null
    }

    const match = await ctx.db.get('matches', matchId)
    if (!match) {
      return null
    }

    // Verify ownership
    const profile = await ctx.db.get('profiles', match.profileId)
    if (!profile || profile.userId !== userId) {
      return null
    }

    // Get full opportunity data
    const opportunity = await ctx.db.get('opportunities', match.opportunityId)
    if (!opportunity) {
      return null
    }

    return {
      ...match,
      opportunity,
    }
  },
})

// Get match count for navigation badge
export const getNewMatchCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) {
      return 0
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      return 0
    }

    const newMatches = await ctx.db
      .query('matches')
      .withIndex('by_profile_new', (q) =>
        q.eq('profileId', profile._id).eq('isNew', true),
      )
      .collect()

    return newMatches.length
  },
})

// Helper mutation: debounce career actions from action context
export const scheduleCareerActions = internalMutation({
  args: { profileId: v.id('profiles') },
  returns: v.null(),
  handler: async (ctx, { profileId }) => {
    await debouncedSchedule(
      ctx,
      'career-actions',
      profileId,
      internal.careerActions.compute.computeActionsForProfile,
      { profileId },
      { delay: 5000 },
    )
    return null
  },
})

// Trigger match computation (called from UI when needed)
export const triggerMatchComputation = action({
  args: {},
  handler: async (ctx): Promise<MatchComputationResult> => {
    const userId = await getUserId(ctx)
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const rl = await rateLimiter.limit(ctx, 'matchComputation', {
      key: userId,
    })
    if (!rl.ok) {
      const retryMinutes = Math.ceil(rl.retryAfter / 60000)
      throw new ConvexError({
        kind: 'RateLimited' as const,
        retryAfter: rl.retryAfter,
        message: `Match computation is rate limited. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
      })
    }

    // Get profile
    const profile: { _id: Id<'profiles'> } | null = await ctx.runQuery(
      internal.matching.queries.getProfileByUserId,
      { userId },
    )

    if (!profile) {
      throw new Error('Profile not found - please create a profile first')
    }

    // Check profile completeness
    const readiness: {
      ready: boolean
      completedCount: number
      totalCount: number
      missingRequired: Array<string>
      sectionsNeeded: number
    } = await ctx.runQuery(internal.matching.queries.getProfileMatchReadiness, {
      profileId: profile._id,
    })
    if (!readiness.ready) {
      throw new ConvexError({
        kind: 'ProfileIncomplete' as const,
        completedCount: readiness.completedCount,
        totalCount: readiness.totalCount,
        missingRequired: readiness.missingRequired,
        sectionsNeeded: readiness.sectionsNeeded,
      })
    }

    // Trigger computation
    const result: MatchComputationResult = await ctx.runAction(
      internal.matching.compute.computeMatchesForProfile,
      { profileId: profile._id },
    )

    // Generate career actions (debounced to avoid redundant Sonnet calls)
    await ctx.runMutation(internal.matches.scheduleCareerActions, {
      profileId: profile._id,
    })

    return result
  },
})

// Mark matches as viewed (clear "new" badge)
export const markMatchesViewed = action({
  args: {},
  handler: async (ctx): Promise<{ markedCount: number }> => {
    const userId = await getUserId(ctx)
    if (!userId) {
      throw new Error('Not authenticated')
    }

    const profile: { _id: Id<'profiles'> } | null = await ctx.runQuery(
      internal.matching.queries.getProfileByUserId,
      { userId },
    )

    if (!profile) {
      return { markedCount: 0 }
    }

    const result: { markedCount: number } = await ctx.runMutation(
      internal.matching.mutations.markMatchesViewed,
      { profileId: profile._id },
    )

    return result
  },
})

/**
 * Dismiss a match - removes it from the user's match list
 */
export const dismissMatch = mutation({
  args: { matchId: v.id('matches') },
  handler: async (ctx, { matchId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const match = await ctx.db.get('matches', matchId)
    if (!match) throw new Error('Match not found')

    // Verify ownership
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    if (!profile || match.profileId !== profile._id) {
      throw new Error('Not authorized')
    }

    await ctx.db.patch('matches', matchId, { status: 'dismissed' })
  },
})

/**
 * Save a match - marks it as a favorite for easy access
 */
export const saveMatch = mutation({
  args: { matchId: v.id('matches') },
  handler: async (ctx, { matchId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const match = await ctx.db.get('matches', matchId)
    if (!match) throw new Error('Match not found')

    // Verify ownership
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    if (!profile || match.profileId !== profile._id) {
      throw new Error('Not authorized')
    }

    // Toggle: if already saved, unsave (set to active)
    const newStatus = match.status === 'saved' ? 'active' : 'saved'
    await ctx.db.patch('matches', matchId, { status: newStatus })
  },
})

/**
 * Mark a match as applied (toggle) — orthogonal to saved/dismissed status
 */
export const markAsApplied = mutation({
  args: { matchId: v.id('matches') },
  returns: v.null(),
  handler: async (ctx, { matchId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const match = await ctx.db.get('matches', matchId)
    if (!match) throw new Error('Match not found')

    // Verify ownership
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()
    if (!profile || match.profileId !== profile._id) {
      throw new Error('Not authorized')
    }

    // Toggle: if already applied, clear it; otherwise set timestamp
    await ctx.db.patch('matches', matchId, {
      appliedAt: match.appliedAt ? undefined : Date.now(),
    })
    return null
  },
})
