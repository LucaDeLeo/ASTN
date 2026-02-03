import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalMutation, mutation } from '../_generated/server'

export const markAsRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const notification = await ctx.db.get('notifications', notificationId)
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found')
    }

    await ctx.db.patch('notifications', notificationId, { read: true })
  },
})

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_read', (q) =>
        q.eq('userId', userId).eq('read', false),
      )
      .collect()

    for (const n of unread) {
      await ctx.db.patch('notifications', n._id, { read: true })
    }
  },
})

// Internal mutation for creating notifications (called by scheduler)
export const createNotification = internalMutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal('event_new'),
      v.literal('event_reminder'),
      v.literal('event_updated'),
      v.literal('org_application_approved'),
      v.literal('org_application_rejected'),
      v.literal('guest_visit_approved'),
      v.literal('guest_visit_rejected'),
      v.literal('guest_visit_pending'),
    ),
    eventId: v.optional(v.id('events')),
    orgId: v.optional(v.id('organizations')),
    applicationId: v.optional(v.id('orgApplications')),
    spaceBookingId: v.optional(v.id('spaceBookings')),
    title: v.string(),
    body: v.string(),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('notifications', {
      ...args,
      read: false,
      createdAt: Date.now(),
    })
  },
})

// Record event view for reminder audience
export const recordEventView = mutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return

    // Check if already viewed
    const existing = await ctx.db
      .query('eventViews')
      .withIndex('by_user_event', (q) =>
        q.eq('userId', userId).eq('eventId', eventId),
      )
      .first()

    if (existing) return // Already tracked

    await ctx.db.insert('eventViews', {
      userId,
      eventId,
      viewedAt: Date.now(),
    })

    // Schedule reminders for this user based on their preferences
    // Use scheduler.runAfter to invoke the scheduling mutation
    await ctx.scheduler.runAfter(
      0, // Run immediately but asynchronously
      internal.notifications.scheduler.scheduleRemindersForViewInternal,
      { eventId, userId },
    )
  },
})
