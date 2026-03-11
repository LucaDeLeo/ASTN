import { v } from 'convex/values'
import { query } from '../_generated/server'
import { checkProgramAccess } from './_helpers'

// Return validator for session phase documents
const phaseReturnValidator = v.object({
  _id: v.id('sessionPhases'),
  _creationTime: v.number(),
  sessionId: v.id('programSessions'),
  programId: v.id('programs'),
  title: v.string(),
  durationMs: v.number(),
  notes: v.optional(v.string()),
  promptIds: v.optional(v.array(v.id('coursePrompts'))),
  pairConfig: v.optional(
    v.object({
      strategy: v.union(
        v.literal('random'),
        v.literal('complementary'),
        v.literal('manual'),
      ),
      sourcePromptId: v.optional(v.id('coursePrompts')),
      sourceFieldId: v.optional(v.string()),
    }),
  ),
  orderIndex: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

// Return validator for live state documents
const liveStateReturnValidator = v.object({
  _id: v.id('sessionLiveState'),
  _creationTime: v.number(),
  sessionId: v.id('programSessions'),
  programId: v.id('programs'),
  status: v.union(
    v.literal('running'),
    v.literal('paused'),
    v.literal('completed'),
  ),
  currentPhaseId: v.id('sessionPhases'),
  phaseStartedAt: v.number(),
  phaseDurationMs: v.number(),
  activePromptIds: v.array(v.id('coursePrompts')),
  startedAt: v.number(),
  startedBy: v.string(),
  completedAt: v.optional(v.number()),
})

export const getSessionPhases = query({
  args: { sessionId: v.id('programSessions') },
  returns: v.array(phaseReturnValidator),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) return []

    const program = await ctx.db.get('programs', session.programId)
    if (!program) return []

    const access = await checkProgramAccess(ctx, program)
    if (!access) return []

    const phases = await ctx.db
      .query('sessionPhases')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()

    return phases.sort((a, b) => a.orderIndex - b.orderIndex)
  },
})

export const getLiveState = query({
  args: { sessionId: v.id('programSessions') },
  returns: v.union(liveStateReturnValidator, v.null()),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) return null

    const program = await ctx.db.get('programs', session.programId)
    if (!program) return null

    const access = await checkProgramAccess(ctx, program)
    if (!access) return null

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()

    return liveState ?? null
  },
})
