---
phase: 12-event-management
plan: 03
subsystem: ui
tags: [events, dashboard, date-fns, convex-query, react]

# Dependency graph
requires:
  - phase: 12-01
    provides: events table schema and lu.ma sync
provides:
  - Dashboard events query (getDashboardEvents)
  - EventCard component for event display
  - Dashboard events section with org grouping
affects: [13-attendance-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dashboard event aggregation with membership-based grouping
    - EventCard component pattern with date-fns formatting

key-files:
  created:
    - src/components/events/EventCard.tsx
  modified:
    - convex/events/queries.ts
    - src/routes/index.tsx

key-decisions:
  - 'Events grouped by org name on dashboard for clear organization'
  - 'Max 5 events shown per org with overflow indicator'
  - "Date format: 'Fri, Jan 24 at 6:00 PM' using date-fns"

patterns-established:
  - 'EventCard: compact card linking to external lu.ma event page'
  - 'Dashboard events: grouped by org with empty state fallbacks'

# Metrics
duration: 5min
completed: 2026-01-19
---

# Phase 12 Plan 03: Dashboard Events Summary

**Dashboard events section with org grouping, EventCard component, and getDashboardEvents query**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-19T18:13:23Z
- **Completed:** 2026-01-19T18:17:57Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- getDashboardEvents query fetches upcoming events (30 days) split by user membership
- EventCard component displays event details with date formatting and lu.ma link
- Dashboard events section groups events by organization with empty states

## Task Commits

Each task was committed atomically:

1. **Task 1: Create getDashboardEvents query** - `8a22cef` (feat)
2. **Task 2: Create EventCard component** - `1b5f9c6` (feat)
3. **Task 3: Add events section to dashboard** - `5561b15` (feat)

## Files Created/Modified

- `convex/events/queries.ts` - Added getDashboardEvents query with org enrichment
- `src/components/events/EventCard.tsx` - Event display card with date formatting
- `src/routes/index.tsx` - Dashboard events section with org grouping

## Decisions Made

- Events grouped by org name for clear visual organization on dashboard
- Max 5 events shown per org to keep dashboard compact
- Date format "Fri, Jan 24 at 6:00 PM" using date-fns for readability
- Empty states differentiate between "no user org events" and "no events at all"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard now shows events from user's organizations
- EventCard component can be reused in other contexts
- Ready for Phase 13: Attendance Tracking

---

_Phase: 12-event-management_
_Completed: 2026-01-19_
