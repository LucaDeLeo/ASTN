import { v } from 'convex/values'
import { query } from '../_generated/server'

// Get organization by slug
export const getOrgBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
  },
})

// Get visible members for an organization's public directory
export const getVisibleMembers = query({
  args: { orgId: v.id('organizations') },
  handler: async (ctx, { orgId }) => {
    // Get all memberships with visible directory visibility
    const memberships = await ctx.db
      .query('orgMemberships')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .filter((q) => q.eq(q.field('directoryVisibility'), 'visible'))
      .collect()

    // Fetch profile data for each member
    const membersWithProfiles = await Promise.all(
      memberships.map(async (membership) => {
        // Get profile for this user
        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', membership.userId))
          .first()

        return {
          membershipId: membership._id,
          userId: membership.userId,
          role: membership.role,
          profile: profile
            ? {
                name: profile.name || 'Anonymous',
                headline: profile.headline,
                skills: profile.skills?.slice(0, 3) || [],
                location: profile.location,
              }
            : {
                name: 'Anonymous',
                headline: undefined,
                skills: [],
                location: undefined,
              },
        }
      }),
    )

    // Sort: admins first, then alphabetically by name
    return membersWithProfiles.sort((a, b) => {
      // Admins first
      if (a.role === 'admin' && b.role !== 'admin') return -1
      if (b.role === 'admin' && a.role !== 'admin') return 1
      // Then alphabetically by name
      return a.profile.name.localeCompare(b.profile.name)
    })
  },
})

// Validate an invite token
export const validateInviteToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // Find invite by token
    const invite = await ctx.db
      .query('orgInviteLinks')
      .withIndex('by_token', (q) => q.eq('token', token))
      .first()

    if (!invite) {
      return { valid: false as const }
    }

    // Check expiration
    if (invite.expiresAt && invite.expiresAt < Date.now()) {
      return { valid: false as const }
    }

    // Get org details
    const org = await ctx.db.get('organizations', invite.orgId)
    if (!org) {
      return { valid: false as const }
    }

    return {
      valid: true as const,
      orgId: invite.orgId,
      orgName: org.name,
      orgSlug: org.slug,
    }
  },
})

// Get member count for an organization
export const getMemberCount = query({
  args: { orgId: v.id('organizations') },
  handler: async (ctx, { orgId }) => {
    const memberships = await ctx.db
      .query('orgMemberships')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .collect()

    return memberships.length
  },
})
