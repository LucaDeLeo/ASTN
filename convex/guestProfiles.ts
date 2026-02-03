import { v } from 'convex/values'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { requireAuth } from './lib/auth'

// ---------- Internal Mutations ----------

/**
 * Get or create a guest profile. Used during visit application.
 * If profile exists, returns existing ID (doesn't update fields).
 * If not exists, creates new profile with initial values.
 */
export const getOrCreateGuestProfile = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    organization: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { userId, name, email, phone, organization, title }) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query('guestProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (existing) {
      return existing._id
    }

    // Create new profile
    const now = Date.now()
    const profileId = await ctx.db.insert('guestProfiles', {
      userId,
      name,
      email,
      phone,
      organization,
      title,
      visitCount: 0,
      becameMember: false,
      createdAt: now,
      updatedAt: now,
    })

    return profileId
  },
})

/**
 * Mark a guest as having become a member.
 * Called when guest creates a full ASTN profile.
 * Preserves guest profile for audit trail.
 */
export const markGuestAsMember = internalMutation({
  args: {
    userId: v.string(),
    profileId: v.id('profiles'),
  },
  handler: async (ctx, { userId, profileId }) => {
    const guestProfile = await ctx.db
      .query('guestProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!guestProfile) {
      // No guest profile to update - this is fine
      return
    }

    await ctx.db.patch('guestProfiles', guestProfile._id, {
      becameMember: true,
      becameMemberAt: Date.now(),
      convertedToProfileId: profileId,
      updatedAt: Date.now(),
    })
  },
})

// ---------- Internal Queries ----------

/**
 * Get guest profile by userId (internal use).
 */
export const getGuestProfileByUserId = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query('guestProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()
  },
})

// ---------- Public Mutations ----------

/**
 * Update guest's own profile.
 * Guests can update name, phone, organization, title (not email).
 */
export const updateGuestProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    organization: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { name, phone, organization, title }) => {
    const userId = await requireAuth(ctx)

    const guestProfile = await ctx.db
      .query('guestProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!guestProfile) {
      throw new Error('Guest profile not found')
    }

    // Build patch object with only provided fields
    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (name !== undefined) patch.name = name
    if (phone !== undefined) patch.phone = phone
    if (organization !== undefined) patch.organization = organization
    if (title !== undefined) patch.title = title

    await ctx.db.patch('guestProfiles', guestProfile._id, patch)

    return { success: true }
  },
})

// ---------- Public Queries ----------

/**
 * Get the current user's guest profile.
 * Returns null if not authenticated or no guest profile exists.
 */
export const getGuestProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity()
    if (!userId) return null

    return await ctx.db
      .query('guestProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId.subject))
      .first()
  },
})
