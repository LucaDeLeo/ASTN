'use node'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { log } from '../lib/logging'
import { validateAndSanitizeBatch } from './validation'

export const runFullSync = internalAction({
  args: {},
  handler: async (ctx) => {
    log('info', 'Starting full opportunity sync')

    // Fetch from all sources in parallel
    const [eightyKJobs, aisafetyJobs, aisafetyEvents] = await Promise.all([
      ctx.runAction(internal.aggregation.eightyK.fetchOpportunities, {}),
      ctx.runAction(internal.aggregation.aisafety.fetchOpportunities, {}),
      ctx.runAction(internal.aggregation.aisafetyEvents.fetchOpportunities, {}),
    ])

    log('info', 'Fetched opportunities from sources', {
      eightyKCount: eightyKJobs.length,
      aisafetyCount: aisafetyJobs.length,
      aisafetyEventsCount: aisafetyEvents.length,
    })

    // Combine all jobs
    const allJobs = [...eightyKJobs, ...aisafetyJobs, ...aisafetyEvents]

    if (allJobs.length === 0) {
      log('warn', 'No opportunities fetched from any source')
      return
    }

    // Validate and sanitize before upserting
    const { valid } = validateAndSanitizeBatch(allJobs)

    if (valid.length === 0) {
      log('warn', 'No valid opportunities after validation')
      return
    }

    // Upsert opportunities with deduplication
    await ctx.runMutation(
      internal.aggregation.syncMutations.upsertOpportunities,
      {
        opportunities: valid,
      },
    )

    // Archive opportunities that disappeared from sources
    await ctx.runMutation(internal.aggregation.syncMutations.archiveMissing, {
      currentSourceIds: valid.map((j) => j.sourceId),
    })

    // Schedule LLM enrichment for any new/unenriched opportunities
    await ctx.scheduler.runAfter(
      0,
      internal.aggregation.enrichment.runEnrichment,
      {},
    )

    log('info', 'Sync complete, enrichment scheduled')
  },
})

// Manual trigger for testing
export const triggerSync = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.aggregation.sync.runFullSync, {})
  },
})
