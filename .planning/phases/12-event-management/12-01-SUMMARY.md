---
phase: 12-event-management
plan: 01
subsystem: database, api
tags: [convex, lu.ma, events, cron, sync]

# Dependency graph
requires:
  - phase: 11-org-discovery
    provides: organizations table with membership structure
provides:
  - events table in Convex schema
  - lu.ma API client for fetching events
  - event sync actions (per-org and full sync)
  - daily cron job for automatic event sync
affects: [12-02 (org event pages), 12-03 (dashboard events)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Lu.ma API integration pattern with pagination and rate limiting'
    - 'Cron job staggering (7 AM after 6 AM opportunity sync)'

key-files:
  created:
    - convex/events/lumaClient.ts
    - convex/events/queries.ts
    - convex/events/mutations.ts
    - convex/events/sync.ts
    - convex/orgs/queries.ts
  modified:
    - convex/schema.ts
    - convex/crons.ts

key-decisions:
  - 'Lu.ma API key is per-calendar, implicitly identifies which calendar to fetch'
  - 'Sync window: 30 days past to 90 days future'
  - '1 second delay between orgs during full sync to avoid rate limits'
  - '200ms delay between pagination pages as rate limit protection'

patterns-established:
  - 'Event sync pattern: runFullEventSync iterates orgs, calls syncOrgEvents per org'
  - 'Upsert by external ID pattern: check by_luma_id index, patch if exists, insert if not'

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 12 Plan 01: Events Schema and Lu.ma Sync Summary

**Events table in Convex schema with Lu.ma API client, sync actions, and daily cron job at 7 AM UTC**

## Performance

- **Duration:** 3 min (191 seconds)
- **Started:** 2026-01-19T18:08:27Z
- **Completed:** 2026-01-19T18:11:38Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Events table with indexes for org, org+start date, and lu.ma event ID
- Lu.ma config fields (lumaCalendarUrl, lumaApiKey, eventsLastSynced) on organizations
- Fully paginated lu.ma API client with rate limit handling (60s retry on 429)
- Daily sync cron job at 7 AM UTC for automatic event import

## Task Commits

Each task was committed atomically:

1. **Task 1: Add events table and lu.ma config to schema** - `e4b8861` (feat)
2. **Task 2: Create lu.ma API client and sync actions** - `d1278d9` (feat)
3. **Task 3: Add daily event sync cron job** - `5258a1b` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added events table and lu.ma config fields to organizations
- `convex/events/lumaClient.ts` - Lu.ma API client with fetchLumaEvents function
- `convex/events/queries.ts` - getOrgsWithLumaConfig for finding orgs to sync
- `convex/events/mutations.ts` - upsertEvents and updateOrgSyncTimestamp mutations
- `convex/events/sync.ts` - syncOrgEvents and runFullEventSync actions
- `convex/orgs/queries.ts` - getById internal query for sync operations
- `convex/crons.ts` - Added sync-luma-events daily cron

## Decisions Made

- **API endpoint URL:** Using `public-api.lu.ma/public/v1/calendar/list-events` per official docs
- **Sync window:** 30 days past to 90 days future covers reasonable event horizon
- **Rate limiting:** 200ms between pages, 1s between orgs, 60s retry on 429
- **Virtual event detection:** Using presence of meeting_url field to set isVirtual flag

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added orgs/queries.ts with getById internal query**

- **Found during:** Task 2 (Creating sync actions)
- **Issue:** syncOrgEvents needed to fetch org by ID but no internal query existed
- **Fix:** Created convex/orgs/queries.ts with getById internal query
- **Files modified:** convex/orgs/queries.ts (new file)
- **Verification:** Convex compiled successfully
- **Committed in:** d1278d9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for sync action to function. No scope creep.

## Issues Encountered

None - plan executed smoothly.

## User Setup Required

**External services require manual configuration.** Per the plan's user_setup section:

- **Lu.ma API Key:** Required for event sync (Luma Plus subscription at $20/month per calendar)
  - Source: Lu.ma Dashboard -> Settings -> API
  - Store as environment variable: `LUMA_API_KEY`
  - Note: API key is per-calendar. Orgs without Luma Plus can still use embed (no API needed) but won't appear in dashboard aggregation.

## Next Phase Readiness

- Events schema and sync infrastructure complete
- Ready for Plan 02: Org event pages with lu.ma embed and list view
- Ready for Plan 03: Dashboard event aggregation across orgs

---

_Phase: 12-event-management_
_Completed: 2026-01-19_
