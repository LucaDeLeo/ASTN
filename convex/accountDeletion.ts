import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireAuth } from './lib/auth'
import { rateLimiter } from './lib/rateLimiter'

/**
 * Delete all data associated with the current user.
 * This is a debug/development tool for resetting accounts.
 */
export const deleteAllMyData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)

    await rateLimiter.limit(ctx, 'accountDeletion', {
      key: userId,
      throws: true,
    })

    // 1. Find profile (needed for profile-dependent tables)
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    const profileId = profile?._id

    // 2. Delete profile-dependent tables
    if (profileId) {
      const enrichmentMessages = await ctx.db
        .query('enrichmentMessages')
        .withIndex('by_profile', (q) => q.eq('profileId', profileId))
        .collect()
      for (const m of enrichmentMessages)
        await ctx.db.delete('enrichmentMessages', m._id)

      const enrichmentExtractions = await ctx.db
        .query('enrichmentExtractions')
        .withIndex('by_profile', (q) => q.eq('profileId', profileId))
        .collect()
      for (const e of enrichmentExtractions)
        await ctx.db.delete('enrichmentExtractions', e._id)

      const agentToolCalls = await ctx.db
        .query('agentToolCalls')
        .withIndex('by_profile', (q) => q.eq('profileId', profileId))
        .collect()
      for (const t of agentToolCalls)
        await ctx.db.delete('agentToolCalls', t._id)

      const careerActions = await ctx.db
        .query('careerActions')
        .withIndex('by_profile', (q) => q.eq('profileId', profileId))
        .collect()
      for (const c of careerActions) await ctx.db.delete('careerActions', c._id)

      const matches = await ctx.db
        .query('matches')
        .withIndex('by_profile', (q) => q.eq('profileId', profileId))
        .collect()
      for (const m of matches) await ctx.db.delete('matches', m._id)
    }

    // 3. Delete uploaded documents and their storage blobs
    const documents = await ctx.db
      .query('uploadedDocuments')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const doc of documents) {
      await ctx.storage.delete(doc.storageId)
      await ctx.db.delete('uploadedDocuments', doc._id)
    }

    // 4. Delete user-level tables
    const spaceBookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const b of spaceBookings) {
      // Also delete visit application responses tied to this booking
      const responses = await ctx.db
        .query('visitApplicationResponses')
        .withIndex('by_booking', (q) => q.eq('spaceBookingId', b._id))
        .collect()
      for (const r of responses)
        await ctx.db.delete('visitApplicationResponses', r._id)
      await ctx.db.delete('spaceBookings', b._id)
    }

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const n of notifications) await ctx.db.delete('notifications', n._id)

    const eventViews = await ctx.db
      .query('eventViews')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const e of eventViews) await ctx.db.delete('eventViews', e._id)

    const scheduledReminders = await ctx.db
      .query('scheduledReminders')
      .withIndex('by_user_event', (q) => q.eq('userId', userId))
      .collect()
    for (const r of scheduledReminders)
      await ctx.db.delete('scheduledReminders', r._id)

    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const a of attendance) await ctx.db.delete('attendance', a._id)

    const attendancePrompts = await ctx.db
      .query('scheduledAttendancePrompts')
      .withIndex('by_user_event', (q) => q.eq('userId', userId))
      .collect()
    for (const p of attendancePrompts)
      await ctx.db.delete('scheduledAttendancePrompts', p._id)

    const memberEngagement = await ctx.db
      .query('memberEngagement')
      .withIndex('by_user_org', (q) => q.eq('userId', userId))
      .collect()
    for (const e of memberEngagement)
      await ctx.db.delete('memberEngagement', e._id)

    const orgMemberships = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const m of orgMemberships) await ctx.db.delete('orgMemberships', m._id)

    const orgApplications = await ctx.db
      .query('orgApplications')
      .withIndex('by_applicant', (q) => q.eq('applicantUserId', userId))
      .collect()
    for (const a of orgApplications)
      await ctx.db.delete('orgApplications', a._id)

    const programParticipation = await ctx.db
      .query('programParticipation')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    for (const p of programParticipation)
      await ctx.db.delete('programParticipation', p._id)

    const opportunityApplications = await ctx.db
      .query('opportunityApplications')
      .withIndex('by_user_and_opportunity', (q) => q.eq('userId', userId))
      .collect()
    for (const a of opportunityApplications)
      await ctx.db.delete('opportunityApplications', a._id)

    const guestProfile = await ctx.db
      .query('guestProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()
    if (guestProfile) await ctx.db.delete('guestProfiles', guestProfile._id)

    // 5. Delete the profile itself (last)
    if (profileId) await ctx.db.delete('profiles', profileId)
  },
})
