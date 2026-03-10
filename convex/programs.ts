import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUserId } from './lib/auth'
import { log } from './lib/logging'
import type { Doc, Id } from './_generated/dataModel'
import type { MutationCtx, QueryCtx } from './_generated/server'

// Helper: Require org admin
async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'organizations'>,
): Promise<Doc<'orgMemberships'>> {
  const userId = await getUserId(ctx)
  if (!userId) throw new Error('Not authenticated')

  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user_and_org', (q) =>
      q.eq('userId', userId).eq('orgId', orgId),
    )
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
    linkedOpportunityId: v.optional(v.id('orgOpportunities')),
  },
  returns: v.object({ programId: v.id('programs'), slug: v.string() }),
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
      linkedOpportunityId: args.linkedOpportunityId,
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
    linkedOpportunityId: v.optional(v.id('orgOpportunities')),
  },
  returns: v.object({ success: v.boolean() }),
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
      .withIndex('by_user_and_org', (q) =>
        q.eq('userId', userId).eq('orgId', program.orgId),
      )
      .first()

    if (!userMembership) {
      throw new Error('User is not a member of this organization')
    }

    // Check if already enrolled
    const existing = await ctx.db
      .query('programParticipation')
      .withIndex('by_program_and_user', (q) =>
        q.eq('programId', programId).eq('userId', userId),
      )
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

// ============================================================
// Bulk Enroll + Opportunity Linking
// ============================================================

// Bulk enroll accepted applicants from a linked opportunity
export const bulkEnrollFromOpportunity = mutation({
  args: {
    programId: v.id('programs'),
  },
  returns: v.object({
    enrolled: v.number(),
    skipped: v.number(),
    noAccount: v.number(),
  }),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) throw new Error('Program not found')

    await requireOrgAdmin(ctx, program.orgId)

    if (!program.linkedOpportunityId) {
      throw new Error('Program has no linked opportunity')
    }

    // Get accepted applications
    const acceptedApps = await ctx.db
      .query('opportunityApplications')
      .withIndex('by_opportunity_and_status', (q) =>
        q
          .eq('opportunityId', program.linkedOpportunityId!)
          .eq('status', 'accepted'),
      )
      .collect()

    // Get existing enrollments for this program
    const existingParticipations = await ctx.db
      .query('programParticipation')
      .withIndex('by_program', (q) => q.eq('programId', programId))
      .collect()
    const enrolledUserIds = new Set(existingParticipations.map((p) => p.userId))

    let enrolled = 0
    let skipped = 0
    let noAccount = 0
    const now = Date.now()

    for (const app of acceptedApps) {
      if (!app.userId) {
        noAccount++
        continue
      }
      if (enrolledUserIds.has(app.userId)) {
        skipped++
        continue
      }
      await ctx.db.insert('programParticipation', {
        programId,
        userId: app.userId,
        orgId: program.orgId,
        status: 'enrolled',
        enrolledAt: now,
      })
      enrolledUserIds.add(app.userId)
      enrolled++
    }

    return { enrolled, skipped, noAccount }
  },
})

// Get info about the linked opportunity (admin only)
export const getLinkedOpportunityInfo = query({
  args: {
    programId: v.id('programs'),
  },
  returns: v.union(
    v.object({
      title: v.string(),
      status: v.union(
        v.literal('active'),
        v.literal('closed'),
        v.literal('draft'),
      ),
      acceptedCount: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) return null

    await requireOrgAdmin(ctx, program.orgId)

    if (!program.linkedOpportunityId) return null

    const opp = await ctx.db.get(
      'orgOpportunities',
      program.linkedOpportunityId,
    )
    if (!opp) return null

    const accepted = await ctx.db
      .query('opportunityApplications')
      .withIndex('by_opportunity_and_status', (q) =>
        q.eq('opportunityId', opp._id).eq('status', 'accepted'),
      )
      .collect()

    return {
      title: opp.title,
      status: opp.status,
      acceptedCount: accepted.length,
    }
  },
})

// ============================================================
// Module CRUD
// ============================================================

// Get modules for a program (accessible to enrolled participants + admins)
export const getProgramModules = query({
  args: {
    programId: v.id('programs'),
  },
  returns: v.array(
    v.object({
      _id: v.id('programModules'),
      _creationTime: v.number(),
      programId: v.id('programs'),
      title: v.string(),
      description: v.optional(v.string()),
      weekNumber: v.number(),
      orderIndex: v.number(),
      materials: v.optional(
        v.array(
          v.object({
            label: v.string(),
            url: v.string(),
            type: v.union(
              v.literal('link'),
              v.literal('pdf'),
              v.literal('video'),
              v.literal('reading'),
            ),
          }),
        ),
      ),
      status: v.union(
        v.literal('locked'),
        v.literal('available'),
        v.literal('completed'),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) throw new Error('Program not found')

    // Check access: enrolled participant or org admin
    await requireProgramAccess(ctx, program)

    const modules = await ctx.db
      .query('programModules')
      .withIndex('by_program_and_order', (q) => q.eq('programId', programId))
      .collect()

    return modules
  },
})

// Create a module (admin only)
export const createModule = mutation({
  args: {
    programId: v.id('programs'),
    title: v.string(),
    description: v.optional(v.string()),
    weekNumber: v.number(),
    materials: v.optional(
      v.array(
        v.object({
          label: v.string(),
          url: v.string(),
          type: v.union(
            v.literal('link'),
            v.literal('pdf'),
            v.literal('video'),
            v.literal('reading'),
          ),
        }),
      ),
    ),
    status: v.optional(
      v.union(
        v.literal('locked'),
        v.literal('available'),
        v.literal('completed'),
      ),
    ),
  },
  returns: v.id('programModules'),
  handler: async (ctx, args) => {
    const program = await ctx.db.get('programs', args.programId)
    if (!program) throw new Error('Program not found')

    await requireOrgAdmin(ctx, program.orgId)

    // Auto-calculate orderIndex
    const existing = await ctx.db
      .query('programModules')
      .withIndex('by_program', (q) => q.eq('programId', args.programId))
      .collect()
    const maxOrder = existing.reduce(
      (max, m) => Math.max(max, m.orderIndex),
      -1,
    )

    const now = Date.now()
    return await ctx.db.insert('programModules', {
      programId: args.programId,
      title: args.title,
      description: args.description,
      weekNumber: args.weekNumber,
      orderIndex: maxOrder + 1,
      materials: args.materials,
      status: args.status ?? 'locked',
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update a module (admin only)
export const updateModule = mutation({
  args: {
    moduleId: v.id('programModules'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    weekNumber: v.optional(v.number()),
    orderIndex: v.optional(v.number()),
    materials: v.optional(
      v.array(
        v.object({
          label: v.string(),
          url: v.string(),
          type: v.union(
            v.literal('link'),
            v.literal('pdf'),
            v.literal('video'),
            v.literal('reading'),
          ),
        }),
      ),
    ),
    status: v.optional(
      v.union(
        v.literal('locked'),
        v.literal('available'),
        v.literal('completed'),
      ),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { moduleId, ...updates }) => {
    const mod = await ctx.db.get('programModules', moduleId)
    if (!mod) throw new Error('Module not found')

    const program = await ctx.db.get('programs', mod.programId)
    if (!program) throw new Error('Program not found')

    await requireOrgAdmin(ctx, program.orgId)

    const patchData: Record<string, unknown> = { updatedAt: Date.now() }
    for (const [key, value] of Object.entries(updates)) {
      patchData[key] = value
    }

    await ctx.db.patch('programModules', moduleId, patchData)
    return null
  },
})

// Delete a module (admin only)
export const deleteModule = mutation({
  args: {
    moduleId: v.id('programModules'),
  },
  returns: v.null(),
  handler: async (ctx, { moduleId }) => {
    const mod = await ctx.db.get('programModules', moduleId)
    if (!mod) throw new Error('Module not found')

    const program = await ctx.db.get('programs', mod.programId)
    if (!program) throw new Error('Program not found')

    await requireOrgAdmin(ctx, program.orgId)

    await ctx.db.delete('programModules', moduleId)
    return null
  },
})

// ============================================================
// Participant Queries
// ============================================================

// Helper: check program access (enrolled/completed participant or org admin)
// Returns access info, or throws if throwOnDenied is true (default)
async function checkProgramAccess(
  ctx: QueryCtx,
  program: Doc<'programs'>,
): Promise<{
  userId: string
  isAdmin: boolean
  participation: Doc<'programParticipation'> | null
} | null> {
  const userId = await getUserId(ctx)
  if (!userId) return null

  // Check if org admin
  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user_and_org', (q) =>
      q.eq('userId', userId).eq('orgId', program.orgId),
    )
    .first()

  if (membership?.role === 'admin') {
    return { userId, isAdmin: true, participation: null }
  }

  // Check if enrolled/completed participant
  const participation = await ctx.db
    .query('programParticipation')
    .withIndex('by_program_and_user', (q) =>
      q.eq('programId', program._id).eq('userId', userId),
    )
    .first()

  if (
    participation &&
    (participation.status === 'enrolled' ||
      participation.status === 'completed')
  ) {
    return { userId, isAdmin: false, participation }
  }

  return null
}

async function requireProgramAccess(
  ctx: QueryCtx,
  program: Doc<'programs'>,
): Promise<string> {
  const access = await checkProgramAccess(ctx, program)
  if (!access) throw new Error('Access denied')
  return access.userId
}

// Get current user's programs for an org
export const getMyPrograms = query({
  args: {
    orgId: v.id('organizations'),
  },
  returns: v.array(
    v.object({
      _id: v.id('programs'),
      name: v.string(),
      slug: v.string(),
      type: v.union(
        v.literal('reading_group'),
        v.literal('fellowship'),
        v.literal('mentorship'),
        v.literal('cohort'),
        v.literal('workshop_series'),
        v.literal('custom'),
      ),
      status: v.union(
        v.literal('planning'),
        v.literal('active'),
        v.literal('completed'),
        v.literal('archived'),
      ),
      description: v.optional(v.string()),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      participationStatus: v.union(
        v.literal('pending'),
        v.literal('enrolled'),
        v.literal('completed'),
        v.literal('withdrawn'),
        v.literal('removed'),
      ),
    }),
  ),
  handler: async (ctx, { orgId }) => {
    const userId = await getUserId(ctx)
    if (!userId) return []

    const participations = await ctx.db
      .query('programParticipation')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', userId).eq('orgId', orgId),
      )
      .collect()

    const results = await Promise.all(
      participations
        .filter((p) => p.status === 'enrolled' || p.status === 'completed')
        .map(async (p) => {
          const program = await ctx.db.get('programs', p.programId)
          if (!program || program.status === 'archived') return null
          return {
            _id: program._id,
            name: program.name,
            slug: program.slug,
            type: program.type,
            status: program.status,
            description: program.description,
            startDate: program.startDate,
            endDate: program.endDate,
            participationStatus: p.status,
          }
        }),
    )

    return results.filter((r): r is NonNullable<typeof r> => r !== null)
  },
})

// Get program by slug (participant view)
export const getProgramBySlug = query({
  args: {
    orgId: v.id('organizations'),
    programSlug: v.string(),
  },
  returns: v.union(
    v.object({
      program: v.object({
        _id: v.id('programs'),
        name: v.string(),
        slug: v.string(),
        description: v.optional(v.string()),
        type: v.union(
          v.literal('reading_group'),
          v.literal('fellowship'),
          v.literal('mentorship'),
          v.literal('cohort'),
          v.literal('workshop_series'),
          v.literal('custom'),
        ),
        status: v.union(
          v.literal('planning'),
          v.literal('active'),
          v.literal('completed'),
          v.literal('archived'),
        ),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
      }),
      participation: v.union(
        v.object({
          status: v.union(
            v.literal('pending'),
            v.literal('enrolled'),
            v.literal('completed'),
            v.literal('withdrawn'),
            v.literal('removed'),
          ),
          enrolledAt: v.number(),
          completedAt: v.optional(v.number()),
          manualAttendanceCount: v.optional(v.number()),
        }),
        v.null(),
      ),
      modules: v.array(
        v.object({
          _id: v.id('programModules'),
          title: v.string(),
          description: v.optional(v.string()),
          weekNumber: v.number(),
          orderIndex: v.number(),
          materials: v.optional(
            v.array(
              v.object({
                label: v.string(),
                url: v.string(),
                type: v.union(
                  v.literal('link'),
                  v.literal('pdf'),
                  v.literal('video'),
                  v.literal('reading'),
                ),
              }),
            ),
          ),
          status: v.union(
            v.literal('locked'),
            v.literal('available'),
            v.literal('completed'),
          ),
        }),
      ),
      events: v.array(
        v.object({
          _id: v.id('events'),
          title: v.string(),
          startAt: v.number(),
          endAt: v.optional(v.number()),
          timezone: v.string(),
          location: v.optional(v.string()),
          isVirtual: v.boolean(),
          url: v.string(),
        }),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, { orgId, programSlug }) => {
    const program = await ctx.db
      .query('programs')
      .withIndex('by_org_slug', (q) =>
        q.eq('orgId', orgId).eq('slug', programSlug),
      )
      .first()

    if (!program) return null

    // Check access using shared helper
    const access = await checkProgramAccess(ctx, program)
    if (!access) return null

    // Get participation (if participant, it's already in access result)
    const participation =
      access.participation ??
      (access.isAdmin
        ? await ctx.db
            .query('programParticipation')
            .withIndex('by_program_and_user', (q) =>
              q.eq('programId', program._id).eq('userId', access.userId),
            )
            .first()
        : null)

    // Get modules
    const modules = await ctx.db
      .query('programModules')
      .withIndex('by_program_and_order', (q) => q.eq('programId', program._id))
      .collect()

    // Get linked events
    const validEvents = await fetchLinkedEvents(
      ctx,
      program.linkedEventIds ?? [],
    )

    return {
      program: {
        _id: program._id,
        name: program.name,
        slug: program.slug,
        description: program.description,
        type: program.type,
        status: program.status,
        startDate: program.startDate,
        endDate: program.endDate,
      },
      participation: participation
        ? {
            status: participation.status,
            enrolledAt: participation.enrolledAt,
            completedAt: participation.completedAt,
            manualAttendanceCount: participation.manualAttendanceCount,
          }
        : null,
      modules: modules.map((m) => ({
        _id: m._id,
        title: m.title,
        description: m.description,
        weekNumber: m.weekNumber,
        orderIndex: m.orderIndex,
        materials: m.materials,
        status: m.status,
      })),
      events: validEvents,
    }
  },
})

// Helper: fetch and project linked events for a program
async function fetchLinkedEvents(
  ctx: QueryCtx,
  linkedEventIds: Array<Id<'events'>>,
) {
  const events = await Promise.all(
    linkedEventIds.map((id) => ctx.db.get('events', id)),
  )
  return events
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.startAt - b.startAt)
    .map((e) => ({
      _id: e._id,
      title: e.title,
      startAt: e.startAt,
      endAt: e.endAt,
      timezone: e.timezone,
      location: e.location,
      isVirtual: e.isVirtual,
      url: e.url,
    }))
}

// Get events linked to a program
export const getProgramEvents = query({
  args: {
    programId: v.id('programs'),
  },
  returns: v.array(
    v.object({
      _id: v.id('events'),
      title: v.string(),
      startAt: v.number(),
      endAt: v.optional(v.number()),
      timezone: v.string(),
      location: v.optional(v.string()),
      isVirtual: v.boolean(),
      url: v.string(),
    }),
  ),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) throw new Error('Program not found')

    await requireProgramAccess(ctx, program)

    return fetchLinkedEvents(ctx, program.linkedEventIds ?? [])
  },
})

// Get a single program by ID (admin only, avoids loading all programs)
export const getProgram = query({
  args: {
    programId: v.id('programs'),
  },
  returns: v.union(
    v.object({
      _id: v.id('programs'),
      _creationTime: v.number(),
      orgId: v.id('organizations'),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      type: v.union(
        v.literal('reading_group'),
        v.literal('fellowship'),
        v.literal('mentorship'),
        v.literal('cohort'),
        v.literal('workshop_series'),
        v.literal('custom'),
      ),
      status: v.union(
        v.literal('planning'),
        v.literal('active'),
        v.literal('completed'),
        v.literal('archived'),
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
      linkedEventIds: v.optional(v.array(v.id('events'))),
      linkedOpportunityId: v.optional(v.id('orgOpportunities')),
      participantCount: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { programId }) => {
    const program = await ctx.db.get('programs', programId)
    if (!program) return null

    await requireOrgAdmin(ctx, program.orgId)

    const participants = await ctx.db
      .query('programParticipation')
      .withIndex('by_program_status', (q) =>
        q.eq('programId', programId).eq('status', 'enrolled'),
      )
      .collect()

    return {
      ...program,
      participantCount: participants.length,
    }
  },
})

// Get org events for linking UI (admin only) — only recent/future events
export const getOrgEventsForLinking = query({
  args: {
    orgId: v.id('organizations'),
  },
  returns: v.array(
    v.object({
      _id: v.id('events'),
      title: v.string(),
      startAt: v.number(),
      timezone: v.string(),
    }),
  ),
  handler: async (ctx, { orgId }) => {
    await requireOrgAdmin(ctx, orgId)

    // Only fetch events from the last 3 months onward
    const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
    const events = await ctx.db
      .query('events')
      .withIndex('by_org_start', (q) =>
        q.eq('orgId', orgId).gte('startAt', threeMonthsAgo),
      )
      .collect()

    return events.map((e) => ({
      _id: e._id,
      title: e.title,
      startAt: e.startAt,
      timezone: e.timezone,
    }))
  },
})
