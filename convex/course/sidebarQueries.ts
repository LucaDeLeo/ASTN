import { v } from 'convex/values'
import { listUIMessages, syncStreams, vStreamArgs } from '@convex-dev/agent'
import { paginationOptsValidator } from 'convex/server'
import { components } from '../_generated/api'
import { query } from '../_generated/server'
import { requireOrgAdmin } from './_helpers'

/**
 * List messages for the sidebar chat UI with streaming support.
 * Used by useUIMessages hook on the frontend.
 */
export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const streams = await syncStreams(ctx, components.agent, args)
    const paginated = await listUIMessages(ctx, components.agent, args)
    return { ...paginated, streams }
  },
})

/**
 * Get all participant threads for a program (facilitator view).
 * Returns threads with participant names and module titles.
 */
export const getParticipantThreads = query({
  args: { programId: v.id('programs') },
  returns: v.any(),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) return []
    await requireOrgAdmin(ctx, program.orgId)

    const threads = await ctx.db
      .query('courseSidebarThreads')
      .withIndex('by_programId', (q) => q.eq('programId', programId))
      .collect()

    const results = []
    for (const thread of threads) {
      // Look up user profile name
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', thread.userId))
        .first()

      // Look up module title
      const module = await ctx.db.get('programModules', thread.moduleId)

      results.push({
        threadId: thread.threadId,
        userId: thread.userId,
        moduleId: thread.moduleId,
        moduleName: module?.title ?? 'Unknown Module',
        userName: profile?.name ?? 'Unknown User',
        createdAt: thread.createdAt,
      })
    }

    return results
  },
})

/**
 * Get threads for a specific participant in a program (per-participant drill-down).
 */
export const getParticipantThreadsByUser = query({
  args: {
    programId: v.id('programs'),
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, { programId, userId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) return []
    await requireOrgAdmin(ctx, program.orgId)

    const threads = await ctx.db
      .query('courseSidebarThreads')
      .withIndex('by_programId_and_userId', (q) =>
        q.eq('programId', programId).eq('userId', userId),
      )
      .collect()

    const results = []
    for (const thread of threads) {
      const module = await ctx.db.get('programModules', thread.moduleId)
      results.push({
        threadId: thread.threadId,
        moduleId: thread.moduleId,
        moduleName: module?.title ?? 'Unknown Module',
        createdAt: thread.createdAt,
      })
    }

    return results
  },
})
