import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'
import { requireOrgAdmin } from './_helpers'

const HEARTBEAT_WINDOW_MS = 30_000

/** Fisher-Yates shuffle (in-place, returns same array) */
function shuffle<T>(array: Array<T>): Array<T> {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/** Create pairs from a list. If odd count, last 3 form a trio. */
function createPairsFromList(
  userIds: Array<string>,
): Array<{ members: Array<string> }> {
  const pairs: Array<{ members: Array<string> }> = []

  if (userIds.length === 0) return pairs
  if (userIds.length === 1) return [{ members: [userIds[0]] }]

  let i = 0
  // If odd, we'll make a trio at the end
  const limit = userIds.length % 2 === 0 ? userIds.length : userIds.length - 3

  for (; i < limit; i += 2) {
    pairs.push({ members: [userIds[i], userIds[i + 1]] })
  }

  // Handle remaining (trio for odd count)
  if (i < userIds.length) {
    pairs.push({ members: userIds.slice(i) })
  }

  return pairs
}

export const generatePairs = mutation({
  args: {
    sessionId: v.id('programSessions'),
    phaseId: v.id('sessionPhases'),
    strategy: v.union(v.literal('random'), v.literal('complementary')),
  },
  returns: v.id('sessionPairAssignments'),
  handler: async (ctx, { sessionId, phaseId, strategy }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    const membership = await requireOrgAdmin(ctx, program.orgId)
    const createdBy = membership.userId

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()

    if (!liveState || liveState.status !== 'running') {
      throw new ConvexError('Session is not running')
    }

    const now = Date.now()
    const cutoff = now - HEARTBEAT_WINDOW_MS

    // Get present participants (lastSeen within heartbeat window).
    // We collect all presence docs for the session and filter in app code
    // because Convex doesn't support range queries on non-indexed fields.
    const allPresence = await ctx.db
      .query('sessionPresence')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .collect()

    const presentUserIds = [
      ...new Set(
        allPresence.filter((p) => p.lastSeen > cutoff).map((p) => p.userId),
      ),
    ]

    if (presentUserIds.length < 2) {
      throw new ConvexError('Need at least 2 present participants to pair')
    }

    let pairs: Array<{ members: Array<string> }>

    if (strategy === 'random') {
      pairs = createPairsFromList(shuffle([...presentUserIds]))
    } else {
      // Complementary: pair across different choices
      const phase = await ctx.db.get('sessionPhases', phaseId)
      if (
        !phase?.pairConfig?.sourcePromptId ||
        !phase.pairConfig.sourceFieldId
      ) {
        // Fallback to random if no source prompt configured
        pairs = createPairsFromList(shuffle([...presentUserIds]))
      } else {
        const responses = await ctx.db
          .query('coursePromptResponses')
          .withIndex('by_promptId', (q) =>
            q.eq('promptId', phase.pairConfig!.sourcePromptId!),
          )
          .collect()

        // Group present users by their choice
        const choiceGroups = new Map<string, Array<string>>()
        const ungrouped: Array<string> = []
        const presentSet = new Set(presentUserIds)

        for (const resp of responses) {
          if (!presentSet.has(resp.userId) || resp.status !== 'submitted')
            continue

          const fieldResp = resp.fieldResponses.find(
            (fr) => fr.fieldId === phase.pairConfig!.sourceFieldId,
          )
          const choice =
            fieldResp?.selectedOptionIds?.[0] ?? fieldResp?.textValue ?? ''

          if (choice) {
            const group = choiceGroups.get(choice) ?? []
            group.push(resp.userId)
            choiceGroups.set(choice, group)
            presentSet.delete(resp.userId)
          }
        }

        // Remaining present users without responses
        for (const uid of presentSet) {
          ungrouped.push(uid)
        }

        // Cross-choice pairing: interleave from different groups
        const groupKeys = [...choiceGroups.keys()]
        const interleaved: Array<string> = []

        // Round-robin across groups for cross-choice diversity
        let maxLen = 0
        for (const g of choiceGroups.values()) {
          shuffle(g)
          maxLen = Math.max(maxLen, g.length)
        }

        for (let i = 0; i < maxLen; i++) {
          for (const key of groupKeys) {
            const group = choiceGroups.get(key)!
            if (i < group.length) {
              interleaved.push(group[i])
            }
          }
        }

        // Add ungrouped at end
        interleaved.push(...shuffle(ungrouped))

        pairs = createPairsFromList(interleaved)
      }
    }

    return await ctx.db.insert('sessionPairAssignments', {
      sessionId,
      phaseId,
      programId: session.programId,
      strategy,
      pairs,
      createdAt: now,
      createdBy,
    })
  },
})

export const setManualPairs = mutation({
  args: {
    sessionId: v.id('programSessions'),
    phaseId: v.id('sessionPhases'),
    pairs: v.array(v.object({ members: v.array(v.string()) })),
  },
  returns: v.id('sessionPairAssignments'),
  handler: async (ctx, { sessionId, phaseId, pairs }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')

    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    const membership = await requireOrgAdmin(ctx, program.orgId)

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()

    if (!liveState || liveState.status !== 'running') {
      throw new ConvexError('Session is not running')
    }

    return await ctx.db.insert('sessionPairAssignments', {
      sessionId,
      phaseId,
      programId: session.programId,
      strategy: 'manual',
      pairs,
      createdAt: Date.now(),
      createdBy: membership.userId,
    })
  },
})
