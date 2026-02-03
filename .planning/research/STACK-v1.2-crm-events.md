# Technology Stack: v1.2 Org CRM, Events & Engagement

**Project:** ASTN v1.2 - Org CRM & Events
**Researched:** 2026-01-19
**Confidence:** HIGH (incremental additions to existing stack)

## Approach: Incremental Over New

v1.2 features build on the existing ASTN stack. This document focuses on **incremental additions only** - what's new or upgraded, not what's already working.

**Existing stack (confirmed from codebase):**

- Convex ^1.31.0 (backend, real-time)
- TanStack Start ^1.132.2 + React 19 (frontend)
- @convex-dev/auth ^0.0.90 (authentication)
- @convex-dev/resend ^0.2.3 (email via Resend)
- @anthropic-ai/sdk ^0.71.2 (Claude Sonnet 4.5 / Haiku 4.5)
- date-fns ^4.1.0 + date-fns-tz ^3.2.0 (date handling)
- shadcn/ui + Tailwind v4 + Radix UI (UI)
- algoliasearch ^5.46.3 (search - already installed)

## New Dependencies Required

### Core: Zero New npm Dependencies

The existing stack handles all v1.2 requirements:

| Requirement            | Existing Solution        | Notes                                              |
| ---------------------- | ------------------------ | -------------------------------------------------- |
| Event scheduling       | Convex scheduler + crons | Already using in crons.ts for sync & email batches |
| Date/time handling     | date-fns + date-fns-tz   | Already installed, handles timezone conversions    |
| Email notifications    | @convex-dev/resend       | Already integrated with batch patterns in emails/  |
| LLM engagement scoring | @anthropic-ai/sdk        | Same pattern as matching/compute.ts (Haiku 4.5)    |
| Real-time updates      | Convex subscriptions     | Core platform feature, used everywhere             |
| Search                 | Convex search indexes    | Already using for skillsTaxonomy, organizations    |

**Rationale:** Adding new dependencies introduces maintenance burden. The existing stack handles 100% of v1.2 requirements.

### Optional: rrule for Recurring Events

If recurring events become a requirement (not in initial scope):

| Library | Version | Purpose                   | Confidence |
| ------- | ------- | ------------------------- | ---------- |
| rrule   | ^2.8.1  | RFC 5545 recurrence rules | MEDIUM     |

```bash
# Only if recurring events needed later
bun add rrule
```

**Why rrule if needed:**

- De facto standard for JavaScript recurrence (1M+ weekly downloads)
- Implements RFC 5545 (iCalendar standard)
- Compatible with date-fns
- Used by FullCalendar and other major calendar libraries

**Why NOT for initial v1.2:**

- Project context indicates one-off local events initially
- Can add later without schema changes
- Keep scope minimal for pilot phase

## Schema Additions

New Convex tables for v1.2 (extends existing schema.ts):

### Events Table

```typescript
// convex/schema.ts addition
events: defineTable({
  orgId: v.id("organizations"),

  // Event details
  title: v.string(),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  locationUrl: v.optional(v.string()), // Google Maps link, venue URL

  // Timing (follows existing pattern from opportunities.deadline)
  startTime: v.number(), // Unix timestamp
  endTime: v.number(),   // Unix timestamp
  timezone: v.string(),  // IANA timezone (same pattern as profiles)

  // Notifications configuration
  notifyBefore: v.optional(v.array(v.number())), // Minutes: [1440, 60] = 1 day + 1 hour

  // Status
  status: v.union(
    v.literal("draft"),
    v.literal("published"),
    v.literal("cancelled")
  ),

  // Metadata
  createdBy: v.id("orgMemberships"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_org", ["orgId"])
  .index("by_org_status", ["orgId", "status"])
  .index("by_start_time", ["startTime"]),
```

### Event Attendance Table

```typescript
eventAttendance: defineTable({
  eventId: v.id("events"),
  userId: v.string(),

  // RSVP status (pre-event)
  rsvpStatus: v.union(
    v.literal("going"),
    v.literal("maybe"),
    v.literal("not_going")
  ),
  rsvpAt: v.number(),

  // Attendance confirmation (post-event)
  attended: v.optional(v.boolean()), // null = not yet asked
  attendedConfirmedAt: v.optional(v.number()),

  // Optional feedback (post-attendance)
  feedback: v.optional(v.object({
    rating: v.optional(v.number()), // 1-5
    comment: v.optional(v.string()),
    submittedAt: v.number(),
  })),
})
  .index("by_event", ["eventId"])
  .index("by_user", ["userId"])
  .index("by_event_user", ["eventId", "userId"]),
```

### Engagement Scores Table

```typescript
engagementScores: defineTable({
  userId: v.string(),
  orgId: v.id("organizations"),

  // LLM-computed score
  score: v.number(), // 0-100 internal score
  level: v.union(
    v.literal("highly_engaged"),
    v.literal("engaged"),
    v.literal("moderately_engaged"),
    v.literal("low_engagement"),
    v.literal("inactive")
  ),

  // Admin override capability
  overrideLevel: v.optional(v.union(
    v.literal("highly_engaged"),
    v.literal("engaged"),
    v.literal("moderately_engaged"),
    v.literal("low_engagement"),
    v.literal("inactive")
  )),
  overrideReason: v.optional(v.string()),
  overrideBy: v.optional(v.id("orgMemberships")),
  overrideAt: v.optional(v.number()),

  // Computation metadata (follows matching pattern)
  computedAt: v.number(),
  modelVersion: v.string(),

  // Input signals for transparency
  signals: v.object({
    eventsAttended: v.number(),
    eventsRsvped: v.number(),
    totalOrgEvents: v.number(),
    profileCompleteness: v.number(), // 0-100
    lastActivityAt: v.number(),
    membershipDurationDays: v.number(),
  }),
})
  .index("by_user_org", ["userId", "orgId"])
  .index("by_org_level", ["orgId", "level"])
  .index("by_org", ["orgId"]),
```

### Notification Preferences Extension

```typescript
// Extend existing profiles.notificationPreferences
// Add to the existing v.object in schema.ts
notificationPreferences: v.optional(
  v.object({
    // EXISTING (unchanged)
    matchAlerts: v.object({ enabled: v.boolean() }),
    weeklyDigest: v.object({ enabled: v.boolean() }),
    timezone: v.string(),

    // NEW for v1.2
    eventReminders: v.optional(v.object({
      enabled: v.boolean(),
      reminderTimes: v.array(v.number()), // Minutes before: [1440, 60]
    })),
    orgAnnouncements: v.optional(v.object({
      enabled: v.boolean(),
    })),
  })
),
```

## Patterns to Reuse

The existing codebase has established patterns that v1.2 should follow exactly.

### Pattern 1: LLM Scoring (from matching/compute.ts)

```typescript
// convex/engagement/compute.ts
'use node'

import { v } from 'convex/values'
import Anthropic from '@anthropic-ai/sdk'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

const MODEL_VERSION = 'claude-haiku-4-5-20251001' // Same as matching

export const computeEngagementForMember = internalAction({
  args: {
    userId: v.string(),
    orgId: v.id('organizations'),
  },
  handler: async (ctx, { userId, orgId }) => {
    // 1. Gather signals (same pattern as matching/queries.ts)
    const signals = await ctx.runQuery(
      internal.engagement.queries.getMemberSignals,
      { userId, orgId },
    )

    // 2. Build prompt and call Claude
    const anthropic = new Anthropic()
    const response = await anthropic.messages.create({
      model: MODEL_VERSION,
      max_tokens: 512,
      tools: [engagementScoringTool],
      tool_choice: { type: 'tool', name: 'score_engagement' },
      system: ENGAGEMENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildEngagementContext(signals) }],
    })

    // 3. Extract and save (same pattern as matching/mutations.ts)
    const toolUse = response.content.find((block) => block.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('No tool use in engagement response')
    }

    await ctx.runMutation(internal.engagement.mutations.saveScore, {
      userId,
      orgId,
      result: toolUse.input,
      signals,
      modelVersion: MODEL_VERSION,
    })
  },
})
```

### Pattern 2: Cron Jobs (from crons.ts)

```typescript
// Add to convex/crons.ts

// Send event reminders hourly (check for events starting in notification windows)
crons.hourly(
  'send-event-reminders',
  { minuteUTC: 30 },
  internal.events.notifications.processEventReminderBatch,
  {},
)

// Recompute engagement scores weekly (Sundays at midnight UTC)
crons.weekly(
  'recompute-engagement-scores',
  { dayOfWeek: 'sunday', hourUTC: 0, minuteUTC: 0 },
  internal.engagement.compute.recomputeAllScores,
  {},
)
```

### Pattern 3: Email Batching (from emails/batchActions.ts)

```typescript
// convex/events/notifications.ts
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

export const processEventReminderBatch = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get events starting within notification windows
    const upcomingEvents = await ctx.runQuery(
      internal.events.queries.getEventsNeedingReminders,
    )

    for (const event of upcomingEvents) {
      // Get users who RSVP'd and have reminders enabled
      const usersToNotify = await ctx.runQuery(
        internal.events.queries.getUsersToNotifyForEvent,
        { eventId: event._id },
      )

      for (const user of usersToNotify) {
        // Render and send email (same pattern as match alerts)
        const html = renderEventReminderEmail(event, user)
        await ctx.runMutation(internal.emails.send.sendEventReminder, {
          to: user.email,
          subject: `Reminder: ${event.title} starts soon`,
          html,
        })
      }
    }
  },
})
```

### Pattern 4: Scheduled Functions (for post-event follow-up)

```typescript
// When event is published, schedule post-event follow-up
await ctx.scheduler.runAt(
  event.endTime + 2 * 60 * 60 * 1000, // 2 hours after event ends
  internal.events.attendance.sendAttendanceConfirmationBatch,
  { eventId: event._id },
)
```

## What NOT to Add

### Avoid These Libraries

| Library                              | Why Not                            | Use Instead                              |
| ------------------------------------ | ---------------------------------- | ---------------------------------------- |
| FullCalendar                         | Overkill for simple event list     | shadcn/ui Card + date-fns formatting     |
| react-big-calendar                   | Heavy bundle, unnecessary features | Simple list/card UI                      |
| Dedicated CRM package                | Convex handles all data needs      | Convex queries + existing admin patterns |
| Push notifications (OneSignal, etc.) | Email sufficient for pilot         | @convex-dev/resend                       |
| dayjs or luxon                       | Already using date-fns             | date-fns + date-fns-tz                   |
| moment-timezone                      | Deprecated, date-fns-tz superior   | date-fns-tz                              |

### Avoid These Patterns

| Anti-Pattern                    | Why Avoid                   | Do This Instead                    |
| ------------------------------- | --------------------------- | ---------------------------------- |
| Client-side recurring expansion | Timezone bugs, performance  | Server-side if needed (with rrule) |
| Polling for event updates       | Wasteful, defeats Convex    | Use Convex real-time subscriptions |
| Storing engagement in profile   | Coupling, hard to recompute | Separate engagementScores table    |
| Complex notification queue      | Over-engineering            | Convex scheduler + crons directly  |
| Webhook-based integrations      | Unnecessary complexity      | Convex internal functions          |

## File Structure

Follow existing organization patterns:

```
convex/
  events/
    mutations.ts     # create, update, cancel events
    queries.ts       # list events, get event details
    notifications.ts # reminder batch processing
  engagement/
    compute.ts       # LLM scoring (internalAction with "use node")
    mutations.ts     # save scores, admin override
    queries.ts       # get signals, get scores
    prompts.ts       # engagement scoring prompt + tool definition
  orgs/
    admin.ts         # ADD: engagement views, event management permissions
    directory.ts     # ADD: engagement level display
```

## Environment Variables

**No new environment variables required.**

Existing configuration handles all v1.2 needs:

- `ANTHROPIC_API_KEY` - already set (used for matching, reused for engagement)
- `RESEND_API_KEY` - already set (used for match alerts, reused for event reminders)

## Migration Path

### Phase 1: Add Schema (No Dependencies)

```bash
# Just add new tables to convex/schema.ts
# Convex handles schema updates automatically on deploy
bun run dev:convex
```

### Phase 2: Build Features

```bash
# Create new files in convex/events/ and convex/engagement/
# Follow existing patterns exactly
# No npm installs needed
```

### Phase 3: If Recurring Events Needed Later

```bash
bun add rrule
# Add recurrence field to events table
# Expand occurrences server-side in queries
```

## Cost Implications

### LLM Costs (Engagement Scoring)

Using Haiku 4.5 (same as matching):

- ~100 members per org
- Weekly recomputation
- ~200 input tokens per member (signals context)
- ~100 output tokens per member (structured score)

**Estimated cost:**

- Per run: 100 members _ 300 tokens _ $0.00025/1K tokens = $0.0075
- Monthly (4 runs): ~$0.03 per org
- **Negligible addition to existing LLM costs**

### Email Costs

Event reminders via Resend:

- Assuming 2 events/week, 50 RSVPs each, 2 reminders
- 2 _ 50 _ 2 \* 4 weeks = 800 emails/month
- **Well within Resend free tier (3K/month)**

## Summary

**Zero new npm dependencies required for v1.2.**

| Need                | Solution                         | Source             |
| ------------------- | -------------------------------- | ------------------ |
| Events data         | New Convex table                 | convex/schema.ts   |
| Attendance tracking | New Convex table                 | convex/schema.ts   |
| Engagement scoring  | Claude Haiku + existing patterns | @anthropic-ai/sdk  |
| Event reminders     | Resend + crons                   | @convex-dev/resend |
| Real-time updates   | Convex subscriptions             | Built-in           |
| Search/filtering    | Convex indexes                   | Built-in           |
| Timezone handling   | date-fns-tz                      | Already installed  |

**Key principle:** The existing stack is production-proven for ASTN. v1.2 adds features by extending existing patterns, not introducing new tools.

## Sources

| Source                                  | Confidence | Used For                    |
| --------------------------------------- | ---------- | --------------------------- |
| ASTN codebase (package.json, schema.ts) | HIGH       | Existing stack verification |
| convex/matching/compute.ts              | HIGH       | LLM scoring pattern         |
| convex/crons.ts                         | HIGH       | Cron job pattern            |
| convex/emails/send.ts                   | HIGH       | Email sending pattern       |
| Convex Docs - Scheduled Functions       | HIGH       | Scheduler API               |
| Convex Docs - Cron Jobs                 | HIGH       | Cron configuration          |
| rrule npm package                       | HIGH       | Recurring events option     |
| date-fns documentation                  | HIGH       | Date handling verification  |
