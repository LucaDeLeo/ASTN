import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get current user's attendance history
 * Returns attendance records enriched with event and org details
 */
export const getMyAttendanceHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // Enrich with event and org details
    const enriched = await Promise.all(
      attendance.map(async (record) => {
        const event = await ctx.db.get("events", record.eventId);
        const org = await ctx.db.get("organizations", record.orgId);

        // Only return records where event exists (handles deleted events)
        if (!event) return null;

        return {
          ...record,
          event: {
            title: event.title,
            startAt: event.startAt,
            location: event.location,
            isVirtual: event.isVirtual,
          },
          org: org
            ? {
                name: org.name,
                logoUrl: org.logoUrl,
              }
            : null,
        };
      })
    );

    // Filter out null records (deleted events)
    return enriched.filter(
      (record): record is NonNullable<typeof record> => record !== null
    );
  },
});

/**
 * Get pending attendance prompts for current user
 * Returns unread attendance_prompt notifications enriched with event/org details
 */
export const getPendingPrompts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const prompts = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .filter((q) => q.eq(q.field("type"), "attendance_prompt"))
      .order("desc")
      .collect();

    // Enrich with event and org details
    const enriched = await Promise.all(
      prompts.map(async (prompt) => {
        if (!prompt.eventId) return null;

        const event = await ctx.db.get("events", prompt.eventId);
        if (!event) return null;

        const org = prompt.orgId ? await ctx.db.get("organizations", prompt.orgId) : null;

        return {
          ...prompt,
          event: {
            title: event.title,
            startAt: event.startAt,
            location: event.location,
            isVirtual: event.isVirtual,
          },
          org: org
            ? {
                name: org.name,
                logoUrl: org.logoUrl,
              }
            : null,
        };
      })
    );

    return enriched.filter(
      (prompt): prompt is NonNullable<typeof prompt> => prompt !== null
    );
  },
});

/**
 * Get attendance privacy defaults for current user
 * Returns the user's default privacy settings for attendance records
 */
export const getAttendancePrivacyDefaults = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Return defaults from profile, or system defaults if not set
    const defaults = profile?.privacySettings?.attendancePrivacyDefaults;
    return {
      showOnProfile: defaults?.showOnProfile ?? true,
      showToOtherOrgs: defaults?.showToOtherOrgs ?? false,
    };
  },
});

/**
 * Get attendance summary for current user
 * Returns total count, attended count, and last 3 attendance records
 */
export const getMyAttendanceSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Get all attendance records for counting
    const allAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get last 3 records for recent list
    const recentRecords = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(3);

    // Count attended (attended + partial)
    const attendedCount = allAttendance.filter(
      (r) => r.status === "attended" || r.status === "partial"
    ).length;

    // Enrich recent records with event and org details
    const recent = await Promise.all(
      recentRecords.map(async (record) => {
        const event = await ctx.db.get("events", record.eventId);
        const org = await ctx.db.get("organizations", record.orgId);

        if (!event) return null;

        return {
          _id: record._id,
          status: record.status,
          event: {
            title: event.title,
            startAt: event.startAt,
          },
          org: org
            ? {
                name: org.name,
              }
            : null,
        };
      })
    );

    return {
      total: allAttendance.length,
      attended: attendedCount,
      recent: recent.filter(
        (r): r is NonNullable<typeof r> => r !== null
      ),
    };
  },
});
