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
const MAX_RETRIES = 10
const RATE_LIMIT_DELAY_MS = 1000

// Check if an error is a rate limit error (HTTP 429 or message contains "rate")
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes('rate') || message.includes('429')) return true
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: number }).status === 429
  ) {
    return true
  }
  return false
}

// Entry point: starts the chained matching process for a profile
export const computeMatchesForProfile = internalAction({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.runQuery(
      internal.matching.queries.getFullProfile,
      { profileId },
    )
    if (!profile) {
      throw new Error('Profile not found')
    }

    const hiddenOrgs = profile.privacySettings?.hiddenFromOrgs || []
    const opportunities = await ctx.runQuery(
      internal.matching.queries.getCandidateOpportunities,
      { hiddenOrgs, limit: 50 },
    )

    if (opportunities.length === 0) {
      await ctx.runMutation(
        internal.matching.mutations.clearMatchesForProfile,
        { profileId },
      )
      return { matchCount: 0, message: 'No active opportunities to match' }
    }

    const existingMatches = await ctx.runQuery(
      internal.matching.queries.getExistingMatches,
      { profileId },
    )
    const previousOppIds = existingMatches.map(
      (m: { opportunityId: string }) => m.opportunityId,
    )

    const totalBatches = Math.ceil(opportunities.length / BATCH_SIZE)
    const runTimestamp = Date.now()

    log('info', 'computeMatchesForProfile: starting chained matching', {
      profileId,
      opportunityCount: opportunities.length,
      totalBatches,
      runTimestamp,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.matching.compute.processMatchBatch,
      {
        profileId,
        batchIndex: 0,
        totalBatches,
        retryCount: 0,
        previousOppIds,
        accumulatedGrowthAreas: [],
        runTimestamp,
      },
    )

    return { message: 'Matching started', totalBatches }
  },
})

// Process a single batch of opportunities - called as a chained scheduled action
export const processMatchBatch = internalAction({
  args: {
    profileId: v.id('profiles'),
    batchIndex: v.number(),
    totalBatches: v.number(),
    retryCount: v.number(),
    previousOppIds: v.array(v.string()),
    accumulatedGrowthAreas: v.array(
      v.object({
        theme: v.string(),
        items: v.array(v.string()),
      }),
    ),
    runTimestamp: v.number(),
  },
  handler: async (
    ctx,
    {
      profileId,
      batchIndex,
      totalBatches,
      retryCount,
      previousOppIds,
      accumulatedGrowthAreas,
      runTimestamp,
    },
  ) => {
    const startTime = Date.now()

    const profile = await ctx.runQuery(
      internal.matching.queries.getFullProfile,
      { profileId },
    )
    if (!profile) {
      log('error', 'processMatchBatch: profile not found', {
        profileId,
        batchIndex,
      })
      return
    }

    const hiddenOrgs = profile.privacySettings?.hiddenFromOrgs || []
    const opportunities = await ctx.runQuery(
      internal.matching.queries.getCandidateOpportunities,
      { hiddenOrgs, limit: 50 },
    )

    const batch = opportunities.slice(
      batchIndex * BATCH_SIZE,
      (batchIndex + 1) * BATCH_SIZE,
    )

    if (batch.length === 0) {
      log('warn', 'processMatchBatch: empty batch, skipping', {
        batchIndex,
        totalBatches,
      })
      return
    }

    const isLastBatch = batchIndex + 1 >= totalBatches
    const batchMatches: MatchingResult['matches'] = []
    let batchGrowthAreas: MatchingResult['growthAreas'] = []

    try {
      const profileContext = buildProfileContext(profile)
      const opportunitiesContext = buildOpportunitiesContext(batch)

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

      const toolUse = response.content.find(
        (block) => block.type === 'tool_use',
      )
      if (!toolUse) {
        log('error', 'processMatchBatch: no tool use in response', {
          batchIndex,
        })
      } else {
        const parseResult = matchResultSchema.safeParse(toolUse.input)
        if (!parseResult.success) {
          log('error', 'processMatchBatch: LLM validation failed', {
            batchIndex,
            issues: parseResult.error.issues,
          })
        }
        const batchResult = (
          parseResult.success ? parseResult.data : toolUse.input
        ) as MatchingResult

        if (!Array.isArray(batchResult.matches)) {
          log('error', 'processMatchBatch: invalid matches array', {
            batchIndex,
          })
        } else {
          for (const match of batchResult.matches) {
            const oppId = match.opportunityId as Id<'opportunities'>
            const validOpp = batch.some(
              (o: { _id: string }) => o._id === oppId,
            )
            if (validOpp) {
              batchMatches.push({
                ...match,
                opportunityId: oppId,
              })
            }
          }
        }

        if (
          Array.isArray(batchResult.growthAreas) &&
          batchResult.growthAreas.length > 0
        ) {
          batchGrowthAreas = batchResult.growthAreas
        }
      }
    } catch (error: unknown) {
      if (isRateLimitError(error) && retryCount < MAX_RETRIES) {
        const delay = Math.min(
          RATE_LIMIT_DELAY_MS * Math.pow(2, retryCount),
          60000,
        )
        log('warn', 'processMatchBatch: rate limited, retrying', {
          batchIndex,
          retryCount: retryCount + 1,
          delayMs: delay,
        })
        await ctx.scheduler.runAfter(
          delay,
          internal.matching.compute.processMatchBatch,
          {
            profileId,
            batchIndex,
            totalBatches,
            retryCount: retryCount + 1,
            previousOppIds,
            accumulatedGrowthAreas,
            runTimestamp,
          },
        )
        return
      }

      if (retryCount === 0) {
        log('warn', 'processMatchBatch: error, retrying once', {
          batchIndex,
          error: error instanceof Error ? error.message : String(error),
        })
        await ctx.scheduler.runAfter(
          RATE_LIMIT_DELAY_MS,
          internal.matching.compute.processMatchBatch,
          {
            profileId,
            batchIndex,
            totalBatches,
            retryCount: 1,
            previousOppIds,
            accumulatedGrowthAreas,
            runTimestamp,
          },
        )
        return
      }

      log('error', 'processMatchBatch: skipping batch after retry failure', {
        batchIndex,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    if (batchMatches.length > 0 || isLastBatch) {
      const newAccumulatedGrowthAreas = [
        ...accumulatedGrowthAreas,
        ...batchGrowthAreas,
      ]

      await ctx.runMutation(internal.matching.mutations.saveBatchResults, {
        profileId,
        batchIndex,
        matches: batchMatches.map((m) => ({
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
        isLastBatch,
        previousOppIds,
        accumulatedGrowthAreas: newAccumulatedGrowthAreas,
        runTimestamp,
      })

      const durationMs = Date.now() - startTime
      log('info', 'processMatchBatch', {
        batchIndex,
        totalBatches,
        durationMs,
        matchCount: batchMatches.length,
        isLastBatch,
      })

      if (!isLastBatch) {
        await ctx.scheduler.runAfter(
          RATE_LIMIT_DELAY_MS,
          internal.matching.compute.processMatchBatch,
          {
            profileId,
            batchIndex: batchIndex + 1,
            totalBatches,
            retryCount: 0,
            previousOppIds,
            accumulatedGrowthAreas: newAccumulatedGrowthAreas,
            runTimestamp,
          },
        )
      }
    } else {
      const durationMs = Date.now() - startTime
      log('info', 'processMatchBatch: no matches in batch', {
        batchIndex,
        totalBatches,
        durationMs,
      })

      await ctx.scheduler.runAfter(
        RATE_LIMIT_DELAY_MS,
        internal.matching.compute.processMatchBatch,
        {
          profileId,
          batchIndex: batchIndex + 1,
          totalBatches,
          retryCount: 0,
          previousOppIds,
          accumulatedGrowthAreas,
          runTimestamp,
        },
      )
    }
  },
})
