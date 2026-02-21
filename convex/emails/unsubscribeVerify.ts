'use node'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { v } from 'convex/values'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'

// HMAC-SHA256 sign a profileId
function signProfileId(profileId: string, secret: string): string {
  return createHmac('sha256', secret).update(profileId).digest('base64url')
}

/**
 * Generate a full unsubscribe URL with HMAC-signed token.
 * Called from batchActions.ts at email send time.
 */
export function generateUnsubscribeUrl(
  profileId: string,
  siteUrl: string,
  secret: string,
): string {
  const signature = signProfileId(profileId, secret)
  const token = Buffer.from(`${profileId}:${signature}`).toString('base64url')
  return `${siteUrl}/unsubscribe?token=${token}`
}

// Verify and decode an unsubscribe token
function verifyToken(
  token: string,
  secret: string,
): { valid: true; profileId: string } | { valid: false } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const colonIndex = decoded.indexOf(':')
    if (colonIndex === -1) return { valid: false }

    const profileId = decoded.substring(0, colonIndex)
    const signature = decoded.substring(colonIndex + 1)
    const expectedSignature = signProfileId(profileId, secret)

    const sigBuf = Buffer.from(signature)
    const expectedBuf = Buffer.from(expectedSignature)
    if (sigBuf.length !== expectedBuf.length) return { valid: false }
    if (!timingSafeEqual(sigBuf, expectedBuf)) return { valid: false }

    return { valid: true, profileId }
  } catch {
    return { valid: false }
  }
}

/**
 * Verify an unsubscribe token and disable all notifications.
 * Called by the httpAction handler — runs in Node.js for crypto access.
 */
export const verifyAndUnsubscribe = internalAction({
  args: { token: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { token }): Promise<boolean> => {
    const secret = process.env.UNSUBSCRIBE_SECRET
    if (!secret) return false

    const result = verifyToken(token, secret)
    if (!result.valid) return false

    await ctx.runMutation(internal.emails.unsubscribe.disableAllNotifications, {
      profileId: result.profileId as Id<'profiles'>,
    })

    return true
  },
})
