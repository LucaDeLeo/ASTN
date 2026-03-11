import { ConvexError, v } from 'convex/values'
import { createThread, saveMessage } from '@convex-dev/agent'
import { components, internal } from '../_generated/api'
import { mutation, query } from '../_generated/server'
import { getUserId, requireAuth } from '../lib/auth'
import { checkProgramAccess, requireOrgAdmin } from './_helpers'

// Shared validators
const fieldResponseValidator = v.object({
  fieldId: v.string(),
  textValue: v.optional(v.string()),
  selectedOptionIds: v.optional(v.array(v.string())),
})

const responseReturnValidator = v.object({
  _id: v.id('coursePromptResponses'),
  _creationTime: v.number(),
  promptId: v.id('coursePrompts'),
  programId: v.id('programs'),
  userId: v.string(),
  fieldResponses: v.array(fieldResponseValidator),
  status: v.union(v.literal('draft'), v.literal('submitted')),
  spotlighted: v.optional(v.boolean()),
  spotlightedBy: v.optional(v.string()),
  spotlightedAt: v.optional(v.number()),
  savedAt: v.number(),
  submittedAt: v.optional(v.number()),
})

export const saveResponse = mutation({
  args: {
    promptId: v.id('coursePrompts'),
    fieldResponses: v.array(fieldResponseValidator),
    submit: v.boolean(),
  },
  returns: v.id('coursePromptResponses'),
  handler: async (ctx, { promptId, fieldResponses, submit }) => {
    const userId = await requireAuth(ctx)

    const prompt = await ctx.db.get('coursePrompts', promptId)
    if (!prompt) throw new ConvexError('Prompt not found')

    const program = await ctx.db.get('programs', prompt.programId)
    if (!program) throw new ConvexError('Program not found')

    // Check enrolled/completed or admin
    const access = await checkProgramAccess(ctx, program)
    if (!access) throw new ConvexError('Access denied')

    // Upsert: find existing response
    const existing = await ctx.db
      .query('coursePromptResponses')
      .withIndex('by_promptId_and_userId', (q) =>
        q.eq('promptId', promptId).eq('userId', userId),
      )
      .first()

    const now = Date.now()

    let responseId: typeof existing extends null
      ? never
      : NonNullable<typeof existing>['_id']

    if (existing) {
      if (existing.status === 'submitted') {
        throw new ConvexError('Response already submitted')
      }
      await ctx.db.patch('coursePromptResponses', existing._id, {
        fieldResponses,
        status: submit ? 'submitted' : 'draft',
        savedAt: now,
        submittedAt: submit ? now : undefined,
      })
      responseId = existing._id
    } else {
      responseId = await ctx.db.insert('coursePromptResponses', {
        promptId,
        programId: prompt.programId,
        userId,
        fieldResponses,
        status: submit ? 'submitted' : 'draft',
        savedAt: now,
        submittedAt: submit ? now : undefined,
      })
    }

    // Proactive AI feedback (SIDE-04)
    if (submit && prompt.aiFeedback !== false && prompt.moduleId) {
      const moduleId = prompt.moduleId

      // Find or auto-create sidebar thread
      let thread = await ctx.db
        .query('courseSidebarThreads')
        .withIndex('by_userId_and_moduleId', (q) =>
          q.eq('userId', userId).eq('moduleId', moduleId),
        )
        .first()

      if (!thread) {
        const threadId = await createThread(ctx, components.agent, { userId })
        const insertedId = await ctx.db.insert('courseSidebarThreads', {
          userId,
          moduleId,
          programId: prompt.programId,
          threadId,
          createdAt: now,
        })
        thread = await ctx.db.get('courseSidebarThreads', insertedId)
      }

      if (thread) {
        const { messageId } = await saveMessage(ctx, components.agent, {
          threadId: thread.threadId,
          prompt: `[System: I just submitted my response to the exercise "${prompt.title}". Can you review it and give me feedback?]`,
        })

        await ctx.scheduler.runAfter(
          0,
          internal.course.sidebarAgent.streamFeedback,
          {
            threadId: thread.threadId,
            promptMessageId: messageId,
            moduleId,
            userId,
            promptId,
          },
        )
      }
    }

    return responseId
  },
})

export const getMyResponse = query({
  args: { promptId: v.id('coursePrompts') },
  returns: v.union(responseReturnValidator, v.null()),
  handler: async (ctx, { promptId }) => {
    const userId = await getUserId(ctx)
    if (!userId) return null

    const response = await ctx.db
      .query('coursePromptResponses')
      .withIndex('by_promptId_and_userId', (q) =>
        q.eq('promptId', promptId).eq('userId', userId),
      )
      .first()

    return response
  },
})

export const getPromptResponses = query({
  args: { promptId: v.id('coursePrompts') },
  returns: v.array(responseReturnValidator),
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get('coursePrompts', promptId)
    if (!prompt) return []

    const program = await ctx.db.get('programs', prompt.programId)
    if (!program) return []

    const access = await checkProgramAccess(ctx, program)
    if (!access) return []

    const allResponses = await ctx.db
      .query('coursePromptResponses')
      .withIndex('by_promptId', (q) => q.eq('promptId', promptId))
      .collect()

    // Admin sees everything
    if (access.isAdmin) return allResponses

    // Participant visibility depends on reveal mode
    switch (prompt.revealMode) {
      case 'immediate':
        // All submitted responses + own drafts
        return allResponses.filter(
          (r) => r.status === 'submitted' || r.userId === access.userId,
        )

      case 'facilitator_only':
        // Only own response
        return allResponses.filter((r) => r.userId === access.userId)

      case 'write_then_reveal':
        if (prompt.revealedAt) {
          // After reveal: all submitted + own drafts + spotlighted
          return allResponses.filter(
            (r) =>
              r.status === 'submitted' ||
              r.userId === access.userId ||
              r.spotlighted,
          )
        }
        // Before reveal: only own response
        return allResponses.filter((r) => r.userId === access.userId)
    }
  },
})

export const toggleSpotlight = mutation({
  args: { responseId: v.id('coursePromptResponses') },
  returns: v.null(),
  handler: async (ctx, { responseId }) => {
    const response = await ctx.db.get('coursePromptResponses', responseId)
    if (!response) throw new ConvexError('Response not found')

    const prompt = await ctx.db.get('coursePrompts', response.promptId)
    if (!prompt) throw new ConvexError('Prompt not found')

    const program = await ctx.db.get('programs', prompt.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const userId = await getUserId(ctx)
    const isSpotlighted = response.spotlighted === true

    await ctx.db.patch('coursePromptResponses', responseId, {
      spotlighted: !isSpotlighted,
      spotlightedBy: isSpotlighted ? undefined : userId!,
      spotlightedAt: isSpotlighted ? undefined : Date.now(),
    })
    return null
  },
})
