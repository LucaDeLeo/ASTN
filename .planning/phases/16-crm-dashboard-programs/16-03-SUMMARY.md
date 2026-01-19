---
phase: 16-crm-dashboard-programs
plan: 03
subsystem: api
tags: [convex, queries, privacy, admin, engagement, attendance]

# Dependency graph
requires:
  - phase: 15-engagement-scoring
    provides: memberEngagement table and engagement override history
  - phase: 14-attendance-tracking
    provides: attendance table with event-linked records
provides:
  - Privacy-controlled member profile query for admin views
  - Member attendance history with event enrichment
  - Member engagement history with override audit trail
affects:
  - 16-crm-dashboard-programs (UI plans will consume these queries)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Privacy-controlled data fetching with section visibility
    - Admin queries with membership verification
    - Override history enrichment with admin names

key-files:
  created:
    - convex/orgs/members.ts
  modified: []

key-decisions:
  - "Profile visibility respects sectionVisibility settings (public/connections visible, private hidden)"
  - "Name always visible for identification purposes"
  - "Attendance history sorted by event date descending (most recent first)"
  - "Override history enriched with admin names for audit clarity"

patterns-established:
  - "requireOrgAdmin helper in convex/orgs/members.ts for admin-only queries"
  - "Privacy isVisible helper for section-level visibility checks"
  - "Override history enrichment pattern for audit trails"

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 16 Plan 03: Member Profile Queries Summary

**Backend queries for admin member view with privacy controls, attendance history, and engagement history audit trail**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-19T21:31:07Z
- **Completed:** 2026-01-19T21:35:02Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- Privacy-controlled member profile query respecting section visibility settings
- Attendance history query with event details and chronological ordering
- Engagement history query with full override audit trail and admin names

## Task Commits

Each task was committed atomically:

1. **Task 1: Create getMemberProfileForAdmin query** - `0ba94ac` (feat)
2. **Task 2: Create getMemberAttendanceHistory query** - `142126c` (feat)
3. **Task 3: Create getMemberEngagementHistory query** - `4fd7e02` (feat)

## Files Created/Modified
- `convex/orgs/members.ts` - New file with three admin queries for member profile, attendance history, and engagement history

## Decisions Made
- Profile name is always visible to admins (needed for identification) but other sections respect privacy settings
- Used "connections" visibility level as visible to org admins since org membership constitutes a connection
- Attendance records sorted by event date (most recent first) for intuitive display
- Override history includes admin names resolved from orgMemberships for audit clarity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend queries ready for frontend consumption in member profile page
- Queries accessible via api.orgs.members namespace
- All queries require admin authentication via requireOrgAdmin helper

---
*Phase: 16-crm-dashboard-programs*
*Completed: 2026-01-19*
