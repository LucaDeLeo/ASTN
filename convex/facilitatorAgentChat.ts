import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const messageValidator = v.object({
  role: v.union(v.literal('user'), v.literal('assistant')),
  content: v.optional(v.string()),
  parts: v.optional(
    v.array(
      v.union(
        v.object({ type: v.literal('text'), content: v.string() }),
        v.object({
          type: v.literal('tool_call'),
          name: v.string(),
          input: v.any(),
          output: v.optional(v.string()),
        }),
      ),
    ),
  ),
})

export const getMessages = query({
  args: { programId: v.id('programs') },
  returns: v.union(v.array(messageValidator), v.null()),
  handler: async (ctx, { programId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const chat = await ctx.db
      .query('facilitatorAgentChats')
      .withIndex('by_userId_programId', (q) =>
        q.eq('userId', identity.subject).eq('programId', programId),
      )
      .unique()

    return chat?.messages ?? null
  },
})

export const saveMessages = mutation({
  args: {
    programId: v.id('programs'),
    messages: v.array(messageValidator),
  },
  returns: v.null(),
  handler: async (ctx, { programId, messages }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const existing = await ctx.db
      .query('facilitatorAgentChats')
      .withIndex('by_userId_programId', (q) =>
        q.eq('userId', identity.subject).eq('programId', programId),
      )
      .unique()

    if (existing) {
      await ctx.db.patch('facilitatorAgentChats', existing._id, {
        messages,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.insert('facilitatorAgentChats', {
        userId: identity.subject,
        programId,
        messages,
        updatedAt: Date.now(),
      })
    }
    return null
  },
})

export const clearMessages = mutation({
  args: { programId: v.id('programs') },
  returns: v.null(),
  handler: async (ctx, { programId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const existing = await ctx.db
      .query('facilitatorAgentChats')
      .withIndex('by_userId_programId', (q) =>
        q.eq('userId', identity.subject).eq('programId', programId),
      )
      .unique()

    if (existing) {
      await ctx.db.delete('facilitatorAgentChats', existing._id)
    }
    return null
  },
})
