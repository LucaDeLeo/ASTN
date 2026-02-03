---
phase: 14-attendance-tracking
plan: 03
subsystem: frontend
tags: [react, tanstack-router, convex, attendance, privacy, settings]

# Dependency graph
requires:
  - phase: 14-attendance-tracking (plan 01)
    provides: attendance schema, recordAttendance, getMyAttendanceHistory queries
provides:
  - /profile/attendance page with full attendance history display
  - Attendance summary card on profile page with recent events
  - AttendancePrivacyForm component for privacy settings
  - getMyAttendanceSummary query for profile summary
  - getAttendancePrivacyDefaults query for privacy settings
  - updateAttendancePrivacy mutation with batch update option
affects: [15-engagement-scoring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Profile-level privacy defaults for per-record settings
    - Summary queries returning aggregated + recent data

key-files:
  created:
    - src/routes/profile/attendance.tsx
    - src/components/settings/AttendancePrivacyForm.tsx
  modified:
    - src/routes/profile/index.tsx
    - src/routes/settings/index.tsx
    - convex/attendance/queries.ts
    - convex/attendance/mutations.ts
    - convex/schema.ts

key-decisions:
  - 'Profile-level privacy defaults stored in privacySettings.attendancePrivacyDefaults'
  - 'Privacy updates can optionally batch-update existing records'
  - 'Host org visibility disclaimer in both attendance page and settings form'

patterns-established:
  - 'Privacy defaults pattern: profile stores defaults, records store actual values, UI can sync both'
  - 'Summary queries return { total, specific_count, recent[] } for profile cards'

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 14 Plan 03: Attendance Views & Privacy Summary

**Attendance history page, profile summary card, and privacy settings with profile-level defaults**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-19T20:04:36Z
- **Completed:** 2026-01-19T20:09:12Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Created /profile/attendance page displaying full attendance history with event details, status badges, and feedback indicators
- Added Event Attendance summary card to profile page showing attended count and last 3 events
- Implemented attendance privacy settings form with show-on-profile and share-with-other-orgs toggles
- Extended schema with attendancePrivacyDefaults in profile.privacySettings
- Updated recordAttendance to respect user's privacy defaults

## Task Commits

Each task was committed atomically:

1. **Task 1: Create attendance history page** - `c8f4f44` (feat)
2. **Task 2: Add attendance summary to profile page** - `8bf2ac8` (feat)
3. **Task 3: Add attendance privacy settings** - `31f63c9` (feat)

## Files Created/Modified

- `src/routes/profile/attendance.tsx` - Full attendance history page with event cards and status badges
- `src/routes/profile/index.tsx` - Added Event Attendance summary card after Career Goals
- `src/components/settings/AttendancePrivacyForm.tsx` - Privacy toggle form for attendance visibility
- `src/routes/settings/index.tsx` - Added AttendancePrivacyForm to settings page
- `convex/attendance/queries.ts` - Added getMyAttendanceSummary and getAttendancePrivacyDefaults
- `convex/attendance/mutations.ts` - Added updateAttendancePrivacy with batch update option
- `convex/schema.ts` - Added attendancePrivacyDefaults to profile.privacySettings

## Decisions Made

- **Profile-level defaults:** Store attendance privacy defaults in `profile.privacySettings.attendancePrivacyDefaults` rather than separate table. Simpler and follows existing pattern.
- **Batch update option:** updateAttendancePrivacy includes `updateExisting` flag to apply settings to all existing records, not just future ones.
- **Disabled cascade:** When showOnProfile is disabled, showToOtherOrgs is automatically disabled and its toggle becomes disabled in UI.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- User-facing attendance features complete
- Privacy controls in place for cross-org visibility
- Ready for Phase 15 (Engagement Scoring) to consume attendance data
- No blockers for next phase

---

_Phase: 14-attendance-tracking_
_Completed: 2026-01-19_
