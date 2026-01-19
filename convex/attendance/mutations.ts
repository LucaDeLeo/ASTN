import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { setHours, setMinutes, addDays } from "date-fns";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

/**
 * Record user attendance at an event
 * Creates or updates attendance record (upsert by userId + eventId)
 */
export const recordAttendance = mutation({
  args: {
    eventId: v.id("events"),
    status: v.union(
      v.literal("attended"),
      v.literal("partial"),
      v.literal("not_attended")
    ),
    notificationId: v.optional(v.id("notifications")),
  },
  handler: async (ctx, { eventId, status, notificationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");

    // Check retroactive window (14 days)
    const eventEnd = event.endAt ?? event.startAt + 2 * 60 * 60 * 1000;
    if (Date.now() - eventEnd > FOURTEEN_DAYS) {
      throw new Error(
        "Cannot record attendance for events older than 2 weeks"
      );
    }

    // Check for existing attendance record
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        status,
        respondedAt: now,
        updatedAt: now,
      });
    } else {
      // Create new record with default privacy settings
      await ctx.db.insert("attendance", {
        userId,
        eventId,
        orgId: event.orgId,
        status,
        respondedAt: now,
        showOnProfile: true, // Default to visible on profile
        showToOtherOrgs: false, // Default to private from other orgs
        createdAt: now,
        updatedAt: now,
      });
    }

    // Mark the notification as read if provided
    if (notificationId) {
      const notification = await ctx.db.get(notificationId);
      if (notification && notification.userId === userId) {
        await ctx.db.patch(notificationId, {
          read: true,
          respondedAt: now,
        });
      }
    }

    // Return status to trigger feedback form for attended/partial
    return { status };
  },
});

/**
 * Submit feedback for an attended event
 * Updates existing attendance record with rating and optional text
 */
export const submitFeedback = mutation({
  args: {
    eventId: v.id("events"),
    rating: v.number(), // 1-5
    text: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, rating, text }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Find existing attendance record
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .first();

    if (!attendance) {
      throw new Error(
        "No attendance record found. Please confirm attendance first."
      );
    }

    const now = Date.now();

    await ctx.db.patch(attendance._id, {
      feedbackRating: rating,
      feedbackText: text,
      feedbackSubmittedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Snooze attendance prompt to next morning (9 AM user local time)
 * Marks current notification as read and schedules follow-up
 */
export const snoozeAttendancePrompt = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found");
    }

    if (notification.type !== "attendance_prompt") {
      throw new Error("Can only snooze attendance prompts");
    }

    // Don't schedule more prompts if already at prompt 2
    const currentPromptNumber = notification.promptNumber ?? 1;
    if (currentPromptNumber >= 2) {
      // Just mark as read, no more follow-ups
      await ctx.db.patch(notificationId, { read: true });
      return { snoozed: false, reason: "max_prompts_reached" };
    }

    // Get user's timezone from profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const timezone = profile?.notificationPreferences?.timezone || "UTC";
    const now = new Date();

    // Calculate next morning 9 AM in user's timezone
    const localNow = toZonedTime(now, timezone);
    let nextMorning = setMinutes(setHours(localNow, 9), 0);

    // If it's already past 9 AM, schedule for tomorrow
    if (localNow >= nextMorning) {
      nextMorning = addDays(nextMorning, 1);
    }

    const scheduledTime = fromZonedTime(nextMorning, timezone).getTime();

    // Mark current notification as read
    await ctx.db.patch(notificationId, { read: true });

    // Schedule follow-up prompt
    if (notification.eventId) {
      await ctx.scheduler.runAt(
        scheduledTime,
        internal.attendance.scheduler.sendAttendancePrompt,
        {
          eventId: notification.eventId,
          userId,
          promptNumber: currentPromptNumber + 1,
        }
      );
    }

    return { snoozed: true, scheduledFor: scheduledTime };
  },
});
