import { v } from 'convex/values'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '../_generated/server'
import { internal } from '../_generated/api'
import type { Id } from '../_generated/dataModel'

/**
 * One-time migration: Backfill email (and name) on profiles from Clerk API.
 *
 * Prerequisites:
 *   1. Set CLERK_SECRET_KEY in Convex dashboard env vars
 *   2. Run: npx convex run migrations/backfillProfileEmails:run
 *
 * For Clerk users (userId starts with "user_"), fetches email/name from Clerk API.
 * For legacy users, attempts lookup from the legacy users table.
 */

export const getProfilesMissingEmail = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('profiles'),
      userId: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const allProfiles = await ctx.db.query('profiles').collect()
    return allProfiles
      .filter((p) => !p.email)
      .map((p) => ({ _id: p._id, userId: p.userId, name: p.name }))
  },
})

export const patchProfileFields = internalMutation({
  args: {
    profileId: v.id('profiles'),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { profileId, email, name }) => {
    const patch: Record<string, string> = {}
    if (email) patch.email = email
    if (name) patch.name = name
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch('profiles', profileId, patch)
    }
    return null
  },
})

export const run = internalAction({
  args: {},
  returns: v.object({
    total: v.number(),
    updated: v.number(),
    skipped: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY
    if (!clerkSecretKey) {
      throw new Error(
        'CLERK_SECRET_KEY not set. Add it in the Convex dashboard under Settings > Environment Variables.',
      )
    }

    const profiles: Array<{
      _id: Id<'profiles'>
      userId: string
      name?: string
    }> = await ctx.runQuery(
      internal.migrations.backfillProfileEmails.getProfilesMissingEmail,
    )

    let updated = 0
    let skipped = 0
    let failed = 0

    for (const profile of profiles) {
      // Only handle Clerk users (user_xxx IDs)
      if (!profile.userId.startsWith('user_')) {
        skipped++
        continue
      }

      try {
        const res = await fetch(
          `https://api.clerk.com/v1/users/${profile.userId}`,
          { headers: { Authorization: `Bearer ${clerkSecretKey}` } },
        )

        if (!res.ok) {
          console.warn(
            `Clerk API ${res.status} for ${profile.userId}: ${await res.text()}`,
          )
          failed++
          continue
        }

        const user = await res.json()

        // Get primary email
        const primaryEmail = user.email_addresses?.find(
          (e: { id: string; email_address: string }) =>
            e.id === user.primary_email_address_id,
        )?.email_address as string | undefined

        // Build full name from Clerk
        const fullName =
          [user.first_name, user.last_name].filter(Boolean).join(' ') ||
          undefined

        const emailToSet = primaryEmail
        const nameToSet = !profile.name && fullName ? fullName : undefined

        if (emailToSet || nameToSet) {
          await ctx.runMutation(
            internal.migrations.backfillProfileEmails.patchProfileFields,
            {
              profileId: profile._id,
              email: emailToSet,
              name: nameToSet,
            },
          )
          updated++
        } else {
          skipped++
        }
      } catch (e) {
        console.error(`Failed for ${profile.userId}:`, e)
        failed++
      }
    }

    console.log(
      `Backfill complete: ${updated} updated, ${skipped} skipped, ${failed} failed out of ${profiles.length} total`,
    )
    return { total: profiles.length, updated, skipped, failed }
  },
})
