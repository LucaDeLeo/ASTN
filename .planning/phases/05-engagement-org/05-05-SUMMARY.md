---
phase: 05-engagement-org
plan: 05
subsystem: ui
tags: [tanstack-router, convex, directory, membership, invite]

# Dependency graph
requires:
  - phase: 05-04
    provides: org membership mutations (joinOrg, getMembership)
provides:
  - Org directory page at /org/:slug
  - Org join flow at /org/:slug/join
  - MemberDirectory component with visibility filtering
  - Directory queries (getOrgBySlug, getVisibleMembers, validateInviteToken, getMemberCount)
affects: [05-06 admin dashboard, future org management features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Directory visibility prompt at join time (user choice, not defaulted)
    - Visible members sorting (admins first, then alphabetically)

key-files:
  created:
    - convex/orgs/directory.ts
    - src/routes/org/$slug/index.tsx
    - src/routes/org/$slug/join.tsx
    - src/components/org/MemberDirectory.tsx
  modified: []

key-decisions:
  - "Directory shows only members with directoryVisibility='visible'"
  - 'Visibility prompt is required before joining (visible/hidden choice)'
  - 'Admin badge shown in member cards for admin role members'

patterns-established:
  - 'Directory page pattern: /org/:slug with member grid'
  - 'Join flow pattern: token validation -> visibility choice -> join'

# Metrics
duration: 5min
completed: 2026-01-18
---

# Phase 5 Plan 5: Org Directory + Join Flow Summary

**Public org directory page with visible member cards and invite-based join flow with visibility prompt**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-18T06:23:25Z
- **Completed:** 2026-01-18T06:28:19Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- Org directory page showing visible members with profile summaries
- Join flow validating invite tokens and prompting for visibility choice
- Member cards displaying name, headline, location, skills, and admin badge
- Responsive grid layout (1/2/3 columns for mobile/tablet/desktop)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create directory queries** - `96212ee` (feat)
2. **Task 2: Create org directory and join routes** - `2a6df03` (feat)

## Files Created/Modified

- `convex/orgs/directory.ts` - Directory queries (getOrgBySlug, getVisibleMembers, validateInviteToken, getMemberCount)
- `src/routes/org/$slug/index.tsx` - Public org directory page
- `src/routes/org/$slug/join.tsx` - Join org flow with visibility prompt
- `src/components/org/MemberDirectory.tsx` - Member directory grid component

## Decisions Made

- Directory shows only members with directoryVisibility="visible" (per CONTEXT.md)
- Visibility prompt required before joining (not defaulted, per CONTEXT.md)
- Admin badge displayed in member cards for easy identification
- Responsive grid: 1 column mobile, 2 tablet, 3 desktop

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Directory and join flow ready for testing with actual orgs
- Admin dashboard (05-06) can now link to org directory
- Future: profile view links from member cards

---

_Phase: 05-engagement-org_
_Completed: 2026-01-18_
