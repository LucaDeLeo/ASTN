import { v } from 'convex/values'
import { query } from '../_generated/server'
import { getUserId } from '../lib/auth'
import { checkProgramAccess, requireOrgAdmin } from './_helpers'

const HEARTBEAT_WINDOW_MS = 30_000

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

export const getPresence = query({
  args: { sessionId: v.id('programSessions') },
  returns: v.array(
    v.object({
      userId: v.string(),
      phaseId: v.id('sessionPhases'),
      status: v.union(
        v.literal('typing'),
        v.literal('idle'),
        v.literal('submitted'),
      ),
      lastSeen: v.number(),
    }),
  ),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) return []

    const program = await ctx.db.get('programs', session.programId)
    if (!program) return []
    await requireOrgAdmin(ctx, program.orgId)

    const now = Date.now()
    const cutoff = now - HEARTBEAT_WINDOW_MS

    // Collect all then filter in app code — no range index on lastSeen,
    // acceptable at session scale (~10-50 participants)
    const allPresence = await ctx.db
      .query('sessionPresence')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()

    return allPresence
      .filter((p) => p.lastSeen > cutoff)
      .map((p) => ({
        userId: p.userId,
        phaseId: p.phaseId,
        status: p.status,
        lastSeen: p.lastSeen,
      }))
  },
})

const pairAssignmentReturnValidator = v.object({
  _id: v.id('sessionPairAssignments'),
  _creationTime: v.number(),
  sessionId: v.id('programSessions'),
  phaseId: v.id('sessionPhases'),
  programId: v.id('programs'),
  strategy: v.union(
    v.literal('random'),
    v.literal('complementary'),
    v.literal('manual'),
  ),
  pairs: v.array(v.object({ members: v.array(v.string()) })),
  createdAt: v.number(),
  createdBy: v.string(),
})

export const getPairAssignments = query({
  args: {
    sessionId: v.id('programSessions'),
    phaseId: v.optional(v.id('sessionPhases')),
  },
  returns: v.array(pairAssignmentReturnValidator),
  handler: async (ctx, { sessionId, phaseId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) return []

    const program = await ctx.db.get('programs', session.programId)
    if (!program) return []

    const access = await checkProgramAccess(ctx, program)
    if (!access) return []

    if (phaseId) {
      return await ctx.db
        .query('sessionPairAssignments')
        .withIndex('by_sessionId_and_phaseId', (q) =>
          q.eq('sessionId', sessionId).eq('phaseId', phaseId),
        )
        .collect()
    }

    return await ctx.db
      .query('sessionPairAssignments')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()
  },
})

const phaseResultReturnValidator = v.object({
  _id: v.id('sessionPhaseResults'),
  _creationTime: v.number(),
  sessionId: v.id('programSessions'),
  phaseId: v.id('sessionPhases'),
  actualDurationMs: v.number(),
  startedAt: v.number(),
  endedAt: v.number(),
})

export const getPhaseResults = query({
  args: { sessionId: v.id('programSessions') },
  returns: v.array(phaseResultReturnValidator),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) return []

    const program = await ctx.db.get('programs', session.programId)
    if (!program) return []

    const access = await checkProgramAccess(ctx, program)
    if (!access) return []

    return await ctx.db
      .query('sessionPhaseResults')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()
  },
})

export const getMyPairs = query({
  args: {
    sessionId: v.id('programSessions'),
    phaseId: v.id('sessionPhases'),
  },
  returns: v.union(v.array(v.string()), v.null()),
  handler: async (ctx, { sessionId, phaseId }) => {
    const userId = await getUserId(ctx)
    if (!userId) return null

    const assignments = await ctx.db
      .query('sessionPairAssignments')
      .withIndex('by_sessionId_and_phaseId', (q) =>
        q.eq('sessionId', sessionId).eq('phaseId', phaseId),
      )
      .collect()

    // Find the most recent assignment for this phase
    if (assignments.length === 0) return null
    const latest = assignments.sort((a, b) => b.createdAt - a.createdAt)[0]

    const myPair = latest.pairs.find((p) => p.members.includes(userId))
    if (!myPair) return null

    // Return partner(s), excluding self
    return myPair.members.filter((m) => m !== userId)
  },
})
