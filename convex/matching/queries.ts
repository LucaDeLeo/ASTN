import { v } from 'convex/values'
import { internalQuery } from '../_generated/server'
import { isProfileMatchReady } from '../profiles'

// Get full profile data for context construction
export const getFullProfile = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.db.get('profiles', profileId)
    if (!profile) return null

    return {
      _id: profile._id,
      name: profile.name,
      pronouns: profile.pronouns,
      location: profile.location,
      headline: profile.headline,
      education: profile.education || [],
      workHistory: profile.workHistory || [],
      skills: profile.skills || [],
      careerGoals: profile.careerGoals,
      aiSafetyInterests: profile.aiSafetyInterests || [],
      seeking: profile.seeking,
      enrichmentSummary: profile.enrichmentSummary,
      hasEnrichmentConversation: profile.hasEnrichmentConversation,
      privacySettings: profile.privacySettings,
      matchPreferences: profile.matchPreferences,
      matchesStaleAt: profile.matchesStaleAt,
    }
  },
})

// Get candidate opportunities for matching (excludes hidden orgs, expired, archived)
export const getCandidateOpportunities = internalQuery({
  args: {
    hiddenOrgs: v.array(v.string()),
  },
  handler: async (ctx, { hiddenOrgs }) => {
    const now = Date.now()

    // Get active opportunities
    let opportunities = await ctx.db
      .query('opportunities')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect()

    // Filter out:
    // 1. Organizations the user has hidden from their profile
    // 2. Expired opportunities (deadline passed)
    opportunities = opportunities.filter((opp) => {
      // Check hidden orgs
      if (hiddenOrgs.includes(opp.organization)) return false

      // Check deadline (only filter if deadline exists and has passed)
      if (opp.deadline && opp.deadline < now) return false

      return true
    })

    return opportunities
  },
})

// Get existing matches for a profile (for staleness check)
export const getExistingMatches = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

// Get opportunities by IDs (for snapshot-based batch processing)
export const getOpportunitiesByIds = internalQuery({
  args: { ids: v.array(v.id('opportunities')) },
  handler: async (ctx, { ids }) => {
    const results = await Promise.all(
      ids.map((id) => ctx.db.get('opportunities', id)),
    )
    return results.filter(
      (opp): opp is NonNullable<typeof opp> =>
        opp !== null && opp.status === 'active',
    )
  },
})

// Check whether a profile meets the completeness bar for matching
export const getProfileMatchReadiness = internalQuery({
  args: { profileId: v.id('profiles') },
  returns: v.object({
    ready: v.boolean(),
    completedCount: v.number(),
    totalCount: v.number(),
    missingRequired: v.array(v.string()),
    sectionsNeeded: v.number(),
  }),
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.db.get('profiles', profileId)
    return isProfileMatchReady(
      profile as unknown as Record<string, unknown> | null,
    )
  },
})

// Get profile by userId (for public query to find profile)
export const getProfileByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()
  },
})
