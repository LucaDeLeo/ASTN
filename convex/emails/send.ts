import { toZonedTime } from 'date-fns-tz'
import { v } from 'convex/values'
import { Resend } from '@convex-dev/resend'
import { internalMutation, internalQuery } from '../_generated/server'
import { components } from '../_generated/api'
import { log } from '../lib/logging'
import type { Id } from '../_generated/dataModel'

// Initialize Resend component
// For production: set RESEND_API_KEY in Convex dashboard
// For local development: testMode prevents actual email sending
export const resend = new Resend(components.resend, {
  // testMode: process.env.NODE_ENV !== "production",
})

// From address for all ASTN emails
const FROM_ADDRESS = 'ASTN <notifications@astn.ai>'

/**
 * Send a match alert email
 * Called by the notification scheduler when new great-tier matches are found
 */
export const sendMatchAlert = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, { to, subject, html }) => {
    await resend.sendEmail(ctx, {
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    })
  },
})

/**
 * Send a weekly digest email
 * Called by the weekly cron job for users with digest enabled
 */
export const sendWeeklyDigest = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, { to, subject, html }) => {
    await resend.sendEmail(ctx, {
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    })
  },
})

/**
 * Get users whose local time matches the target hour for match alerts
 * Used by the hourly cron to process timezone-aware email delivery
 * Uses direct ctx.db.get with Id cast instead of full-table-scan filter
 */
export const getUsersForMatchAlertBatch = internalQuery({
  args: { targetLocalHour: v.number() },
  handler: async (ctx, { targetLocalHour }) => {
    // Get all profiles with match alerts enabled
    const profiles = await ctx.db.query('profiles').collect()

    const now = new Date()

    // Pass 1: Filter eligible profiles (alerts enabled + correct timezone hour)
    const eligible = profiles.filter((profile) => {
      if (
        !profile.notificationPreferences ||
        !profile.notificationPreferences.matchAlerts.enabled
      ) {
        return false
      }
      const timezone = profile.notificationPreferences.timezone || 'UTC'
      const userLocalTime = toZonedTime(now, timezone)
      const userLocalHour = userLocalTime.getHours()
      return userLocalHour === targetLocalHour
    })

    // Pass 2: Batch fetch users with direct ID access
    const users = await Promise.all(
      eligible.map((p) => ctx.db.get('users', p.userId as Id<'users'>)),
    )

    log('info', 'getUsersForMatchAlertBatch', {
      totalProfiles: profiles.length,
      eligible: eligible.length,
      batchedUserReads: eligible.length,
    })

    // Pass 3: Build result
    const usersToNotify: Array<{
      userId: string
      email: string
      timezone: string
      profileId: (typeof profiles)[0]['_id']
      userName: string
    }> = []

    for (let i = 0; i < eligible.length; i++) {
      const user = users[i]
      const profile = eligible[i]
      if (user?.email) {
        usersToNotify.push({
          userId: profile.userId,
          email: user.email,
          timezone: profile.notificationPreferences?.timezone || 'UTC',
          profileId: profile._id,
          userName: profile.name || 'there',
        })
      }
    }

    return usersToNotify
  },
})

/**
 * Get users with weekly digest enabled
 * Uses direct ctx.db.get with Id cast instead of full-table-scan filter
 */
export const getUsersForWeeklyDigestBatch = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all profiles with weekly digest enabled
    const profiles = await ctx.db.query('profiles').collect()

    // Pass 1: Filter eligible profiles (digest enabled)
    const eligible = profiles.filter(
      (profile) =>
        profile.notificationPreferences &&
        profile.notificationPreferences.weeklyDigest.enabled,
    )

    // Pass 2: Batch fetch users with direct ID access
    const users = await Promise.all(
      eligible.map((p) => ctx.db.get('users', p.userId as Id<'users'>)),
    )

    log('info', 'getUsersForWeeklyDigestBatch', {
      totalProfiles: profiles.length,
      eligible: eligible.length,
      batchedUserReads: eligible.length,
    })

    // Pass 3: Build result
    const usersToNotify: Array<{
      userId: string
      email: string
      profileId: (typeof profiles)[0]['_id']
      userName: string
      completedSections: Array<string>
      hasEnrichmentConversation: boolean
    }> = []

    for (let i = 0; i < eligible.length; i++) {
      const user = users[i]
      const profile = eligible[i]
      if (user?.email) {
        usersToNotify.push({
          userId: profile.userId,
          email: user.email,
          profileId: profile._id,
          userName: profile.name || 'there',
          completedSections: profile.completedSections || [],
          hasEnrichmentConversation: profile.hasEnrichmentConversation || false,
        })
      }
    }

    return usersToNotify
  },
})

/**
 * Mark matches as no longer new (after alert email sent)
 */
export const markMatchesNotNew = internalMutation({
  args: {
    matchIds: v.array(v.id('matches')),
  },
  handler: async (ctx, { matchIds }) => {
    for (const matchId of matchIds) {
      await ctx.db.patch('matches', matchId, { isNew: false })
    }
  },
})

/**
 * Get new great-tier matches for a profile
 * Only "great" tier matches trigger alerts (per CONTEXT.md)
 */
export const getNewGreatMatches = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query('matches')
      .withIndex('by_profile_tier', (q) =>
        q.eq('profileId', profileId).eq('tier', 'great'),
      )
      .filter((q) => q.eq(q.field('isNew'), true))
      .collect()
  },
})

/**
 * Get recent matches for a profile (for weekly digest)
 */
export const getRecentMatches = internalQuery({
  args: {
    profileId: v.id('profiles'),
    since: v.number(),
  },
  handler: async (ctx, { profileId, since }) => {
    const matches = await ctx.db
      .query('matches')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()

    // Filter to matches computed after the since timestamp
    return matches.filter((m) => m.computedAt >= since)
  },
})

/**
 * Get opportunity by ID
 */
export const getOpportunity = internalQuery({
  args: { opportunityId: v.id('opportunities') },
  handler: async (ctx, { opportunityId }) => {
    return await ctx.db.get('opportunities', opportunityId)
  },
})

// ===== Event Digest Email Functions =====

/**
 * Send an event digest email
 * Called by the event digest batch actions
 */
export const sendEventDigest = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, { to, subject, html }) => {
    await resend.sendEmail(ctx, {
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    })
  },
})

/**
 * Get users whose local time matches the target hour for daily event digest
 * Uses direct ctx.db.get with Id cast instead of full-table-scan filter
 */
export const getUsersForDailyEventDigestBatch = internalQuery({
  args: { targetLocalHour: v.number() },
  handler: async (ctx, { targetLocalHour }) => {
    const profiles = await ctx.db.query('profiles').collect()
    const now = new Date()
    type ProfileId = (typeof profiles)[0]['_id']
    type OrgId = NonNullable<
      (typeof profiles)[0]['eventNotificationPreferences']
    >['mutedOrgIds'] extends Array<infer T> | undefined
      ? T
      : never

    // Pass 1: Filter eligible profiles (daily frequency + correct timezone hour)
    const eligible = profiles.filter((profile) => {
      if (profile.eventNotificationPreferences?.frequency !== 'daily')
        return false
      const timezone = profile.notificationPreferences?.timezone || 'UTC'
      const userLocalTime = toZonedTime(now, timezone)
      const userLocalHour = userLocalTime.getHours()
      return userLocalHour === targetLocalHour
    })

    // Pass 2: Batch fetch users with direct ID access
    const users = await Promise.all(
      eligible.map((p) => ctx.db.get('users', p.userId as Id<'users'>)),
    )

    log('info', 'getUsersForDailyEventDigestBatch', {
      totalProfiles: profiles.length,
      eligible: eligible.length,
      batchedUserReads: eligible.length,
    })

    // Pass 3: Build result
    const usersToNotify: Array<{
      userId: string
      email: string
      timezone: string
      profileId: ProfileId
      userName: string
      mutedOrgIds: Array<OrgId>
    }> = []

    for (let i = 0; i < eligible.length; i++) {
      const user = users[i]
      const profile = eligible[i]
      if (user?.email) {
        usersToNotify.push({
          userId: profile.userId,
          email: user.email,
          timezone: profile.notificationPreferences?.timezone || 'UTC',
          profileId: profile._id,
          userName: profile.name || 'there',
          mutedOrgIds: profile.eventNotificationPreferences!.mutedOrgIds || [],
        })
      }
    }
    return usersToNotify
  },
})

/**
 * Get users with weekly event digest enabled
 * Uses direct ctx.db.get with Id cast instead of full-table-scan filter
 */
export const getUsersForWeeklyEventDigestBatch = internalQuery({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query('profiles').collect()
    type ProfileId = (typeof profiles)[0]['_id']
    type OrgId = NonNullable<
      (typeof profiles)[0]['eventNotificationPreferences']
    >['mutedOrgIds'] extends Array<infer T> | undefined
      ? T
      : never

    // Pass 1: Filter eligible profiles (weekly frequency)
    const eligible = profiles.filter(
      (profile) => profile.eventNotificationPreferences?.frequency === 'weekly',
    )

    // Pass 2: Batch fetch users with direct ID access
    const users = await Promise.all(
      eligible.map((p) => ctx.db.get('users', p.userId as Id<'users'>)),
    )

    log('info', 'getUsersForWeeklyEventDigestBatch', {
      totalProfiles: profiles.length,
      eligible: eligible.length,
      batchedUserReads: eligible.length,
    })

    // Pass 3: Build result
    const usersToNotify: Array<{
      userId: string
      email: string
      profileId: ProfileId
      userName: string
      mutedOrgIds: Array<OrgId>
    }> = []

    for (let i = 0; i < eligible.length; i++) {
      const user = users[i]
      const profile = eligible[i]
      if (user?.email) {
        usersToNotify.push({
          userId: profile.userId,
          email: user.email,
          profileId: profile._id,
          userName: profile.name || 'there',
          mutedOrgIds: profile.eventNotificationPreferences!.mutedOrgIds || [],
        })
      }
    }
    return usersToNotify
  },
})

/**
 * Get upcoming events for a user from their org memberships
 * Excludes muted orgs
 */
export const getUpcomingEventsForUser = internalQuery({
  args: {
    userId: v.string(),
    mutedOrgIds: v.array(v.id('organizations')),
    since: v.number(),
  },
  handler: async (ctx, { userId, mutedOrgIds, since }) => {
    // Get user's org memberships
    const memberships = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const orgIds = memberships
      .map((m) => m.orgId)
      .filter((id) => !mutedOrgIds.includes(id))

    // Get upcoming events from user's (non-muted) orgs
    const events: Array<{
      title: string
      orgName: string
      startAt: number
      location?: string
      isVirtual: boolean
      url: string
      description?: string
    }> = []

    for (const orgId of orgIds) {
      const org = await ctx.db.get('organizations', orgId)
      if (!org) continue

      const orgEvents = await ctx.db
        .query('events')
        .withIndex('by_org_start', (q) =>
          q.eq('orgId', orgId).gt('startAt', since),
        )
        .take(10)

      for (const e of orgEvents) {
        events.push({
          title: e.title,
          orgName: org.name,
          startAt: e.startAt,
          location: e.location,
          isVirtual: e.isVirtual,
          url: e.url,
          description: e.description,
        })
      }
    }

    // Sort by start time and limit to 20
    return events.sort((a, b) => a.startAt - b.startAt).slice(0, 20)
  },
})
