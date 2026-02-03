# Architecture Research: v1.2 Org CRM & Events

**Domain:** Org CRM, Events, Attendance Tracking, Engagement Scoring
**Researched:** 2026-01-19
**Confidence:** HIGH (builds on existing patterns)

## Executive Summary

v1.2 extends the existing ASTN architecture with three new domains: events, attendance tracking, and engagement scoring. The architecture follows established Convex patterns (queries/mutations for data, actions for LLM work, crons for scheduled tasks) while adding new tables and relationships that integrate cleanly with the existing org/membership model.

The key architectural insight: **engagement scoring is computed from observable behavior (event attendance, profile updates, platform activity), not self-reported data**. This makes the CRM self-maintaining - orgs see accurate engagement levels without asking members to fill out forms.

## System Overview

```
+------------------------------------------------------------------+
|                         CLIENT LAYER                              |
|  +------------------+  +------------------+  +------------------+ |
|  |   Member Portal  |  |   Org Dashboard  |  |   Event Pages    | |
|  | (existing)       |  | (CRM, engagement)|  | (new)            | |
|  +--------+---------+  +--------+---------+  +--------+---------+ |
+-----------|--------------------|----------------------|-----------+
            |                    |                      |
            v                    v                      v
+------------------------------------------------------------------+
|                     CONVEX DATA LAYER                             |
|  +------------------+  +------------------+  +------------------+ |
|  |  organizations   |  |     events       |  |  eventAttendance | |
|  |  orgMemberships  |  | (new table)      |  |  (new table)     | |
|  +------------------+  +------------------+  +------------------+ |
|  +------------------+  +------------------+  +------------------+ |
|  |  engagementLogs  |  | memberEngagement |  |   profiles       | |
|  |  (new table)     |  | (new table)      |  |   (existing)     | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
            |                    |                      |
+-----------v--------------------v----------------------v-----------+
|                       CONVEX ACTIONS                              |
|  +------------------+  +------------------+  +------------------+ |
|  | Event Notifier   |  | Attendance Check |  | Engagement Scorer| |
|  | (email/push)     |  | (cron, "attend?")| | (LLM-computed)   | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
```

## Schema Additions

### New Tables

```typescript
// convex/schema.ts additions

// Events created by org admins
events: defineTable({
  orgId: v.id("organizations"),

  // Event details
  title: v.string(),
  description: v.optional(v.string()),
  eventType: v.union(
    v.literal("meetup"),
    v.literal("workshop"),
    v.literal("talk"),
    v.literal("social"),
    v.literal("other")
  ),

  // Timing
  startTime: v.number(),  // Unix timestamp
  endTime: v.optional(v.number()),
  timezone: v.string(),   // IANA timezone

  // Location
  location: v.optional(v.string()),  // Physical address or "Online"
  isOnline: v.boolean(),
  virtualLink: v.optional(v.string()),  // Zoom/Meet link

  // Metadata
  createdBy: v.id("orgMemberships"),
  createdAt: v.number(),
  updatedAt: v.number(),
  status: v.union(
    v.literal("upcoming"),
    v.literal("past"),
    v.literal("cancelled")
  ),
})
  .index("by_org", ["orgId"])
  .index("by_org_status", ["orgId", "status"])
  .index("by_start_time", ["startTime"]),

// Event attendance records
eventAttendance: defineTable({
  eventId: v.id("events"),
  membershipId: v.id("orgMemberships"),
  userId: v.string(),  // Denormalized for profile queries

  // Attendance status
  rsvpStatus: v.union(
    v.literal("going"),
    v.literal("maybe"),
    v.literal("not_going"),
    v.literal("no_response")
  ),
  attended: v.optional(v.boolean()),  // Confirmed after event

  // Post-attendance
  attendanceConfirmedAt: v.optional(v.number()),
  feedbackSubmitted: v.optional(v.boolean()),
  feedbackText: v.optional(v.string()),
  feedbackRating: v.optional(v.number()),  // 1-5

  // Notification tracking
  attendancePromptSentAt: v.optional(v.number()),
  reminderSentAt: v.optional(v.number()),

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_event", ["eventId"])
  .index("by_membership", ["membershipId"])
  .index("by_user", ["userId"])
  .index("by_event_rsvp", ["eventId", "rsvpStatus"]),

// Activity log for engagement tracking
engagementLogs: defineTable({
  userId: v.string(),
  orgId: v.id("organizations"),
  membershipId: v.id("orgMemberships"),

  // Activity type
  activityType: v.union(
    v.literal("event_attended"),
    v.literal("event_rsvp"),
    v.literal("profile_updated"),
    v.literal("matches_viewed"),
    v.literal("joined_org"),
    v.literal("feedback_submitted")
  ),

  // Activity-specific data
  metadata: v.optional(v.object({
    eventId: v.optional(v.id("events")),
    eventTitle: v.optional(v.string()),
    profileSection: v.optional(v.string()),
    matchCount: v.optional(v.number()),
  })),

  timestamp: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_org", ["orgId"])
  .index("by_membership", ["membershipId"])
  .index("by_org_user", ["orgId", "userId"])
  .index("by_timestamp", ["timestamp"]),

// Computed engagement per member per org
memberEngagement: defineTable({
  membershipId: v.id("orgMemberships"),
  orgId: v.id("organizations"),
  userId: v.string(),

  // Engagement metrics (raw counts)
  eventsAttended30d: v.number(),
  eventsAttendedTotal: v.number(),
  lastEventAttended: v.optional(v.number()),
  profileUpdatedAt: v.optional(v.number()),
  lastActive: v.number(),

  // LLM-computed engagement level
  computedLevel: v.union(
    v.literal("highly_engaged"),
    v.literal("engaged"),
    v.literal("occasional"),
    v.literal("inactive")
  ),
  computedAt: v.number(),
  computedRationale: v.optional(v.string()),  // LLM explanation

  // Admin override
  adminOverrideLevel: v.optional(v.union(
    v.literal("highly_engaged"),
    v.literal("engaged"),
    v.literal("occasional"),
    v.literal("inactive")
  )),
  adminOverrideBy: v.optional(v.id("orgMemberships")),
  adminOverrideAt: v.optional(v.number()),
  adminOverrideReason: v.optional(v.string()),

  updatedAt: v.number(),
})
  .index("by_membership", ["membershipId"])
  .index("by_org", ["orgId"])
  .index("by_org_level", ["orgId", "computedLevel"]),
```

### Schema Additions to Existing Tables

```typescript
// Add to profiles table
profiles: defineTable({
  // ... existing fields ...

  // Event preferences (new)
  eventNotifications: v.optional(v.object({
    enabled: v.boolean(),
    frequency: v.union(
      v.literal("all"),      // Every event
      v.literal("weekly"),   // Weekly digest
      v.literal("none")      // Disabled
    ),
    reminderHours: v.optional(v.number()),  // Hours before event
  })),
}),

// Add to organizations table
organizations: defineTable({
  // ... existing fields ...

  // Org discovery (new)
  location: v.optional(v.string()),       // City/region
  coordinates: v.optional(v.object({
    lat: v.number(),
    lng: v.number(),
  })),
  isOnlineCommunity: v.optional(v.boolean()),
  description: v.optional(v.string()),
  website: v.optional(v.string()),
  discoverableInSearch: v.optional(v.boolean()),  // Default true
}),
```

## Component Boundaries

### Data Access Layer (Convex Functions)

| Component          | Responsibility                          | Files                                                            |
| ------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| Event CRUD         | Create, read, update, cancel events     | `convex/events/mutations.ts`, `convex/events/queries.ts`         |
| Attendance         | RSVP, attendance confirmation, feedback | `convex/attendance/mutations.ts`, `convex/attendance/queries.ts` |
| Engagement Logs    | Record activity, query history          | `convex/engagement/logs.ts`                                      |
| Engagement Scoring | LLM computation, admin override         | `convex/engagement/scoring.ts` (action)                          |
| Org Discovery      | Search, geography-based suggestions     | `convex/orgs/discovery.ts`                                       |

### UI Components

| Component           | Responsibility                  | Route                                |
| ------------------- | ------------------------------- | ------------------------------------ |
| Org Discovery       | Search, map, suggestions        | `/orgs` (new)                        |
| Event List          | Upcoming/past events for an org | `/org/$slug/events` (new)            |
| Event Detail        | Event info, RSVP, attendees     | `/org/$slug/events/$id` (new)        |
| Attendance Prompt   | "Did you attend?" modal         | Component in `/org/$slug/events`     |
| Org CRM Dashboard   | Member list with engagement     | `/org/$slug/admin` (extend existing) |
| Member Profile View | Attendance history on profile   | `/org/$slug/admin/members/$id` (new) |

### Background Jobs (Crons)

| Job                  | Schedule             | Responsibility                              |
| -------------------- | -------------------- | ------------------------------------------- |
| Event Reminders      | Hourly               | Send reminders to RSVPed members            |
| Attendance Prompts   | Daily at 10 AM local | Ask "Did you attend?" for past events       |
| Engagement Recompute | Daily at 3 AM UTC    | Recompute engagement scores for active orgs |
| Event Status Update  | Hourly               | Move events from "upcoming" to "past"       |

## Data Flow Diagrams

### Event Creation Flow

```
[Org Admin creates event]
       |
       v
[Convex mutation: events.create]
       |
       v
[Event stored in events table]
       |
       v (if notifications enabled)
[Schedule notification job]
       |
       v (at configured time)
[Convex action: sendEventNotification]
       |
       v
[Email sent via Resend to members with eventNotifications.enabled]
```

### Attendance Tracking Flow

```
[Event time passes]
       |
       v (cron job, next day 10 AM user local)
[Convex action: sendAttendancePrompt]
       |
       v
[Email/notification: "Did you attend [Event]?"]
       |
       v (user clicks)
[Landing page: /org/$slug/events/$id/attendance]
       |
       +---> [Yes] ---> [Feedback form]
       |                      |
       |                      v
       |               [Convex mutation: confirmAttendance]
       |                      |
       |                      v
       |               [engagementLogs entry created]
       |                      |
       |                      v
       |               [memberEngagement updated]
       |
       +---> [No] ---> [Convex mutation: markNotAttended]
       |
       +---> [Dismiss] ---> [No action, can respond later]
       |
       +---> [Remind Later] ---> [Schedule follow-up]
```

### Engagement Scoring Flow

```
[Daily cron: 3 AM UTC]
       |
       v
[Query orgs with active members]
       |
       v (for each org)
[Query engagementLogs for org members]
       |
       v
[Aggregate: events attended, profile updates, last active]
       |
       v
[Construct context for LLM]
       |
       v
[Claude Haiku 4.5: compute engagement level + rationale]
       |
       v
[Convex mutation: update memberEngagement]
       |
       v
[Real-time sync to org admin dashboard]
```

## Integration with Existing System

### What Stays the Same

- **Auth flow**: Uses existing @convex-dev/auth
- **Org membership model**: `orgMemberships` table unchanged, extended with engagement data
- **Profile model**: `profiles` table extended with event notification preferences
- **Email infrastructure**: Existing Resend integration via `convex/emails/send.ts`
- **Cron infrastructure**: Existing `convex/crons.ts` pattern
- **Admin auth helper**: Existing `requireOrgAdmin()` pattern in `convex/orgs/admin.ts`

### What Gets Extended

| Existing Component          | Extension                                                 |
| --------------------------- | --------------------------------------------------------- |
| `/org/$slug/admin`          | Add engagement tab, filter by engagement level            |
| `/org/$slug/admin/members`  | Add attendance history, engagement score display          |
| `getOrgStats` query         | Add event count, attendance rate, engagement distribution |
| `getAllMembersWithProfiles` | Add engagement data, last activity                        |
| Profile page                | Add event attendance history section (user's own orgs)    |
| Notification preferences    | Add event notification settings                           |

### What's New

| New Component        | Purpose                         |
| -------------------- | ------------------------------- |
| Events subsystem     | Full event lifecycle management |
| Attendance subsystem | Track confirmed attendance      |
| Engagement subsystem | Log activities, compute scores  |
| Org discovery        | Search, geography, suggestions  |

## LLM Integration for Engagement Scoring

### Why LLM (Not Just Rules)

Rule-based scoring (e.g., "attended 3+ events = highly engaged") is brittle:

- Doesn't account for event frequency (3 events in 6 months vs 3 events in 1 year)
- Doesn't weight recent activity higher
- Can't explain the reasoning to admins

LLM scoring provides:

- Contextual interpretation of activity patterns
- Natural language explanation for admins
- Easy to adjust by modifying the prompt (not code)

### Implementation Pattern

```typescript
// convex/engagement/scoring.ts
'use node'

import Anthropic from '@anthropic-ai/sdk'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

const ENGAGEMENT_PROMPT = `You are evaluating a community member's engagement level.

Given their activity data, classify them as:
- highly_engaged: Regular event attendance, active profile, consistent participation
- engaged: Attends events periodically, keeps profile reasonably current
- occasional: Rare participation, may have joined but not active
- inactive: No recent activity, profile possibly stale

Activity data:
{activityContext}

Respond with JSON:
{
  "level": "highly_engaged" | "engaged" | "occasional" | "inactive",
  "rationale": "Brief explanation for admins (1-2 sentences)"
}`

export const computeEngagementForMember = internalAction({
  args: { membershipId: v.id('orgMemberships') },
  handler: async (ctx, { membershipId }) => {
    // 1. Get activity data
    const activities = await ctx.runQuery(
      internal.engagement.logs.getRecentActivities,
      { membershipId, days: 90 },
    )

    // 2. Build context
    const context = buildActivityContext(activities)

    // 3. Call Claude Haiku (fast, cheap)
    const anthropic = new Anthropic()
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: ENGAGEMENT_PROMPT.replace('{activityContext}', context),
        },
      ],
    })

    // 4. Parse and store
    const result = JSON.parse(response.content[0].text)
    await ctx.runMutation(internal.engagement.mutations.updateEngagement, {
      membershipId,
      computedLevel: result.level,
      computedRationale: result.rationale,
    })
  },
})
```

### Admin Override Pattern

Admins can override the LLM score when they have context the system doesn't:

- "This person is highly engaged offline but doesn't use the platform"
- "This person is temporarily inactive due to personal circumstances"

```typescript
export const setEngagementOverride = mutation({
  args: {
    membershipId: v.id('orgMemberships'),
    level: engagementLevelValidator,
    reason: v.string(),
  },
  handler: async (ctx, { membershipId, level, reason }) => {
    const adminMembership = await requireOrgAdmin(ctx, orgId)

    await ctx.db.patch(memberEngagementId, {
      adminOverrideLevel: level,
      adminOverrideBy: adminMembership._id,
      adminOverrideAt: Date.now(),
      adminOverrideReason: reason,
    })
  },
})
```

## Suggested Build Order

Based on dependencies between components:

### Phase 1: Org Discovery Foundation

**Dependencies:** Existing org tables
**Builds:** Searchable org list, geography fields

1. Add `location`, `coordinates`, `description`, `website`, `discoverableInSearch` to organizations table
2. Build org search query with full-text search
3. Build geography-based suggestions query (simple distance calculation)
4. Create `/orgs` route with search UI
5. Update org pages to show description, location

### Phase 2: Events Core

**Dependencies:** Phase 1 (orgs discoverable)
**Builds:** Event creation, listing, RSVP

1. Add `events` table
2. Build event CRUD mutations
3. Add event notification preferences to profiles
4. Create `/org/$slug/events` route (list)
5. Create `/org/$slug/events/new` route (admin create)
6. Create `/org/$slug/events/$id` route (detail)
7. Build RSVP mutation

### Phase 3: Event Notifications

**Dependencies:** Phase 2 (events exist)
**Builds:** Reminders, attendance prompts

1. Add `eventAttendance` table
2. Build event reminder cron job
3. Build event notification email templates
4. Build attendance prompt cron job
5. Create attendance confirmation UI

### Phase 4: Attendance Tracking

**Dependencies:** Phase 3 (attendance prompts sent)
**Builds:** Confirmed attendance, feedback

1. Build attendance confirmation mutation
2. Build feedback submission UI
3. Add attendance history to member profile view
4. Create `/org/$slug/events/$id/attendance` landing page

### Phase 5: Engagement Scoring

**Dependencies:** Phase 4 (attendance data exists)
**Builds:** Activity logs, LLM scoring, admin override

1. Add `engagementLogs` table
2. Add `memberEngagement` table
3. Build activity logging (event attendance, profile updates)
4. Build engagement scoring action (LLM)
5. Build engagement recompute cron job
6. Add admin override mutation
7. Extend org admin dashboard with engagement view

### Phase 6: CRM Integration

**Dependencies:** Phase 5 (engagement data exists)
**Builds:** Full CRM view, exports

1. Extend `/org/$slug/admin/members` with engagement display
2. Add engagement filters to member list
3. Add engagement history timeline to member detail
4. Extend export to include engagement data
5. Add engagement distribution to org stats

## Scaling Considerations

| Scale                     | Considerations                                                                |
| ------------------------- | ----------------------------------------------------------------------------- |
| 1-5 orgs, <500 members    | Default architecture fine. Compute engagement on-demand.                      |
| 5-20 orgs, 500-2K members | Pre-compute engagement scores daily. Batch attendance prompts.                |
| 20+ orgs, 2K+ members     | Shard engagement computation by org. Consider engagement staleness tolerance. |

### Key Bottlenecks

1. **Engagement scoring LLM calls**: Mitigated by daily batch computation (not on-demand)
2. **Event notification fan-out**: Mitigated by batching by timezone
3. **Activity log volume**: Mitigated by keeping only 90-day rolling window for scoring

## Anti-Patterns to Avoid

### Anti-Pattern 1: Real-Time Engagement Scoring

**What to avoid:** Recompute engagement on every page load
**Why bad:** Expensive LLM calls, unnecessary (engagement doesn't change instantly)
**Instead:** Daily batch computation, serve from `memberEngagement` table

### Anti-Pattern 2: Storing All Activity Forever

**What to avoid:** Keep every activity log entry indefinitely
**Why bad:** Table grows unbounded, slows queries
**Instead:** Roll up old data, keep 90-day window for scoring, archive or delete older

### Anti-Pattern 3: Notification Spam

**What to avoid:** Send event notification for every event to every member
**Why bad:** Users unsubscribe, notification fatigue
**Instead:** Honor user preferences, batch into digests, respect frequency settings

### Anti-Pattern 4: Blocking Attendance on Feedback

**What to avoid:** Require feedback before marking attendance
**Why bad:** Reduces attendance confirmation rate
**Instead:** Feedback is optional, prompted but not required

### Anti-Pattern 5: Single Engagement Score Across Orgs

**What to avoid:** One engagement score per user
**Why bad:** User might be active in one org, inactive in another
**Instead:** Engagement is per-membership (user + org combination)

## Sources

### Convex Patterns

- Existing ASTN codebase patterns for org membership, auth, LLM actions
- Convex documentation for scheduled jobs and actions

### Event Management

- Standard event RSVP patterns from Meetup, Eventbrite, Luma
- Post-event feedback patterns from workshop platforms

### Engagement Scoring

- Community engagement scoring patterns from Discord, Slack
- LLM-based classification patterns from existing ASTN matching

---

_Architecture research for: ASTN v1.2 Org CRM & Events_
_Researched: 2026-01-19_
_Confidence: HIGH - builds on proven patterns in existing codebase_
