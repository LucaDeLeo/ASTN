import { v } from 'convex/values'
import { query } from '../_generated/server'
import { getUserId } from '../lib/auth'
import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

// Helper: Require current user is an admin of the given org
async function requireOrgAdmin(
  ctx: QueryCtx,
  orgId: Id<'organizations'>,
): Promise<Doc<'orgMemberships'>> {
  const userId = await getUserId(ctx)
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

/**
 * Get member profile for admin view with privacy controls
 * CONTEXT.md: "Respect all member privacy settings - admins see exactly what member has made visible to their org"
 */
export const getMemberProfileForAdmin = query({
  args: {
    orgId: v.id('organizations'),
    userId: v.string(),
  },
  handler: async (ctx, { orgId, userId }) => {
    await requireOrgAdmin(ctx, orgId)

    // Get profile
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) return null

    // Get membership
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), orgId))
      .first()

    if (!membership) return null

    // Check if member has hidden themselves from this org
    const hiddenOrgs = profile.privacySettings?.hiddenFromOrgs ?? []
    if (hiddenOrgs.includes(orgId.toString())) {
      return {
        restricted: true,
        reason: 'Member has hidden their profile from this organization',
      }
    }

    // Apply section visibility (respect member's choices)
    const visibility = profile.privacySettings?.sectionVisibility ?? {}
    const defaultVis = profile.privacySettings?.defaultVisibility ?? 'private'

    // Helper: check if section is visible to org admin
    // "public" or "connections" visible to org admin (org membership = connection)
    const isVisible = (section: string): boolean => {
      const sectionVis =
        (visibility as Record<string, string>)[section] ?? defaultVis
      return sectionVis !== 'private'
    }

    // Get user email
    const user = await ctx.db.get('users', userId as Id<'users'>)
    const email = user?.email ?? null

    return {
      restricted: false,
      profile: {
        name: profile.name, // Always visible (needed for identification)
        headline: isVisible('basicInfo') ? profile.headline : null,
        location: isVisible('basicInfo') ? profile.location : null,
        pronouns: isVisible('basicInfo') ? profile.pronouns : null,
        education: isVisible('education') ? profile.education : null,
        workHistory: isVisible('workHistory') ? profile.workHistory : null,
        skills: isVisible('skills') ? profile.skills : null,
        careerGoals: isVisible('careerGoals') ? profile.careerGoals : null,
        seeking: isVisible('careerGoals') ? profile.seeking : null,
        aiSafetyInterests: isVisible('careerGoals')
          ? profile.aiSafetyInterests
          : null,
        enrichmentSummary: isVisible('careerGoals')
          ? profile.enrichmentSummary
          : null,
      },
      email,
      membership: {
        _id: membership._id,
        joinedAt: membership.joinedAt,
        role: membership.role,
        directoryVisibility: membership.directoryVisibility,
      },
      visibleSections: {
        basicInfo: isVisible('basicInfo'),
        education: isVisible('education'),
        workHistory: isVisible('workHistory'),
        skills: isVisible('skills'),
        careerGoals: isVisible('careerGoals'),
      },
    }
  },
})

/**
 * Get member's attendance history for this org
 * Returns all attendance records with event details, sorted by event date descending
 */
export const getMemberAttendanceHistory = query({
  args: {
    orgId: v.id('organizations'),
    userId: v.string(),
  },
  handler: async (ctx, { orgId, userId }) => {
    await requireOrgAdmin(ctx, orgId)

    // Verify user is a member of this org
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), orgId))
      .first()

    if (!membership) {
      throw new Error('User is not a member of this organization')
    }

    // Get all attendance records for this user in this org
    const attendanceRecords = await ctx.db
      .query('attendance')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), orgId))
      .collect()

    // Enrich with event details
    const enrichedRecords = await Promise.all(
      attendanceRecords.map(async (record) => {
        const event = await ctx.db.get('events', record.eventId)
        return {
          _id: record._id,
          status: record.status,
          respondedAt: record.respondedAt,
          feedbackRating: record.feedbackRating,
          feedbackText: record.feedbackText,
          createdAt: record.createdAt,
          event: event
            ? {
                _id: event._id,
                title: event.title,
                startAt: event.startAt,
                location: event.location,
                isVirtual: event.isVirtual,
              }
            : null,
        }
      }),
    )

    // Sort by event date descending
    return enrichedRecords.sort(
      (a, b) => (b.event?.startAt ?? 0) - (a.event?.startAt ?? 0),
    )
  },
})

/**
 * Get member's engagement data and override history for audit
 * Returns current engagement state and full history of admin overrides
 */
export const getMemberEngagementHistory = query({
  args: {
    orgId: v.id('organizations'),
    userId: v.string(),
  },
  handler: async (ctx, { orgId, userId }) => {
    await requireOrgAdmin(ctx, orgId)

    // Verify user is a member of this org
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), orgId))
      .first()

    if (!membership) {
      throw new Error('User is not a member of this organization')
    }

    // Get current engagement record
    const engagement = await ctx.db
      .query('memberEngagement')
      .withIndex('by_user_org', (q) =>
        q.eq('userId', userId).eq('orgId', orgId),
      )
      .first()

    if (!engagement) {
      return {
        current: null,
        history: [],
      }
    }

    // Get override history
    const overrideHistory = await ctx.db
      .query('engagementOverrideHistory')
      .withIndex('by_engagement', (q) => q.eq('engagementId', engagement._id))
      .collect()

    // Enrich history with admin names
    const enrichedHistory = await Promise.all(
      overrideHistory.map(async (record) => {
        // Get admin membership to find admin user
        const adminMembership = await ctx.db.get(
          'orgMemberships',
          record.performedBy,
        )
        let adminName = 'Unknown admin'

        if (adminMembership) {
          const adminProfile = await ctx.db
            .query('profiles')
            .withIndex('by_user', (q) => q.eq('userId', adminMembership.userId))
            .first()
          adminName = adminProfile?.name ?? 'Admin'
        }

        return {
          _id: record._id,
          action: record.action,
          previousLevel: record.previousLevel,
          newLevel: record.newLevel,
          notes: record.notes,
          adminName,
          performedAt: record.performedAt,
        }
      }),
    )

    // Sort by date descending
    enrichedHistory.sort((a, b) => b.performedAt - a.performedAt)

    return {
      current: {
        level: engagement.override?.level ?? engagement.level,
        computedLevel: engagement.level,
        adminExplanation: engagement.adminExplanation,
        userExplanation: engagement.userExplanation,
        signals: engagement.signals,
        hasOverride: !!engagement.override,
        overrideNotes: engagement.override?.notes,
        overrideExpiresAt: engagement.override?.expiresAt,
        computedAt: engagement.computedAt,
      },
      history: enrichedHistory,
    }
  },
})
