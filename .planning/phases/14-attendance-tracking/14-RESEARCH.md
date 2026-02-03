# Phase 14: Attendance Tracking - Research

**Researched:** 2026-01-19
**Domain:** Post-event attendance confirmation, feedback collection, scheduler patterns
**Confidence:** HIGH

## Summary

This phase implements post-event attendance tracking using ASTN's established scheduler patterns from Phase 13. The core flow is: event ends -> system schedules "Did you attend?" prompt -> user confirms (Yes/No/Partial) -> optional feedback form -> attendance recorded on profile.

The existing infrastructure handles everything needed:

- `ctx.scheduler.runAt()` for scheduling post-event prompts at `event.endAt + 1 hour`
- `scheduledReminders` table pattern for tracking/cancelling scheduled functions
- `notifications` table for in-app attendance prompts
- Existing NotificationList UI can be extended for interactive prompts

The primary technical challenges are:

1. Adding new notification types for attendance prompts (actionable, not just informational)
2. Building a simple star rating + text feedback component (no npm packages needed)
3. Implementing the snooze/defer logic (reschedule for next morning)
4. Privacy controls for attendance visibility

**Primary recommendation:** Extend the notifications system with actionable prompt types. Use the same scheduler pattern from Phase 13 for post-event timing. Build feedback UI inline with existing form patterns (no form builder needed for v1 - admin-configurable forms are future scope).

## Standard Stack

### Core (Already Installed)

| Library          | Version  | Purpose                                 | Why Standard                                 |
| ---------------- | -------- | --------------------------------------- | -------------------------------------------- |
| Convex scheduler | built-in | Schedule post-event prompts             | Already used for event reminders in Phase 13 |
| `date-fns`       | ^4.1.0   | Event end time calculations             | Already used throughout codebase             |
| `date-fns-tz`    | ^3.2.0   | Timezone-aware "next morning"           | Already used for email scheduling            |
| `lucide-react`   | ^0.562.0 | Star icons for rating, attendance icons | Already installed                            |
| `sonner`         | ^2.0.7   | Toast confirmations                     | Already configured                           |

### Supporting (Already Installed)

| Library                          | Version  | Purpose                    | When to Use                      |
| -------------------------------- | -------- | -------------------------- | -------------------------------- |
| `@radix-ui/react-popover`        | ^1.1.5   | Attendance prompt dropdown | Already used in NotificationBell |
| shadcn/ui Card, Button, Textarea | existing | Feedback form UI           | Already in component library     |

### No New Dependencies Required

Per prior decision: "Zero new npm dependencies - existing stack handles everything"

Star rating component will be built with lucide-react Star icons + Tailwind styling - no need for a rating library.

**Installation:**

```bash
# No installation needed - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure

```
convex/
├── attendance/
│   ├── mutations.ts        # NEW - recordAttendance, submitFeedback, snoozePrompt
│   ├── queries.ts          # NEW - getAttendanceHistory, getPendingPrompts
│   └── scheduler.ts        # NEW - schedulePostEventPrompt, sendAttendancePrompt
├── notifications/
│   ├── mutations.ts        # EXTEND - add dismissAttendancePrompt
│   └── queries.ts          # EXTEND - filter by notification type
└── schema.ts               # EXTEND - add attendance, feedbackForms tables

src/
├── components/
│   ├── attendance/
│   │   ├── AttendancePrompt.tsx    # NEW - Yes/No/Partial buttons + snooze
│   │   ├── FeedbackForm.tsx        # NEW - Star rating + text + skip
│   │   └── AttendanceHistory.tsx   # NEW - List of attended events
│   └── notifications/
│       └── NotificationList.tsx    # EXTEND - render AttendancePrompt for type
└── routes/
    └── profile/
        └── attendance.tsx          # NEW - Full attendance history page
```

### Pattern 1: Post-Event Prompt Scheduling

**What:** Schedule "Did you attend?" notification 1 hour after event ends
**When to use:** When an event ends for any user who was notified about it
**Example:**

```typescript
// Source: Existing pattern in convex/notifications/scheduler.ts
export const schedulePostEventPrompt = internalMutation({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get('events', eventId)
    if (!event) return

    // Calculate prompt time: 1 hour after event ends
    const endAt = event.endAt ?? event.startAt + 2 * 60 * 60 * 1000 // Default 2hr duration
    const promptTime = endAt + 60 * 60 * 1000 // 1 hour after end

    // Get users who viewed this event (same audience as reminders)
    const views = await ctx.db
      .query('eventViews')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .collect()

    for (const view of views) {
      // Check if user has notifications enabled
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', view.userId))
        .first()

      if (profile?.eventNotificationPreferences?.frequency === 'none') continue

      // Schedule the prompt
      const functionId = await ctx.scheduler.runAt(
        promptTime,
        internal.attendance.scheduler.sendAttendancePrompt,
        { eventId, userId: view.userId },
      )

      // Track for cancellation
      await ctx.db.insert('scheduledAttendancePrompts', {
        eventId,
        userId: view.userId,
        scheduledFunctionId: functionId.toString(),
        scheduledFor: promptTime,
        promptNumber: 1, // First prompt
      })
    }
  },
})
```

### Pattern 2: Actionable Notification with Response Options

**What:** Notification that presents Yes/No/Partial/Snooze buttons instead of just showing info
**When to use:** Attendance confirmation prompts
**Example:**

```typescript
// Schema extension - add attendance_prompt type
notifications: defineTable({
  userId: v.string(),
  type: v.union(
    v.literal('event_new'),
    v.literal('event_reminder'),
    v.literal('event_updated'),
    v.literal('attendance_prompt'), // NEW
  ),
  eventId: v.optional(v.id('events')),
  orgId: v.optional(v.id('organizations')),
  title: v.string(),
  body: v.string(),
  actionUrl: v.optional(v.string()),
  read: v.boolean(),
  createdAt: v.number(),
  // NEW: For attendance prompts
  promptNumber: v.optional(v.number()), // 1 or 2
  respondedAt: v.optional(v.number()), // When user responded
})
```

### Pattern 3: Snooze to Next Morning (9 AM Local Time)

**What:** Reschedule attendance prompt to next morning when user clicks "Remind me later"
**When to use:** User wants to defer the attendance confirmation
**Example:**

```typescript
// Source: Timezone pattern from convex/emails/send.ts
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { setHours, setMinutes, addDays } from 'date-fns'

export const snoozeAttendancePrompt = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const notification = await ctx.db.get('notifications', notificationId)
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found')
    }

    // Get user's timezone
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    const timezone = profile?.notificationPreferences?.timezone || 'UTC'
    const now = new Date()

    // Calculate next morning 9 AM in user's timezone
    const localNow = toZonedTime(now, timezone)
    let nextMorning = setMinutes(setHours(localNow, 9), 0)

    // If it's already past 9 AM, schedule for tomorrow
    if (localNow >= nextMorning) {
      nextMorning = addDays(nextMorning, 1)
    }

    const scheduledTime = fromZonedTime(nextMorning, timezone).getTime()

    // Mark current notification as dismissed
    await ctx.db.patch('notifications', notificationId, { read: true })

    // Schedule follow-up prompt
    await ctx.scheduler.runAt(
      scheduledTime,
      internal.attendance.scheduler.sendAttendancePrompt,
      { eventId: notification.eventId!, userId, isFollowUp: true },
    )
  },
})
```

### Pattern 4: Simple Star Rating Component (No Library)

**What:** Interactive star rating using lucide-react Star icons
**When to use:** Event feedback form
**Example:**

```typescript
// Source: Common React pattern with lucide-react
import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 hover:scale-110 transition-transform"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          aria-checked={value >= star}
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              value >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-300 hover:text-yellow-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}
```

### Pattern 5: Attendance Record Schema

**What:** Store attendance confirmations with privacy controls
**When to use:** Recording user attendance responses
**Example:**

```typescript
// Schema addition
attendance: defineTable({
  userId: v.string(),
  eventId: v.id("events"),
  orgId: v.id("organizations"), // Denormalized for privacy queries

  // Response
  status: v.union(
    v.literal("attended"),     // Yes
    v.literal("partial"),      // Partial
    v.literal("not_attended"), // No
    v.literal("unknown")       // No response after 2 prompts
  ),
  respondedAt: v.optional(v.number()),

  // Feedback (optional)
  feedbackRating: v.optional(v.number()), // 1-5 stars
  feedbackText: v.optional(v.string()),
  feedbackSubmittedAt: v.optional(v.number()),

  // Privacy
  showOnProfile: v.boolean(), // User's choice for public visibility
  showToOtherOrgs: v.boolean(), // User's choice for cross-org visibility
  // Host org ALWAYS sees (implicit consent from attending)

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_event", ["eventId"])
  .index("by_org", ["orgId"])
  .index("by_user_status", ["userId", "status"]),
```

### Anti-Patterns to Avoid

- **Building a full form builder for v1:** Per CONTEXT.md, feedback forms are "admin-configurable with full form builder functionality" but this is complex. For v1, use a simple default form (star rating + text). Admin-configurable forms can be Phase 15+.
- **Sending prompts for events user didn't view:** Only prompt users in `eventViews` table, not all org members.
- **Multiple notification channels simultaneously:** Respect user's notification preferences (in-app only, email only, or both).
- **Allowing retroactive attendance marking beyond 2 weeks:** Per CONTEXT.md, limit to past 2 weeks only.
- **Storing attendance without org reference:** Always denormalize `orgId` for efficient privacy queries.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                       | Don't Build                | Use Instead                           | Why                           |
| ----------------------------- | -------------------------- | ------------------------------------- | ----------------------------- |
| Scheduling post-event prompts | Manual timeout/polling     | `ctx.scheduler.runAt()`               | Already working for reminders |
| Timezone-aware "next morning" | Manual offset math         | `date-fns-tz` (existing)              | Handles DST correctly         |
| Star rating UI                | Third-party rating library | Lucide Star + Tailwind                | 20 lines, no dependency       |
| Notification persistence      | Custom notification system | Extend existing `notifications` table | Pattern already proven        |
| Cancelling scheduled prompts  | Manual tracking            | `scheduledReminders` table pattern    | Already implemented           |

**Key insight:** Phase 13 already solved scheduling. This phase reuses that pattern with a different trigger (event end instead of event view) and different notification type (actionable prompt instead of informational).

## Common Pitfalls

### Pitfall 1: Event End Time Not Set

**What goes wrong:** Events without `endAt` cause undefined behavior for prompt scheduling
**Why it happens:** lu.ma API sometimes returns null for `end_at`
**How to avoid:**

- Default to `startAt + 2 hours` if `endAt` is missing
- Document this assumption in the code
  **Warning signs:** Prompts sent during events (too early)

### Pitfall 2: Duplicate Prompts After Snooze

**What goes wrong:** User gets multiple prompts for same event
**Why it happens:** Snooze creates new scheduled function without cancelling old tracking
**How to avoid:**

- Update `scheduledAttendancePrompts` table on snooze
- Use unique constraint on (userId, eventId) for attendance records
- Check for existing attendance before creating new prompt
  **Warning signs:** User reports receiving 3+ prompts for same event

### Pitfall 3: Multi-Day Event Prompt Timing

**What goes wrong:** Prompt fires after day 1 of a multi-day event
**Why it happens:** Using first `endAt` instead of final day
**How to avoid:**

- Per CONTEXT.md Claude's Discretion: prompt after final day for multi-day events
- Detect multi-day: `endAt - startAt > 24 hours`
- Use latest `endAt` for prompt scheduling
  **Warning signs:** Users asked about attendance mid-event

### Pitfall 4: Privacy Model Complexity

**What goes wrong:** Attendance visibility rules become inconsistent
**Why it happens:** Multiple privacy dimensions (profile, other users, other orgs)
**How to avoid:**

- Host org ALWAYS sees (no toggle)
- User controls profile visibility AND cross-org visibility as separate flags
- Store both flags in attendance record, not as derived values
  **Warning signs:** Privacy settings not saving, inconsistent visibility

### Pitfall 5: Feedback Skip Without Soft Nudge

**What goes wrong:** Users skip feedback too easily, org gets no data
**Why it happens:** Skip button equally prominent as submit
**How to avoid:**

- Per CONTEXT.md: "Soft nudge before allowing skip"
- First click shows "Are you sure you don't want to share feedback?"
- Second click confirms skip
  **Warning signs:** Very low feedback submission rates

## Code Examples

Verified patterns from official sources and existing codebase.

### Recording Attendance

```typescript
// convex/attendance/mutations.ts
import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const recordAttendance = mutation({
  args: {
    eventId: v.id('events'),
    status: v.union(
      v.literal('attended'),
      v.literal('partial'),
      v.literal('not_attended'),
    ),
    notificationId: v.optional(v.id('notifications')),
  },
  handler: async (ctx, { eventId, status, notificationId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const event = await ctx.db.get('events', eventId)
    if (!event) throw new Error('Event not found')

    // Check for existing attendance record
    const existing = await ctx.db
      .query('attendance')
      .withIndex('by_event', (q) => q.eq('eventId', eventId))
      .filter((q) => q.eq(q.field('userId'), userId))
      .first()

    if (existing) {
      // Update existing record
      await ctx.db.patch('attendance', existing._id, {
        status,
        respondedAt: Date.now(),
        updatedAt: Date.now(),
      })
    } else {
      // Create new record with default privacy settings
      await ctx.db.insert('attendance', {
        userId,
        eventId,
        orgId: event.orgId,
        status,
        respondedAt: Date.now(),
        showOnProfile: true, // Default to visible
        showToOtherOrgs: false, // Default to private from other orgs
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }

    // Mark the notification as read if provided
    if (notificationId) {
      const notification = await ctx.db.get('notifications', notificationId)
      if (notification && notification.userId === userId) {
        await ctx.db.patch('notifications', notificationId, {
          read: true,
          respondedAt: Date.now(),
        })
      }
    }

    // Return status to trigger feedback form for attended/partial
    return { status }
  },
})
```

### Attendance History Query

```typescript
// convex/attendance/queries.ts
import { v } from 'convex/values'
import { query } from '../_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const getMyAttendanceHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(limit)

    // Enrich with event and org details
    return Promise.all(
      attendance.map(async (record) => {
        const event = await ctx.db.get('events', record.eventId)
        const org = await ctx.db.get('organizations', record.orgId)
        return {
          ...record,
          event: event
            ? {
                title: event.title,
                startAt: event.startAt,
                location: event.location,
                isVirtual: event.isVirtual,
              }
            : null,
          org: org
            ? {
                name: org.name,
                logoUrl: org.logoUrl,
              }
            : null,
        }
      }),
    )
  },
})
```

### Attendance Prompt Component

```typescript
// src/components/attendance/AttendancePrompt.tsx
import { useState } from "react";
import { useMutation } from "convex/react";
import { CheckCircle, XCircle, MinusCircle, Clock } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { FeedbackForm } from "./FeedbackForm";
import type { Id } from "../../../convex/_generated/dataModel";

interface AttendancePromptProps {
  notificationId: Id<"notifications">;
  eventId: Id<"events">;
  eventTitle: string;
  orgName: string;
}

export function AttendancePrompt({
  notificationId,
  eventId,
  eventTitle,
  orgName,
}: AttendancePromptProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);

  const recordAttendance = useMutation(api.attendance.mutations.recordAttendance);
  const snoozePrompt = useMutation(api.attendance.mutations.snoozeAttendancePrompt);

  const handleResponse = async (
    status: "attended" | "partial" | "not_attended"
  ) => {
    const result = await recordAttendance({
      eventId,
      status,
      notificationId,
    });

    setAttendanceStatus(result.status);

    // Show feedback form for attended or partial
    if (status === "attended" || status === "partial") {
      setShowFeedback(true);
    }
  };

  const handleSnooze = async () => {
    await snoozePrompt({ notificationId });
  };

  if (showFeedback) {
    return (
      <FeedbackForm
        eventId={eventId}
        eventTitle={eventTitle}
        onComplete={() => setShowFeedback(false)}
      />
    );
  }

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <p className="font-medium text-slate-900 mb-1">Did you attend?</p>
      <p className="text-sm text-slate-500 mb-3">
        {eventTitle} - {orgName}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResponse("attended")}
          className="gap-1"
        >
          <CheckCircle className="size-4 text-green-600" />
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResponse("partial")}
          className="gap-1"
        >
          <MinusCircle className="size-4 text-amber-600" />
          Partial
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResponse("not_attended")}
          className="gap-1"
        >
          <XCircle className="size-4 text-slate-400" />
          No
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSnooze}
          className="gap-1 text-slate-500"
        >
          <Clock className="size-4" />
          Later
        </Button>
      </div>
    </div>
  );
}
```

### Feedback Form with Soft Nudge

```typescript
// src/components/attendance/FeedbackForm.tsx
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { StarRating } from "./StarRating";
import type { Id } from "../../../convex/_generated/dataModel";

interface FeedbackFormProps {
  eventId: Id<"events">;
  eventTitle: string;
  onComplete: () => void;
}

export function FeedbackForm({ eventId, eventTitle, onComplete }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = useMutation(api.attendance.mutations.submitFeedback);

  const handleSubmit = async () => {
    if (rating === 0) return; // Require rating

    setSubmitting(true);
    await submitFeedback({
      eventId,
      rating,
      text: text.trim() || undefined,
    });
    setSubmitting(false);
    onComplete();
  };

  const handleSkip = () => {
    if (!showSkipConfirm) {
      setShowSkipConfirm(true);
      return;
    }
    // Second click - actually skip
    onComplete();
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm">
      <p className="font-medium text-slate-900 mb-1">How was {eventTitle}?</p>
      <p className="text-sm text-slate-500 mb-4">
        Your feedback helps improve future events
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Rating
          </label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            Comments (optional)
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What did you think?"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
          <Button variant="ghost" onClick={handleSkip}>
            {showSkipConfirm ? "Yes, skip feedback" : "Skip"}
          </Button>
        </div>

        {showSkipConfirm && (
          <p className="text-sm text-amber-600">
            Are you sure you don&apos;t want to share feedback?
          </p>
        )}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach                         | Current Approach                | When Changed         | Impact                                |
| ------------------------------------ | ------------------------------- | -------------------- | ------------------------------------- |
| External cron for post-event actions | Convex scheduler per-event      | Phase 13 established | Precise timing, atomic with mutations |
| Separate feedback service            | Inline with attendance tracking | This phase           | Single flow, better UX                |
| Fixed notification types             | Polymorphic notifications       | This phase           | Actionable prompts in same system     |

**Deprecated/outdated:**

- Polling for "events that ended" - Use per-event scheduled functions instead
- Third-party star rating libraries - Simple implementation with lucide-react suffices

## Open Questions

Things that couldn't be fully resolved:

1. **Admin-Configurable Feedback Forms**
   - What we know: CONTEXT.md says "full form builder functionality" for feedback forms
   - What's unclear: Full form builder is significant scope (field types, validation, conditional logic)
   - Recommendation: v1 ships with default form (star rating + text). Form builder is v1.3 or later. Document this as future scope.

2. **Multi-Day Event Detection Threshold**
   - What we know: Need to prompt after final day, not each day
   - What's unclear: What duration qualifies as "multi-day"? (12 hours? 24 hours?)
   - Recommendation: Use 12-hour threshold. Events longer than 12 hours are treated as multi-day.

3. **Retroactive Attendance Marking Cutoff**
   - What we know: CONTEXT.md says "past 2 weeks only"
   - What's unclear: Is this a hard technical cutoff or soft UI guidance?
   - Recommendation: Hard cutoff - mutation rejects attempts to record attendance for events older than 14 days. Show message explaining why.

## Sources

### Primary (HIGH confidence)

- Existing codebase: `convex/notifications/scheduler.ts`, `convex/schema.ts`, `convex/crons.ts`
- Convex Scheduled Functions: https://docs.convex.dev/scheduling/scheduled-functions
- Phase 13 research and implementation (same scheduler patterns)

### Secondary (MEDIUM confidence)

- date-fns-tz documentation for timezone handling
- React star rating patterns (multiple sources agree on simple lucide-react approach)

### Tertiary (LOW confidence)

- Community patterns for actionable notifications (adapted from general notification center designs)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already installed, patterns established in Phase 13
- Architecture: HIGH - Directly extends Phase 13 scheduler pattern
- Pitfalls: HIGH - Based on Phase 13 learnings + CONTEXT.md explicit requirements
- Form builder deferral: MEDIUM - Assumption that v1 default form is acceptable

**Research date:** 2026-01-19
**Valid until:** 60 days (stable - reuses Phase 13 infrastructure)
