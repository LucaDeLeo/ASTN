import { v } from 'convex/values'
import { internalQuery, query } from '../_generated/server'
import { getUserId } from '../lib/auth'

// Get full profile data for context construction (reuses matching pattern)
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
    }
  },
})

// Get all career actions for a profile
export const getExistingActions = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query('careerActions')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

// Get preserved actions (saved, in_progress, done) -- used during regeneration
export const getPreservedActions = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    const actions = await ctx.db
      .query('careerActions')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    return actions.filter(
      (a) =>
        a.status === 'saved' ||
        a.status === 'in_progress' ||
        a.status === 'done',
    )
  },
})

// Get all career actions for the current user, grouped by status
export const getMyActions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) {
      return null
    }

    // Get user's profile
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) {
      return {
        active: [],
        inProgress: [],
        saved: [],
        completed: [],
        hasProfile: false,
        profileId: null,
      }
    }

    // Get all career actions for this profile
    const actions = await ctx.db
      .query('careerActions')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect()

    // Group by status
    const active = actions.filter((a) => a.status === 'active')
    const inProgress = actions.filter((a) => a.status === 'in_progress')
    const saved = actions.filter((a) => a.status === 'saved')
    const completed = actions
      .filter((a) => a.status === 'done')
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

    return {
      active,
      inProgress,
      saved,
      completed,
      hasProfile: true,
      profileId: profile._id,
    }
  },
})
