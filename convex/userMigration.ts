import { mutation } from './_generated/server'

/**
 * First-login migration: when a Clerk user logs in, match their email
 * to the old @convex-dev/auth users table and batch-update all tables
 * that store userId to use the new Clerk subject ID.
 *
 * This is a one-time operation per user. Remove after all users have migrated.
 */
export const migrateUserIfNeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { migrated: false }

    const clerkUserId = identity.subject
    const email = identity.email

    if (!email) return { migrated: false }

    // Check if a profile already exists for this Clerk userId → already migrated
    const existingProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', clerkUserId))
      .first()

    if (existingProfile) return { migrated: false }

    // Look up old user by email in the legacy auth users table
    const oldUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .first()

    if (!oldUser) return { migrated: false }

    const oldUserId = oldUser._id as string

    // profiles
    for (const r of await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', oldUserId))
      .collect()) {
      await ctx.db.patch('profiles', r._id, { userId: clerkUserId })
    }
    // uploadedDocuments
    for (const r of await ctx.db
      .query('uploadedDocuments')
      .withIndex('by_user', (q) => q.eq('userId', oldUserId))
      .collect()) {
      await ctx.db.patch('uploadedDocuments', r._id, { userId: clerkUserId })
    }
    // orgMemberships
    for (const r of await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', oldUserId))
      .collect()) {
      await ctx.db.patch('orgMemberships', r._id, { userId: clerkUserId })
    }
    // notifications
    for (const r of await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', oldUserId))
      .collect()) {
      await ctx.db.patch('notifications', r._id, { userId: clerkUserId })
    }
    // eventViews
    for (const r of await ctx.db
      .query('eventViews')
      .withIndex('by_user', (q) => q.eq('userId', oldUserId))
      .collect()) {
      await ctx.db.patch('eventViews', r._id, { userId: clerkUserId })
    }
    // attendance
    for (const r of await ctx.db
      .query('attendance')
      .withIndex('by_user', (q) => q.eq('userId', oldUserId))
      .collect()) {
      await ctx.db.patch('attendance', r._id, { userId: clerkUserId })
    }
    // programParticipation
    for (const r of await ctx.db
      .query('programParticipation')
      .withIndex('by_user', (q) => q.eq('userId', oldUserId))
      .collect()) {
      await ctx.db.patch('programParticipation', r._id, { userId: clerkUserId })
    }

    // scheduledReminders — no by_user index, use filter
    for (const r of await ctx.db
      .query('scheduledReminders')
      .filter((q) => q.eq(q.field('userId'), oldUserId))
      .collect()) {
      await ctx.db.patch('scheduledReminders', r._id, { userId: clerkUserId })
    }
    // scheduledAttendancePrompts
    for (const r of await ctx.db
      .query('scheduledAttendancePrompts')
      .filter((q) => q.eq(q.field('userId'), oldUserId))
      .collect()) {
      await ctx.db.patch('scheduledAttendancePrompts', r._id, {
        userId: clerkUserId,
      })
    }
    // memberEngagement
    for (const r of await ctx.db
      .query('memberEngagement')
      .filter((q) => q.eq(q.field('userId'), oldUserId))
      .collect()) {
      await ctx.db.patch('memberEngagement', r._id, { userId: clerkUserId })
    }
    // engagementOverrideHistory
    for (const r of await ctx.db
      .query('engagementOverrideHistory')
      .filter((q) => q.eq(q.field('userId'), oldUserId))
      .collect()) {
      await ctx.db.patch('engagementOverrideHistory', r._id, {
        userId: clerkUserId,
      })
    }

    return { migrated: true }
  },
})
