import { ConvexError, v } from 'convex/values'
import { mutation, query } from '../_generated/server'
import { getUserId } from '../lib/auth'
import { checkProgramAccess, requireOrgAdmin } from './_helpers'

// Shared validators
const fieldValidator = v.object({
  id: v.string(),
  type: v.union(
    v.literal('text'),
    v.literal('choice'),
    v.literal('multiple_choice'),
  ),
  label: v.string(),
  required: v.boolean(),
  placeholder: v.optional(v.string()),
  options: v.optional(v.array(v.object({ id: v.string(), label: v.string() }))),
  maxLength: v.optional(v.number()),
})

const attachedToValidator = v.union(
  v.object({ type: v.literal('module'), moduleId: v.id('programModules') }),
  v.object({
    type: v.literal('session_phase'),
    sessionId: v.id('programSessions'),
    phaseId: v.id('sessionPhases'),
  }),
)

const revealModeValidator = v.union(
  v.literal('immediate'),
  v.literal('facilitator_only'),
  v.literal('write_then_reveal'),
)

// Return validator for prompt documents
const promptReturnValidator = v.object({
  _id: v.id('coursePrompts'),
  _creationTime: v.number(),
  programId: v.id('programs'),
  moduleId: v.optional(v.id('programModules')),
  sessionId: v.optional(v.id('programSessions')),
  attachedTo: attachedToValidator,
  title: v.string(),
  body: v.optional(v.string()),
  orderIndex: v.number(),
  fields: v.array(fieldValidator),
  revealMode: revealModeValidator,
  revealedAt: v.optional(v.number()),
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const create = mutation({
  args: {
    programId: v.id('programs'),
    attachedTo: attachedToValidator,
    title: v.string(),
    body: v.optional(v.string()),
    orderIndex: v.number(),
    fields: v.array(fieldValidator),
    revealMode: revealModeValidator,
  },
  returns: v.id('coursePrompts'),
  handler: async (ctx, args) => {
    const program = await ctx.db.get('programs', args.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const userId = await getUserId(ctx)
    const now = Date.now()

    return await ctx.db.insert('coursePrompts', {
      ...args,
      moduleId:
        args.attachedTo.type === 'module'
          ? args.attachedTo.moduleId
          : undefined,
      sessionId:
        args.attachedTo.type === 'session_phase'
          ? args.attachedTo.sessionId
          : undefined,
      createdBy: userId!,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    promptId: v.id('coursePrompts'),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    orderIndex: v.optional(v.number()),
    fields: v.optional(v.array(fieldValidator)),
    revealMode: v.optional(revealModeValidator),
  },
  returns: v.null(),
  handler: async (ctx, { promptId, ...updates }) => {
    const prompt = await ctx.db.get('coursePrompts', promptId)
    if (!prompt) throw new ConvexError('Prompt not found')

    const program = await ctx.db.get('programs', prompt.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    // Don't allow revealMode change if submitted responses exist
    if (updates.revealMode && updates.revealMode !== prompt.revealMode) {
      const existingResponse = await ctx.db
        .query('coursePromptResponses')
        .withIndex('by_promptId', (q) => q.eq('promptId', promptId))
        .first()
      if (existingResponse && existingResponse.status === 'submitted') {
        throw new ConvexError(
          'Cannot change reveal mode after responses have been submitted',
        )
      }
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (updates.title !== undefined) patch.title = updates.title
    if (updates.body !== undefined) patch.body = updates.body
    if (updates.orderIndex !== undefined) patch.orderIndex = updates.orderIndex
    if (updates.fields !== undefined) patch.fields = updates.fields
    if (updates.revealMode !== undefined) patch.revealMode = updates.revealMode

    await ctx.db.patch('coursePrompts', promptId, patch)
    return null
  },
})

export const remove = mutation({
  args: { promptId: v.id('coursePrompts') },
  returns: v.null(),
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get('coursePrompts', promptId)
    if (!prompt) throw new ConvexError('Prompt not found')

    const program = await ctx.db.get('programs', prompt.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    // Delete all responses for this prompt
    const responses = await ctx.db
      .query('coursePromptResponses')
      .withIndex('by_promptId', (q) => q.eq('promptId', promptId))
      .collect()
    for (const response of responses) {
      await ctx.db.delete('coursePromptResponses', response._id)
    }

    await ctx.db.delete('coursePrompts', promptId)
    return null
  },
})

export const get = query({
  args: { promptId: v.id('coursePrompts') },
  returns: v.union(promptReturnValidator, v.null()),
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get('coursePrompts', promptId)
    if (!prompt) return null

    const program = await ctx.db.get('programs', prompt.programId)
    if (!program) return null

    const access = await checkProgramAccess(ctx, program)
    if (!access) return null

    return prompt
  },
})

export const getByModule = query({
  args: { moduleId: v.id('programModules') },
  returns: v.array(promptReturnValidator),
  handler: async (ctx, { moduleId }) => {
    const module = await ctx.db.get('programModules', moduleId)
    if (!module) return []

    const program = await ctx.db.get('programs', module.programId)
    if (!program) return []

    const access = await checkProgramAccess(ctx, program)
    if (!access) return []

    const prompts = await ctx.db
      .query('coursePrompts')
      .withIndex('by_moduleId', (q) => q.eq('moduleId', moduleId))
      .collect()

    return prompts.sort((a, b) => a.orderIndex - b.orderIndex)
  },
})

export const getBySession = query({
  args: { sessionId: v.id('programSessions') },
  returns: v.array(promptReturnValidator),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) return []

    const program = await ctx.db.get('programs', session.programId)
    if (!program) return []

    const access = await checkProgramAccess(ctx, program)
    if (!access) return []

    const prompts = await ctx.db
      .query('coursePrompts')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()

    return prompts.sort((a, b) => a.orderIndex - b.orderIndex)
  },
})

export const triggerReveal = mutation({
  args: { promptId: v.id('coursePrompts') },
  returns: v.null(),
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get('coursePrompts', promptId)
    if (!prompt) throw new ConvexError('Prompt not found')

    if (prompt.revealMode !== 'write_then_reveal') {
      throw new ConvexError('Prompt is not in write_then_reveal mode')
    }

    // Idempotent -- already revealed
    if (prompt.revealedAt) return null

    const program = await ctx.db.get('programs', prompt.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    await ctx.db.patch('coursePrompts', promptId, {
      revealedAt: Date.now(),
      updatedAt: Date.now(),
    })
    return null
  },
})
