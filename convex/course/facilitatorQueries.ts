import { v } from 'convex/values'
import { query } from '../_generated/server'
import { requireOrgAdmin } from './_helpers'

/**
 * Get participant progress for a program — materials completed and prompts submitted.
 */
export const getParticipantProgress = query({
  args: { programId: v.id('programs') },
  returns: v.any(),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) return []
    await requireOrgAdmin(ctx, program.orgId)

    // Get enrolled participants
    const participations = await ctx.db
      .query('programParticipation')
      .withIndex('by_program_status', (q) =>
        q.eq('programId', programId).eq('status', 'enrolled'),
      )
      .collect()

    // Get all modules for total materials count
    const modules = await ctx.db
      .query('programModules')
      .withIndex('by_program', (q) => q.eq('programId', programId))
      .collect()

    const totalMaterials = modules.reduce(
      (sum, m) => sum + (m.materials?.length ?? 0),
      0,
    )

    // Get total prompts for program
    const prompts = await ctx.db
      .query('coursePrompts')
      .withIndex('by_programId', (q) => q.eq('programId', programId))
      .collect()
    const totalPrompts = prompts.length

    const results = []
    for (const p of participations) {
      // Count completed materials
      const materialProgress = await ctx.db
        .query('materialProgress')
        .withIndex('by_program_and_user', (q) =>
          q.eq('programId', programId).eq('userId', p.userId),
        )
        .collect()

      // Count submitted responses
      const responses = await ctx.db
        .query('coursePromptResponses')
        .withIndex('by_programId_and_userId', (q) =>
          q.eq('programId', programId).eq('userId', p.userId),
        )
        .collect()
      const submittedCount = responses.filter(
        (r) => r.status === 'submitted',
      ).length

      // Look up profile name
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', p.userId))
        .first()

      results.push({
        userId: p.userId,
        name: profile?.name ?? 'Unknown',
        materialsCompleted: materialProgress.length,
        materialsTotal: totalMaterials,
        promptsSubmitted: submittedCount,
        promptsTotal: totalPrompts,
      })
    }

    return results
  },
})

/**
 * Get response counts for all prompts in a program.
 */
export const getResponseCounts = query({
  args: { programId: v.id('programs') },
  returns: v.any(),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) return []
    await requireOrgAdmin(ctx, program.orgId)

    const prompts = await ctx.db
      .query('coursePrompts')
      .withIndex('by_programId', (q) => q.eq('programId', programId))
      .collect()

    // Get enrolled participant count
    const participations = await ctx.db
      .query('programParticipation')
      .withIndex('by_program_status', (q) =>
        q.eq('programId', programId).eq('status', 'enrolled'),
      )
      .collect()
    const participantCount = participations.length

    const results = []
    for (const prompt of prompts) {
      const responses = await ctx.db
        .query('coursePromptResponses')
        .withIndex('by_promptId', (q) => q.eq('promptId', prompt._id))
        .collect()
      const submitted = responses.filter((r) => r.status === 'submitted').length

      results.push({
        promptId: prompt._id,
        promptTitle: prompt.title,
        moduleId: prompt.moduleId ?? null,
        responseCount: submitted,
        participantCount,
      })
    }

    return results
  },
})

/**
 * Get attendance summary for all sessions in a program.
 */
export const getAttendanceSummary = query({
  args: { programId: v.id('programs') },
  returns: v.any(),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) return []
    await requireOrgAdmin(ctx, program.orgId)

    const sessions = await ctx.db
      .query('programSessions')
      .withIndex('by_program', (q) => q.eq('programId', programId))
      .collect()

    // Get enrolled participant count
    const participations = await ctx.db
      .query('programParticipation')
      .withIndex('by_program_status', (q) =>
        q.eq('programId', programId).eq('status', 'enrolled'),
      )
      .collect()
    const participantCount = participations.length

    const results = []
    for (const session of sessions) {
      const attendance = await ctx.db
        .query('sessionAttendance')
        .withIndex('by_session', (q) => q.eq('sessionId', session._id))
        .collect()

      results.push({
        sessionId: session._id,
        sessionTitle: session.title,
        dayNumber: session.dayNumber,
        date: session.date,
        attendeeCount: attendance.length,
        participantCount,
      })
    }

    return results
  },
})
