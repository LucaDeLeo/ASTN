import { v } from 'convex/values'
import { internalMutation, mutation } from '../_generated/server'
import { getUserId } from '../lib/auth'
import { log } from '../lib/logging'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

// Valid action type literals for the actions array validator
const actionTypeValidator = v.union(
  v.literal('replicate'),
  v.literal('collaborate'),
  v.literal('start_org'),
  v.literal('identify_gaps'),
  v.literal('volunteer'),
  v.literal('build_tools'),
  v.literal('teach_write'),
  v.literal('develop_skills'),
)

/**
 * Verify the current user owns the given career action.
 * Returns the action and profile documents.
 * Throws if not authenticated, action not found, or not authorized.
 */
async function verifyActionOwnership(
  ctx: MutationCtx,
  actionId: Id<'careerActions'>,
): Promise<{ action: Doc<'careerActions'>; profile: Doc<'profiles'> }> {
  const userId = await getUserId(ctx)
  if (!userId) throw new Error('Not authenticated')

  const action = await ctx.db.get('careerActions', actionId)
  if (!action) throw new Error('Action not found')

  // Verify ownership via profile
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .unique()

  if (!profile || action.profileId !== profile._id) {
    throw new Error('Not authorized')
  }

  return { action, profile }
}

// Save generated actions from LLM pipeline (internal only)
export const saveGeneratedActions = internalMutation({
  args: {
    profileId: v.id('profiles'),
    actions: v.array(
      v.object({
        type: actionTypeValidator,
        title: v.string(),
        description: v.string(),
        rationale: v.string(),
        profileBasis: v.optional(v.array(v.string())),
      }),
    ),
    modelVersion: v.string(),
  },
  handler: async (ctx, { profileId, actions, modelVersion }) => {
    // Get existing actions for this profile
    const existingActions = await ctx.db
      .query('careerActions')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    // Delete ONLY active actions (preserve saved/in_progress/done/dismissed)
    const activeActions = existingActions.filter((a) => a.status === 'active')
    for (const action of activeActions) {
      await ctx.db.delete('careerActions', action._id)
    }

    const now = Date.now()

    // Insert new actions
    for (const action of actions) {
      await ctx.db.insert('careerActions', {
        profileId,
        type: action.type,
        title: action.title,
        description: action.description,
        rationale: action.rationale,
        profileBasis: action.profileBasis,
        status: 'active',
        generatedAt: now,
        modelVersion,
      })
    }

    log('info', 'saveGeneratedActions', {
      profileId,
      deletedActive: activeActions.length,
      preservedOther: existingActions.length - activeActions.length,
      insertedNew: actions.length,
    })

    return { savedCount: actions.length }
  },
})

// Save an action (active -> saved)
export const saveAction = mutation({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    const { action } = await verifyActionOwnership(ctx, actionId)

    if (action.status !== 'active') {
      throw new Error(
        `Cannot save action with status "${action.status}" - must be "active"`,
      )
    }

    await ctx.db.patch('careerActions', actionId, { status: 'saved' })
  },
})

// Dismiss an action (active or saved -> dismissed)
export const dismissAction = mutation({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    const { action } = await verifyActionOwnership(ctx, actionId)

    if (action.status !== 'active' && action.status !== 'saved') {
      throw new Error(
        `Cannot dismiss action with status "${action.status}" - must be "active" or "saved"`,
      )
    }

    await ctx.db.patch('careerActions', actionId, { status: 'dismissed' })
  },
})

// Start an action (active or saved -> in_progress)
export const startAction = mutation({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    const { action } = await verifyActionOwnership(ctx, actionId)

    if (action.status !== 'active' && action.status !== 'saved') {
      throw new Error(
        `Cannot start action with status "${action.status}" - must be "active" or "saved"`,
      )
    }

    await ctx.db.patch('careerActions', actionId, {
      status: 'in_progress',
      startedAt: Date.now(),
    })
  },
})

// Complete an action (in_progress -> done)
export const completeAction = mutation({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    const { action } = await verifyActionOwnership(ctx, actionId)

    if (action.status !== 'in_progress') {
      throw new Error(
        `Cannot complete action with status "${action.status}" - must be "in_progress"`,
      )
    }

    await ctx.db.patch('careerActions', actionId, {
      status: 'done',
      completedAt: Date.now(),
    })
  },
})

// Unsave an action (saved -> active)
export const unsaveAction = mutation({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    const { action } = await verifyActionOwnership(ctx, actionId)

    if (action.status !== 'saved') {
      throw new Error(
        `Cannot unsave action with status "${action.status}" - must be "saved"`,
      )
    }

    await ctx.db.patch('careerActions', actionId, { status: 'active' })
  },
})

// Cancel progress on an action (in_progress -> active)
export const cancelAction = mutation({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    const { action } = await verifyActionOwnership(ctx, actionId)

    if (action.status !== 'in_progress') {
      throw new Error(
        `Cannot cancel action with status "${action.status}" - must be "in_progress"`,
      )
    }

    await ctx.db.patch('careerActions', actionId, {
      status: 'active',
      startedAt: undefined,
    })
  },
})

// Mark a completed action as having started a completion conversation
export const markCompletionStarted = mutation({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    const { action } = await verifyActionOwnership(ctx, actionId)

    if (action.status !== 'done') {
      throw new Error(
        `Cannot start completion conversation for action with status "${action.status}" - must be "done"`,
      )
    }

    await ctx.db.patch('careerActions', actionId, {
      completionConversationStarted: true,
    })
  },
})
