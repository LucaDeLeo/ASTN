'use node'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { log } from '../lib/logging'

export const runFullSync = internalAction({
  args: {},
  handler: async (ctx) => {
    log('info', 'Starting full opportunity sync')

    // Fetch from both sources in parallel
    const [eightyKJobs, aisafetyJobs] = await Promise.all([
      ctx.runAction(internal.aggregation.eightyK.fetchOpportunities, {}),
      ctx.runAction(internal.aggregation.aisafety.fetchOpportunities, {}),
    ])

    log('info', 'Fetched opportunities from sources', {
      eightyKCount: eightyKJobs.length,
      aisafetyCount: aisafetyJobs.length,
    })

    // Combine all jobs
    const allJobs = [...eightyKJobs, ...aisafetyJobs]

    if (allJobs.length === 0) {
      log('warn', 'No opportunities fetched from any source')
      return
    }

    // Upsert opportunities with deduplication
    await ctx.runMutation(
      internal.aggregation.syncMutations.upsertOpportunities,
      {
        opportunities: allJobs,
      },
    )

    // Archive opportunities that disappeared from sources
    await ctx.runMutation(internal.aggregation.syncMutations.archiveMissing, {
      currentSourceIds: allJobs.map((j) => j.sourceId),
    })

    log('info', 'Sync complete')
  },
})

// Manual trigger for testing
export const triggerSync = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.aggregation.sync.runFullSync, {})
  },
})
