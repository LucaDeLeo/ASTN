import { ConvexError, v } from 'convex/values'
import { mutation, query } from '../_generated/server'
import { requireAuth } from '../lib/auth'
import { checkProgramAccess, requireOrgAdmin } from './_helpers'

/**
 * Get comments for a prompt response (visible to both participants and admins).
 */
export const getCommentsForResponse = query({
  args: { promptResponseId: v.id('coursePromptResponses') },
  returns: v.any(),
  handler: async (ctx, { promptResponseId }) => {
    await requireAuth(ctx)

    const response = await ctx.db.get('coursePromptResponses', promptResponseId)
    if (!response) return []

    const program = await ctx.db.get('programs', response.programId)
    if (!program) return []

    // Both participants and admins can see comments
    const access = await checkProgramAccess(ctx, program)
    if (!access) return []

    const comments = await ctx.db
      .query('facilitatorComments')
      .withIndex('by_promptResponseId', (q) =>
        q.eq('promptResponseId', promptResponseId),
      )
      .collect()

    // Look up author names
    const results = []
    for (const comment of comments) {
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', comment.authorId))
        .first()

      results.push({
        _id: comment._id,
        content: comment.content,
        authorName: profile?.name ?? 'Facilitator',
        fromAgent: comment.fromAgent,
        createdAt: comment.createdAt,
      })
    }

    return results
  },
})

/**
 * Add a manual comment (facilitator writes directly, not via agent).
 */
export const addManualComment = mutation({
  args: {
    promptResponseId: v.id('coursePromptResponses'),
    content: v.string(),
  },
  returns: v.id('facilitatorComments'),
  handler: async (ctx, { promptResponseId, content }) => {
    const response = await ctx.db.get('coursePromptResponses', promptResponseId)
    if (!response) throw new ConvexError('Response not found')

    const program = await ctx.db.get('programs', response.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const userId = await requireAuth(ctx)

    return await ctx.db.insert('facilitatorComments', {
      promptResponseId,
      programId: response.programId,
      authorId: userId,
      content,
      fromAgent: false,
      createdAt: Date.now(),
    })
  },
})
