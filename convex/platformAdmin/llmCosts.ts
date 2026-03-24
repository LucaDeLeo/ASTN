import { v } from 'convex/values'
import { query } from '../_generated/server'
import { requirePlatformAdmin } from '../lib/auth'
import { estimateCost, PRICING } from '../lib/llmUsage'

const OPERATION_LABELS: Record<string, string> = {
  matching_coarse: 'Coarse Matching',
  matching: 'Detailed Matching',
  enrichment_extraction: 'Profile Extraction',
  text_extraction: 'Text Extraction',
  opportunity_enrichment: 'Opp. Enrichment',
  engagement: 'Engagement Scoring',
  career_actions: 'Career Actions',
  enrichment_chat: 'Chat',
  pdf_extraction: 'PDF Extraction',
  agent_chat: 'Sidebar Agent',
}

function formatOperationLabel(op: string): string {
  return OPERATION_LABELS[op] ?? op
}

function bucketKey(
  ts: number,
  granularity: 'day' | 'week' | 'month',
): { periodStart: number; periodLabel: string } {
  const d = new Date(ts)
  if (granularity === 'day') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const label = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    return { periodStart: start.getTime(), periodLabel: label }
  }
  if (granularity === 'week') {
    // Week starts on Monday
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(d.getFullYear(), d.getMonth(), diff)
    start.setHours(0, 0, 0, 0)
    const label = `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    return { periodStart: start.getTime(), periodLabel: label }
  }
  // month
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const label = start.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
  return { periodStart: start.getTime(), periodLabel: label }
}

const MODEL_SHORT_NAMES: Record<string, string> = {
  'claude-sonnet-4-6': 'Sonnet 4.6',
  'claude-haiku-4-5': 'Haiku 4.5',
  'gemini-3-flash-preview': 'Gemini Flash',
  'kimi-k2.5': 'Kimi K2.5',
}

function shortModelName(model: string): string {
  return MODEL_SHORT_NAMES[model] ?? model
}

function roundCost(value: number): number {
  return Math.round(value * 10000) / 10000
}

/** Cost over time, broken down by model. Powers the main stacked bar chart. */
export const getCostTimeSeries = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    granularity: v.union(
      v.literal('day'),
      v.literal('week'),
      v.literal('month'),
    ),
  },
  returns: v.any(),
  handler: async (ctx, { startTime, endTime, granularity }) => {
    await requirePlatformAdmin(ctx)

    const rows = await ctx.db
      .query('llmUsage')
      .withIndex('by_createdAt', (q) =>
        q.gte('createdAt', startTime).lte('createdAt', endTime),
      )
      .collect()

    const buckets = new Map<
      number,
      {
        periodStart: number
        periodLabel: string
        totalCostUsd: number
        byModel: Map<string, number>
      }
    >()

    for (const row of rows) {
      const { periodStart, periodLabel } = bucketKey(row.createdAt, granularity)
      let bucket = buckets.get(periodStart)
      if (!bucket) {
        bucket = {
          periodStart,
          periodLabel,
          totalCostUsd: 0,
          byModel: new Map(),
        }
        buckets.set(periodStart, bucket)
      }
      const cost = estimateCost(row.model, row.inputTokens, row.outputTokens)
      bucket.totalCostUsd += cost
      const modelName = shortModelName(row.model)
      bucket.byModel.set(modelName, (bucket.byModel.get(modelName) ?? 0) + cost)
    }

    // Collect all model names across all buckets for consistent keys
    const allModels = new Set<string>()
    for (const bucket of buckets.values()) {
      for (const m of bucket.byModel.keys()) allModels.add(m)
    }

    return [...buckets.values()]
      .sort((a, b) => a.periodStart - b.periodStart)
      .map((b) => {
        const entry: Record<string, unknown> = {
          periodStart: b.periodStart,
          periodLabel: b.periodLabel,
          totalCostUsd: roundCost(b.totalCostUsd),
        }
        for (const m of allModels) {
          entry[m] = roundCost(b.byModel.get(m) ?? 0)
        }
        return entry
      })
  },
})

/** Cost breakdown by model. Powers pie chart. */
export const getCostByModel = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, { startTime, endTime }) => {
    await requirePlatformAdmin(ctx)

    const rows = await ctx.db
      .query('llmUsage')
      .withIndex('by_createdAt', (q) =>
        q.gte('createdAt', startTime).lte('createdAt', endTime),
      )
      .collect()

    const buckets = new Map<
      string,
      {
        model: string
        displayName: string
        callCount: number
        totalInputTokens: number
        totalOutputTokens: number
      }
    >()

    for (const row of rows) {
      let bucket = buckets.get(row.model)
      if (!bucket) {
        bucket = {
          model: row.model,
          displayName: shortModelName(row.model),
          callCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
        }
        buckets.set(row.model, bucket)
      }
      bucket.callCount++
      bucket.totalInputTokens += row.inputTokens
      bucket.totalOutputTokens += row.outputTokens
    }

    return [...buckets.values()]
      .map((b) => ({
        ...b,
        costUsd: roundCost(
          estimateCost(b.model, b.totalInputTokens, b.totalOutputTokens),
        ),
        pricePerMInput: PRICING[b.model]?.input ?? 0,
        pricePerMOutput: PRICING[b.model]?.output ?? 0,
      }))
      .sort((a, b) => b.costUsd - a.costUsd)
  },
})

/** Cost breakdown by operation. Powers horizontal bar chart. */
export const getCostByOperation = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, { startTime, endTime }) => {
    await requirePlatformAdmin(ctx)

    const rows = await ctx.db
      .query('llmUsage')
      .withIndex('by_createdAt', (q) =>
        q.gte('createdAt', startTime).lte('createdAt', endTime),
      )
      .collect()

    const buckets = new Map<
      string,
      {
        operation: string
        label: string
        callCount: number
        totalInputTokens: number
        totalOutputTokens: number
        costUsd: number
      }
    >()

    for (const row of rows) {
      let bucket = buckets.get(row.operation)
      if (!bucket) {
        bucket = {
          operation: row.operation,
          label: formatOperationLabel(row.operation),
          callCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          costUsd: 0,
        }
        buckets.set(row.operation, bucket)
      }
      bucket.callCount++
      bucket.totalInputTokens += row.inputTokens
      bucket.totalOutputTokens += row.outputTokens
      bucket.costUsd += estimateCost(
        row.model,
        row.inputTokens,
        row.outputTokens,
      )
    }

    return [...buckets.values()]
      .map((b) => ({
        ...b,
        costUsd: roundCost(b.costUsd),
      }))
      .sort((a, b) => b.costUsd - a.costUsd)
  },
})

/** Matching-specific stats: unique users, cost per user, coarse vs detailed. */
export const getMatchingStats = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, { startTime, endTime }) => {
    await requirePlatformAdmin(ctx)

    const rows = await ctx.db
      .query('llmUsage')
      .withIndex('by_createdAt', (q) =>
        q.gte('createdAt', startTime).lte('createdAt', endTime),
      )
      .collect()

    const matchingRows = rows.filter(
      (r) => r.operation === 'matching' || r.operation === 'matching_coarse',
    )

    const profileIds = new Set<string>()
    let coarseCalls = 0
    let coarseCostUsd = 0
    let detailedCalls = 0
    let detailedCostUsd = 0

    for (const row of matchingRows) {
      if (row.profileId) profileIds.add(row.profileId)
      else if (row.userId) profileIds.add(row.userId)
      const cost = estimateCost(row.model, row.inputTokens, row.outputTokens)
      if (row.operation === 'matching_coarse') {
        coarseCalls++
        coarseCostUsd += cost
      } else {
        detailedCalls++
        detailedCostUsd += cost
      }
    }

    const totalCost = coarseCostUsd + detailedCostUsd
    const uniqueUsers = profileIds.size

    return {
      uniqueUsersMatched: uniqueUsers,
      totalMatchingCalls: matchingRows.length,
      totalMatchingCostUsd: roundCost(totalCost),
      avgCostPerUserUsd:
        uniqueUsers > 0 ? roundCost(totalCost / uniqueUsers) : 0,
      coarseCalls,
      coarseCostUsd: roundCost(coarseCostUsd),
      detailedCalls,
      detailedCostUsd: roundCost(detailedCostUsd),
    }
  },
})

/** Top-level KPIs: total spend, total calls, avg cost, top operation. */
export const getOverallStats = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, { startTime, endTime }) => {
    await requirePlatformAdmin(ctx)

    const rows = await ctx.db
      .query('llmUsage')
      .withIndex('by_createdAt', (q) =>
        q.gte('createdAt', startTime).lte('createdAt', endTime),
      )
      .collect()

    let totalCostUsd = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const opCosts = new Map<string, number>()

    for (const row of rows) {
      const cost = estimateCost(row.model, row.inputTokens, row.outputTokens)
      totalCostUsd += cost
      totalInputTokens += row.inputTokens
      totalOutputTokens += row.outputTokens
      opCosts.set(row.operation, (opCosts.get(row.operation) ?? 0) + cost)
    }

    let mostExpensiveOperation = ''
    let mostExpensiveOperationCostUsd = 0
    for (const [op, cost] of opCosts) {
      if (cost > mostExpensiveOperationCostUsd) {
        mostExpensiveOperation = formatOperationLabel(op)
        mostExpensiveOperationCostUsd = cost
      }
    }

    return {
      totalCostUsd: roundCost(totalCostUsd),
      totalCalls: rows.length,
      avgCostPerCallUsd:
        rows.length > 0 ? roundCost(totalCostUsd / rows.length) : 0,
      totalInputTokens,
      totalOutputTokens,
      mostExpensiveOperation: mostExpensiveOperation || 'N/A',
      mostExpensiveOperationCostUsd: roundCost(mostExpensiveOperationCostUsd),
    }
  },
})
