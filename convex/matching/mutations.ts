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

// Opportunity snapshot validator (denormalized into match documents)
const opportunitySnapshotValidator = v.object({
  title: v.string(),
  organization: v.string(),
  location: v.string(),
  isRemote: v.boolean(),
  roleType: v.string(),
  experienceLevel: v.optional(v.string()),
  salaryRange: v.optional(v.string()),
  sourceUrl: v.string(),
  deadline: v.optional(v.number()),
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
    opportunitySnapshots: v.record(v.string(), opportunitySnapshotValidator),
    totalOpportunities: v.number(),
    startedAt: v.number(),
  },
  returns: v.null(),
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
      opportunitySnapshots,
      totalOpportunities,
      startedAt,
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

    // Track which opportunity IDs were touched this batch (for cleanup in Fix 2)
    const touchedOppIds = new Set<string>()

    // Per-match: PATCH existing or INSERT new (Fix 1: avoids delete+insert)
    for (const match of matches) {
      const existing = existingByOppId.get(match.opportunityId)
      const isNew = !previousOppSet.has(match.opportunityId)
      const snapshot = opportunitySnapshots[String(match.opportunityId)]

      // Preserve saved/dismissed status from old match
      const preservedStatus =
        existing &&
        existing.computedAt !== runTimestamp &&
        (existing.status === 'saved' || existing.status === 'dismissed')
          ? existing.status
          : ('active' as const)

      touchedOppIds.add(String(match.opportunityId))

      if (existing && existing.computedAt === runTimestamp) {
        // Retry safety: already processed in this run, skip
        continue
      } else if (existing) {
        // Existing match from previous run: PATCH in place
        await ctx.db.patch('matches', existing._id, {
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
          opportunitySnapshot: snapshot,
        })
      } else {
        // Truly new match: INSERT
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
          opportunitySnapshot: snapshot,
        })
      }
    }

    // Update progress on profile (Fix 6: use passed args instead of re-reading)
    if (isLastBatch) {
      await ctx.db.patch('profiles', profileId, {
        matchProgress: undefined,
      })
    } else {
      await ctx.db.patch('profiles', profileId, {
        matchProgress: {
          totalBatches,
          completedBatches: batchIndex + 1,
          totalOpportunities,
          startedAt,
        },
      })
    }

    // Last-batch cleanup: reuse already-loaded existingMatches (Fix 2: no second .collect())
    if (isLastBatch) {
      const validOppSet = new Set(validOpportunityIds.map(String))

      for (const match of existingMatches) {
        // Skip matches we just touched in this batch
        if (touchedOppIds.has(String(match.opportunityId))) continue

        if (isFullRecompute) {
          // Full recompute: delete anything not from this run
          if (match.computedAt !== runTimestamp) {
            await ctx.db.delete('matches', match._id)
          }
        } else {
          // Incremental: delete matches for opps no longer in valid set
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

    return null
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
