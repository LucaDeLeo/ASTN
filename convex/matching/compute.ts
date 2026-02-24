'use node'

import { v } from 'convex/values'
import { GoogleGenAI } from '@google/genai'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { log } from '../lib/logging'
import { buildUsageArgs } from '../lib/llmUsage'
import { MODEL_GEMINI_FAST } from '../lib/models'
import {
  MATCHING_SYSTEM_PROMPT,
  buildOpportunitiesContext,
  buildProfileContext,
  matchResponseSchema,
} from './prompts'
import { matchResultSchema } from './validation'
import type { Id } from '../_generated/dataModel'

const BATCH_SIZE = 15 // Detailed scoring (Tier 3) batch size
const COARSE_BATCH_SIZE = 50 // Coarse scoring (Tier 2) batch size
const TOP_N = 25 // Top candidates selected for detailed scoring
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

// Extract the maximum USD salary from a free-text salaryRange field.
// Returns null if unparseable — err on the side of passing through (zero false negatives).
export function parseMaxSalary(
  salaryRange: string | undefined,
): number | null {
  if (!salaryRange) return null

  // Non-USD currencies — can't compare to minimumSalaryUSD
  if (/[€£¥₹]/.test(salaryRange)) return null
  if (/\b(EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY)\b/i.test(salaryRange)) return null

  // Non-annual rates — can't reliably convert to annual
  if (/\b(hour|hr|month|week|day)\b/i.test(salaryRange)) return null

  // Open-ended ranges like "$50,000+" indicate a floor, not a ceiling —
  // can't determine max salary, so pass through to avoid false negatives
  if (/\d\s*\+/.test(salaryRange)) return null

  const amounts: Array<number> = []
  const regex = /\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*([kK])?\b/g
  let m
  while ((m = regex.exec(salaryRange)) !== null) {
    let value = parseFloat(m[1].replace(/,/g, ''))
    if (m[2]) value *= 1000
    // Ignore tiny numbers (likely not salaries, e.g., "2 years experience")
    if (value >= 1000) amounts.push(value)
  }

  if (amounts.length === 0) return null
  return Math.max(...amounts)
}

// Programmatic hard filters — applied before LLM sees any opportunity
function applyHardFilters<
  T extends {
    _id: Id<'opportunities'>
    isRemote: boolean
    roleType: string
    experienceLevel?: string
    salaryRange?: string
  },
>(
  opportunities: Array<T>,
  prefs?: {
    remotePreference?: string
    roleTypes?: Array<string>
    experienceLevels?: Array<string>
    minimumSalaryUSD?: number
  },
): Array<T> {
  if (!prefs) return opportunities
  return opportunities.filter((opp) => {
    if (prefs.remotePreference === 'remote_only' && !opp.isRemote) return false
    if (prefs.roleTypes?.length && !prefs.roleTypes.includes(opp.roleType))
      return false
    // If opportunity has no experienceLevel, don't filter it out — let LLM decide
    if (
      prefs.experienceLevels?.length &&
      opp.experienceLevel &&
      !prefs.experienceLevels.includes(opp.experienceLevel)
    )
      return false
    // Salary filter: only filter if max salary is parseable AND below user's minimum
    if (prefs.minimumSalaryUSD) {
      const maxSalary = parseMaxSalary(opp.salaryRange)
      if (maxSalary !== null && maxSalary < prefs.minimumSalaryUSD) return false
    }
    return true
  })
}

// Entry point: starts the 3-tier matching pipeline for a profile
// Tier 1: Programmatic hard filters (instant)
// Tier 2: Coarse LLM scoring in large batches (cheap)
// Tier 3: Detailed LLM scoring on top candidates (expensive, same as before)
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

    // Tier 1: availability check — skip matching entirely for unavailable users
    if (profile.matchPreferences?.availability === 'not_available') {
      await ctx.runMutation(
        internal.matching.mutations.clearMatchesForProfile,
        { profileId },
      )
      log('info', 'computeMatchesForProfile: user not available, skipping', {
        profileId,
      })
      return { matchCount: 0, message: 'User not available for matching' }
    }

    const hiddenOrgs = profile.privacySettings?.hiddenFromOrgs || []
    const allOpportunities = await ctx.runQuery(
      internal.matching.queries.getCandidateOpportunities,
      { hiddenOrgs },
    )

    // Tier 1: Apply programmatic hard filters
    const filteredOpportunities = applyHardFilters(
      allOpportunities,
      profile.matchPreferences,
    )

    // Get existing matches for incremental logic
    const existingMatches = await ctx.runQuery(
      internal.matching.queries.getExistingMatches,
      { profileId },
    )

    const existingByOppId = new Map(
      existingMatches.map(
        (m: { opportunityId: string; computedAt: number }) => [
          m.opportunityId,
          m,
        ],
      ),
    )

    // Determine mode: full recompute if profile fields changed (matchesStaleAt set)
    const isFullRecompute = Boolean(profile.matchesStaleAt)

    // Build evaluation set
    let evaluationSet: typeof filteredOpportunities
    if (isFullRecompute) {
      evaluationSet = filteredOpportunities
    } else {
      // Incremental: only new or updated opportunities
      evaluationSet = filteredOpportunities.filter((opp) => {
        const existing = existingByOppId.get(opp._id)
        if (!existing) return true // New opportunity, no match exists
        return opp.updatedAt > (existing as { computedAt: number }).computedAt
      })
    }

    // Valid opportunity IDs = all filtered opportunities (for cleanup)
    const validOpportunityIds = filteredOpportunities.map((o) => o._id)

    if (evaluationSet.length === 0 && !isFullRecompute) {
      // Nothing to evaluate — just clean up stale matches
      await ctx.runMutation(internal.matching.mutations.cleanupOnlyMatches, {
        profileId,
        validOpportunityIds,
      })
      return { matchCount: 0, message: 'No new opportunities to evaluate' }
    }

    if (evaluationSet.length === 0 && isFullRecompute) {
      // Full recompute but no opportunities after filtering
      await ctx.runMutation(
        internal.matching.mutations.clearMatchesForProfile,
        { profileId },
      )
      return { matchCount: 0, message: 'No active opportunities to match' }
    }

    // Detect first computation: no existing matches means this is a brand new user
    const isFirstComputation = existingMatches.length === 0

    const previousOppIds = existingMatches.map(
      (m: { opportunityId: string }) => m.opportunityId,
    )

    // Snapshot opportunity IDs so batches work against a consistent set
    const snapshotOpportunityIds = evaluationSet.map(
      (o: { _id: Id<'opportunities'> }) => o._id,
    )

    const runTimestamp = Date.now()

    // Build profile context once, pass as string to all batches
    const profileContext = buildProfileContext(profile)

    // Calculate batch counts for 3-tier pipeline
    const totalCoarseBatches = Math.ceil(
      evaluationSet.length / COARSE_BATCH_SIZE,
    )
    const estimatedDetailedBatches = isFullRecompute
      ? Math.ceil(TOP_N / BATCH_SIZE)
      : Math.ceil(Math.min(evaluationSet.length, TOP_N) / BATCH_SIZE)
    const totalBatches = totalCoarseBatches + estimatedDetailedBatches

    log('info', 'computeMatchesForProfile: starting 3-tier matching', {
      profileId,
      totalOpportunities: allOpportunities.length,
      filteredCount: filteredOpportunities.length,
      evaluationCount: evaluationSet.length,
      isFullRecompute,
      totalCoarseBatches,
      estimatedDetailedBatches,
      totalBatches,
      runTimestamp,
    })

    // Set initial progress so the frontend can show a progress bar
    await ctx.runMutation(internal.matching.mutations.setMatchProgress, {
      profileId,
      totalBatches,
      totalOpportunities: evaluationSet.length,
    })

    // Schedule Tier 2: coarse scoring
    await ctx.scheduler.runAfter(
      0,
      internal.matching.coarse.processCoarseBatch,
      {
        profileId,
        profileContext,
        batchIndex: 0,
        totalCoarseBatches,
        retryCount: 0,
        snapshotOpportunityIds,
        coarseScores: [],
        previousOppIds,
        validOpportunityIds,
        isFullRecompute,
        runTimestamp,
        totalBatches,
        totalOpportunities: evaluationSet.length,
        startedAt: runTimestamp,
        isFirstComputation,
      },
    )

    return { message: 'Matching started', totalBatches }
  },
})

// Build opportunity snapshot for denormalization into match documents
function buildOpportunitySnapshot(opp: {
  title: string
  organization: string
  location: string
  isRemote: boolean
  roleType: string
  experienceLevel?: string
  salaryRange?: string
  extractedSkills?: Array<string>
  sourceUrl: string
  deadline?: number
  postedAt?: number
  opportunityType?: string
}) {
  return {
    title: opp.title,
    organization: opp.organization,
    location: opp.location,
    isRemote: opp.isRemote,
    roleType: opp.roleType,
    experienceLevel: opp.experienceLevel,
    salaryRange: opp.salaryRange,
    extractedSkills: opp.extractedSkills,
    sourceUrl: opp.sourceUrl,
    deadline: opp.deadline,
    postedAt: opp.postedAt,
    opportunityType: opp.opportunityType,
  }
}

// Process a single batch of opportunities (Tier 3: detailed scoring)
// Called as a chained scheduled action, typically after Tier 2 coarse scoring
export const processMatchBatch = internalAction({
  args: {
    profileId: v.id('profiles'),
    profileContext: v.string(),
    batchIndex: v.number(),
    totalBatches: v.number(),
    retryCount: v.number(),
    previousOppIds: v.array(v.string()),
    snapshotOpportunityIds: v.array(v.id('opportunities')),
    runTimestamp: v.number(),
    validOpportunityIds: v.array(v.id('opportunities')),
    isFullRecompute: v.boolean(),
    totalOpportunities: v.number(),
    startedAt: v.number(),
    isFirstComputation: v.boolean(),
    // Offset for progress bar: number of coarse batches already completed
    progressBatchOffset: v.optional(v.number()),
    // Combined T2+T3 total for progress display (defaults to totalBatches)
    totalBatchesForProgress: v.optional(v.number()),
  },
  handler: async (
    ctx,
    {
      profileId,
      profileContext,
      batchIndex,
      totalBatches,
      retryCount,
      previousOppIds,
      snapshotOpportunityIds,
      runTimestamp,
      validOpportunityIds,
      isFullRecompute,
      totalOpportunities,
      startedAt,
      isFirstComputation,
      progressBatchOffset,
      totalBatchesForProgress,
    },
  ) => {
    const startTime = Date.now()

    // Common args forwarded to all scheduler calls
    const chainArgs = {
      profileId,
      profileContext,
      totalBatches,
      previousOppIds,
      snapshotOpportunityIds,
      runTimestamp,
      validOpportunityIds,
      isFullRecompute,
      totalOpportunities,
      startedAt,
      isFirstComputation,
      progressBatchOffset,
      totalBatchesForProgress,
    }

    // Slice batch from snapshot IDs, then fetch current data
    const batchIds = snapshotOpportunityIds.slice(
      batchIndex * BATCH_SIZE,
      (batchIndex + 1) * BATCH_SIZE,
    )

    if (batchIds.length === 0) {
      log('warn', 'processMatchBatch: empty batch, skipping', {
        batchIndex,
        totalBatches,
      })
      return
    }

    const batch = await ctx.runQuery(
      internal.matching.queries.getOpportunitiesByIds,
      { ids: batchIds },
    )

    const isLastBatch = batchIndex + 1 >= totalBatches

    // Build opportunity snapshots map from this batch (Fix 3b)
    const opportunitySnapshots: Record<
      string,
      {
        title: string
        organization: string
        location: string
        isRemote: boolean
        roleType: string
        experienceLevel?: string
        salaryRange?: string
        extractedSkills?: Array<string>
        sourceUrl: string
        deadline?: number
        postedAt?: number
        opportunityType?: string
      }
    > = {}
    for (const opp of batch) {
      opportunitySnapshots[String(opp._id)] = buildOpportunitySnapshot(opp)
    }

    // Common args for saveBatchResults calls
    const saveBatchArgs = {
      profileId,
      batchIndex,
      totalBatches: totalBatchesForProgress ?? totalBatches,
      previousOppIds,
      runTimestamp,
      validOpportunityIds,
      isFullRecompute,
      opportunitySnapshots,
      totalOpportunities,
      startedAt,
      progressBatchOffset,
    }

    if (batch.length === 0) {
      log('warn', 'processMatchBatch: all opportunities in batch inactive', {
        batchIndex,
        totalBatches,
      })
      // If this is the last batch, still run saveBatchResults to trigger cleanup
      if (isLastBatch) {
        await ctx.runMutation(internal.matching.mutations.saveBatchResults, {
          ...saveBatchArgs,
          matches: [],
          modelVersion: MODEL_GEMINI_FAST,
          isLastBatch: true,
        })
      } else {
        await ctx.scheduler.runAfter(
          RATE_LIMIT_DELAY_MS,
          internal.matching.compute.processMatchBatch,
          {
            ...chainArgs,
            batchIndex: batchIndex + 1,
            retryCount: 0,
          },
        )
      }
      return
    }
    const batchMatches: Array<{
      opportunityId: Id<'opportunities'>
      tier: 'great' | 'good' | 'exploring'
      score: number
      strengths: Array<string>
      gap?: string
      recommendations: Array<{
        type: 'specific' | 'skill' | 'experience'
        action: string
        priority: 'high' | 'medium' | 'low'
      }>
    }> = []

    try {
      // Fix 4: Use pre-built profileContext instead of re-reading profile
      const opportunitiesContext = buildOpportunitiesContext(batch)

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
      const apiStart = Date.now()
      const response = await ai.models.generateContent({
        model: MODEL_GEMINI_FAST,
        contents: `${profileContext}\n\n${opportunitiesContext}\n\nScore ALL opportunities for this candidate. You MUST return a result for every opportunity — assign tier "exploring" with a low score to any that are a poor fit. Do not skip any.`,
        config: {
          systemInstruction: MATCHING_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: matchResponseSchema,
        },
      })
      const apiDuration = Date.now() - apiStart

      await ctx.runMutation(
        internal.lib.llmUsage.logUsage,
        buildUsageArgs(
          'matching',
          MODEL_GEMINI_FAST,
          {
            promptTokenCount: response.usageMetadata?.promptTokenCount ?? 0,
            candidatesTokenCount:
              response.usageMetadata?.candidatesTokenCount ?? 0,
          },
          {
            profileId,
            durationMs: apiDuration,
          },
        ),
      )

      const parsed = JSON.parse(response.text!)
      const parseResult = matchResultSchema.safeParse(parsed)
      if (!parseResult.success) {
        const issues = parseResult.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')
        throw new Error(
          `LLM validation failed for batch ${batchIndex}: ${issues}`,
        )
      }
      const batchResult = parseResult.data

      if (!Array.isArray(batchResult.matches)) {
        log('error', 'processMatchBatch: invalid matches array', {
          batchIndex,
        })
      } else {
        for (const match of batchResult.matches) {
          const oppId = match.opportunityId as Id<'opportunities'>
          const validOpp = batch.some((o: { _id: string }) => o._id === oppId)
          if (validOpp) {
            batchMatches.push({
              ...match,
              opportunityId: oppId,
            })
          }
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
            ...chainArgs,
            batchIndex,
            retryCount: retryCount + 1,
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
            ...chainArgs,
            batchIndex,
            retryCount: 1,
          },
        )
        return
      }

      log('error', 'processMatchBatch: skipping batch after retry failure', {
        batchIndex,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Always save batch results — even if empty (failed batch), so progress
    // updates correctly and old matches for those opportunities are preserved
    await ctx.runMutation(internal.matching.mutations.saveBatchResults, {
      ...saveBatchArgs,
      matches: batchMatches.map((m) => ({
        opportunityId: m.opportunityId,
        tier: m.tier,
        score: m.score,
        strengths: m.strengths,
        gap: m.gap ?? undefined,
        recommendations: m.recommendations,
      })),
      modelVersion: MODEL_GEMINI_FAST,
      isLastBatch,
    })

    // On last batch of first-ever computation, send immediate email with great matches
    if (isLastBatch && isFirstComputation) {
      await ctx.scheduler.runAfter(
        0,
        internal.emails.batchActions.sendFirstMatchEmail,
        { profileId },
      )
    }

    const durationMs = Date.now() - startTime
    log('info', 'processMatchBatch', {
      batchIndex,
      totalBatches,
      durationMs,
      matchCount: batchMatches.length,
      isLastBatch,
    })

    // Schedule the next batch unless this was the last one
    if (!isLastBatch) {
      await ctx.scheduler.runAfter(
        RATE_LIMIT_DELAY_MS,
        internal.matching.compute.processMatchBatch,
        {
          ...chainArgs,
          batchIndex: batchIndex + 1,
          retryCount: 0,
        },
      )
    }
  },
})
