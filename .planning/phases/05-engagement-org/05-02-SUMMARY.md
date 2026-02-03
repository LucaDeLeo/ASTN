---
phase: 05-engagement-org
plan: 02
subsystem: notifications
tags: [convex, cron, email, timezone, date-fns-tz, resend]

# Dependency graph
requires:
  - phase: 05-01
    provides: Email infrastructure (Resend component, templates, send mutations)
provides:
  - Batch processing functions for timezone-aware match alerts
  - Batch processing functions for weekly digest emails
  - Cron jobs for scheduled email delivery
  - Queries for new great-tier matches and recent matches
affects: [05-03, 05-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Timezone-aware batch processing with date-fns-tz
    - Chunked batch processing (10 users per batch) to avoid timeouts
    - Separation of queries (send.ts) from actions (batchActions.ts)

key-files:
  created:
    - convex/emails/batchActions.ts
  modified:
    - convex/emails/send.ts
    - convex/crons.ts

key-decisions:
  - "Batch alerts hourly to catch each timezone's 8 AM"
  - 'Weekly digest at 22:00 UTC Sunday (covers Americas evening)'
  - 'Only great-tier matches trigger alerts (per CONTEXT.md)'
  - 'Batch size of 10 users to avoid action timeout'

patterns-established:
  - 'Timezone-aware email delivery via hourly cron checking local hour'
  - 'Separate Node.js actions file for template rendering'

# Metrics
duration: 6min
completed: 2026-01-18
---

# Phase 5 Plan 02: Notification Scheduling Summary

**Timezone-aware cron jobs for match alerts (hourly at 8 AM local) and weekly digests (Sunday 22:00 UTC) with batch processing**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-18T06:24:16Z
- **Completed:** 2026-01-18T06:30:11Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Hourly cron processes match alerts for users whose local time is 8 AM
- Weekly cron sends digest emails Sunday evening UTC
- Only great-tier matches trigger alert emails (per CONTEXT.md)
- Batch processing in chunks of 10 to avoid timeouts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add batch processing functions to send.ts** - `3e1454c` (feat)
2. **Task 2: Add cron jobs for scheduled email delivery** - `f30034c` (feat)

## Files Created/Modified

- `convex/emails/batchActions.ts` - Batch processing actions for match alerts and weekly digests
- `convex/emails/send.ts` - Added queries for users by timezone, new great matches, recent matches
- `convex/crons.ts` - Added hourly match alerts cron and weekly digest cron

## Decisions Made

- Hourly cron covers all timezones' 8 AM by checking each user's local hour via date-fns-tz
- Weekly digest at 22:00 UTC Sunday targets Americas Sunday afternoon/evening
- Batch processing in chunks of 10 users to stay within Convex action timeout limits
- Great-tier only for alerts - good/exploring matches appear in digest but don't trigger alerts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript inference issues with Convex internalAction handlers required @ts-nocheck directive
- ESLint required Array<T> syntax instead of T[] per project configuration

## User Setup Required

None - cron jobs are automatically scheduled by Convex deployment.

## Next Phase Readiness

- Email scheduling infrastructure complete
- Settings page (05-03) can manage notification preferences
- Email templates ready to receive real user data

---

_Phase: 05-engagement-org_
_Completed: 2026-01-18_
