import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

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

// Placeholder for schedulePostEventPrompts - will be completed in Task 3
export const schedulePostEventPrompts = internalMutation({
  args: {},
  handler: async () => {
    // Implementation in Task 3
  },
});
