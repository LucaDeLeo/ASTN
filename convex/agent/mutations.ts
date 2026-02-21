import { v } from 'convex/values'
import { internalMutation, mutation } from '../_generated/server'
import { getUserId } from '../lib/auth'

/**
 * Mark enrichment conversation as done on the profile.
 * Called after the first successful agent response.
 */
export const markEnrichmentDone = internalMutation({
  args: { profileId: v.id('profiles') },
  returns: v.null(),
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.db.get('profiles', profileId)
    if (profile && !profile.hasEnrichmentConversation) {
      await ctx.db.patch('profiles', profileId, {
        hasEnrichmentConversation: true,
        updatedAt: Date.now(),
      })
    }
    return null
  },
})

// Fields that affect match quality — trigger staleness indicator
const MATCH_AFFECTING_FIELDS = new Set([
  'skills',
  'education',
  'workHistory',
  'careerGoals',
  'aiSafetyInterests',
  'seeking',
  'enrichmentSummary',
])

/**
 * Apply a tool change to the profile and record it for approve/undo UI.
 * Called by agent tools after extracting information from conversation.
 */
export const applyToolChange = internalMutation({
  args: {
    profileId: v.id('profiles'),
    threadId: v.string(),
    toolName: v.string(),
    displayText: v.string(),
    updates: v.string(), // JSON
    previousValues: v.string(), // JSON
  },
  returns: v.id('agentToolCalls'),
  handler: async (ctx, args) => {
    const profile = await ctx.db.get('profiles', args.profileId)
    if (!profile) throw new Error('Profile not found')

    // Parse and apply updates to profile
    const updates = JSON.parse(args.updates) as Record<string, unknown>
    const affectsMatches = Object.keys(updates).some((f) =>
      MATCH_AFFECTING_FIELDS.has(f),
    )

    await ctx.db.patch('profiles', args.profileId, {
      ...updates,
      updatedAt: Date.now(),
      ...(affectsMatches ? { matchesStaleAt: Date.now() } : {}),
    })

    // Record the tool call for approve/undo
    const toolCallId = await ctx.db.insert('agentToolCalls', {
      profileId: args.profileId,
      threadId: args.threadId,
      toolName: args.toolName,
      displayText: args.displayText,
      updates: args.updates,
      previousValues: args.previousValues,
      status: 'pending',
      createdAt: Date.now(),
    })

    return toolCallId
  },
})

/**
 * Resolve a tool change — approve or undo.
 * Approve: marks as approved (no-op on data, just clears pending UI).
 * Undo: restores previous values to the profile and marks as undone.
 */
export const resolveToolChange = mutation({
  args: {
    toolCallId: v.id('agentToolCalls'),
    action: v.union(v.literal('approve'), v.literal('undo')),
  },
  returns: v.null(),
  handler: async (ctx, { toolCallId, action }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const toolCall = await ctx.db.get('agentToolCalls', toolCallId)
    if (!toolCall) throw new Error('Tool call not found')

    // Verify ownership via profile
    const profile = await ctx.db.get('profiles', toolCall.profileId)
    if (!profile || profile.userId !== userId) {
      throw new Error('Not authorized')
    }

    if (action === 'approve') {
      await ctx.db.patch('agentToolCalls', toolCallId, { status: 'approved' })
    } else {
      // Undo: restore previous values
      const previousValues = JSON.parse(toolCall.previousValues) as Record<
        string,
        unknown
      >

      const affectsMatches = Object.keys(previousValues).some((f) =>
        MATCH_AFFECTING_FIELDS.has(f),
      )

      await ctx.db.patch('profiles', toolCall.profileId, {
        ...previousValues,
        updatedAt: Date.now(),
        ...(affectsMatches ? { matchesStaleAt: Date.now() } : {}),
      })

      await ctx.db.patch('agentToolCalls', toolCallId, { status: 'undone' })
    }

    return null
  },
})

/**
 * Batch-approve all pending tool calls for a thread.
 * Called when the user sends a new message (auto-approve on send).
 */
export const batchApprovePending = mutation({
  args: {
    threadId: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, { threadId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const pending = await ctx.db
      .query('agentToolCalls')
      .withIndex('by_thread_and_createdAt', (q) => q.eq('threadId', threadId))
      .collect()

    let count = 0
    for (const tc of pending) {
      if (tc.status === 'pending') {
        await ctx.db.patch('agentToolCalls', tc._id, { status: 'approved' })
        count++
      }
    }

    return count
  },
})
