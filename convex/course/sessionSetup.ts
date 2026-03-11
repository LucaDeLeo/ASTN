import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireOrgAdmin } from './_helpers'
import type { Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

// Shared validators
const pairConfigValidator = v.object({
  strategy: v.union(
    v.literal('random'),
    v.literal('complementary'),
    v.literal('manual'),
  ),
  sourcePromptId: v.optional(v.id('coursePrompts')),
  sourceFieldId: v.optional(v.string()),
})

/**
 * Check that no live session is running for the given session.
 * Throws if a session is currently live (phases locked during live sessions).
 */
async function requireNotLive(
  ctx: MutationCtx,
  sessionId: Id<'programSessions'>,
) {
  const liveState = await ctx.db
    .query('sessionLiveState')
    .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
    .first()

  if (liveState && liveState.status === 'running') {
    throw new ConvexError('Cannot edit phases while session is live')
  }
}

export const createPhase = mutation({
  args: {
    sessionId: v.id('programSessions'),
    title: v.string(),
    durationMs: v.number(),
    notes: v.optional(v.string()),
    promptIds: v.optional(v.array(v.id('coursePrompts'))),
    pairConfig: v.optional(pairConfigValidator),
  },
  returns: v.id('sessionPhases'),
  handler: async (ctx, args) => {
    const session = await ctx.db.get('programSessions', args.sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    await requireNotLive(ctx, args.sessionId)

    // Compute next orderIndex
    const existingPhases = await ctx.db
      .query('sessionPhases')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    const maxOrder = existingPhases.reduce(
      (max, p) => Math.max(max, p.orderIndex),
      -1,
    )

    const now = Date.now()
    return await ctx.db.insert('sessionPhases', {
      sessionId: args.sessionId,
      programId: session.programId,
      title: args.title,
      durationMs: args.durationMs,
      notes: args.notes,
      promptIds: args.promptIds,
      pairConfig: args.pairConfig,
      orderIndex: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const updatePhase = mutation({
  args: {
    phaseId: v.id('sessionPhases'),
    title: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    notes: v.optional(v.string()),
    promptIds: v.optional(v.array(v.id('coursePrompts'))),
    pairConfig: v.optional(pairConfigValidator),
  },
  returns: v.null(),
  handler: async (ctx, { phaseId, ...updates }) => {
    const phase = await ctx.db.get('sessionPhases', phaseId)
    if (!phase) throw new ConvexError('Phase not found')

    const session = await ctx.db.get('programSessions', phase.sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    await requireNotLive(ctx, phase.sessionId)

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (updates.title !== undefined) patch.title = updates.title
    if (updates.durationMs !== undefined) patch.durationMs = updates.durationMs
    if (updates.notes !== undefined) patch.notes = updates.notes
    if (updates.promptIds !== undefined) patch.promptIds = updates.promptIds
    if (updates.pairConfig !== undefined) patch.pairConfig = updates.pairConfig

    await ctx.db.patch('sessionPhases', phaseId, patch)
    return null
  },
})

export const reorderPhases = mutation({
  args: {
    sessionId: v.id('programSessions'),
    phaseIds: v.array(v.id('sessionPhases')),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId, phaseIds }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    await requireNotLive(ctx, sessionId)

    for (let i = 0; i < phaseIds.length; i++) {
      await ctx.db.patch('sessionPhases', phaseIds[i], {
        orderIndex: i,
        updatedAt: Date.now(),
      })
    }
    return null
  },
})

export const deletePhase = mutation({
  args: {
    phaseId: v.id('sessionPhases'),
  },
  returns: v.null(),
  handler: async (ctx, { phaseId }) => {
    const phase = await ctx.db.get('sessionPhases', phaseId)
    if (!phase) throw new ConvexError('Phase not found')

    const session = await ctx.db.get('programSessions', phase.sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    await requireNotLive(ctx, phase.sessionId)

    await ctx.db.delete('sessionPhases', phaseId)
    return null
  },
})
