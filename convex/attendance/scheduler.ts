import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

const ONE_HOUR = 60 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

/**
 * Send attendance prompt notification
 * Called by scheduler after event ends or when snooze expires
 */
export const sendAttendancePrompt = internalMutation({
  args: {
    eventId: v.id("events"),
    userId: v.string(),
    promptNumber: v.optional(v.number()),
  },
  handler: async (ctx, { eventId, userId, promptNumber = 1 }) => {
    const event = await ctx.db.get(eventId);
    if (!event) return; // Event deleted

    const org = await ctx.db.get(event.orgId);

    // Check if user already recorded attendance
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .first();

    if (existingAttendance) return; // Already responded

    // Create in-app notification
    await ctx.db.insert("notifications", {
      userId,
      type: "attendance_prompt",
      eventId,
      orgId: event.orgId,
      title: "Did you attend?",
      body: `${event.title}${org ? ` - ${org.name}` : ""}`,
      actionUrl: event.url,
      read: false,
      createdAt: Date.now(),
      promptNumber,
    });

    // Remove from scheduledAttendancePrompts table after creating notification
    const scheduled = await ctx.db
      .query("scheduledAttendancePrompts")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .filter((q) => q.eq(q.field("promptNumber"), promptNumber))
      .first();

    if (scheduled) {
      await ctx.db.delete(scheduled._id);
    }
  },
});

/**
 * Schedule post-event attendance prompts
 * Called by cron every 10 minutes to check for recently ended events
 *
 * Queries events that ended in the last 10-20 minutes window to avoid duplicates.
 * For each user who viewed the event, schedules a prompt for 1 hour after event end.
 */
export const schedulePostEventPrompts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Query window: events that ended 10-20 minutes ago
    // This ensures we catch events only once per cron cycle
    const windowStart = now - 20 * 60 * 1000; // 20 minutes ago
    const windowEnd = now - TEN_MINUTES; // 10 minutes ago

    // Get all events to check (we need to filter by endAt)
    // Since we don't have an index on endAt, query by org and filter
    const allEvents = await ctx.db.query("events").collect();

    // Filter to events that ended in our window
    const endedEvents = allEvents.filter((event) => {
      // Default to startAt + 2 hours if endAt is missing
      const endAt = event.endAt ?? event.startAt + 2 * ONE_HOUR;
      return endAt >= windowStart && endAt < windowEnd;
    });

    for (const event of endedEvents) {
      // Get users who viewed this event
      const views = await ctx.db
        .query("eventViews")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();

      for (const view of views) {
        // Check if user has notifications enabled
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", view.userId))
          .first();

        // Skip if notifications disabled
        if (profile?.eventNotificationPreferences?.frequency === "none") {
          continue;
        }

        // Skip if attendance record already exists
        const existingAttendance = await ctx.db
          .query("attendance")
          .withIndex("by_user_event", (q) =>
            q.eq("userId", view.userId).eq("eventId", event._id)
          )
          .first();

        if (existingAttendance) continue;

        // Skip if already scheduled
        const existingScheduled = await ctx.db
          .query("scheduledAttendancePrompts")
          .withIndex("by_user_event", (q) =>
            q.eq("userId", view.userId).eq("eventId", event._id)
          )
          .first();

        if (existingScheduled) continue;

        // Schedule prompt for 1 hour after event end
        const endAt = event.endAt ?? event.startAt + 2 * ONE_HOUR;
        const promptTime = endAt + ONE_HOUR;

        const functionId = await ctx.scheduler.runAt(
          promptTime,
          internal.attendance.scheduler.sendAttendancePrompt,
          { eventId: event._id, userId: view.userId, promptNumber: 1 }
        );

        // Track in scheduledAttendancePrompts table
        await ctx.db.insert("scheduledAttendancePrompts", {
          eventId: event._id,
          userId: view.userId,
          scheduledFunctionId: functionId.toString(),
          scheduledFor: promptTime,
          promptNumber: 1,
        });
      }
    }
  },
});
