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
