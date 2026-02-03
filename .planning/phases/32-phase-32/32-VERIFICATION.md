---
phase: 32-member-booking
verified: 2026-02-03T10:30:00Z
status: passed
score: 14/14 must-haves verified
---

# Phase 32: Member Booking + Consent + Attendee View - Verification Report

**Phase Goal:** Members can book a co-working spot for any day with flexible hours, see who else is booked (with consent-based profile visibility), and manage their upcoming bookings.

**Verified:** 2026-02-03T10:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                           | Status     | Evidence                                                                                                                                              |
| --- | ------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A member can create a booking for a specific date with flexible start/end times | ✓ VERIFIED | `createMemberBooking` mutation exists with date, startMinutes, endMinutes validation. Called via `useMutation` in index.tsx:214                       |
| 2   | Booking returns capacity warning (nearing/at_capacity) without blocking         | ✓ VERIFIED | Mutation returns `{ bookingId, capacityWarning }` (spaceBookings.ts:143). UI shows yellow/red banners (index.tsx:383-402) but doesn't disable booking |
| 3   | A member can cancel their own booking                                           | ✓ VERIFIED | `cancelBooking` mutation exists (spaceBookings.ts:148-178), called in bookings.tsx:349 with AlertDialog confirmation                                  |
| 4   | A member can update workingOn/interestedInMeeting tags on their booking         | ✓ VERIFIED | `updateBookingTags` mutation exists (spaceBookings.ts:181-224), edit UI in bookings.tsx:379-409 with 140 char validation                              |
| 5   | A query returns all bookings for a date with consented profile data             | ✓ VERIFIED | `getBookingAttendees` query (spaceBookings.ts:274-325) filters by `consentToProfileSharing === true`, returns profile subset                          |
| 6   | A query returns the user's upcoming bookings                                    | ✓ VERIFIED | `getMyBookings` query (spaceBookings.ts:247-271) filters confirmed/pending, sorted by date                                                            |
| 7   | Capacity counts only confirmed bookings for the given date                      | ✓ VERIFIED | `getCapacityForDateRange` query (spaceBookings.ts:334-346) filters `status === 'confirmed'`                                                           |
| 8   | Member can pick a date from a calendar showing per-day availability indicators  | ✓ VERIFIED | BookingCalendar component (165 lines) with green/yellow/red dots based on capacity (BookingCalendar.tsx:52-102)                                       |
| 9   | Member can select flexible hours via time range picker                          | ✓ VERIFIED | TimeRangePicker component (116 lines) generates 30-min slots from operating hours (TimeRangePicker.tsx:24-116)                                        |
| 10  | Member sees soft capacity warning without being blocked from booking            | ✓ VERIFIED | Warning displayed (index.tsx:383-402) but Book button only disabled by consent, not capacity (index.tsx:474)                                          |
| 11  | Member can view their upcoming bookings and cancel any of them                  | ✓ VERIFIED | bookings.tsx renders list with cancel buttons (bookings.tsx:346-359), filters future dates client-side                                                |
| 12  | Member can add/edit workingOn and interestedInMeeting tags                      | ✓ VERIFIED | Booking form has textareas (index.tsx:416-446), edit mode in BookingCard (bookings.tsx:379-409)                                                       |
| 13  | Member can see list of other attendees for the same day with profile previews   | ✓ VERIFIED | AttendeeList component (102 lines) shows name, headline, skills, tags (AttendeeList.tsx:50-102)                                                       |
| 14  | Consent checkbox is required before booking                                     | ✓ VERIFIED | Checkbox at index.tsx:455-461, Book button disabled when unchecked (index.tsx:474)                                                                    |

**Score:** 14/14 truths verified

### Required Artifacts

| Artifact                                   | Expected                              | Status     | Details                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `convex/schema.ts`                         | spaceBookings table definition        | ✓ VERIFIED | Lines 323-357: Full table with all fields, 3 indexes (by_space_date, by_user, by_space_user)                                                                               |
| `convex/spaceBookings.ts`                  | Booking mutations and queries         | ✓ VERIFIED | 378 lines, exports all 7 functions: createMemberBooking, cancelBooking, updateBookingTags, getBookingsForDate, getMyBookings, getBookingAttendees, getCapacityForDateRange |
| `src/routes/org/$slug/space/index.tsx`     | Main booking page                     | ✓ VERIFIED | 521 lines (plan: 150+ min). Three-query cascade, calendar, time picker, attendee preview, consent form                                                                     |
| `src/routes/org/$slug/space/bookings.tsx`  | My bookings page                      | ✓ VERIFIED | 517 lines (plan: 100+ min). List view with cancel and edit tags functionality                                                                                              |
| `src/components/space/BookingCalendar.tsx` | Calendar with availability indicators | ✓ VERIFIED | 165 lines (plan: 80+ min). Custom DayButton with green/yellow/red dots                                                                                                     |
| `src/components/space/AttendeeList.tsx`    | Attendee list with profile previews   | ✓ VERIFIED | 102 lines (plan: 50+ min). Shows name, headline, skills (max 5), tags                                                                                                      |
| `src/components/space/TimeRangePicker.tsx` | Time range picker                     | ✓ VERIFIED | 116 lines. Two selects with 30-min increments, validates end > start                                                                                                       |
| `package.json`                             | react-day-picker dependency           | ✓ VERIFIED | react-day-picker@9.13.0 installed                                                                                                                                          |

### Key Link Verification

| From                  | To                        | Via         | Status  | Details                                                                                                         |
| --------------------- | ------------------------- | ----------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `index.tsx`           | `createMemberBooking`     | useMutation | ✓ WIRED | Line 214: mutation called in handleBooking (246-282) with all params                                            |
| `index.tsx`           | `getCapacityForDateRange` | useQuery    | ✓ WIRED | Line 198: query used to populate calendar capacity data                                                         |
| `index.tsx`           | `getBookingAttendees`     | useQuery    | ✓ WIRED | Line 208: query fetches attendees when date selected, passed to AttendeeList (501)                              |
| `bookings.tsx`        | `cancelBooking`           | useMutation | ✓ WIRED | Line 324: mutation called in handleCancel (346-359) after AlertDialog confirm                                   |
| `bookings.tsx`        | `updateBookingTags`       | useMutation | ✓ WIRED | Line 323: mutation called in handleSaveTags (326-344) with tag validation                                       |
| `BookingCalendar.tsx` | `capacityData`            | props       | ✓ WIRED | Component receives capacityData from parent query, CustomDayButton renders dots (52-102)                        |
| `spaceBookings.ts`    | `spaceBookings` table     | ctx.db      | ✓ WIRED | Mutations insert/patch (128-141, 170-174, 220), queries use indexes (235-294, 338-348)                          |
| `spaceBookings.ts`    | `coworkingSpaces` table   | ctx.db.get  | ✓ WIRED | requireOrgMember helper fetches space for capacity (line 15), getCapacityForDateRange uses space.capacity (366) |

### Requirements Coverage

| Requirement                                                              | Status      | Evidence                                                                                  |
| ------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------- |
| COWRK-02: Members can book a spot for a specific day with flexible hours | ✓ SATISFIED | createMemberBooking mutation + booking form with date picker + time range picker          |
| COWRK-03: Booking page shows current capacity with soft warnings         | ✓ SATISFIED | Capacity display (index.tsx:360-380), yellow/red banners (383-402), doesn't block booking |
| COWRK-04: Members can cancel their own bookings                          | ✓ SATISFIED | cancelBooking mutation + cancel button with AlertDialog in bookings.tsx                   |
| COWRK-05: Members see who else is booked for the same day                | ✓ SATISFIED | getBookingAttendees query + AttendeeList component, consent-gated                         |
| COWRK-06: Members can view their today/upcoming bookings                 | ✓ SATISFIED | getMyBookings query + bookings.tsx page with filtering                                    |
| COWRK-07: Calendar date picker shows availability per day                | ✓ SATISFIED | BookingCalendar with green/yellow/red dots based on capacity status                       |
| COWRK-08: Members can optionally add tags when booking                   | ✓ SATISFIED | workingOn and interestedInMeeting fields in form + updateBookingTags mutation             |

**Coverage:** 7/7 requirements satisfied

### Anti-Patterns Found

**Scan results:** None detected

- No TODO/FIXME/PLACEHOLDER comments found in modified files
- No empty return statements (null, {}, []) in business logic
- No console.log-only implementations
- All mutations have proper validation and error handling
- All queries return substantive data structures

### Human Verification Required

None — all goal criteria can be verified programmatically through code inspection.

**Automated checks passed:**

- ✓ Schema compiles without errors
- ✓ All mutations and queries registered in Convex
- ✓ TypeScript compiles (521-line files with complex types)
- ✓ Component imports resolve
- ✓ react-day-picker v9 installed and used correctly
- ✓ Consent validation enforced at both UI and backend

---

## Verification Details

### Backend Verification (32-01)

**Schema (convex/schema.ts:323-357):**

- ✓ spaceBookings table exists with all 14 fields
- ✓ Indexes: by_space_date, by_user, by_space_user
- ✓ Includes guest fields (pending for Phase 33)
- ✓ consentToProfileSharing boolean required
- ✓ workingOn/interestedInMeeting optional strings

**Mutations (convex/spaceBookings.ts):**

1. **createMemberBooking (38-145):**
   - ✓ Validates consent (63-65): throws if false
   - ✓ Validates date format (68-70): regex YYYY-MM-DD
   - ✓ Validates time range (73-75): startMinutes < endMinutes
   - ✓ Validates tag lengths (78-85): max 140 chars
   - ✓ Checks existing booking (88-106): prevents double-booking
   - ✓ Counts confirmed bookings (109-117)
   - ✓ Returns capacityWarning (120-125): at_capacity (>=100%), nearing (>=80%)
   - ✓ Inserts with status 'confirmed' (128-141)

2. **cancelBooking (148-178):**
   - ✓ Verifies ownership (160-162)
   - ✓ Verifies status === 'confirmed' (165-167)
   - ✓ Patches status to 'cancelled' + sets cancelledAt (170-174)

3. **updateBookingTags (181-224):**
   - ✓ Verifies ownership (195-197)
   - ✓ Verifies status === 'confirmed' (200-202)
   - ✓ Validates tag lengths (205-212)
   - ✓ Patches with undefined handling (215-220)

**Queries (convex/spaceBookings.ts):**

1. **getBookingsForDate (227-244):** ✓ Requires org member, returns all bookings for date
2. **getMyBookings (247-271):** ✓ Filters confirmed/pending, sorted by date
3. **getBookingAttendees (274-325):**
   - ✓ Filters status='confirmed' AND consentToProfileSharing=true (288-293)
   - ✓ Fetches profile subset: name, headline, skills only (313-317)
   - ✓ Returns null profile if not found (318)
4. **getCapacityForDateRange (328-377):**
   - ✓ Filters confirmed bookings in range (343-347)
   - ✓ Groups by date (351-354)
   - ✓ Calculates status: at_capacity (>=100%), nearing (>=70%), available (356-369)

### Frontend Verification (32-02)

**BookingCalendar.tsx (165 lines):**

- ✓ Uses react-day-picker v9 DayPicker with mode="single" (105-143)
- ✓ CustomDayButton component (52-102) renders availability dots
- ✓ Dot colors: green (available), yellow (nearing), red (at_capacity) (59-71)
- ✓ Disables past dates: isBefore(date, today) (46)
- ✓ Disables closed days: checks operatingHours.isClosed (39-49)
- ✓ onMonthChange callback for capacity range updates (110)

**TimeRangePicker.tsx (116 lines):**

- ✓ Generates 30-min increments from operating hours (24-36)
- ✓ Two selects: start and end (79-114)
- ✓ Validates end > start with auto-adjustment (63-76)
- ✓ Handles closed days: shows "Space is closed" (45-50)

**AttendeeList.tsx (102 lines):**

- ✓ Empty state: "No one else booked yet" (29-36)
- ✓ AttendeeCard shows name, headline (58-62)
- ✓ Skills limited to 5 + "+N more" badge (65-77)
- ✓ workingOn and interestedInMeeting display (81-97)

**index.tsx (521 lines):**

- ✓ Three-query cascade: org → membership → space (42-50)
- ✓ Loading skeleton (53-67)
- ✓ Not member guard (95-117)
- ✓ No space guard (119-140)
- ✓ Space loading state (142-161)
- ✓ Calendar with capacity data query (190-202)
- ✓ Attendees query when date selected (204-211)
- ✓ Capacity display: "{X} / {capacity} booked" with color (360-380)
- ✓ Warning banners: yellow (nearing), red (at_capacity) (383-402)
- ✓ Time picker with operating hours (405-413)
- ✓ workingOn textarea (416-434) with 140 char limit (421-422)
- ✓ interestedInMeeting textarea (436-449) with 140 char limit
- ✓ Consent checkbox (453-470) with label explaining visibility
- ✓ Book button disabled only if !consentChecked (474), NOT by capacity
- ✓ handleBooking calls mutation (246-282), shows toast with warning
- ✓ AttendeeList component rendered (499-502)

**bookings.tsx (517 lines):**

- ✓ Three-query cascade (42-50)
- ✓ getMyBookings query (52-53)
- ✓ Client-side filtering: future vs past (174-176, 178-180)
- ✓ BookingCard component (314-503):
  - Edit mode toggle (315, 379-423)
  - workingOn and interestedInMeeting textareas with char count (381-418)
  - Save button calls updateTags mutation (326-344)
  - Cancel button with AlertDialog (442-491)
  - handleCancel calls cancelBooking mutation (346-359)
- ✓ Empty state: "You have no upcoming bookings" (149-166)
- ✓ Link to space booking page (156)

---

## Summary

**Phase 32 goal ACHIEVED.**

All 14 must-haves verified through code inspection:

- ✓ Backend: spaceBookings table with 3 mutations + 4 queries, all substantive and wired
- ✓ Frontend: 5 components totaling 1421 lines, all exceed minimum requirements
- ✓ Wiring: All 8 key links verified (components call backend, queries populate UI)
- ✓ Requirements: All 7 COWRK requirements satisfied
- ✓ No anti-patterns or stubs detected
- ✓ Consent enforcement at both UI and backend layers
- ✓ Soft capacity warnings displayed without blocking booking

**Ready to proceed to Phase 33 (Guest Access + Visit Applications).**

---

_Verified: 2026-02-03T10:30:00Z_
_Verifier: Claude (gsd-verifier)_
