import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { auth } from './auth'
import { log } from './lib/logging'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'

// Helper: Require org admin
async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'organizations'>,
): Promise<Doc<'orgMemberships'>> {
  const userId = await auth.getUserId(ctx)
  if (!userId) throw new Error('Not authenticated')

  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('orgId'), orgId))
    .first()

  if (!membership) throw new Error('Not a member of this organization')
  if (membership.role !== 'admin') throw new Error('Admin access required')

  return membership
}

// Helper: Generate URL-safe slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

// Get all programs for an org
export const getOrgPrograms = query({
  args: {
    orgId: v.id('organizations'),
    status: v.optional(
      v.union(
        v.literal('planning'),
        v.literal('active'),
        v.literal('completed'),
        v.literal('archived'),
      ),
    ),
  },
  handler: async (ctx, { orgId, status }) => {
    await requireOrgAdmin(ctx, orgId)

    let programs
    if (status) {
      programs = await ctx.db
        .query('programs')
        .withIndex('by_org_status', (q) =>
          q.eq('orgId', orgId).eq('status', status),
        )
        .collect()
    } else {
      programs = await ctx.db
        .query('programs')
        .withIndex('by_org', (q) => q.eq('orgId', orgId))
        .collect()
    }

    // Add participant counts (indexed query per program - optimal without denormalization)
    const programsWithCounts = await Promise.all(
      programs.map(async (program) => {
        const participants = await ctx.db
          .query('programParticipation')
          .withIndex('by_program_status', (q) =>
            q.eq('programId', program._id).eq('status', 'enrolled'),
          )
          .collect()

        return {
          ...program,
          participantCount: participants.length,
        }
      }),
    )

    log('info', 'getOrgPrograms', {
      programCount: programs.length,
      participantQueries: programs.length,
    })

    return programsWithCounts
  },
})

// Create a new program
export const createProgram = mutation({
  args: {
    orgId: v.id('organizations'),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal('reading_group'),
      v.literal('fellowship'),
      v.literal('mentorship'),
      v.literal('cohort'),
      v.literal('workshop_series'),
      v.literal('custom'),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    enrollmentMethod: v.union(
      v.literal('admin_only'),
      v.literal('self_enroll'),
      v.literal('approval_required'),
    ),
    maxParticipants: v.optional(v.number()),
    completionCriteria: v.optional(
      v.object({
        type: v.union(
          v.literal('attendance_count'),
          v.literal('attendance_percentage'),
          v.literal('manual'),
        ),
        requiredCount: v.optional(v.number()),
        requiredPercentage: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const adminMembership = await requireOrgAdmin(ctx, args.orgId)

    // Generate unique slug
    let slug = generateSlug(args.name)
    const existingSlug = await ctx.db
      .query('programs')
      .withIndex('by_org_slug', (q) =>
        q.eq('orgId', args.orgId).eq('slug', slug),
      )
      .first()

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    const now = Date.now()
    const programId = await ctx.db.insert('programs', {
      orgId: args.orgId,
      name: args.name,
      slug,
      description: args.description,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      status: 'planning',
      enrollmentMethod: args.enrollmentMethod,
      maxParticipants: args.maxParticipants,
      completionCriteria: args.completionCriteria,
      linkedEventIds: [],
      createdBy: adminMembership._id,
      createdAt: now,
      updatedAt: now,
    })

    return { programId, slug }
  },
})

// Update a program
export const updateProgram = mutation({
  args: {
    programId: v.id('programs'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('planning'),
        v.literal('active'),
        v.literal('completed'),
        v.literal('archived'),
      ),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    enrollmentMethod: v.optional(
      v.union(
        v.literal('admin_only'),
        v.literal('self_enroll'),
        v.literal('approval_required'),
      ),
    ),
    maxParticipants: v.optional(v.number()),
    completionCriteria: v.optional(
      v.object({
        type: v.union(
          v.literal('attendance_count'),
          v.literal('attendance_percentage'),
          v.literal('manual'),
        ),
        requiredCount: v.optional(v.number()),
        requiredPercentage: v.optional(v.number()),
      }),
    ),
    linkedEventIds: v.optional(v.array(v.id('events'))),
  },
  handler: async (ctx, { programId, ...updates }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) throw new Error('Program not found')

    await requireOrgAdmin(ctx, program.orgId)

    const patchData: Record<string, unknown> = { updatedAt: Date.now() }
    for (const [key, value] of Object.entries(updates)) {
      patchData[key] = value
    }

    await ctx.db.patch('programs', programId, patchData)

    return { success: true }
  },
})

// Delete a program (soft delete by archiving)
export const deleteProgram = mutation({
  args: {
    programId: v.id('programs'),
  },
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) throw new Error('Program not found')

    await requireOrgAdmin(ctx, program.orgId)

    // Archive instead of hard delete
    await ctx.db.patch('programs', programId, {
      status: 'archived',
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

// Get program participants
export const getProgramParticipants = query({
  args: {
    programId: v.id('programs'),
  },
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) throw new Error('Program not found')

    await requireOrgAdmin(ctx, program.orgId)

    const participations = await ctx.db
      .query('programParticipation')
      .withIndex('by_program', (q) => q.eq('programId', programId))
      .collect()

    if (participations.length === 0) return []

    // Pass 1: Collect unique userIds
    const userIds = [...new Set(participations.map((p) => p.userId))]

    // Pass 2: Batch fetch profiles
    const profiles = await Promise.all(
      userIds.map((userId) =>
        ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', userId))
          .first(),
      ),
    )

    // Pass 3: Build Map for O(1) lookup
    const profileMap = new Map<string, Doc<'profiles'>>()
    for (let i = 0; i < userIds.length; i++) {
      const profile = profiles[i]
      if (profile) profileMap.set(userIds[i], profile)
    }

    log('info', 'getProgramParticipants', {
      participants: participations.length,
      uniqueUsers: userIds.length,
      batchedProfileReads: userIds.length,
    })

    // Enrich with Map lookups
    const enrichedParticipants = participations.map((p) => {
      const profile = profileMap.get(p.userId)
      return {
        ...p,
        memberName: profile?.name ?? 'Unknown',
        memberEmail: null, // Privacy: don't expose email in list
      }
    })

    return enrichedParticipants
  },
})

// Enroll a member in a program
export const enrollMember = mutation({
  args: {
    programId: v.id('programs'),
    userId: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, { programId, userId, adminNotes }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) throw new Error('Program not found')

    const adminMembership = await requireOrgAdmin(ctx, program.orgId)

    // Verify user is a member of the org
    const userMembership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), program.orgId))
      .first()

    if (!userMembership) {
      throw new Error('User is not a member of this organization')
    }

    // Check if already enrolled
    const existing = await ctx.db
      .query('programParticipation')
      .withIndex('by_program', (q) => q.eq('programId', programId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .first()

    if (
      existing &&
      (existing.status === 'enrolled' || existing.status === 'pending')
    ) {
      throw new Error('User is already enrolled or has a pending enrollment')
    }

    // Check capacity
    if (program.maxParticipants) {
      const enrolledCount = await ctx.db
        .query('programParticipation')
        .withIndex('by_program_status', (q) =>
          q.eq('programId', programId).eq('status', 'enrolled'),
        )
        .collect()

      if (enrolledCount.length >= program.maxParticipants) {
        throw new Error('Program is at capacity')
      }
    }

    const now = Date.now()
    const participationId = await ctx.db.insert('programParticipation', {
      programId,
      userId,
      orgId: program.orgId,
      status: 'enrolled',
      enrolledAt: now,
      adminNotes,
      approvedBy: adminMembership._id,
      approvedAt: now,
    })

    return { participationId }
  },
})

// Unenroll/remove a member from a program
export const unenrollMember = mutation({
  args: {
    participationId: v.id('programParticipation'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { participationId, reason }) => {
    const participation = await ctx.db.get(
      'programParticipation',
      participationId,
    )
    if (!participation) throw new Error('Participation not found')

    await requireOrgAdmin(ctx, participation.orgId)

    await ctx.db.patch('programParticipation', participationId, {
      status: 'removed',
      adminNotes: reason
        ? `${participation.adminNotes ?? ''}\nRemoved: ${reason}`.trim()
        : participation.adminNotes,
    })

    return { success: true }
  },
})

// Mark a participant as completed (manual completion)
export const markCompleted = mutation({
  args: {
    participationId: v.id('programParticipation'),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { participationId, notes }) => {
    const participation = await ctx.db.get(
      'programParticipation',
      participationId,
    )
    if (!participation) throw new Error('Participation not found')

    await requireOrgAdmin(ctx, participation.orgId)

    if (participation.status !== 'enrolled') {
      throw new Error('Can only mark enrolled participants as completed')
    }

    await ctx.db.patch('programParticipation', participationId, {
      status: 'completed',
      completedAt: Date.now(),
      adminNotes: notes
        ? `${participation.adminNotes ?? ''}\nCompleted: ${notes}`.trim()
        : participation.adminNotes,
    })

    return { success: true }
  },
})

// Update manual attendance count for a participant
export const updateManualAttendance = mutation({
  args: {
    participationId: v.id('programParticipation'),
    count: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { participationId, count, notes }) => {
    const participation = await ctx.db.get(
      'programParticipation',
      participationId,
    )
    if (!participation) throw new Error('Participation not found')

    await requireOrgAdmin(ctx, participation.orgId)

    await ctx.db.patch('programParticipation', participationId, {
      manualAttendanceCount: count,
      attendanceNotes: notes,
    })

    // Check if this triggers auto-completion
    const program = await ctx.db.get('programs', participation.programId)
    if (program?.completionCriteria?.type === 'attendance_count') {
      const required = program.completionCriteria.requiredCount ?? 0
      if (count >= required && participation.status === 'enrolled') {
        await ctx.db.patch('programParticipation', participationId, {
          status: 'completed',
          completedAt: Date.now(),
        })
      }
    }

    return { success: true }
  },
})
