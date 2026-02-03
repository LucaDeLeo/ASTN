---
phase: 33-guest
plan: 01
subsystem: database, api
tags:
  [convex, guest-access, visit-applications, notifications, approval-workflow]

# Dependency graph
requires:
  - phase: 32-phase-32
    provides: spaceBookings table, member booking flow, attendee visibility
provides:
  - guestProfiles table with visit tracking and conversion support
  - visitApplicationResponses table for custom form field storage
  - Guest visit application and approval workflow mutations
  - Extended attendee query with isGuest flag
affects: [33-02, 33-03, 34-admin] # Guest UI and admin dashboard phases

# Tech tracking
tech-stack:
  added: []
  patterns:
    - requireSpaceAdmin auth helper for space-level admin operations
    - Inline guest profile creation in mutations (no runMutation for internal)

key-files:
  created:
    - convex/guestProfiles.ts
    - convex/guestBookings.ts
  modified:
    - convex/schema.ts
    - convex/lib/auth.ts
    - convex/notifications/mutations.ts
    - convex/spaceBookings.ts
    - src/components/notifications/NotificationList.tsx

key-decisions:
  - 'Inline guest profile creation in submitVisitApplication instead of calling internal mutation'
  - 'Guest profiles preserved after member conversion for audit trail'
  - "spaceBookings reused for guest visits with bookingType: 'guest' and status: 'pending'"

patterns-established:
  - 'requireSpaceAdmin(ctx, spaceId): returns userId, space, membership for space-level admin checks'
  - 'Guest attendees returned with isGuest: true flag for UI differentiation'

# Metrics
duration: 6min
completed: 2026-02-03
---

# Phase 33 Plan 01: Guest Backend Schema + Mutations Summary

**Guest profiles, visit applications, and approval workflow backend with notifications via Convex scheduler**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-03T05:37:13Z
- **Completed:** 2026-02-03T05:43:24Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- guestProfiles table with visit count tracking and member conversion fields
- visitApplicationResponses table for storing custom form field answers
- Complete guest visit application flow: submit -> pending -> approved/rejected
- Batch approval support for efficient admin review
- Extended getBookingAttendees to include approved guests with isGuest flag

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend schema with guestProfiles, visitApplicationResponses, and booking approval fields** - `3687166` (feat)
2. **Task 2: Create guestProfiles.ts with profile CRUD and conversion tracking** - `7aaebbd` (feat)
3. **Task 3: Create guestBookings.ts with visit application and approval workflow** - `60192e0` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added guestProfiles, visitApplicationResponses tables; extended spaceBookings with approval fields; added guest notification types
- `convex/guestProfiles.ts` - Guest profile CRUD mutations and conversion tracking
- `convex/guestBookings.ts` - Visit application submission, approval/rejection, batch approval, queries for pending/history
- `convex/lib/auth.ts` - Added requireSpaceAdmin helper for space-level admin authorization
- `convex/notifications/mutations.ts` - Extended createNotification with guest types and spaceBookingId
- `convex/spaceBookings.ts` - Extended getBookingAttendees to include guests with isGuest flag
- `src/components/notifications/NotificationList.tsx` - Added guest notification types and icons

## Decisions Made

- **Inline guest profile creation:** Used direct db.insert in submitVisitApplication instead of ctx.runMutation because Convex mutations cannot call internal mutations with runMutation. This keeps the logic self-contained.
- **Guest profile preservation:** When guests become members (markGuestAsMember), the guestProfile is marked with becameMember: true but not deleted, preserving visit history for audit.
- **Unified spaceBookings table:** Guest visits use the same spaceBookings table with bookingType: 'guest' rather than a separate table, enabling unified capacity tracking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated NotificationList component for new types**

- **Found during:** Task 1 (Schema changes)
- **Issue:** Pre-commit hook failed because NotificationList.tsx had a hardcoded Notification type union that didn't include new guest types
- **Fix:** Extended the Notification interface and typeIcons map to include guest_visit_approved, guest_visit_rejected, guest_visit_pending
- **Files modified:** src/components/notifications/NotificationList.tsx
- **Verification:** TypeScript compilation passed, commit succeeded
- **Committed in:** 3687166 (Task 1 commit)

**2. [Rule 3 - Blocking] Changed from runMutation to inline guest profile creation**

- **Found during:** Task 3 (guestBookings.ts creation)
- **Issue:** ctx.runMutation on internal mutations causes TypeScript circular reference error in Convex
- **Fix:** Inlined the getOrCreateGuestProfile logic directly in submitVisitApplication mutation
- **Files modified:** convex/guestBookings.ts
- **Verification:** Convex codegen passed without errors
- **Committed in:** 60192e0 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were necessary for compilation. No scope creep - functionality matches plan exactly.

## Issues Encountered

None beyond the auto-fixed blocking issues above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend complete for guest visit flow
- Ready for 33-02: Guest UI (visit application form, application status page)
- Notification infrastructure in place for guest communications
- getBookingAttendees already supports guests for attendee view

---

_Phase: 33-guest_
_Completed: 2026-02-03_
