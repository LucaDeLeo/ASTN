'use node'

import { v } from 'convex/values'
import { GoogleGenAI } from '@google/genai'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { log } from '../lib/logging'
import { buildUsageArgs } from '../lib/llmUsage'
import { MODEL_GEMINI_FAST } from '../lib/models'
import {
  COARSE_MATCHING_PROMPT,
  buildOpportunitiesContext,
  coarseResponseSchema,
} from './prompts'
import { coarseResultSchema } from './validation'
import type { Id } from '../_generated/dataModel'

const COARSE_BATCH_SIZE = 50
const TOP_N = 25
const COARSE_THRESHOLD = 40
const DETAILED_BATCH_SIZE = 15
const MAX_RETRIES = 10
const RATE_LIMIT_DELAY_MS = 1000

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

// Tier 2: Coarse LLM scoring — large batches, simple output (just scores)
// Chains across batches via scheduler args, then schedules Tier 3 for top candidates
export const processCoarseBatch = internalAction({
  args: {
    profileId: v.id('profiles'),
    profileContext: v.string(),
    batchIndex: v.number(),
    totalCoarseBatches: v.number(),
    retryCount: v.number(),
    snapshotOpportunityIds: v.array(v.id('opportunities')),
    coarseScores: v.array(
      v.object({
        opportunityId: v.string(),
        score: v.number(),
      }),
    ),
    // Forwarded to Tier 3
    previousOppIds: v.array(v.string()),
    validOpportunityIds: v.array(v.id('opportunities')),
    isFullRecompute: v.boolean(),
    runTimestamp: v.number(),
    totalBatches: v.number(), // combined T2+T3 for progress
    totalOpportunities: v.number(),
    startedAt: v.number(),
    isFirstComputation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const {
      profileId,
      profileContext,
      batchIndex,
      totalCoarseBatches,
      retryCount,
      snapshotOpportunityIds,
      coarseScores,
      previousOppIds,
      validOpportunityIds,
      isFullRecompute,
      runTimestamp,
      totalBatches,
      totalOpportunities,
      startedAt,
      isFirstComputation,
    } = args

    const isLastCoarseBatch = batchIndex + 1 >= totalCoarseBatches

    // Slice batch from snapshot IDs
    const batchIds = snapshotOpportunityIds.slice(
      batchIndex * COARSE_BATCH_SIZE,
      (batchIndex + 1) * COARSE_BATCH_SIZE,
    )

    if (batchIds.length === 0 && !isLastCoarseBatch) {
      log('warn', 'processCoarseBatch: empty batch, skipping', { batchIndex })
      return
    }

    const batch =
      batchIds.length > 0
        ? await ctx.runQuery(internal.matching.queries.getOpportunitiesByIds, {
            ids: batchIds,
          })
        : []

    // Args forwarded when scheduling next coarse batch or Tier 3
    const forwardArgs = {
      profileId,
      profileContext,
      totalCoarseBatches,
      snapshotOpportunityIds,
      previousOppIds,
      validOpportunityIds,
      isFullRecompute,
      runTimestamp,
      totalBatches,
      totalOpportunities,
      startedAt,
      isFirstComputation,
    }

    const newScores = [...coarseScores]

    if (batch.length > 0) {
      try {
        const opportunitiesContext = buildOpportunitiesContext(batch)

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
        const apiStart = Date.now()
        const response = await ai.models.generateContent({
          model: MODEL_GEMINI_FAST,
          contents: `${profileContext}\n\n${opportunitiesContext}\n\nScore ALL opportunities for this candidate. You MUST return a score for every opportunity.`,
          config: {
            systemInstruction: COARSE_MATCHING_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: coarseResponseSchema,
          },
        })
        const apiDuration = Date.now() - apiStart

        await ctx.runMutation(
          internal.lib.llmUsage.logUsage,
          buildUsageArgs(
            'matching_coarse',
            MODEL_GEMINI_FAST,
            {
              promptTokenCount: response.usageMetadata?.promptTokenCount ?? 0,
              candidatesTokenCount:
                response.usageMetadata?.candidatesTokenCount ?? 0,
            },
            { profileId, durationMs: apiDuration },
          ),
        )

        const parsed = JSON.parse(response.text!)
        const parseResult = coarseResultSchema.safeParse(parsed)
        if (!parseResult.success) {
          const issues = parseResult.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')
          throw new Error(
            `Coarse scoring validation failed for batch ${batchIndex}: ${issues}`,
          )
        }

        // Only keep scores that reference valid opportunity IDs from this batch
        const validIds = new Set(batch.map((o: { _id: string }) => o._id))
        let acceptedCount = 0
        for (const score of parseResult.data.scores) {
          if (validIds.has(score.opportunityId)) {
            newScores.push(score)
            acceptedCount++
          }
        }

        // Warn if LLM skipped opportunities — they won't be considered for T3
        if (acceptedCount < batch.length) {
          log(
            'warn',
            'processCoarseBatch: LLM returned fewer scores than opportunities',
            {
              batchIndex,
              expected: batch.length,
              received: acceptedCount,
              missing: batch.length - acceptedCount,
            },
          )
        }
      } catch (error: unknown) {
        if (isRateLimitError(error) && retryCount < MAX_RETRIES) {
          const delay = Math.min(
            RATE_LIMIT_DELAY_MS * Math.pow(2, retryCount),
            60000,
          )
          log('warn', 'processCoarseBatch: rate limited, retrying', {
            batchIndex,
            retryCount: retryCount + 1,
            delayMs: delay,
          })
          await ctx.scheduler.runAfter(
            delay,
            internal.matching.coarse.processCoarseBatch,
            {
              ...forwardArgs,
              batchIndex,
              retryCount: retryCount + 1,
              coarseScores,
            },
          )
          return
        }

        if (retryCount === 0) {
          log('warn', 'processCoarseBatch: error, retrying once', {
            batchIndex,
            error: error instanceof Error ? error.message : String(error),
          })
          await ctx.scheduler.runAfter(
            RATE_LIMIT_DELAY_MS,
            internal.matching.coarse.processCoarseBatch,
            {
              ...forwardArgs,
              batchIndex,
              retryCount: 1,
              coarseScores,
            },
          )
          return
        }

        // Failed after retries — skip this batch's scores, continue pipeline
        log('error', 'processCoarseBatch: skipping batch after retry failure', {
          batchIndex,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Update progress
    await ctx.runMutation(internal.matching.mutations.updateMatchProgress, {
      profileId,
      completedBatches: batchIndex + 1,
      totalBatches,
      totalOpportunities,
      startedAt,
    })

    log('info', 'processCoarseBatch', {
      batchIndex,
      totalCoarseBatches,
      scoresThisBatch: newScores.length - coarseScores.length,
      totalScores: newScores.length,
      isLastCoarseBatch,
    })

    if (!isLastCoarseBatch) {
      // Schedule next coarse batch
      await ctx.scheduler.runAfter(
        RATE_LIMIT_DELAY_MS,
        internal.matching.coarse.processCoarseBatch,
        {
          ...forwardArgs,
          batchIndex: batchIndex + 1,
          retryCount: 0,
          coarseScores: newScores,
        },
      )
      return
    }

    // === Last coarse batch: select candidates for Tier 3 detailed scoring ===

    let topOppIds: Array<Id<'opportunities'>>

    // First computation uses top-N like full recompute — a niche new user
    // could have nothing above the threshold and end up with 0 matches
    const useTopN = isFullRecompute || isFirstComputation

    if (useTopN) {
      // Full recompute / first computation: take top N by score
      const sorted = [...newScores].sort((a, b) => b.score - a.score)
      topOppIds = sorted
        .slice(0, TOP_N)
        .map((s) => s.opportunityId as Id<'opportunities'>)
    } else {
      // Incremental: take all above threshold
      topOppIds = newScores
        .filter((s) => s.score >= COARSE_THRESHOLD)
        .map((s) => s.opportunityId as Id<'opportunities'>)
    }

    log('info', 'processCoarseBatch: coarse scoring complete', {
      profileId,
      totalScored: newScores.length,
      selectedForDetailed: topOppIds.length,
      isFullRecompute,
      topScores: [...newScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((s) => ({ id: s.opportunityId.slice(-6), score: s.score })),
    })

    if (topOppIds.length === 0) {
      // No opportunities qualified for detailed scoring
      if (isFullRecompute) {
        // Run saveBatchResults with empty matches to trigger cleanup
        await ctx.runMutation(internal.matching.mutations.saveBatchResults, {
          profileId,
          batchIndex: 0,
          totalBatches,
          matches: [],
          modelVersion: MODEL_GEMINI_FAST,
          isLastBatch: true,
          previousOppIds,
          runTimestamp,
          validOpportunityIds,
          isFullRecompute,
          opportunitySnapshots: {},
          totalOpportunities,
          startedAt,
          progressBatchOffset: totalCoarseBatches,
        })
      } else {
        await ctx.runMutation(internal.matching.mutations.cleanupOnlyMatches, {
          profileId,
          validOpportunityIds,
        })
        await ctx.runMutation(internal.matching.mutations.clearMatchProgress, {
          profileId,
          startedAt,
        })
      }
      return
    }

    // Schedule Tier 3: detailed scoring for top candidates
    const detailedBatches = Math.ceil(topOppIds.length / DETAILED_BATCH_SIZE)

    // Correct the progress total now that we know actual T3 batch count
    // (the estimate in computeMatchesForProfile may differ)
    const actualTotalBatches = totalCoarseBatches + detailedBatches
    if (actualTotalBatches !== totalBatches) {
      await ctx.runMutation(internal.matching.mutations.updateMatchProgress, {
        profileId,
        completedBatches: totalCoarseBatches,
        totalBatches: actualTotalBatches,
        totalOpportunities,
        startedAt,
      })
    }

    await ctx.scheduler.runAfter(
      RATE_LIMIT_DELAY_MS,
      internal.matching.compute.processMatchBatch,
      {
        profileId,
        profileContext,
        batchIndex: 0,
        totalBatches: detailedBatches,
        retryCount: 0,
        previousOppIds,
        snapshotOpportunityIds: topOppIds,
        runTimestamp,
        validOpportunityIds,
        isFullRecompute,
        totalOpportunities,
        startedAt,
        isFirstComputation,
        progressBatchOffset: totalCoarseBatches,
        totalBatchesForProgress: actualTotalBatches,
      },
    )
  },
})
