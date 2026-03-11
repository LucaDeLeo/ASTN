import { v } from 'convex/values'
import {
  abortStream,
  createThread,
  listStreams,
  saveMessage,
} from '@convex-dev/agent'
import { components, internal } from '../_generated/api'
import { internalQuery, mutation } from '../_generated/server'
import { requireAuth } from '../lib/auth'
import { checkProgramAccess } from './_helpers'

/**
 * Get or create a sidebar thread for the current user + module.
 */
export const getOrCreateThread = mutation({
  args: {
    moduleId: v.id('programModules'),
  },
  returns: v.string(),
  handler: async (ctx, { moduleId }) => {
    const userId = await requireAuth(ctx)

    // Check existing thread
    const existing = await ctx.db
      .query('courseSidebarThreads')
      .withIndex('by_userId_and_moduleId', (q) =>
        q.eq('userId', userId).eq('moduleId', moduleId),
      )
      .first()

    if (existing) return existing.threadId

    // Verify access
    const module = await ctx.db.get('programModules', moduleId)
    if (!module) throw new Error('Module not found')
    const program = await ctx.db.get('programs', module.programId)
    if (!program) throw new Error('Program not found')
    await checkProgramAccess(ctx, program)

    // Create new thread
    const threadId = await createThread(ctx, components.agent, { userId })
    await ctx.db.insert('courseSidebarThreads', {
      userId,
      moduleId,
      programId: module.programId,
      threadId,
      createdAt: Date.now(),
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
    moduleId: v.id('programModules'),
  },
  returns: v.string(),
  handler: async (ctx, { threadId, prompt, moduleId }) => {
    const userId = await requireAuth(ctx)

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.course.sidebarAgent.streamResponse,
      {
        threadId,
        promptMessageId: messageId,
        moduleId,
        userId,
      },
    )

    return messageId
  },
})

/**
 * Abort all active streams on a thread.
 */
export const abortGeneration = mutation({
  args: { threadId: v.string() },
  returns: v.number(),
  handler: async (ctx, { threadId }) => {
    await requireAuth(ctx)

    const streams = await listStreams(ctx, components.agent, {
      threadId,
      includeStatuses: ['streaming'],
    })
    let count = 0
    for (const stream of streams) {
      if (
        await abortStream(ctx, components.agent, {
          streamId: stream.streamId,
          reason: 'User cancelled',
        })
      ) {
        count++
      }
    }
    return count
  },
})

/**
 * Build module context for the learning agent system prompt.
 */
export const buildModuleContext = internalQuery({
  args: {
    moduleId: v.id('programModules'),
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { moduleId, userId }) => {
    const module = await ctx.db.get('programModules', moduleId)
    if (!module) return null

    const program = await ctx.db.get('programs', module.programId)
    if (!program) return null

    // Materials with completion status
    const materialProgressEntries = await ctx.db
      .query('materialProgress')
      .withIndex('by_module_and_user', (q) =>
        q.eq('moduleId', moduleId).eq('userId', userId),
      )
      .collect()

    const completedIndexes = new Set(
      materialProgressEntries.map((p) => p.materialIndex),
    )

    const materials = (module.materials ?? []).map(
      (m: { label: string; type: string }, idx: number) => ({
        title: m.label,
        type: m.type,
        completed: completedIndexes.has(idx),
      }),
    )

    // Prompt responses
    const prompts = await ctx.db
      .query('coursePrompts')
      .withIndex('by_moduleId', (q) => q.eq('moduleId', moduleId))
      .collect()

    const promptsWithResponses = []
    for (const prompt of prompts) {
      const response = await ctx.db
        .query('coursePromptResponses')
        .withIndex('by_promptId_and_userId', (q) =>
          q.eq('promptId', prompt._id).eq('userId', userId),
        )
        .first()

      // Extract text from field responses
      let userResponse: string | undefined
      if (response && response.fieldResponses.length > 0) {
        const texts = response.fieldResponses
          .map((fr) => fr.textValue)
          .filter(Boolean)
        if (texts.length > 0) {
          userResponse = texts.join(' | ')
        }
      }

      promptsWithResponses.push({
        title: prompt.title,
        userResponse,
      })
    }

    // Next session date
    const sessions = await ctx.db
      .query('programSessions')
      .withIndex('by_program', (q) => q.eq('programId', module.programId))
      .collect()

    const now = Date.now()
    const futureSessions = sessions
      .filter((s) => s.date > now)
      .sort((a, b) => a.date - b.date)
    const nextSessionDate =
      futureSessions.length > 0 ? futureSessions[0].date : undefined

    return {
      moduleTitle: module.title,
      moduleDescription: module.description,
      materials,
      progress: {
        completed: completedIndexes.size,
        total: materials.length,
      },
      prompts: promptsWithResponses,
      nextSessionDate,
    }
  },
})

/**
 * Get a prompt with the user's response (for proactive feedback context).
 */
export const getPromptWithResponse = internalQuery({
  args: {
    promptId: v.id('coursePrompts'),
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { promptId, userId }) => {
    const prompt = await ctx.db.get('coursePrompts', promptId)
    if (!prompt) return null

    const response = await ctx.db
      .query('coursePromptResponses')
      .withIndex('by_promptId_and_userId', (q) =>
        q.eq('promptId', promptId).eq('userId', userId),
      )
      .first()

    if (!response) return null

    // Extract text from field responses
    const texts = response.fieldResponses
      .map((fr) => fr.textValue)
      .filter(Boolean)
    const userResponse = texts.join(' | ') || '(non-text response)'

    return {
      title: prompt.title,
      body: prompt.body,
      userResponse,
    }
  },
})
