# Phase 12: Event Management - Research

**Researched:** 2026-01-19
**Domain:** Lu.ma event integration, external calendar sync, event aggregation
**Confidence:** MEDIUM

## Summary

This phase implements event management via Lu.ma import integration. Based on CONTEXT.md decisions, the scope is constrained to:

1. **Import-only integration** - Orgs configure a lu.ma calendar URL; events are fetched via API
2. **Lu.ma embed widget** - For org event pages, embeds handle display and RSVP link-out
3. **Dashboard aggregation** - Custom rendering needed to aggregate events across multiple orgs
4. **Caching layer** - Daily cron sync + 1-hour cache on page load

The Lu.ma API requires a **Luma Plus subscription** ($20/month per calendar) for API access. This is a critical constraint - orgs without Luma Plus cannot have their events imported via API. The embed widget approach for org pages works without API keys (it's a client-side script), providing a fallback for orgs without Luma Plus.

**Primary recommendation:** Use lu.ma embed widget for org event pages (no API needed), and only use the lu.ma API for dashboard event aggregation where orgs have configured API keys.

## Standard Stack

Based on CONTEXT.md decisions and existing codebase patterns.

### Core

| Library            | Version  | Purpose                    | Why Standard                                  |
| ------------------ | -------- | -------------------------- | --------------------------------------------- |
| Convex actions     | existing | API calls to lu.ma         | Already used for 80K Hours, aisafety.com sync |
| Convex crons       | existing | Daily event sync           | Already configured for opportunity sync       |
| lu.ma embed script | N/A      | Embed widget for org pages | Official lu.ma integration, no API key needed |

### Supporting

| Library               | Version  | Purpose                      | When to Use                             |
| --------------------- | -------- | ---------------------------- | --------------------------------------- |
| @tanstack/react-query | existing | Cache management on frontend | Already in stack via Convex integration |
| date-fns              | existing | Date formatting/comparison   | Already used in codebase                |

### No New Dependencies Required

Per STATE.md decision: "Zero new npm dependencies - existing stack handles everything"

The lu.ma embed widget is loaded via external script tag, not npm package:

```html
<script id="luma-checkout" src="https://embed.lu.ma/checkout-button.js" />
```

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure

```
convex/
├── events/
│   ├── sync.ts           # Cron job to sync lu.ma events daily
│   ├── queries.ts        # Get events for org, dashboard aggregation
│   └── mutations.ts      # Upsert events from lu.ma API
src/
├── components/
│   └── events/
│       ├── LumaEmbed.tsx        # Embed widget wrapper for org pages
│       ├── EventCard.tsx        # Event card for dashboard display
│       └── EventCalendar.tsx    # Calendar view component (optional)
└── routes/
    └── org/$slug/
        └── events.tsx           # Org events page with embed + list toggle
```

### Pattern 1: Dual Display Strategy

**What:** Use lu.ma embed for org pages, custom rendering for dashboard
**When to use:** Always - this matches CONTEXT.md decisions

The lu.ma embed widget handles its own data fetching and RSVP flow. For the dashboard, we need to aggregate events from multiple orgs, requiring custom rendering from Convex-stored data.

**Org Page (embed approach):**

```typescript
// Source: https://help.lu.ma/p/embed-our-checkout-registration-button-on-your-website
function LumaEmbed({ calendarUrl }: { calendarUrl: string }) {
  return (
    <div>
      {/* Embed the full calendar page via iframe */}
      <iframe
        src={calendarUrl}
        className="w-full h-[600px] border-0 rounded-lg"
        allow="payment"
      />
    </div>
  );
}
```

**Dashboard (custom rendering from stored data):**

```typescript
function DashboardEvents({ events }: { events: Event[] }) {
  // Group by org, sort by date
  const grouped = groupBy(events, e => e.orgId);
  return (
    <div>
      {Object.entries(grouped).map(([orgId, orgEvents]) => (
        <section key={orgId}>
          <h3>{orgEvents[0].orgName} Events</h3>
          {orgEvents.map(event => <EventCard key={event._id} event={event} />)}
        </section>
      ))}
    </div>
  );
}
```

### Pattern 2: Cron + On-Demand Caching

**What:** Daily background sync + fresh fetch on page load with 1-hour cache
**When to use:** For dashboard event data

Based on existing opportunity sync pattern in `convex/aggregation/sync.ts`:

```typescript
// convex/events/sync.ts
'use node'
import { internalAction } from '../_generated/server'

export const syncOrgEvents = internalAction({
  args: { orgId: v.id('organizations') },
  handler: async (ctx, { orgId }) => {
    // Get org's lu.ma config
    const org = await ctx.runQuery(internal.orgs.queries.getOrgWithLumaConfig, {
      orgId,
    })
    if (!org?.lumaApiKey || !org?.lumaCalendarId) return

    // Fetch events from lu.ma API
    const events = await fetchLumaEvents(org.lumaApiKey, org.lumaCalendarId)

    // Upsert to Convex
    await ctx.runMutation(internal.events.mutations.upsertEvents, {
      orgId,
      events,
    })
  },
})
```

### Pattern 3: Schema Extension

**What:** Add lu.ma config to organizations table, create events table
**When to use:** Always - required for this phase

```typescript
// Schema additions
organizations: defineTable({
  // ... existing fields
  lumaCalendarUrl: v.optional(v.string()),   // e.g., "https://lu.ma/baish"
  lumaCalendarId: v.optional(v.string()),    // For API calls (if using API)
  lumaApiKey: v.optional(v.string()),        // Org's lu.ma API key (requires Luma Plus)
  eventsLastSynced: v.optional(v.number()),  // Timestamp of last sync
}),

events: defineTable({
  orgId: v.id("organizations"),
  lumaEventId: v.string(),          // lu.ma event ID (e.g., "evt-abc123")

  // Core fields from lu.ma API
  title: v.string(),
  description: v.optional(v.string()),
  startAt: v.number(),              // Unix timestamp
  endAt: v.optional(v.number()),    // Unix timestamp
  timezone: v.string(),             // IANA timezone
  coverUrl: v.optional(v.string()), // Event cover image
  url: v.string(),                  // lu.ma event URL for RSVP link-out

  // Location (can be virtual or physical)
  location: v.optional(v.string()), // Address or "Online"
  meetingUrl: v.optional(v.string()), // For virtual events

  // Metadata
  syncedAt: v.number(),
})
.index("by_org", ["orgId"])
.index("by_org_start", ["orgId", "startAt"])
.index("by_luma_id", ["lumaEventId"]),
```

### Anti-Patterns to Avoid

- **Custom RSVP tracking:** Per CONTEXT.md, RSVPs happen on lu.ma. Don't build in-app RSVP status.
- **Bi-directional sync:** This is deferred per CONTEXT.md. Only import from lu.ma, never create events in lu.ma from ASTN.
- **Polling lu.ma on every request:** Use caching. Daily cron + 1-hour cache on page load.
- **Requiring lu.ma API for embed:** The embed widget works without API keys - only dashboard aggregation needs API access.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                   | Don't Build           | Use Instead                     | Why                                                           |
| ------------------------- | --------------------- | ------------------------------- | ------------------------------------------------------------- |
| Event display on org page | Custom event cards    | lu.ma embed iframe              | Always current, handles RSVP, less maintenance                |
| Calendar view UI          | Custom calendar grid  | lu.ma embed OR simple list view | Calendar UIs are complex, list view sufficient per CONTEXT.md |
| Date/time formatting      | Manual string parsing | date-fns (existing)             | Timezone handling is error-prone                              |
| API key storage           | Plain text in env     | Convex encrypted secrets        | Security best practice                                        |

**Key insight:** The lu.ma embed handles the hard parts (event display, RSVP flow, timezone conversion). Only build custom rendering where aggregation across orgs is required (dashboard).

## Common Pitfalls

### Pitfall 1: Assuming All Orgs Have Lu.ma Plus

**What goes wrong:** Trying to use lu.ma API without checking subscription status
**Why it happens:** API requires Luma Plus ($20/month per calendar)
**How to avoid:**

- Embed widget works without API key (client-side)
- For dashboard aggregation, only fetch events from orgs with configured API keys
- Provide graceful fallback: "Visit [org name] page to see their events"
  **Warning signs:** 401/403 responses from lu.ma API

### Pitfall 2: Calendar ID vs Calendar URL Confusion

**What goes wrong:** Using the public URL slug where API expects calendar ID
**Why it happens:** lu.ma has both `lu.ma/calendar-slug` (public URL) and internal calendar IDs
**How to avoid:**

- Store both: `lumaCalendarUrl` (for embed) and `lumaCalendarId` (for API)
- Calendar URL is user-facing; API ID is from developer settings
  **Warning signs:** API returns "calendar not found" errors

### Pitfall 3: Rate Limit Exhaustion

**What goes wrong:** Hitting 429 Too Many Requests during sync
**Why it happens:** Lu.ma limits: 500 GET/5min, 100 POST/5min per calendar
**How to avoid:**

- Daily sync is well within limits
- Stagger syncs across orgs (don't sync all orgs simultaneously)
- Use pagination_limit to reduce requests
  **Warning signs:** 429 responses, 1-minute blocks

### Pitfall 4: Timezone Mishandling

**What goes wrong:** Events show wrong times for users in different timezones
**Why it happens:** Lu.ma returns ISO 8601 UTC, but events have local timezones
**How to avoid:**

- Store both raw timestamp AND timezone string
- Display using event's timezone, not user's timezone
- Use date-fns-tz or similar for formatting
  **Warning signs:** Events appear at wrong times, especially around DST transitions

### Pitfall 5: Stale Embed Cache

**What goes wrong:** lu.ma embed shows outdated events
**Why it happens:** Browser caching of iframe content
**How to avoid:**

- This is largely out of our control (lu.ma manages their embed)
- For critical freshness, add cache-bust query param: `?t=${Date.now()}`
  **Warning signs:** New events not appearing immediately

## Code Examples

Verified patterns from official sources and existing codebase.

### Fetching Events from Lu.ma API

```typescript
// Source: https://docs.luma.com/reference/get_v1-calendar-list-events
// convex/events/lumaClient.ts
'use node'

interface LumaEvent {
  api_id: string
  event: {
    id: string
    name: string
    start_at: string // ISO 8601
    end_at: string | null
    timezone: string
    description: string | null
    description_md: string | null
    cover_url: string | null
    url: string
    meeting_url: string | null
    geo_address_json: { address?: string } | null
  }
}

interface LumaListResponse {
  entries: LumaEvent[]
  has_more: boolean
  next_cursor: string | null
}

export async function fetchLumaEvents(
  apiKey: string,
  options?: { after?: string; before?: string },
): Promise<LumaEvent[]> {
  const events: LumaEvent[] = []
  let cursor: string | null = null

  do {
    const params = new URLSearchParams()
    if (options?.after) params.set('after', options.after)
    if (options?.before) params.set('before', options.before)
    if (cursor) params.set('pagination_cursor', cursor)
    params.set('pagination_limit', '100')
    params.set('sort_column', 'start_at')
    params.set('sort_direction', 'asc')

    const response = await fetch(
      `https://public-api.luma.com/v1/calendar/list-events?${params}`,
      {
        headers: {
          'x-luma-api-key': apiKey,
        },
      },
    )

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait 1 minute and retry once
        await new Promise((resolve) => setTimeout(resolve, 60000))
        continue
      }
      throw new Error(`Lu.ma API error: ${response.status}`)
    }

    const data: LumaListResponse = await response.json()
    events.push(...data.entries)
    cursor = data.has_more ? data.next_cursor : null

    // Rate limit protection: small delay between pages
    if (cursor) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  } while (cursor)

  return events
}
```

### Lu.ma Embed Component

```typescript
// Source: https://help.lu.ma/p/embed-our-checkout-registration-button-on-your-website
// src/components/events/LumaEmbed.tsx
import { useEffect } from "react";

interface LumaEmbedProps {
  calendarUrl: string;  // e.g., "https://lu.ma/baish"
  height?: number;
}

export function LumaEmbed({ calendarUrl, height = 600 }: LumaEmbedProps) {
  // Add cache-bust to ensure fresh content
  const urlWithCacheBust = `${calendarUrl}?embed=true`;

  return (
    <iframe
      src={urlWithCacheBust}
      className="w-full border-0 rounded-lg"
      style={{ height: `${height}px` }}
      allow="payment"
      loading="lazy"
      title="Events Calendar"
    />
  );
}

// For individual event RSVP buttons (optional)
export function LumaCheckoutButton({ eventId }: { eventId: string }) {
  useEffect(() => {
    // Load lu.ma checkout script once
    if (!document.getElementById("luma-checkout")) {
      const script = document.createElement("script");
      script.id = "luma-checkout";
      script.src = "https://embed.lu.ma/checkout-button.js";
      document.body.appendChild(script);
    }

    // Re-initialize if script already loaded
    if (window.luma) {
      window.luma.initCheckout();
    }
  }, [eventId]);

  return (
    <button
      className="luma-checkout--button"
      data-luma-action="checkout"
      data-luma-event-id={eventId}
    >
      Register
    </button>
  );
}

// Type augmentation for lu.ma global
declare global {
  interface Window {
    luma?: {
      initCheckout: () => void;
    };
  }
}
```

### Dashboard Event Aggregation Query

```typescript
// convex/events/queries.ts
import { query } from '../_generated/server'
import { v } from 'convex/values'

// Get events for dashboard - prioritize user's orgs
export const getDashboardEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { userOrgEvents: [], otherOrgEvents: [] }

    const userId = identity.subject

    // Get user's org memberships
    const memberships = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const userOrgIds = new Set(memberships.map((m) => m.orgId))

    // Get upcoming events (next 30 days)
    const now = Date.now()
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000

    // Fetch all upcoming events
    const allEvents = await ctx.db
      .query('events')
      .filter((q) =>
        q.and(
          q.gte(q.field('startAt'), now),
          q.lte(q.field('startAt'), thirtyDaysFromNow),
        ),
      )
      .order('asc')
      .take(100)

    // Get org details for each event
    const orgIds = [...new Set(allEvents.map((e) => e.orgId))]
    const orgs = await Promise.all(orgIds.map((id) => ctx.db.get(id)))
    const orgMap = Object.fromEntries(
      orgs.filter(Boolean).map((o) => [o!._id, o]),
    )

    // Enrich events with org info and split by membership
    const enriched = allEvents.map((event) => ({
      ...event,
      org: orgMap[event.orgId],
    }))

    return {
      userOrgEvents: enriched.filter((e) => userOrgIds.has(e.orgId)),
      otherOrgEvents: enriched.filter((e) => !userOrgIds.has(e.orgId)),
    }
  },
})
```

### Cron Job for Daily Sync

```typescript
// convex/crons.ts (addition to existing)
crons.daily(
  'sync-luma-events',
  { hourUTC: 7, minuteUTC: 0 }, // 7 AM UTC, after opportunity sync
  internal.events.sync.runFullEventSync,
)
```

```typescript
// convex/events/sync.ts
'use node'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

export const runFullEventSync = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log('Starting lu.ma event sync...')

    // Get all orgs with lu.ma API keys configured
    const orgsWithLuma = await ctx.runQuery(
      internal.events.queries.getOrgsWithLumaConfig,
    )

    console.log(`Found ${orgsWithLuma.length} orgs with lu.ma config`)

    // Sync each org's events (staggered to avoid rate limits)
    for (const org of orgsWithLuma) {
      try {
        await ctx.runAction(internal.events.sync.syncOrgEvents, {
          orgId: org._id,
        })
        console.log(`Synced events for ${org.name}`)

        // Small delay between orgs
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to sync ${org.name}:`, error)
        // Continue with other orgs
      }
    }

    console.log('Event sync complete')
  },
})
```

## State of the Art

| Old Approach         | Current Approach   | When Changed   | Impact                             |
| -------------------- | ------------------ | -------------- | ---------------------------------- |
| Scraping lu.ma pages | Official lu.ma API | 2024+          | Reliable, documented, rate-limited |
| Custom event widgets | lu.ma embed iframe | Current        | Less maintenance, always current   |
| Manual event entry   | Import from lu.ma  | Phase decision | Reduces admin burden               |

**Deprecated/outdated:**

- Scraping lu.ma public pages: Against ToS, unreliable, use API instead
- Building custom RSVP system: Deferred, use lu.ma for RSVPs

## Open Questions

Things that couldn't be fully resolved:

1. **Lu.ma Calendar ID Discovery**
   - What we know: API uses internal calendar IDs, not URL slugs
   - What's unclear: How to programmatically get calendar ID from URL slug
   - Recommendation: Require orgs to manually enter both URL (for embed) and API key (for sync). The API key is per-calendar, so it implicitly identifies the calendar.

2. **Embed Height Auto-sizing**
   - What we know: iframe requires fixed height
   - What's unclear: How to dynamically size iframe to content
   - Recommendation: Use generous default (600px), add list view toggle as alternative

3. **Events Without Luma Plus**
   - What we know: API requires Luma Plus subscription
   - What's unclear: Percentage of orgs that have Luma Plus
   - Recommendation: Embed-first approach (works without API). Dashboard shows message "Enable lu.ma integration in org settings" for orgs without API config.

## Sources

### Primary (HIGH confidence)

- [Lu.ma API Documentation - Getting Started](https://docs.luma.com/reference/getting-started-with-your-api) - Authentication, base URL
- [Lu.ma API - List Events](https://docs.luma.com/reference/get_v1-calendar-list-events) - Full response schema, pagination
- [Lu.ma API - Rate Limits](https://docs.luma.com/reference/rate-limits) - 500 GET/5min, 100 POST/5min per calendar
- [Lu.ma Help - Embed Registration Button](https://help.lu.ma/p/embed-our-checkout-registration-button-on-your-website) - Embed code patterns

### Secondary (MEDIUM confidence)

- [Lu.ma GitHub Examples](https://github.com/luma-team/examples) - Embed implementation patterns
- [Lu.ma Basketball Club Example](https://github.com/luma-team/basketball-club-example) - API integration example (Next.js)

### Tertiary (LOW confidence)

- WebSearch results on lu.ma embed options - Limited official documentation on full calendar embedding

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - No new dependencies needed, follows existing patterns
- Architecture: MEDIUM - Dual strategy (embed + API) is sound but calendar ID discovery unclear
- Pitfalls: HIGH - Rate limits and API requirements well-documented
- Code examples: MEDIUM - Based on official docs but not yet tested in this codebase

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - lu.ma API is stable)
