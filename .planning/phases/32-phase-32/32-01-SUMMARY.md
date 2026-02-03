---
phase: 32-member-booking
plan: 01
subsystem: database
tags: [convex, schema, bookings, coworking, consent]

# Dependency graph
requires:
  - phase: 31-org-self-config
    provides: coworkingSpaces table and org configuration
provides:
  - spaceBookings table for member/guest booking workflow
  - Booking mutations (create, cancel, update tags)
  - Booking queries (by date, by user, attendees with consent)
  - Capacity tracking with soft warnings
affects: [32-02 (booking UI), 33-guest-booking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Soft capacity warnings (nearing at 80%, at_capacity at 100%)
    - Consent-gated profile sharing for attendee visibility
    - ISO date strings for booking dates (YYYY-MM-DD)
    - Minutes-from-midnight for flexible time ranges

key-files:
  created:
    - convex/spaceBookings.ts
  modified:
    - convex/schema.ts
    - src/components/notifications/NotificationList.tsx

key-decisions:
  - 'Soft capacity: warnings without blocking to allow overbooking if needed'
  - '140 char limit on workingOn/interestedInMeeting tags'
  - 'Profile subset for attendees: name, headline, skills only'
  - '0.7 threshold for nearing capacity in calendar view (vs 0.8 in create mutation)'

patterns-established:
  - 'requireOrgMember helper for space-level member authorization'
  - 'Capacity warning return pattern: { bookingId, capacityWarning? }'
  - 'Date range queries with manual date string filtering'

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 32 Plan 01: Schema + Backend - Member Booking Summary

**spaceBookings table with member booking mutations, capacity tracking, and consent-gated attendee queries**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T04:47:22Z
- **Completed:** 2026-02-03T04:51:50Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- spaceBookings table with full schema for member/guest booking workflow
- createMemberBooking with consent validation and soft capacity warnings
- Attendee queries returning only consented profile data
- Calendar capacity view with date range status

## Task Commits

Each task was committed atomically:

1. **Task 1: Add spaceBookings table to schema** - `c0bd26e` (feat)
2. **Task 2: Create spaceBookings.ts with booking mutations** - `51df8d7` (feat)
3. **Task 3: Add booking queries to spaceBookings.ts** - `9f9e9eb` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added spaceBookings table, booking_confirmed notification type
- `convex/spaceBookings.ts` - New file with 3 mutations and 4 queries
- `src/components/notifications/NotificationList.tsx` - Added booking_confirmed type handling

## Decisions Made

1. **Soft capacity warnings:** Returns warning without blocking booking to allow admins flexibility
2. **Consent required:** consentToProfileSharing must be true to create booking
3. **Profile subset:** Only name, headline, skills returned for attendees (minimal PII)
4. **Dual capacity thresholds:** 0.7 for calendar nearing (early visual warning), 0.8 for booking nearing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript error in NotificationList**

- **Found during:** Task 1 (schema update)
- **Issue:** Adding 'booking_confirmed' to schema notification types caused type mismatch in NotificationList component
- **Fix:** Updated Notification interface and typeIcons map to include booking_confirmed
- **Files modified:** src/components/notifications/NotificationList.tsx
- **Verification:** TypeScript compiles successfully
- **Committed in:** c0bd26e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Essential fix for type safety. No scope creep.

## Issues Encountered

None - all tasks executed as specified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- spaceBookings table ready for frontend integration
- All mutations and queries available via `api.spaceBookings`
- Ready for 32-02: Member Booking UI + Attendee View

---

_Phase: 32-member-booking_
_Completed: 2026-02-03_
