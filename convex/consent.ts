import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireAuth } from './lib/auth'

const CURRENT_CONSENT_VERSION = 'v1'

export const recordConsent = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .unique()

    if (!profile) {
      throw new Error('Profile not found')
    }

    // Idempotent: skip if already consented to current version
    if (profile.consentVersion === CURRENT_CONSENT_VERSION) {
      return null
    }

    await ctx.db.patch('profiles', profile._id, {
      consentedAt: Date.now(),
      consentVersion: CURRENT_CONSENT_VERSION,
    })

    return null
  },
})
