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
  interviewChance: v.string(),
  ranking: v.string(),
  confidence: v.string(),
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

// Save a single batch of match results incrementally (chained action architecture)
export const saveBatchResults = internalMutation({
  args: {
    profileId: v.id('profiles'),
    batchIndex: v.number(),
    matches: v.array(matchResultValidator),
    modelVersion: v.string(),
    isLastBatch: v.boolean(),
    previousOppIds: v.array(v.string()),
    runTimestamp: v.number(),
  },
  handler: async (
    ctx,
    {
      profileId,
      batchIndex,
      matches,
      modelVersion,
      isLastBatch,
      previousOppIds,
      runTimestamp,
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
        probability: {
          interviewChance: match.interviewChance,
          ranking: match.ranking,
          confidence: match.confidence,
        },
        recommendations: match.recommendations,
        isNew,
        computedAt: runTimestamp,
        modelVersion,
      })
    }

    // Last-batch cleanup: remove stale matches for opportunities no longer matched
    if (isLastBatch) {
      const remainingOld = await ctx.db
        .query('matches')
        .withIndex('by_profile', (q) => q.eq('profileId', profileId))
        .collect()

      for (const match of remainingOld) {
        if (match.computedAt !== runTimestamp) {
          await ctx.db.delete('matches', match._id)
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
