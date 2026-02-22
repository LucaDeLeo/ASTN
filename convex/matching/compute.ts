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

// Programmatic hard filters — applied before LLM sees any opportunity
function applyHardFilters<
  T extends {
    _id: Id<'opportunities'>
    isRemote: boolean
    roleType: string
    experienceLevel?: string
  },
>(
  opportunities: Array<T>,
  prefs?: {
    remotePreference?: string
    roleTypes?: Array<string>
    experienceLevels?: Array<string>
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
    return true
  })
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
    const allOpportunities = await ctx.runQuery(
      internal.matching.queries.getCandidateOpportunities,
      { hiddenOrgs },
    )

    // Apply programmatic hard filters
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

    const previousOppIds = existingMatches.map(
      (m: { opportunityId: string }) => m.opportunityId,
    )

    // Snapshot opportunity IDs so batches work against a consistent set
    const snapshotOpportunityIds = evaluationSet.map(
      (o: { _id: Id<'opportunities'> }) => o._id,
    )

    const totalBatches = Math.ceil(evaluationSet.length / BATCH_SIZE)
    const runTimestamp = Date.now()

    // Fix 4: Build profile context once, pass as string to all batches
    const profileContext = buildProfileContext(profile)

    log('info', 'computeMatchesForProfile: starting chained matching', {
      profileId,
      totalOpportunities: allOpportunities.length,
      filteredCount: filteredOpportunities.length,
      evaluationCount: evaluationSet.length,
      isFullRecompute,
      totalBatches,
      runTimestamp,
    })

    // Set initial progress so the frontend can show a progress bar
    await ctx.runMutation(internal.matching.mutations.setMatchProgress, {
      profileId,
      totalBatches,
      totalOpportunities: evaluationSet.length,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.matching.compute.processMatchBatch,
      {
        profileId,
        profileContext,
        batchIndex: 0,
        totalBatches,
        retryCount: 0,
        previousOppIds,
        snapshotOpportunityIds,
        runTimestamp,
        validOpportunityIds,
        isFullRecompute,
        totalOpportunities: evaluationSet.length,
        startedAt: runTimestamp,
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
  }
}

// Process a single batch of opportunities - called as a chained scheduled action
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
      }
    > = {}
    for (const opp of batch) {
      opportunitySnapshots[String(opp._id)] = buildOpportunitySnapshot(opp)
    }

    // Common args for saveBatchResults calls
    const saveBatchArgs = {
      profileId,
      batchIndex,
      totalBatches,
      previousOppIds,
      runTimestamp,
      validOpportunityIds,
      isFullRecompute,
      opportunitySnapshots,
      totalOpportunities,
      startedAt,
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
        contents: `${profileContext}\n\n${opportunitiesContext}\n\nScore all opportunities for this candidate. Include only opportunities with tier great, good, or exploring - skip any that have no reasonable fit.`,
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

    // Save results when we have matches or this is the final batch
    if (batchMatches.length > 0 || isLastBatch) {
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
