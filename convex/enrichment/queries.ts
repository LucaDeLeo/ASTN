import { v } from 'convex/values'
import { internalMutation, internalQuery, query } from '../_generated/server'
import { auth } from '../auth'

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
    const userId = await auth.getUserId(ctx)
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

// Save a message (internal mutation)
export const saveMessage = internalMutation({
  args: {
    profileId: v.id('profiles'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
  },
  handler: async (ctx, { profileId, role, content }) => {
    await ctx.db.insert('enrichmentMessages', {
      profileId,
      role,
      content,
      createdAt: Date.now(),
    })
  },
})
