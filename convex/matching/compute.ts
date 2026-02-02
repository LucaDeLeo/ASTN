'use node'

import { v } from 'convex/values'
import Anthropic from '@anthropic-ai/sdk'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { log } from '../lib/logging'
import {
  MATCHING_SYSTEM_PROMPT,
  buildOpportunitiesContext,
  buildProfileContext,
  matchOpportunitiesTool,
} from './prompts'
import { matchResultSchema } from './validation'
import type { MatchingResult } from './prompts'
import type { Id } from '../_generated/dataModel'

const MODEL_VERSION = 'claude-haiku-4-5-20251001'
const BATCH_SIZE = 15 // Process up to 15 opportunities per LLM call

// Deduplicate growth areas accumulated across multiple matching batches.
// Groups by normalized theme, deduplicates items within each theme,
// ranks items by frequency, and caps at 10 items per theme.
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

// Main compute action - scores all opportunities for a profile
export const computeMatchesForProfile = internalAction({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    // 1. Get profile with all fields
    const profile = await ctx.runQuery(
      internal.matching.queries.getFullProfile,
      { profileId },
    )
    if (!profile) {
      throw new Error('Profile not found')
    }

    // 2. Get candidate opportunities (excluding hidden orgs, expired)
    const hiddenOrgs = profile.privacySettings?.hiddenFromOrgs || []
    const opportunities = await ctx.runQuery(
      internal.matching.queries.getCandidateOpportunities,
      { hiddenOrgs, limit: 50 }, // Cap at 50 for pilot
    )

    if (opportunities.length === 0) {
      // No opportunities to match - clear existing matches
      await ctx.runMutation(
        internal.matching.mutations.clearMatchesForProfile,
        { profileId },
      )
      return { matchCount: 0, message: 'No active opportunities to match' }
    }

    // 3. Build context
    const profileContext = buildProfileContext(profile)

    // 4. Process in batches if needed
    const allMatches: MatchingResult['matches'] = []
    const aggregatedGrowthAreas: MatchingResult['growthAreas'] = []

    for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
      const batch = opportunities.slice(i, i + BATCH_SIZE)
      const opportunitiesContext = buildOpportunitiesContext(batch)

      // 5. Call Claude with forced tool_choice
      const anthropic = new Anthropic()
      const response = await anthropic.messages.create({
        model: MODEL_VERSION,
        max_tokens: 4096,
        tools: [matchOpportunitiesTool],
        tool_choice: { type: 'tool', name: 'score_opportunities' },
        system: MATCHING_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `${profileContext}\n\n${opportunitiesContext}\n\nScore all opportunities for this candidate. Include only opportunities with tier great, good, or exploring - skip any that have no reasonable fit.`,
          },
        ],
      })

      // 6. Extract tool use result
      const toolUse = response.content.find(
        (block) => block.type === 'tool_use',
      )
      if (!toolUse) {
        log('error', 'No tool use in response for batch', { batchIndex: i })
        continue
      }

      const parseResult = matchResultSchema.safeParse(toolUse.input)
      if (!parseResult.success) {
        log('error', 'LLM validation failed for matching batch', {
          batchIndex: i,
          issues: parseResult.error.issues,
        })
      }
      const batchResult = (
        parseResult.success ? parseResult.data : toolUse.input
      ) as MatchingResult

      // Validate response structure (fallback check)
      if (!Array.isArray(batchResult.matches)) {
        log(
          'error',
          'Invalid tool response - missing or invalid matches array',
          { batchIndex: i },
        )
        continue
      }

      // Map opportunityId strings back to actual Ids
      for (const match of batchResult.matches) {
        const oppId = match.opportunityId as Id<'opportunities'>
        // Verify the opportunity exists in our batch
        const validOpp = batch.find((o) => o._id === oppId)
        if (validOpp) {
          allMatches.push({
            ...match,
            opportunityId: oppId,
          })
        }
      }

      // Accumulate growth areas from all batches (deduplicated later)
      if (
        Array.isArray(batchResult.growthAreas) &&
        batchResult.growthAreas.length > 0
      ) {
        aggregatedGrowthAreas.push(...batchResult.growthAreas)
      }
    }

    // 7. Save all matches
    if (allMatches.length > 0) {
      await ctx.runMutation(internal.matching.mutations.saveMatches, {
        profileId,
        matches: allMatches.map((m) => ({
          opportunityId: m.opportunityId as Id<'opportunities'>,
          tier: m.tier,
          score: m.score,
          strengths: m.strengths,
          gap: m.gap,
          interviewChance: m.interviewChance,
          ranking: m.ranking,
          confidence: m.confidence,
          recommendations: m.recommendations,
        })),
        modelVersion: MODEL_VERSION,
      })
    }

    // Deduplicate growth areas accumulated across all batches
    const deduplicatedGrowthAreas = deduplicateGrowthAreas(
      aggregatedGrowthAreas,
    )

    return {
      matchCount: allMatches.length,
      tiers: {
        great: allMatches.filter((m) => m.tier === 'great').length,
        good: allMatches.filter((m) => m.tier === 'good').length,
        exploring: allMatches.filter((m) => m.tier === 'exploring').length,
      },
      growthAreas: deduplicatedGrowthAreas,
    }
  },
})
