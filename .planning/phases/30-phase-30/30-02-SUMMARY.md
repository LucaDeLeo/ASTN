---
phase: 30-phase-30
plan: "02"
subsystem: ui
tags: [react, tanstack-router, convex, shadcn, forms, admin, org-application]

# Dependency graph
requires:
  - phase: 30-phase-30
    provides: orgApplications backend (schema, mutations, queries, auth helpers)
provides:
  - /apply form page for org application submission
  - /apply/status page for applicant to track applications
  - /admin/applications review queue for platform admins
  - RejectApplicationDialog component
  - Admin nav and dashboard links to applications
affects: [31-phase-31, 32-phase-32]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Public form with auth-gated submission (Authenticated/Unauthenticated conditional rendering)"
    - "Platform admin check pattern using checkPlatformAdmin query"
    - "Status filter tabs with client-side pagination"
    - "Responsive table (desktop) / card list (mobile) pattern"

key-files:
  created:
    - src/routes/apply/index.tsx
    - src/routes/apply/status.tsx
    - src/routes/apply/route.tsx
    - src/routes/admin/applications/index.tsx
    - src/routes/admin/applications/route.tsx
    - src/components/admin/RejectApplicationDialog.tsx
  modified:
    - src/routes/admin/route.tsx
    - src/routes/admin/index.tsx

key-decisions:
  - "Pre-fill applicant name/email from profile query when authenticated"
  - "Status page links to /orgs for approved apps (generic org listing) rather than specific slug-based URL"
  - "Desktop table + mobile card list for admin review queue (responsive pattern)"
  - "Client-side pagination at 25 items per page"
  - "Rejection reason minimum 10 characters"

patterns-established:
  - "Platform admin gating: query checkPlatformAdmin, show access denied message if false"
  - "Form validation with useState + isValid pattern (no form library)"

# Metrics
duration: 5min
completed: 2026-02-03
---

# Phase 30 Plan 02: Frontend -- Application Form, Status Page, Admin Review Queue Summary

**Org application frontend with public form at /apply, applicant status tracking, and platform admin review queue with approve/reject actions**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-03T03:53:43Z
- **Completed:** 2026-02-03T03:59:11Z
- **Tasks:** 8
- **Files modified:** 8

## Accomplishments
- Public /apply page with form that validates required fields and submits to backend, with auth-gated submission
- /apply/status page showing all user applications with status badges, rejection reasons, and withdraw capability
- /admin/applications review queue with status filter tabs, responsive table/card layout, approve/reject actions
- RejectApplicationDialog component with reason textarea and minimum length validation
- Admin layout and dashboard updated with links to the new applications section

## Task Commits

Each task was committed atomically:

1. **Task 1: Create application form page** - `45060b3` (feat)
2. **Task 2: Create application status page** - `455af15` (feat)
3. **Task 3: Create apply route layout** - `eff8a8a` (feat)
4. **Task 4: Create admin applications review page** - `0d665c7` (feat)
5. **Task 5: Create rejection reason dialog component** - `71cc6a0` (feat)
6. **Task 6: Update admin layout with Applications nav link** - `4a6377c` (feat)
7. **Task 7: Update admin dashboard with Applications card** - `89b0edc` (feat)
8. **Task 8: Create admin applications route layout** - `9f40191` (feat)

## Files Created/Modified
- `src/routes/apply/index.tsx` - Application form page with auth-gated submission
- `src/routes/apply/status.tsx` - Applicant status tracking with withdraw capability
- `src/routes/apply/route.tsx` - Passthrough route layout for /apply
- `src/routes/admin/applications/index.tsx` - Platform admin review queue with table/card layouts
- `src/routes/admin/applications/route.tsx` - Passthrough route layout for /admin/applications
- `src/components/admin/RejectApplicationDialog.tsx` - Dialog for rejection with reason textarea
- `src/routes/admin/route.tsx` - Added "Applications" nav link
- `src/routes/admin/index.tsx` - Added "Org Applications" dashboard card

## Decisions Made
- Pre-fill applicant contact info from profile query (name, email) when user is authenticated
- Approved applications link to /orgs page (general org listing) since the specific slug is not easily available on the status page
- Used Tabs component from shadcn for status filtering (cleaner than button group)
- Minimum 10-character rejection reason to ensure meaningful feedback to applicants
- Client-side pagination matches existing member list pattern at 25 per page

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 30 complete: both backend (30-01) and frontend (30-02) for org applications are done
- Ready for Phase 31 (Org Public Profiles) which will build on the organizations created through this flow
- Platform admin must be seeded in the platformAdmins table for the review queue to be accessible

---
*Phase: 30-phase-30*
*Completed: 2026-02-03*
