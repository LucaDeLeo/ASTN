import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { auth } from "../auth";
import type { QueryCtx } from "../_generated/server";

/**
 * Get all organizations with at least one member
 * Used by engagement batch job to iterate through orgs
 */
export const getActiveOrgs = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all orgs
    const orgs = await ctx.db.query("organizations").collect();

    // Filter to orgs with at least one member
    const activeOrgs = await Promise.all(
      orgs.map(async (org) => {
        const memberCount = await ctx.db
          .query("orgMemberships")
          .withIndex("by_org", (q) => q.eq("orgId", org._id))
          .first();
        return memberCount ? org : null;
      })
    );

    return activeOrgs.filter((org): org is NonNullable<typeof org> => org !== null);
  },
});

/**
 * Get org members needing engagement computation
 * Returns members with profile and membership data for scoring
 */
export const getOrgMembersForEngagement = internalQuery({
  args: {
    orgId: v.id("organizations"),
    onlyStale: v.optional(v.boolean()), // Only return members with stale scores (>24h old)
  },
  handler: async (ctx, { orgId, onlyStale }) => {
    const now = Date.now();
    const staleThreshold = now - 24 * 60 * 60 * 1000; // 24 hours

    // Get all memberships for this org
    const memberships = await ctx.db
      .query("orgMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // For each member, get profile and optionally filter by stale scores
    const members = await Promise.all(
      memberships.map(async (membership) => {
        // Get profile
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", membership.userId))
          .first();

        // If filtering by stale, check existing engagement score
        if (onlyStale) {
          const existingScore = await ctx.db
            .query("memberEngagement")
            .withIndex("by_user_org", (q) =>
              q.eq("userId", membership.userId).eq("orgId", orgId)
            )
            .first();

          // Skip if score exists and is recent
          if (existingScore && existingScore.computedAt > staleThreshold) {
            return null;
          }
        }

        return {
          userId: membership.userId,
          membershipId: membership._id,
          joinedAt: membership.joinedAt,
          profileName: profile?.name || "Member",
          profileUpdatedAt: profile?.updatedAt,
        };
      })
    );

    return members.filter(
      (member): member is NonNullable<typeof member> => member !== null
    );
  },
});

/**
 * Get current member's engagement for an org
 * For user-facing display (shows user-friendly explanation)
 */
export const getMemberEngagement = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const engagement = await ctx.db
      .query("memberEngagement")
      .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
      .first();

    if (!engagement) return null;

    // For users, return the effective level (override or computed)
    // and the user-friendly explanation
    return {
      level: engagement.override?.level || engagement.level,
      explanation: engagement.userExplanation,
      computedAt: engagement.computedAt,
      hasOverride: !!engagement.override,
    };
  },
});

// Helper: Require current user is an admin of the given org
async function requireOrgAdmin(
  ctx: QueryCtx,
  orgId: Id<"organizations">
) {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const membership = await ctx.db
    .query("orgMemberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("orgId"), orgId))
    .first();

  if (!membership) {
    throw new Error("Not a member of this organization");
  }

  if (membership.role !== "admin") {
    throw new Error("Admin access required");
  }

  return membership;
}

/**
 * Get all engagement data for an organization (admin only)
 * For admin member directory - shows engagement for all members
 */
export const getOrgEngagementForAdmin = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await requireOrgAdmin(ctx, orgId);

    // Get all engagement records for this org
    const engagementRecords = await ctx.db
      .query("memberEngagement")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Return engagement data keyed by userId for easy lookup
    return engagementRecords.map((e) => ({
      _id: e._id,
      userId: e.userId,
      level: e.override?.level || e.level,
      computedLevel: e.level,
      adminExplanation: e.adminExplanation,
      hasOverride: !!e.override,
      overrideNotes: e.override?.notes,
    }));
  },
});

/**
 * Get engagement for a specific member (admin only)
 * For admin dashboard - shows full details including admin explanation
 */
export const getMemberEngagementForAdmin = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  handler: async (ctx, { orgId, userId }) => {
    await requireOrgAdmin(ctx, orgId);

    const engagement = await ctx.db
      .query("memberEngagement")
      .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
      .first();

    if (!engagement) return null;

    // For admins, return full details including override history
    const overrideHistory = await ctx.db
      .query("engagementOverrideHistory")
      .withIndex("by_engagement", (q) => q.eq("engagementId", engagement._id))
      .order("desc")
      .take(5);

    return {
      ...engagement,
      effectiveLevel: engagement.override?.level || engagement.level,
      overrideHistory,
    };
  },
});

/**
 * Get engagement for an existing memberEngagement record
 * Internal use for override operations
 */
export const getEngagementById = internalQuery({
  args: { engagementId: v.id("memberEngagement") },
  handler: async (ctx, { engagementId }) => {
    return await ctx.db.get("memberEngagement", engagementId);
  },
});

/**
 * Get org by ID (internal)
 */
export const getOrgById = internalQuery({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    return await ctx.db.get("organizations", orgId);
  },
});

/**
 * Get member engagement record (internal)
 */
export const getMemberEngagementInternal = internalQuery({
  args: {
    userId: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, { userId, orgId }) => {
    return await ctx.db
      .query("memberEngagement")
      .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
      .first();
  },
});

/**
 * Get attendance records for engagement computation
 * Returns attendance for a user in a specific org
 */
export const getAttendanceForEngagement = internalQuery({
  args: {
    userId: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, { userId, orgId }) => {
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .collect();

    return attendance.map((a) => ({
      status: a.status,
      respondedAt: a.respondedAt,
      createdAt: a.createdAt,
    }));
  },
});

/**
 * Get event views count for engagement computation
 * Counts event views as proxy for RSVPs/interest
 */
export const getEventViewsCount = internalQuery({
  args: {
    userId: v.string(),
    orgId: v.id("organizations"),
    since: v.number(),
  },
  handler: async (ctx, { userId, orgId, since }) => {
    // Get all event views for this user
    const eventViews = await ctx.db
      .query("eventViews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("viewedAt"), since))
      .collect();

    // Filter to views of events from this org
    let count = 0;
    for (const view of eventViews) {
      const event = await ctx.db.get("events", view.eventId);
      if (event && event.orgId === orgId) {
        count++;
      }
    }

    return count;
  },
});
