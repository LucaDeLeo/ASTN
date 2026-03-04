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
  args: { orgId: v.id('organizations') },
  returns: v.union(v.array(messageValidator), v.null()),
  handler: async (ctx, { orgId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const chat = await ctx.db
      .query('adminAgentChats')
      .withIndex('by_userId_orgId', (q) =>
        q.eq('userId', identity.subject).eq('orgId', orgId),
      )
      .unique()

    return chat?.messages ?? null
  },
})

export const saveMessages = mutation({
  args: {
    orgId: v.id('organizations'),
    messages: v.array(messageValidator),
  },
  returns: v.null(),
  handler: async (ctx, { orgId, messages }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const existing = await ctx.db
      .query('adminAgentChats')
      .withIndex('by_userId_orgId', (q) =>
        q.eq('userId', identity.subject).eq('orgId', orgId),
      )
      .unique()

    if (existing) {
      await ctx.db.patch('adminAgentChats', existing._id, {
        messages,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.insert('adminAgentChats', {
        orgId,
        userId: identity.subject,
        messages,
        updatedAt: Date.now(),
      })
    }
    return null
  },
})

export const clearMessages = mutation({
  args: { orgId: v.id('organizations') },
  returns: v.null(),
  handler: async (ctx, { orgId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const existing = await ctx.db
      .query('adminAgentChats')
      .withIndex('by_userId_orgId', (q) =>
        q.eq('userId', identity.subject).eq('orgId', orgId),
      )
      .unique()

    if (existing) {
      await ctx.db.delete('adminAgentChats', existing._id)
    }
    return null
  },
})
