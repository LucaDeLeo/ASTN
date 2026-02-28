import { v } from 'convex/values'
import { internalQuery, mutation } from './_generated/server'
import { requireAuth } from './lib/auth'

export const registerToken = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    // Check if this token already exists
    const existing = await ctx.db
      .query('pushTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first()

    if (existing) {
      // Update if ownership changed (e.g., user re-installed app)
      if (existing.userId !== userId) {
        await ctx.db.patch('pushTokens', existing._id, {
          userId,
          platform: args.platform,
          createdAt: Date.now(),
        })
      }
      return null
    }

    await ctx.db.insert('pushTokens', {
      userId,
      token: args.token,
      platform: args.platform,
      createdAt: Date.now(),
    })

    return null
  },
})

export const unregisterToken = mutation({
  args: {
    token: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx)

    const existing = await ctx.db
      .query('pushTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first()

    if (existing && existing.userId === userId) {
      await ctx.db.delete('pushTokens', existing._id)
    }

    return null
  },
})

// Internal: get all tokens for a user (called by push action)
export const getTokensForUser = internalQuery({
  args: {
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      token: v.string(),
      platform: v.union(v.literal('ios'), v.literal('android')),
    }),
  ),
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query('pushTokens')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect()

    return tokens.map((t) => ({ token: t.token, platform: t.platform }))
  },
})
