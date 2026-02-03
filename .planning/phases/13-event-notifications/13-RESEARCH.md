# Phase 13: Event Notifications - Research

**Researched:** 2026-01-19
**Domain:** Notification systems, scheduled jobs, email/in-app messaging
**Confidence:** HIGH

## Summary

This phase implements configurable event notifications leveraging ASTN's existing infrastructure. The codebase already has a robust email system using `@convex-dev/resend` with `@react-email/components`, timezone-aware cron scheduling via `convex/server` crons, and toast notifications via `sonner`. The existing `convex/emails/` module provides proven patterns for batch email processing.

The primary technical challenge is adding event-specific notification preferences to the schema and implementing efficient batching for digest emails. The in-app notification center (bell icon with persisted notifications) requires a new database table but uses existing UI patterns (shadcn/ui Popover + DropdownMenu).

**Primary recommendation:** Extend the existing email infrastructure with new event notification templates and add an `eventNotificationPreferences` field to profiles, plus a `notifications` table for in-app persistence. Use `ctx.scheduler.runAt()` for reminder scheduling.

## Standard Stack

The established libraries/tools for this domain are already installed in the project:

### Core (Already Installed)

| Library                   | Version  | Purpose                     | Why Standard                                                                          |
| ------------------------- | -------- | --------------------------- | ------------------------------------------------------------------------------------- |
| `@convex-dev/resend`      | ^0.2.3   | Email delivery via Resend   | Already configured, proven patterns in codebase                                       |
| `@react-email/components` | ^1.0.4   | Email templating with React | Already used for match alerts and weekly digest                                       |
| `@react-email/render`     | ^2.0.2   | Render React email to HTML  | Already imported in templates.tsx                                                     |
| `sonner`                  | ^2.0.7   | Toast notifications         | Already configured in `__root.tsx` with `<Toaster position="top-right" richColors />` |
| `date-fns`                | ^4.1.0   | Date formatting             | Already used for event date formatting                                                |
| `date-fns-tz`             | ^3.2.0   | Timezone handling           | Already used in email batch processing                                                |
| `convex/server` cronJobs  | built-in | Scheduled jobs              | Already configured for match alerts and weekly digest                                 |

### Supporting (Already Installed)

| Library                         | Version  | Purpose                      | When to Use                   |
| ------------------------------- | -------- | ---------------------------- | ----------------------------- |
| `lucide-react`                  | ^0.562.0 | Icons (Bell, Calendar, etc.) | UI components                 |
| `@radix-ui/react-dropdown-menu` | ^2.1.16  | Notification dropdown        | Bell icon notification center |

### No New Dependencies Required

Per CONTEXT.md decision: "Zero new npm dependencies - existing stack handles everything"

**Installation:**

```bash
# No installation needed - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure

```
convex/
├── emails/
│   ├── send.ts                    # Existing - add event email mutations
│   ├── batchActions.ts            # Existing - add event digest processing
│   └── templates.tsx              # Existing - add EventDigestEmail, EventReminderEmail
├── notifications/
│   ├── mutations.ts               # NEW - create/mark-read in-app notifications
│   ├── queries.ts                 # NEW - get user notifications, unread count
│   └── scheduler.ts               # NEW - schedule reminders via ctx.scheduler
└── schema.ts                      # Add eventNotificationPreferences, notifications table

src/
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.tsx   # NEW - Bell icon with unread badge
│   │   └── NotificationList.tsx   # NEW - Dropdown list of notifications
│   └── settings/
│       └── EventNotificationPrefsForm.tsx  # NEW - Event notification settings
```

### Pattern 1: Schema Extension for Event Notifications

**What:** Add event notification preferences to profiles schema
**When to use:** User preference storage
**Example:**

```typescript
// Source: Existing notificationPreferences pattern in schema.ts
eventNotificationPreferences: v.optional(
  v.object({
    frequency: v.union(
      v.literal('all'),
      v.literal('daily'),
      v.literal('weekly'),
      v.literal('none'),
    ),
    eventTypes: v.optional(v.array(v.string())), // Filter by event type
    reminderTiming: v.optional(
      v.object({
        oneWeekBefore: v.boolean(),
        oneDayBefore: v.boolean(),
        oneHourBefore: v.boolean(),
      }),
    ),
    mutedOrgIds: v.optional(v.array(v.id('organizations'))), // Per-org muting
  }),
)
```

### Pattern 2: In-App Notifications Table

**What:** Store persisted notifications for bell icon dropdown
**When to use:** Notifications that persist beyond toast dismissal
**Example:**

```typescript
// Source: Standard pattern for notification systems
notifications: defineTable({
  userId: v.string(),
  type: v.union(
    v.literal('event_new'),
    v.literal('event_reminder'),
    v.literal('event_updated'),
  ),
  eventId: v.optional(v.id('events')),
  orgId: v.optional(v.id('organizations')),
  title: v.string(),
  body: v.string(),
  actionUrl: v.optional(v.string()),
  read: v.boolean(),
  createdAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_read', ['userId', 'read'])
```

### Pattern 3: Scheduled Reminders with ctx.scheduler

**What:** Schedule reminder notifications at specific times before events
**When to use:** Event reminders (1 week, 1 day, 1 hour before)
**Example:**

```typescript
// Source: https://docs.convex.dev/scheduling/scheduled-functions
export const scheduleEventReminders = mutation({
  args: { eventId: v.id('events'), userId: v.string() },
  handler: async (ctx, { eventId, userId }) => {
    const event = await ctx.db.get('events', eventId)
    if (!event) return

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    const prefs = profile?.eventNotificationPreferences?.reminderTiming
    if (!prefs) return

    const now = Date.now()
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000
    const ONE_DAY = 24 * 60 * 60 * 1000
    const ONE_HOUR = 60 * 60 * 1000

    // Schedule 1 week before
    if (prefs.oneWeekBefore && event.startAt - ONE_WEEK > now) {
      await ctx.scheduler.runAt(
        event.startAt - ONE_WEEK,
        internal.notifications.scheduler.sendReminder,
        { eventId, userId, timing: '1_week' },
      )
    }

    // Schedule 1 day before
    if (prefs.oneDayBefore && event.startAt - ONE_DAY > now) {
      await ctx.scheduler.runAt(
        event.startAt - ONE_DAY,
        internal.notifications.scheduler.sendReminder,
        { eventId, userId, timing: '1_day' },
      )
    }

    // Schedule 1 hour before
    if (prefs.oneHourBefore && event.startAt - ONE_HOUR > now) {
      await ctx.scheduler.runAt(
        event.startAt - ONE_HOUR,
        internal.notifications.scheduler.sendReminder,
        { eventId, userId, timing: '1_hour' },
      )
    }
  },
})
```

### Pattern 4: Notification Bell Component

**What:** Bell icon with unread count badge and dropdown
**When to use:** Header navigation for in-app notifications
**Example:**

```typescript
// Source: shadcn/ui Popover + existing Button patterns
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Button } from "~/components/ui/button";

export function NotificationBell() {
  const unreadCount = useQuery(api.notifications.queries.getUnreadCount);
  const notifications = useQuery(api.notifications.queries.getRecent, { limit: 10 });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <NotificationList notifications={notifications} />
      </PopoverContent>
    </Popover>
  );
}
```

### Pattern 5: Batch Email Processing (Existing Pattern)

**What:** Process digest emails in batches to avoid timeouts
**When to use:** Daily/weekly digest sending
**Example:**

```typescript
// Source: convex/emails/batchActions.ts (existing pattern)
const BATCH_SIZE = 10;

for (let i = 0; i < users.length; i += BATCH_SIZE) {
  const batch = users.slice(i, i + BATCH_SIZE);

  for (const user of batch) {
    // Process each user's notifications
    const events = await getEventsForDigest(ctx, user, since);
    if (events.length === 0) continue;

    const emailContent = await renderEventDigest({ ... });
    await ctx.runMutation(internal.emails.send.sendEventDigest, {
      to: user.email,
      subject: `Your ${frequency} event digest`,
      html: emailContent,
    });
  }
}
```

### Anti-Patterns to Avoid

- **Sending immediately on "All" frequency:** Always apply rate limiting (max 5 per hour per user) to prevent notification fatigue
- **Fetching events individually:** Batch-fetch events for all users in a digest run, don't query per-user
- **Blocking UI on notification writes:** Use fire-and-forget pattern for creating in-app notifications
- **Scheduling reminders without cancellation tracking:** Store scheduled function IDs to cancel if event is deleted/changed

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem             | Don't Build               | Use Instead                       | Why                                             |
| ------------------- | ------------------------- | --------------------------------- | ----------------------------------------------- |
| Email templating    | Raw HTML strings          | `@react-email/components`         | Already configured, type-safe, Tailwind support |
| Toast notifications | Custom toast system       | `sonner` (already installed)      | Already configured in `__root.tsx`              |
| Timezone handling   | Manual UTC offset math    | `date-fns-tz` (already installed) | Handles DST, IANA timezones properly            |
| Scheduled jobs      | Manual setTimeout/polling | `ctx.scheduler.runAt()`           | Atomic with mutations, survives restarts        |
| Cron jobs           | External cron service     | `convex/server` cronJobs          | Already working for match alerts                |
| Email delivery      | SMTP configuration        | `@convex-dev/resend`              | Already configured with idempotency             |
| Batch processing    | Custom queue              | Convex action with batch loops    | Pattern already proven in batchActions.ts       |

**Key insight:** The codebase already has working email + scheduling infrastructure. This phase extends existing patterns rather than building new foundations.

## Common Pitfalls

### Pitfall 1: Notification Fatigue from "All" Frequency

**What goes wrong:** Users enabling "All" get spammed when orgs create many events
**Why it happens:** No rate limiting on immediate notifications
**How to avoid:**

- Implement per-user rate limiting: max 5 notifications per hour
- If limit exceeded, batch remaining into next hour
- Show in-app count but don't toast for every notification
  **Warning signs:** Users disabling notifications entirely, complaints about spam

### Pitfall 2: Duplicate Reminders After Event Reschedule

**What goes wrong:** Event time changes but old reminder still fires at wrong time
**Why it happens:** Scheduled functions weren't cancelled when event updated
**How to avoid:**

- Store scheduled function IDs in a tracking table
- On event update/delete, cancel all scheduled reminders
- Re-schedule with new times if event still active
  **Warning signs:** Users getting reminders for cancelled events, wrong timing

### Pitfall 3: Digest Email Timeout

**What goes wrong:** Processing many users in weekly digest causes action timeout
**Why it happens:** Convex actions have 10-minute timeout limit
**How to avoid:**

- Use BATCH_SIZE = 10 (already established pattern)
- For very large user bases, chain multiple actions
- Consider fan-out pattern: schedule individual send actions
  **Warning signs:** Incomplete digest sends, action failures in logs

### Pitfall 4: Missing Event View Tracking for Reminders

**What goes wrong:** Can't send reminders to users who "viewed" an event
**Why it happens:** No tracking of which users viewed which events
**How to avoid:**

- Add `eventViews` table: `{ userId, eventId, viewedAt }`
- Record view on event detail page load
- Query this table when scheduling reminders
  **Warning signs:** Reminders only going to explicitly subscribed users

### Pitfall 5: Timezone Confusion in Digest Timing

**What goes wrong:** Daily digest arrives at wrong local time for users
**Why it happens:** Running single cron job without timezone awareness
**How to avoid:**

- Use existing pattern: hourly cron checks which timezones hit target hour
- See `getUsersForMatchAlertBatch` in `convex/emails/send.ts`
- Convert UTC to user timezone before comparison
  **Warning signs:** Users in wrong timezone getting digests at odd hours

## Code Examples

Verified patterns from official sources and existing codebase:

### Event Digest Email Template

```typescript
// Source: Existing pattern in convex/emails/templates.tsx
import {
  Body, Button, Container, Head, Hr, Html,
  Img, Preview, Section, Tailwind, Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import { format } from "date-fns";

interface EventDigestProps {
  userName: string;
  frequency: "daily" | "weekly";
  events: Array<{
    title: string;
    orgName: string;
    startAt: number;
    location?: string;
    isVirtual: boolean;
    url: string;
    description?: string;
  }>;
}

export function EventDigestEmail({ userName, frequency, events }: EventDigestProps) {
  // Group events by org (per Phase 12 pattern)
  const eventsByOrg = events.reduce((acc, event) => {
    if (!acc[event.orgName]) acc[event.orgName] = [];
    acc[event.orgName].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <Html>
      <Head />
      <Preview>Your {frequency} event digest from ASTN</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="bg-white mx-auto my-8 p-8 rounded-lg max-w-xl">
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              Hi {userName},
            </Text>
            <Text className="text-gray-600 mb-6">
              Here are upcoming events from your organizations:
            </Text>

            {Object.entries(eventsByOrg).map(([orgName, orgEvents]) => (
              <Section key={orgName} className="mb-6">
                <Text className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {orgName}
                </Text>
                {orgEvents.slice(0, 5).map((event, i) => (
                  <Section key={i} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <Text className="font-medium text-gray-900 mb-1">
                      {event.title}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-1">
                      {format(event.startAt, "EEE, MMM d 'at' h:mm a")}
                    </Text>
                    {event.description && (
                      <Text className="text-sm text-gray-500 mb-2">
                        {event.description.slice(0, 100)}...
                      </Text>
                    )}
                    <Button
                      href={event.url}
                      className="text-sm text-primary underline"
                    >
                      View event &amp; RSVP on lu.ma
                    </Button>
                  </Section>
                ))}
                {orgEvents.length > 5 && (
                  <Text className="text-sm text-gray-500">
                    +{orgEvents.length - 5} more events
                  </Text>
                )}
              </Section>
            ))}

            <Hr className="my-6 border-gray-200" />
            <Text className="text-xs text-gray-400 text-center">
              <a href="https://astn.ai/settings" className="text-gray-400">
                Manage notification preferences
              </a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export async function renderEventDigest(props: EventDigestProps): Promise<string> {
  return await render(<EventDigestEmail {...props} />);
}
```

### Cron Job for Daily Event Digest

```typescript
// Source: Existing crons.ts pattern
// Add to convex/crons.ts

// Run hourly to process daily digest for each timezone's target hour
// Target: 9 AM local time (reasonable morning hour)
crons.hourly(
  'send-daily-event-digest',
  { minuteUTC: 30 }, // Offset from match alerts at :00
  internal.emails.batchActions.processDailyEventDigestBatch,
  {},
)
```

### Toast Notification for New Events (In-App)

```typescript
// Source: Existing sonner usage pattern
import { toast } from 'sonner'

// When creating in-app notification, also show toast for immediate feedback
export function showEventNotificationToast(event: {
  title: string
  orgName: string
  url: string
}) {
  toast.success(`New event from ${event.orgName}`, {
    description: event.title,
    action: {
      label: 'View',
      onClick: () => window.open(event.url, '_blank'),
    },
    duration: 5000, // 5 seconds
  })
}
```

## State of the Art

| Old Approach                        | Current Approach               | When Changed      | Impact                                     |
| ----------------------------------- | ------------------------------ | ----------------- | ------------------------------------------ |
| Polling for notifications           | Convex real-time subscriptions | Native to Convex  | In-app notifications update instantly      |
| External email queue (SQS)          | `@convex-dev/resend` component | Convex components | Simpler architecture, idempotency built-in |
| Manual cron with external scheduler | `convex/server` cronJobs       | Native to Convex  | No infrastructure to manage                |

**Deprecated/outdated:**

- Direct Resend SDK usage: Use `@convex-dev/resend` wrapper for idempotency
- Node.js `setTimeout` for delayed tasks: Use `ctx.scheduler.runAt()` instead

## Open Questions

Things that couldn't be fully resolved:

1. **Event Type Taxonomy**
   - What we know: Lu.ma API provides event data but no standardized "type" field
   - What's unclear: Should we infer types (workshop, talk, social) from titles/descriptions or just skip type filtering for v1?
   - Recommendation: Skip type filtering for v1, add later based on user feedback. Use org-based filtering as primary dimension.

2. **Rate Limit Specifics for "All" Frequency**
   - What we know: Need to prevent spam, existing batching pattern works
   - What's unclear: Optimal rate (5/hour? 10/hour?) and whether to batch overflow or delay
   - Recommendation: Start with 5/hour, batch overflow into single "X more events" notification, tune based on usage data

3. **Reminder Audience Scope**
   - What we know: CONTEXT.md says "anyone who viewed the event"
   - What's unclear: How to track "viewed" without explicit opt-in - page view? time on page?
   - Recommendation: Track event detail page views with simple `eventViews` table, send reminders to all viewers

## Sources

### Primary (HIGH confidence)

- Existing codebase: `convex/emails/`, `convex/crons.ts`, `src/routes/__root.tsx` (Toaster)
- Convex Scheduled Functions: https://docs.convex.dev/scheduling/scheduled-functions
- @convex-dev/resend: https://www.convex.dev/components/resend
- sonner documentation: https://github.com/emilkowalski/sonner

### Secondary (MEDIUM confidence)

- React Email components: https://react.email/docs/introduction
- date-fns-tz: https://github.com/marnusw/date-fns-tz

### Tertiary (LOW confidence)

- Notification center UI patterns: Community examples (patterns verified against shadcn/ui)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already installed and working in codebase
- Architecture: HIGH - Extends proven patterns from existing email/cron infrastructure
- Pitfalls: HIGH - Based on existing batchActions.ts patterns and Convex documentation

**Research date:** 2026-01-19
**Valid until:** 60 days (stable - relies on existing infrastructure)
