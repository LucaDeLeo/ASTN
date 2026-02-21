import { v } from 'convex/values'
import { createThread, saveMessage } from '@convex-dev/agent'
import { components, internal } from '../_generated/api'
import { mutation } from '../_generated/server'
import { getUserId } from '../lib/auth'

/**
 * Create a new agent thread and store it on the profile.
 */
export const createAgentThread = mutation({
  args: {
    profileId: v.id('profiles'),
  },
  returns: v.string(),
  handler: async (ctx, { profileId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const profile = await ctx.db.get('profiles', profileId)
    if (!profile || profile.userId !== userId) {
      throw new Error('Not authorized')
    }

    const threadId = await createThread(ctx, components.agent, {
      userId,
    })

    await ctx.db.patch('profiles', profileId, {
      agentThreadId: threadId,
      updatedAt: Date.now(),
    })

    return threadId
  },
})

/**
 * Save a user message and schedule streaming response.
 */
export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    profileId: v.id('profiles'),
  },
  returns: v.string(),
  handler: async (ctx, { threadId, prompt, profileId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    })

    await ctx.scheduler.runAfter(0, internal.agent.actions.streamResponse, {
      threadId,
      promptMessageId: messageId,
      profileId,
    })

    return messageId
  },
})
