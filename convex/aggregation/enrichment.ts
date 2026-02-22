'use node'

import { v } from 'convex/values'
import Anthropic from '@anthropic-ai/sdk'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { log } from '../lib/logging'
import { buildUsageArgs } from '../lib/llmUsage'
import { MODEL_FAST } from '../lib/models'
import {
  ENRICHMENT_SYSTEM_PROMPT,
  buildEnrichmentContext,
  enrichOpportunitiesTool,
} from './enrichmentPrompts'
import { enrichmentResultSchema } from './enrichmentValidation'
import type { Id } from '../_generated/dataModel'

const BATCH_SIZE = 10
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

export const runEnrichment = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const unenriched = await ctx.runQuery(
      internal.aggregation.enrichmentMutations.getUnenrichedOpportunities,
      {},
    )

    if (unenriched.length === 0) {
      log('info', 'Enrichment: no unenriched opportunities found')
      return null
    }

    const snapshotIds = unenriched.map(
      (o: { _id: Id<'opportunities'> }) => o._id,
    )
    const totalBatches = Math.ceil(snapshotIds.length / BATCH_SIZE)

    log('info', 'Enrichment: starting', {
      totalOpportunities: snapshotIds.length,
      totalBatches,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.aggregation.enrichment.processEnrichmentBatch,
      {
        snapshotIds,
        batchIndex: 0,
        totalBatches,
        retryCount: 0,
      },
    )

    return null
  },
})

export const processEnrichmentBatch = internalAction({
  args: {
    snapshotIds: v.array(v.id('opportunities')),
    batchIndex: v.number(),
    totalBatches: v.number(),
    retryCount: v.number(),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { snapshotIds, batchIndex, totalBatches, retryCount },
  ) => {
    const batchIds = snapshotIds.slice(
      batchIndex * BATCH_SIZE,
      (batchIndex + 1) * BATCH_SIZE,
    )

    if (batchIds.length === 0) {
      log('warn', 'Enrichment: empty batch, skipping', { batchIndex })
      return null
    }

    // Fetch current opportunity data
    const batch = await ctx.runQuery(
      internal.matching.queries.getOpportunitiesByIds,
      { ids: batchIds },
    )

    if (batch.length === 0) {
      log('warn', 'Enrichment: all opportunities in batch inactive', {
        batchIndex,
      })
      // Schedule next batch
      if (batchIndex + 1 < totalBatches) {
        await ctx.scheduler.runAfter(
          RATE_LIMIT_DELAY_MS,
          internal.aggregation.enrichment.processEnrichmentBatch,
          {
            snapshotIds,
            batchIndex: batchIndex + 1,
            totalBatches,
            retryCount: 0,
          },
        )
      }
      return null
    }

    try {
      const context = buildEnrichmentContext(batch)

      const anthropic = new Anthropic()
      const apiStart = Date.now()
      const response = await anthropic.messages.create({
        model: MODEL_FAST,
        max_tokens: 2048,
        tools: [enrichOpportunitiesTool],
        tool_choice: { type: 'tool', name: 'enrich_opportunities' },
        system: ENRICHMENT_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `${context}\n\nAnalyze each opportunity and infer any missing or low-quality metadata fields. Only include fields you are confident about.`,
          },
        ],
      })
      const apiDuration = Date.now() - apiStart

      await ctx.runMutation(
        internal.lib.llmUsage.logUsage,
        buildUsageArgs('opportunity_enrichment', MODEL_FAST, response.usage, {
          durationMs: apiDuration,
        }),
      )

      const toolUse = response.content.find(
        (block) => block.type === 'tool_use',
      )

      if (!toolUse) {
        log('error', 'Enrichment: no tool use in response', { batchIndex })
      } else {
        const parseResult = enrichmentResultSchema.safeParse(toolUse.input)
        if (!parseResult.success) {
          const issues = parseResult.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')
          log('error', 'Enrichment: validation failed', { batchIndex, issues })
        } else {
          await ctx.runMutation(
            internal.aggregation.enrichmentMutations.applyEnrichments,
            {
              enrichments: parseResult.data.enrichments.map((e) => ({
                opportunityId: e.opportunityId,
                location: e.location,
                experienceLevel: e.experienceLevel,
                roleType: e.roleType,
                isRemote: e.isRemote,
                salaryRange: e.salaryRange,
                skills: e.skills,
              })),
              batchIds,
            },
          )
        }
      }
    } catch (error: unknown) {
      if (isRateLimitError(error) && retryCount < MAX_RETRIES) {
        const delay = Math.min(
          RATE_LIMIT_DELAY_MS * Math.pow(2, retryCount),
          60000,
        )
        log('warn', 'Enrichment: rate limited, retrying', {
          batchIndex,
          retryCount: retryCount + 1,
          delayMs: delay,
        })
        await ctx.scheduler.runAfter(
          delay,
          internal.aggregation.enrichment.processEnrichmentBatch,
          { snapshotIds, batchIndex, totalBatches, retryCount: retryCount + 1 },
        )
        return null
      }

      if (retryCount === 0) {
        log('warn', 'Enrichment: error, retrying once', {
          batchIndex,
          error: error instanceof Error ? error.message : String(error),
        })
        await ctx.scheduler.runAfter(
          RATE_LIMIT_DELAY_MS,
          internal.aggregation.enrichment.processEnrichmentBatch,
          { snapshotIds, batchIndex, totalBatches, retryCount: 1 },
        )
        return null
      }

      log('error', 'Enrichment: skipping batch after retry failure', {
        batchIndex,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    const isLastBatch = batchIndex + 1 >= totalBatches

    if (isLastBatch) {
      log('info', 'Enrichment: all batches complete', { totalBatches })
    } else {
      await ctx.scheduler.runAfter(
        RATE_LIMIT_DELAY_MS,
        internal.aggregation.enrichment.processEnrichmentBatch,
        {
          snapshotIds,
          batchIndex: batchIndex + 1,
          totalBatches,
          retryCount: 0,
        },
      )
    }

    return null
  },
})

// Manual trigger for testing/backfill
export const triggerEnrichment = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.runAction(internal.aggregation.enrichment.runEnrichment, {})
    return null
  },
})
