---
phase: 16-crm-dashboard-programs
plan: 04
subsystem: database
tags: [convex, programs, participation, enrollment, crud]

# Dependency graph
requires:
  - phase: 11-org-discovery
    provides: organizations table and membership structure
  - phase: 12-event-management
    provides: events table for linkedEventIds
provides:
  - programs table with types, status, enrollment methods, and completion criteria
  - programParticipation table for member enrollment tracking
  - CRUD mutations for program management
  - Enrollment mutations with capacity checks
  - Auto-completion on attendance criteria met
affects: [16-05, 16-06, org-admin-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Soft delete via archiving (status: archived)'
    - 'URL-safe slug generation with timestamp collision handling'
    - 'Capacity enforcement before enrollment'

key-files:
  created:
    - convex/programs.ts
  modified:
    - convex/schema.ts

key-decisions:
  - 'Soft delete: Programs archived instead of hard deleted'
  - 'Auto-completion: Attendance count triggers completion when criteria met'
  - 'Privacy: Member emails not exposed in participant list'

patterns-established:
  - 'Program types: reading_group, fellowship, mentorship, cohort, workshop_series, custom'
  - 'Enrollment methods: admin_only, self_enroll, approval_required'
  - 'Completion criteria: attendance_count, attendance_percentage, manual'

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 16 Plan 04: Programs Schema and Backend Summary

**Programs and participation tables with CRUD mutations, enrollment management, and auto-completion logic**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-19T21:31:02Z
- **Completed:** 2026-01-19T21:34:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Programs table with 6 program types and configurable completion criteria
- ProgramParticipation table with enrollment status tracking
- Full CRUD mutations for program management with admin auth
- Enrollment mutations with capacity checks and org membership validation
- Auto-completion triggers when attendance count criteria met

## Task Commits

Each task was committed atomically:

1. **Task 1: Add programs and programParticipation tables to schema** - `09e051c` (feat)
2. **Task 2: Create program CRUD mutations and queries** - `c1c0ba3` (feat)
3. **Task 3: Create enrollment mutations and completion logic** - `8ef0ee3` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added programs and programParticipation tables with indexes
- `convex/programs.ts` - Created with CRUD, enrollment, and completion mutations

## Decisions Made

- **Soft delete via archiving:** Programs set to "archived" status instead of hard delete for audit trail
- **Auto-completion:** When `updateManualAttendance` count meets `attendance_count` criteria, participation auto-marked complete
- **Privacy:** `getProgramParticipants` returns member name but not email to protect privacy

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema and backend ready for program admin UI in 16-05
- All mutations tested for admin auth
- Ready to build program creation form and participant management UI

---

_Phase: 16-crm-dashboard-programs_
_Completed: 2026-01-19_
