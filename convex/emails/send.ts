import { toZonedTime } from "date-fns-tz";
import { v } from "convex/values";
import { Resend } from "@convex-dev/resend";
import { internalMutation, internalQuery } from "../_generated/server";
import { components } from "../_generated/api";

// Initialize Resend component
// For production: set RESEND_API_KEY in Convex dashboard
// For local development: testMode prevents actual email sending
export const resend = new Resend(components.resend, {
  // testMode: process.env.NODE_ENV !== "production",
});

// From address for all ASTN emails
const FROM_ADDRESS = "ASTN <notifications@astn.ai>";

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
    });
  },
});

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
    });
  },
});

/**
 * Get users whose local time matches the target hour for match alerts
 * Used by the hourly cron to process timezone-aware email delivery
 */
export const getUsersForMatchAlertBatch = internalQuery({
  args: { targetLocalHour: v.number() },
  handler: async (ctx, { targetLocalHour }) => {
    // Get all profiles with match alerts enabled
    const profiles = await ctx.db.query("profiles").collect();

    const now = new Date();
    const usersToNotify: Array<{
      userId: string;
      email: string;
      timezone: string;
      profileId: typeof profiles[0]["_id"];
      userName: string;
    }> = [];

    for (const profile of profiles) {
      // Skip if no notification preferences or alerts disabled
      if (
        !profile.notificationPreferences ||
        !profile.notificationPreferences.matchAlerts.enabled
      ) {
        continue;
      }

      const timezone = profile.notificationPreferences.timezone || "UTC";

      // Get current hour in user's timezone
      const userLocalTime = toZonedTime(now, timezone);
      const userLocalHour = userLocalTime.getHours();

      // Check if it's the target hour in user's timezone
      if (userLocalHour === targetLocalHour) {
        // Get user email from auth table
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("_id"), profile.userId))
          .first();

        if (user?.email) {
          usersToNotify.push({
            userId: profile.userId,
            email: user.email,
            timezone,
            profileId: profile._id,
            userName: profile.name || "there",
          });
        }
      }
    }

    return usersToNotify;
  },
});

/**
 * Get users with weekly digest enabled
 */
export const getUsersForWeeklyDigestBatch = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all profiles with weekly digest enabled
    const profiles = await ctx.db.query("profiles").collect();

    const usersToNotify: Array<{
      userId: string;
      email: string;
      profileId: typeof profiles[0]["_id"];
      userName: string;
      completedSections: Array<string>;
      hasEnrichmentConversation: boolean;
    }> = [];

    for (const profile of profiles) {
      // Skip if no notification preferences or digest disabled
      if (
        !profile.notificationPreferences ||
        !profile.notificationPreferences.weeklyDigest.enabled
      ) {
        continue;
      }

      // Get user email from auth table
      const user = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("_id"), profile.userId))
        .first();

      if (user?.email) {
        usersToNotify.push({
          userId: profile.userId,
          email: user.email,
          profileId: profile._id,
          userName: profile.name || "there",
          completedSections: profile.completedSections || [],
          hasEnrichmentConversation: profile.hasEnrichmentConversation || false,
        });
      }
    }

    return usersToNotify;
  },
});

/**
 * Mark matches as no longer new (after alert email sent)
 */
export const markMatchesNotNew = internalMutation({
  args: {
    matchIds: v.array(v.id("matches")),
  },
  handler: async (ctx, { matchIds }) => {
    for (const matchId of matchIds) {
      await ctx.db.patch("matches", matchId, { isNew: false });
    }
  },
});

/**
 * Get new great-tier matches for a profile
 * Only "great" tier matches trigger alerts (per CONTEXT.md)
 */
export const getNewGreatMatches = internalQuery({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("matches")
      .withIndex("by_profile_tier", (q) =>
        q.eq("profileId", profileId).eq("tier", "great")
      )
      .filter((q) => q.eq(q.field("isNew"), true))
      .collect();
  },
});

/**
 * Get recent matches for a profile (for weekly digest)
 */
export const getRecentMatches = internalQuery({
  args: {
    profileId: v.id("profiles"),
    since: v.number(),
  },
  handler: async (ctx, { profileId, since }) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .collect();

    // Filter to matches computed after the since timestamp
    return matches.filter((m) => m.computedAt >= since);
  },
});

/**
 * Get opportunity by ID
 */
export const getOpportunity = internalQuery({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    return await ctx.db.get("opportunities", opportunityId);
  },
});
