"use node";

import { v } from 'convex/values'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'

/**
 * Send push notification to a user via FCM HTTP v1 API.
 *
 * Requires FIREBASE_SERVER_KEY environment variable to be set
 * in the Convex dashboard.
 *
 * Called from match pipeline when a new match is created.
 */
export const sendPushNotification = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tokens: Array<{ token: string; platform: 'ios' | 'android' }> =
      await ctx.runQuery(internal.pushTokens.getTokensForUser, {
        userId: args.userId,
      })

    if (tokens.length === 0) return null

    const serverKey = process.env.FIREBASE_SERVER_KEY
    if (!serverKey) {
      console.warn('FIREBASE_SERVER_KEY not set — skipping push notification')
      return null
    }

    for (const { token } of tokens) {
      try {
        const response = await fetch(
          'https://fcm.googleapis.com/fcm/send',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `key=${serverKey}`,
            },
            body: JSON.stringify({
              to: token,
              notification: {
                title: args.title,
                body: args.body,
              },
              data: args.data ?? {},
            }),
          },
        )

        if (!response.ok) {
          console.error(
            `FCM send failed for token ${token.slice(0, 10)}...: ${response.status}`,
          )
        }
      } catch (error) {
        console.error('FCM send error:', error)
      }
    }

    return null
  },
})
