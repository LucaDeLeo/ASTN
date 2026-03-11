import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireAuth } from '../lib/auth'
import { checkProgramAccess, requireOrgAdmin } from './_helpers'

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

export const startSession = mutation({
  args: {
    sessionId: v.id('programSessions'),
  },
  returns: v.id('sessionLiveState'),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    const membership = await requireOrgAdmin(ctx, program.orgId)
    const userId = membership.userId

    // One-live-session-per-program invariant
    const existingLive = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_programId_and_status', (q) =>
        q.eq('programId', session.programId).eq('status', 'running'),
      )
      .first()
    if (existingLive) {
      throw new ConvexError('A session is already running for this program')
    }

    // Get first phase by orderIndex
    const phases = await ctx.db
      .query('sessionPhases')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()

    if (phases.length === 0) {
      throw new ConvexError('Cannot start session with no phases')
    }

    const sorted = phases.sort((a, b) => a.orderIndex - b.orderIndex)
    const firstPhase = sorted[0]
    const now = Date.now()

    return await ctx.db.insert('sessionLiveState', {
      sessionId,
      programId: session.programId,
      status: 'running',
      currentPhaseId: firstPhase._id,
      phaseStartedAt: now,
      phaseDurationMs: firstPhase.durationMs,
      activePromptIds: firstPhase.promptIds ?? [],
      startedAt: now,
      startedBy: userId,
    })
  },
})

export const advancePhase = mutation({
  args: {
    sessionId: v.id('programSessions'),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()

    // Idempotent: if not running, no-op
    if (!liveState || liveState.status !== 'running') return null

    const now = Date.now()

    // Record phase result
    await ctx.db.insert('sessionPhaseResults', {
      sessionId,
      phaseId: liveState.currentPhaseId,
      actualDurationMs: now - liveState.phaseStartedAt,
      startedAt: liveState.phaseStartedAt,
      endedAt: now,
    })

    // Get all phases ordered
    const phases = await ctx.db
      .query('sessionPhases')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()
    const sorted = phases.sort((a, b) => a.orderIndex - b.orderIndex)

    const currentIdx = sorted.findIndex(
      (p) => p._id === liveState.currentPhaseId,
    )
    const nextPhase =
      currentIdx + 1 < sorted.length ? sorted[currentIdx + 1] : undefined

    if (nextPhase) {
      await ctx.db.patch('sessionLiveState', liveState._id, {
        currentPhaseId: nextPhase._id,
        phaseStartedAt: now,
        phaseDurationMs: nextPhase.durationMs,
        activePromptIds: nextPhase.promptIds ?? [],
      })
    } else {
      // No more phases — complete session
      await ctx.db.patch('sessionLiveState', liveState._id, {
        status: 'completed',
        completedAt: now,
      })
    }

    return null
  },
})

export const extendPhase = mutation({
  args: {
    sessionId: v.id('programSessions'),
    additionalMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId, additionalMs }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()

    if (!liveState || liveState.status !== 'running') return null

    await ctx.db.patch('sessionLiveState', liveState._id, {
      phaseDurationMs: liveState.phaseDurationMs + additionalMs,
    })

    return null
  },
})

export const skipPhase = mutation({
  args: {
    sessionId: v.id('programSessions'),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()

    if (!liveState || liveState.status !== 'running') return null

    const now = Date.now()

    // Skip does NOT record phase result (skipped, not completed)
    const phases = await ctx.db
      .query('sessionPhases')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()
    const sorted = phases.sort((a, b) => a.orderIndex - b.orderIndex)

    const currentIdx = sorted.findIndex(
      (p) => p._id === liveState.currentPhaseId,
    )
    const nextPhase =
      currentIdx + 1 < sorted.length ? sorted[currentIdx + 1] : undefined

    if (nextPhase) {
      await ctx.db.patch('sessionLiveState', liveState._id, {
        currentPhaseId: nextPhase._id,
        phaseStartedAt: now,
        phaseDurationMs: nextPhase.durationMs,
        activePromptIds: nextPhase.promptIds ?? [],
      })
    } else {
      await ctx.db.patch('sessionLiveState', liveState._id, {
        status: 'completed',
        completedAt: now,
      })
    }

    return null
  },
})

export const endSession = mutation({
  args: {
    sessionId: v.id('programSessions'),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()

    if (!liveState || liveState.status !== 'running') return null

    const now = Date.now()

    // Record final phase result
    await ctx.db.insert('sessionPhaseResults', {
      sessionId,
      phaseId: liveState.currentPhaseId,
      actualDurationMs: now - liveState.phaseStartedAt,
      startedAt: liveState.phaseStartedAt,
      endedAt: now,
    })

    await ctx.db.patch('sessionLiveState', liveState._id, {
      status: 'completed',
      completedAt: now,
    })

    return null
  },
})

export const createAdHocPrompt = mutation({
  args: {
    sessionId: v.id('programSessions'),
    title: v.string(),
    body: v.optional(v.string()),
    fields: v.array(fieldValidator),
  },
  returns: v.id('coursePrompts'),
  handler: async (ctx, { sessionId, title, body, fields }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    const membership = await requireOrgAdmin(ctx, program.orgId)
    const userId = membership.userId

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()

    if (!liveState || liveState.status !== 'running') {
      throw new ConvexError('Session is not running')
    }

    const now = Date.now()

    // Create the course prompt attached to the current phase
    const promptId = await ctx.db.insert('coursePrompts', {
      programId: session.programId,
      sessionId,
      attachedTo: {
        type: 'session_phase',
        sessionId,
        phaseId: liveState.currentPhaseId,
      },
      title,
      body,
      orderIndex: 999, // Ad-hoc prompts appear at end
      fields,
      revealMode: 'immediate',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    })

    // Add to active prompts on live state
    await ctx.db.patch('sessionLiveState', liveState._id, {
      activePromptIds: [...liveState.activePromptIds, promptId],
    })

    return promptId
  },
})

export const updatePresence = mutation({
  args: {
    sessionId: v.id('programSessions'),
    phaseId: v.id('sessionPhases'),
    status: v.union(
      v.literal('typing'),
      v.literal('idle'),
      v.literal('submitted'),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId, phaseId, status }) => {
    const userId = await requireAuth(ctx)

    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')

    const access = await checkProgramAccess(ctx, program)
    if (!access) throw new ConvexError('Access denied')

    const now = Date.now()

    // Upsert presence
    const existing = await ctx.db
      .query('sessionPresence')
      .withIndex('by_sessionId_and_userId', (q) =>
        q.eq('sessionId', sessionId).eq('userId', userId),
      )
      .first()

    if (existing) {
      await ctx.db.patch('sessionPresence', existing._id, {
        phaseId,
        status,
        lastSeen: now,
      })
    } else {
      await ctx.db.insert('sessionPresence', {
        sessionId,
        userId,
        phaseId,
        status,
        lastSeen: now,
      })
    }

    return null
  },
})
