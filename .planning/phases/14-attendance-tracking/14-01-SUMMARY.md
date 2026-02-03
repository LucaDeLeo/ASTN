---
phase: 14-attendance-tracking
plan: 01
subsystem: backend
tags: [convex, scheduler, notifications, attendance, feedback]

# Dependency graph
requires:
  - phase: 13-event-notifications
    provides: scheduler patterns, notifications table, eventViews tracking
provides:
  - attendance table for storing user attendance records
  - scheduledAttendancePrompts table for deduplication
  - attendance_prompt notification type
  - recordAttendance, submitFeedback, snoozeAttendancePrompt mutations
  - getMyAttendanceHistory, getPendingPrompts queries
  - schedulePostEventPrompts cron for post-event prompts
affects: [14-02, 15-engagement-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Post-event scheduler using cron + ctx.scheduler.runAt
    - Attendance upsert with 14-day retroactive window
    - Snooze to next 9 AM in user timezone

key-files:
  created:
    - convex/attendance/mutations.ts
    - convex/attendance/queries.ts
    - convex/attendance/scheduler.ts
  modified:
    - convex/schema.ts
    - convex/crons.ts

key-decisions:
  - '10-minute cron with 10-20 minute window to avoid duplicate scheduling'
  - '2-prompt max limit (no more follow-ups after prompt 2)'
  - 'Default privacy: showOnProfile=true, showToOtherOrgs=false'

patterns-established:
  - 'Post-event scheduling: cron detects ended events, schedules prompts 1 hour after'
  - 'Attendance record privacy: host org always sees, user controls profile/cross-org visibility'

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 14 Plan 01: Attendance Backend Summary

**Convex backend for attendance tracking with schema, mutations for recording/feedback/snooze, queries for history, and cron-based post-event prompt scheduling**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-19T19:59:22Z
- **Completed:** 2026-01-19T20:02:55Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Extended schema with attendance table (status, feedback, privacy fields) and scheduledAttendancePrompts table
- Created recordAttendance mutation with 14-day retroactive window and upsert logic
- Created submitFeedback mutation for 1-5 star rating with optional text
- Created snoozeAttendancePrompt mutation respecting 2-prompt limit and user timezone
- Added schedulePostEventPrompts cron job running every 10 minutes
- Created getMyAttendanceHistory and getPendingPrompts queries with event/org enrichment

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend schema for attendance tracking** - `1a910d5` (feat)
2. **Task 2: Create attendance mutations** - `bdaf336` (feat)
3. **Task 3: Create attendance queries and scheduler** - `6792464` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added attendance and scheduledAttendancePrompts tables, extended notifications type
- `convex/attendance/mutations.ts` - recordAttendance, submitFeedback, snoozeAttendancePrompt
- `convex/attendance/queries.ts` - getMyAttendanceHistory, getPendingPrompts
- `convex/attendance/scheduler.ts` - sendAttendancePrompt, schedulePostEventPrompts
- `convex/crons.ts` - Added check-ended-events cron running every 10 minutes

## Decisions Made

- **10-20 minute detection window:** Cron queries events that ended 10-20 minutes ago to avoid duplicate prompt scheduling on overlapping cron runs
- **Privacy defaults:** showOnProfile=true (visible on public profile) but showToOtherOrgs=false (hidden from non-host orgs) - respects user privacy while enabling community visibility
- **2-hour default duration:** Events without endAt use startAt + 2 hours for prompt timing calculation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully, schema deployed without errors.

## User Setup Required

None - no external service configuration required. The cron job is automatically registered.

## Next Phase Readiness

- Backend layer complete, ready for UI components in 14-02
- Queries return enriched data suitable for frontend consumption
- Scheduler pattern established for post-event automation
- No blockers for next phase

---

_Phase: 14-attendance-tracking_
_Completed: 2026-01-19_
