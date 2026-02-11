import { v } from 'convex/values'
import { internalMutation, internalQuery, query } from '../_generated/server'
import { getUserId } from '../lib/auth'

// Get messages for a profile (internal query)
export const getMessages = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query('enrichmentMessages')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

// Public query for UI to load messages
export const getMessagesPublic = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    // Auth + ownership check (returns [] for unauthenticated/unauthorized)
    const userId = await getUserId(ctx)
    if (!userId) return []
    const profile = await ctx.db.get('profiles', profileId)
    if (!profile || profile.userId !== userId) return []

    return await ctx.db
      .query('enrichmentMessages')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

// Get profile for context (internal query)
export const getProfileInternal = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    return await ctx.db.get('profiles', profileId)
  },
})

// Get messages for a specific action (internal query for completion chat)
export const getMessagesByAction = internalQuery({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    return await ctx.db
      .query('enrichmentMessages')
      .withIndex('by_action', (q) => q.eq('actionId', actionId))
      .collect()
  },
})

// Public query for completion chat messages with auth/ownership check
export const getCompletionMessagesPublic = query({
  args: {
    actionId: v.id('careerActions'),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, { actionId, profileId }) => {
    const userId = await getUserId(ctx)
    if (!userId) return []
    const profile = await ctx.db.get('profiles', profileId)
    if (!profile || profile.userId !== userId) return []

    return await ctx.db
      .query('enrichmentMessages')
      .withIndex('by_action', (q) => q.eq('actionId', actionId))
      .collect()
  },
})

// Save a message (internal mutation)
export const saveMessage = internalMutation({
  args: {
    profileId: v.id('profiles'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    actionId: v.optional(v.id('careerActions')),
  },
  handler: async (ctx, { profileId, role, content, actionId }) => {
    await ctx.db.insert('enrichmentMessages', {
      profileId,
      role,
      content,
      ...(actionId && { actionId }),
      createdAt: Date.now(),
    })
  },
})
