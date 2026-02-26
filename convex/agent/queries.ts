import { v } from 'convex/values'
import { listUIMessages, syncStreams, vStreamArgs } from '@convex-dev/agent'
import { paginationOptsValidator } from 'convex/server'
import { components } from '../_generated/api'
import { internalQuery, query } from '../_generated/server'
import { getUserId } from '../lib/auth'

/**
 * List messages for the agent chat UI with streaming support.
 * Used by useUIMessages hook on the frontend.
 */
export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const streams = await syncStreams(ctx, components.agent, args)
    const paginated = await listUIMessages(ctx, components.agent, args)
    return { ...paginated, streams }
  },
})

/**
 * Get all tool calls for a thread (for approve/undo UI).
 */
export const getToolCalls = query({
  args: {
    threadId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { threadId }) => {
    const userId = await getUserId(ctx)
    if (!userId) return []

    return await ctx.db
      .query('agentToolCalls')
      .withIndex('by_thread_and_createdAt', (q) => q.eq('threadId', threadId))
      .collect()
  },
})

/**
 * Internal query to get a profile by its document ID.
 * Used by agent tools to read current profile state.
 */
export const getProfileById = internalQuery({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.any(),
  handler: async (ctx, { profileId }) => {
    return await ctx.db.get('profiles', profileId)
  },
})

/**
 * Internal query to get a profile by userId.
 * Used by agent tools which only have ctx.userId available.
 */
export const getProfileByUserId = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()
  },
})

// ── Page context queries (called by streamResponse) ──────────────────────────

/**
 * Fetch a match joined with its opportunity.
 * Used to build rich page context when viewing a specific match.
 */
export const getMatchWithOpportunity = internalQuery({
  args: {
    matchId: v.id('matches'),
    profileId: v.id('profiles'),
  },
  returns: v.any(),
  handler: async (ctx, { matchId, profileId }) => {
    const match = await ctx.db.get('matches', matchId)
    if (!match || match.profileId !== profileId) return null
    const opportunity = await ctx.db.get('opportunities', match.opportunityId)
    return { match, opportunity }
  },
})

/**
 * Fetch an opportunity and check if user already has a match for it.
 */
export const getOpportunityForContext = internalQuery({
  args: {
    opportunityId: v.id('opportunities'),
    profileId: v.id('profiles'),
  },
  returns: v.any(),
  handler: async (ctx, { opportunityId, profileId }) => {
    const opportunity = await ctx.db.get('opportunities', opportunityId)
    if (!opportunity) return null
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
    const existingMatch = matches.find((m) => m.opportunityId === opportunityId)
    return { opportunity, existingMatch: existingMatch ?? null }
  },
})

/**
 * Summary of user's matches: tier counts + top 3 per tier.
 */
export const getMatchesSummary = internalQuery({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.any(),
  handler: async (ctx, { profileId }) => {
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    const tiers: Record<
      string,
      Array<{ title: string; organization: string }>
    > = { great: [], good: [], exploring: [] }

    for (const match of matches) {
      const opp = await ctx.db.get('opportunities', match.opportunityId)
      if (opp) {
        tiers[match.tier].push({
          title: opp.title,
          organization: opp.organization,
        })
      }
    }

    return {
      counts: {
        great: tiers.great.length,
        good: tiers.good.length,
        exploring: tiers.exploring.length,
      },
      topByTier: {
        great: tiers.great.slice(0, 3),
        good: tiers.good.slice(0, 3),
        exploring: tiers.exploring.slice(0, 3),
      },
    }
  },
})

// ── Agent tool queries ───────────────────────────────────────────────────────

/**
 * All matches with joined opportunity title/org for the agent summary tool.
 */
export const getMatchesWithOpportunities = internalQuery({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.any(),
  handler: async (ctx, { profileId }) => {
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    const results = []
    for (const match of matches) {
      const opp = await ctx.db.get('opportunities', match.opportunityId)
      if (opp) {
        results.push({
          matchId: match._id,
          tier: match.tier,
          score: match.score,
          status: match.status,
          strengths: match.explanation.strengths,
          gap: match.explanation.gap,
          recommendations: match.recommendations,
          opportunityTitle: opp.title,
          organization: opp.organization,
          roleType: opp.roleType,
          location: opp.location,
          isRemote: opp.isRemote,
        })
      }
    }
    return results
  },
})

/**
 * All career actions for the user.
 */
export const getCareerActionsForAgent = internalQuery({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.any(),
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query('careerActions')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

/**
 * Get recently extracted documents for a user (up to 3).
 * Used to inject extracted CV/resume content into the agent's system prompt.
 */
export const getRecentExtractedDocuments = internalQuery({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, { userId }) => {
    const docs = await ctx.db
      .query('uploadedDocuments')
      .withIndex('by_user_and_status', (q) =>
        q.eq('userId', userId).eq('status', 'extracted'),
      )
      .collect()
    return docs
      .filter((d) => d.extractedData)
      .sort((a, b) => b.uploadedAt - a.uploadedAt)
      .slice(0, 3)
      .map((d) => ({
        fileName: d.fileName,
        uploadedAt: d.uploadedAt,
        extractedData: d.extractedData,
      }))
  },
})

// ── BAISH CRM lookup ─────────────────────────────────────────────────────────

/**
 * Look up a BAISH CRM import by email.
 * Checks primary email via index, then falls back to scanning otherEmails.
 */
export const getBaishImport = internalQuery({
  args: {
    email: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase()

    // Fast path: indexed lookup on primary email
    const primary = await ctx.db
      .query('baishImports')
      .withIndex('by_email', (q) => q.eq('email', normalized))
      .first()
    if (primary) return primary

    // Slow path: scan all records checking otherEmails (59 records, acceptable)
    const all = await ctx.db.query('baishImports').collect()
    for (const record of all) {
      if (record.otherEmails?.includes(normalized)) {
        return record
      }
    }

    return null
  },
})

/**
 * Search opportunities by title using the search index.
 */
export const searchOpportunitiesInternal = internalQuery({
  args: {
    searchTerm: v.string(),
    roleType: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, { searchTerm, roleType, isRemote, limit }) => {
    const results = await ctx.db
      .query('opportunities')
      .withSearchIndex('search_title', (q) => {
        let sq = q.search('title', searchTerm).eq('status', 'active')
        if (roleType) sq = sq.eq('roleType', roleType)
        if (isRemote !== undefined) sq = sq.eq('isRemote', isRemote)
        return sq
      })
      .take(limit ?? 10)

    return results.map((opp) => ({
      _id: opp._id,
      title: opp.title,
      organization: opp.organization,
      location: opp.location,
      isRemote: opp.isRemote,
      roleType: opp.roleType,
      description: opp.description.slice(0, 300),
      deadline: opp.deadline,
      sourceUrl: opp.sourceUrl,
    }))
  },
})

/**
 * List opportunities with optional filters using indexes.
 */
export const listOpportunitiesInternal = internalQuery({
  args: {
    roleType: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, { roleType, isRemote, limit }) => {
    let results
    if (roleType) {
      results = await ctx.db
        .query('opportunities')
        .withIndex('by_role_type', (q) =>
          q.eq('roleType', roleType).eq('status', 'active'),
        )
        .take(limit ?? 10)
    } else if (isRemote !== undefined) {
      results = await ctx.db
        .query('opportunities')
        .withIndex('by_location', (q) =>
          q.eq('isRemote', isRemote).eq('status', 'active'),
        )
        .take(limit ?? 10)
    } else {
      results = await ctx.db
        .query('opportunities')
        .withIndex('by_status', (q) => q.eq('status', 'active'))
        .take(limit ?? 10)
    }

    return results.map((opp) => ({
      _id: opp._id,
      title: opp.title,
      organization: opp.organization,
      location: opp.location,
      isRemote: opp.isRemote,
      roleType: opp.roleType,
      description: opp.description.slice(0, 300),
      deadline: opp.deadline,
      sourceUrl: opp.sourceUrl,
    }))
  },
})
