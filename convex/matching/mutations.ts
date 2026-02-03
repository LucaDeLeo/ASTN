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

// Growth area validator for batch results
const growthAreaValidator = v.object({
  theme: v.string(),
  items: v.array(v.string()),
})

// Save batch of matches for a profile
export const saveMatches = internalMutation({
  args: {
    profileId: v.id('profiles'),
    matches: v.array(matchResultValidator),
    modelVersion: v.string(),
  },
  handler: async (ctx, { profileId, matches, modelVersion }) => {
    const now = Date.now()

    // Get existing match opportunity IDs to determine which are "new"
    const existingMatches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    const existingOppIds = new Set(existingMatches.map((m) => m.opportunityId))

    // Delete old matches for this profile
    for (const match of existingMatches) {
      await ctx.db.delete('matches', match._id)
    }

    // Insert new matches
    for (const match of matches) {
      const isNew = !existingOppIds.has(match.opportunityId)

      await ctx.db.insert('matches', {
        profileId,
        opportunityId: match.opportunityId,
        tier: match.tier,
        score: match.score,
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
        computedAt: now,
        modelVersion,
      })
    }

    return { savedCount: matches.length }
  },
})

// Deduplicate growth areas accumulated across multiple matching batches.
function deduplicateGrowthAreas(
  areas: Array<{ theme: string; items: Array<string> }>,
): Array<{ theme: string; items: Array<string> }> {
  const themeMap = new Map<string, Map<string, number>>()
  for (const area of areas) {
    const normalizedTheme = area.theme.toLowerCase().trim()
    if (!themeMap.has(normalizedTheme)) {
      themeMap.set(normalizedTheme, new Map())
    }
    const itemMap = themeMap.get(normalizedTheme)!
    for (const item of area.items) {
      const normalizedItem = item.toLowerCase().trim()
      itemMap.set(normalizedItem, (itemMap.get(normalizedItem) || 0) + 1)
    }
  }
  return Array.from(themeMap.entries()).map(([theme, items]) => ({
    theme: theme.charAt(0).toUpperCase() + theme.slice(1),
    items: Array.from(items.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item]) => item.charAt(0).toUpperCase() + item.slice(1)),
  }))
}

// Save a single batch of match results incrementally (chained action architecture)
export const saveBatchResults = internalMutation({
  args: {
    profileId: v.id('profiles'),
    batchIndex: v.number(),
    matches: v.array(matchResultValidator),
    modelVersion: v.string(),
    isLastBatch: v.boolean(),
    previousOppIds: v.array(v.string()),
    accumulatedGrowthAreas: v.array(growthAreaValidator),
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
      accumulatedGrowthAreas,
      runTimestamp,
    },
  ) => {
    const existingMatches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    if (batchIndex > 0) {
      const alreadySaved = existingMatches.some(
        (m) => m.computedAt === runTimestamp,
      )
      if (!alreadySaved) {
        log('warn', 'saveBatchResults: no prior batch matches found', {
          batchIndex,
          profileId,
        })
      }
    }

    if (batchIndex === 0) {
      for (const match of existingMatches) {
        await ctx.db.delete('matches', match._id)
      }
    }

    const previousOppSet = new Set(previousOppIds)

    for (const match of matches) {
      const isNew = !previousOppSet.has(match.opportunityId)
      await ctx.db.insert('matches', {
        profileId,
        opportunityId: match.opportunityId,
        tier: match.tier,
        score: match.score,
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

    if (isLastBatch && accumulatedGrowthAreas.length > 0) {
      const deduplicated = deduplicateGrowthAreas(accumulatedGrowthAreas)
      log('info', 'saveBatchResults: final growth areas', {
        profileId,
        rawCount: accumulatedGrowthAreas.length,
        deduplicatedCount: deduplicated.length,
        themes: deduplicated.map((g) => g.theme),
      })
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

// Clear all matches for a profile (used before recomputation)
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
