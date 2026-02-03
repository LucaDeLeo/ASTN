import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

/**
 * Bootstrap the first platform admin by email.
 * This is an internal mutation -- run from the Convex dashboard.
 *
 * Usage (from Convex dashboard):
 *   lib/seedPlatformAdmin:seedPlatformAdmin({ email: "admin@example.com" })
 */
export const seedPlatformAdmin = internalMutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    // Look up user by email in auth tables
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), email))
      .first()

    if (!user) {
      console.log(`[seedPlatformAdmin] User not found with email: ${email}`)
      return { success: false, reason: 'User not found' }
    }

    // Check if already a platform admin
    const existing = await ctx.db
      .query('platformAdmins')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()

    if (existing) {
      console.log(
        `[seedPlatformAdmin] User ${email} is already a platform admin`,
      )
      return { success: false, reason: 'Already a platform admin' }
    }

    // Insert platform admin record
    await ctx.db.insert('platformAdmins', {
      userId: user._id,
      addedAt: Date.now(),
      // addedBy is undefined for seed operations
    })

    console.log(
      `[seedPlatformAdmin] Successfully added ${email} (${user._id}) as platform admin`,
    )
    return { success: true, userId: user._id }
  },
})
