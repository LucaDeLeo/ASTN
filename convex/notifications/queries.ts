import { getAuthUserId } from '@convex-dev/auth/server'
import { v } from 'convex/values'
import { query } from '../_generated/server'

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return 0

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user_read', (q) =>
        q.eq('userId', userId).eq('read', false),
      )
      .collect()

    return unread.length
  },
})

export const getRecentNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(limit)

    // Enrich with event/org data
    return Promise.all(
      notifications.map(async (n) => {
        let eventTitle: string | undefined
        let orgName: string | undefined

        if (n.eventId) {
          const event = await ctx.db.get('events', n.eventId)
          eventTitle = event?.title
        }
        if (n.orgId) {
          const org = await ctx.db.get('organizations', n.orgId)
          orgName = org?.name
        }

        return { ...n, eventTitle, orgName }
      }),
    )
  },
})
