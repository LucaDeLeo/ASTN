import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { log } from '../lib/logging'

// Match result type from LLM
const matchResultValidator = v.object({
  opportunityId: v.id('opportunities'),
  tier: v.union(v.literal('great'), v.literal('good'), v.literal('exploring')),
  score: v.number(),
  strengths: v.array(v.string()),
  gap: v.optional(v.string()),
  recommendations: v.array(
    v.object({
      type: v.union(
        v.literal('specific'),
        v.literal('skill'),
        v.literal('experience'),
      ),
      action: v.string(),
      priority: v.union(
        v.literal('high'),
        v.literal('medium'),
        v.literal('low'),
      ),
    }),
  ),
})

// Set initial match progress on profile (called before first batch)
export const setMatchProgress = internalMutation({
  args: {
    profileId: v.id('profiles'),
    totalBatches: v.number(),
    totalOpportunities: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { profileId, totalBatches, totalOpportunities }) => {
    await ctx.db.patch('profiles', profileId, {
      matchProgress: {
        totalBatches,
        completedBatches: 0,
        totalOpportunities,
        startedAt: Date.now(),
      },
    })
  },
})

// Clear match progress from profile (called on completion or error)
export const clearMatchProgress = internalMutation({
  args: { profileId: v.id('profiles') },
  returns: v.null(),
  handler: async (ctx, { profileId }) => {
    await ctx.db.patch('profiles', profileId, {
      matchProgress: undefined,
    })
  },
})

// Save a single batch of match results incrementally (chained action architecture)
export const saveBatchResults = internalMutation({
  args: {
    profileId: v.id('profiles'),
    batchIndex: v.number(),
    totalBatches: v.number(),
    matches: v.array(matchResultValidator),
    modelVersion: v.string(),
    isLastBatch: v.boolean(),
    previousOppIds: v.array(v.string()),
    runTimestamp: v.number(),
    validOpportunityIds: v.array(v.id('opportunities')),
    isFullRecompute: v.boolean(),
  },
  handler: async (
    ctx,
    {
      profileId,
      batchIndex,
      totalBatches,
      matches,
      modelVersion,
      isLastBatch,
      previousOppIds,
      runTimestamp,
      validOpportunityIds,
      isFullRecompute,
    },
  ) => {
    const existingMatches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    // Build lookup of existing matches by opportunityId for status preservation
    const existingByOppId = new Map(
      existingMatches.map((m) => [m.opportunityId, m]),
    )

    const previousOppSet = new Set(previousOppIds)

    // Per-match replacement with status preservation
    for (const match of matches) {
      const existing = existingByOppId.get(match.opportunityId)
      const isNew = !previousOppSet.has(match.opportunityId)

      // Preserve saved/dismissed status from old match
      const preservedStatus =
        existing &&
        existing.computedAt !== runTimestamp &&
        (existing.status === 'saved' || existing.status === 'dismissed')
          ? existing.status
          : ('active' as const)

      // Delete old match for this opportunity if it exists and is from a previous run
      if (existing && existing.computedAt !== runTimestamp) {
        await ctx.db.delete('matches', existing._id)
      }

      await ctx.db.insert('matches', {
        profileId,
        opportunityId: match.opportunityId,
        tier: match.tier,
        score: match.score,
        status: preservedStatus,
        explanation: {
          strengths: match.strengths,
          ...(match.gap != null && { gap: match.gap }),
        },
        recommendations: match.recommendations,
        isNew,
        computedAt: runTimestamp,
        modelVersion,
      })
    }

    // Update progress on profile
    if (isLastBatch) {
      // Clear progress entirely on completion
      await ctx.db.patch('profiles', profileId, {
        matchProgress: undefined,
      })
    } else {
      // Read current progress to preserve totalOpportunities and startedAt
      const profile = await ctx.db.get('profiles', profileId)
      const existing = profile?.matchProgress
      await ctx.db.patch('profiles', profileId, {
        matchProgress: {
          totalBatches,
          completedBatches: batchIndex + 1,
          totalOpportunities: existing?.totalOpportunities ?? 0,
          startedAt: existing?.startedAt ?? Date.now(),
        },
      })
    }

    // Last-batch cleanup: remove stale matches
    if (isLastBatch) {
      const remainingOld = await ctx.db
        .query('matches')
        .withIndex('by_profile', (q) => q.eq('profileId', profileId))
        .collect()

      const validOppSet = new Set(validOpportunityIds.map(String))

      for (const match of remainingOld) {
        if (isFullRecompute) {
          // Full recompute: delete anything not from this run
          if (match.computedAt !== runTimestamp) {
            await ctx.db.delete('matches', match._id)
          }
        } else {
          // Incremental: delete matches for opps no longer in valid set
          // (archived/expired/filtered-out opportunities)
          if (!validOppSet.has(String(match.opportunityId))) {
            await ctx.db.delete('matches', match._id)
          }
        }
      }

      // Clear staleness flag
      await ctx.db.patch('profiles', profileId, { matchesStaleAt: undefined })
    }

    log('info', 'saveBatchResults', {
      profileId,
      batchIndex,
      savedCount: matches.length,
      isLastBatch,
    })

    return { savedCount: matches.length }
  },
})

// Cleanup-only mutation for incremental runs with no new evaluations
export const cleanupOnlyMatches = internalMutation({
  args: {
    profileId: v.id('profiles'),
    validOpportunityIds: v.array(v.id('opportunities')),
  },
  returns: v.null(),
  handler: async (ctx, { profileId, validOpportunityIds }) => {
    const existingMatches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    const validOppSet = new Set(validOpportunityIds.map(String))
    let deletedCount = 0

    for (const match of existingMatches) {
      if (!validOppSet.has(String(match.opportunityId))) {
        await ctx.db.delete('matches', match._id)
        deletedCount++
      }
    }

    // Clear staleness flag
    await ctx.db.patch('profiles', profileId, { matchesStaleAt: undefined })

    log('info', 'cleanupOnlyMatches', { profileId, deletedCount })
    return null
  },
})

// Clear all matches for a profile (used when there are 0 opportunities)
export const clearMatchesForProfile = internalMutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    for (const match of matches) {
      await ctx.db.delete('matches', match._id)
    }

    // Clear staleness flag since there's nothing to refresh against
    await ctx.db.patch('profiles', profileId, { matchesStaleAt: undefined })

    return { deletedCount: matches.length }
  },
})

// Mark matches as not new (after user has viewed them)
export const markMatchesViewed = internalMutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    const newMatches = await ctx.db
      .query('matches')
      .withIndex('by_profile_new', (q) =>
        q.eq('profileId', profileId).eq('isNew', true),
      )
      .collect()

    for (const match of newMatches) {
      await ctx.db.patch('matches', match._id, { isNew: false })
    }

    return { markedCount: newMatches.length }
  },
})
