Now I have all the context needed. Let me produce the implementation decisions analysis for Phase 32.

---

## Implementation Decisions for Phase 32: Member Booking + Consent + Attendee View

### Implementation Decisions

**1. `spaceBookings` Table Schema**

- Decision: Create `spaceBookings` table with `date` as ISO string (e.g., `"2026-02-15"`), `startMinutes`/`endMinutes` as integers (minutes from midnight), `bookingType` (member/guest), `status` workflow, `workingOn`/`interestedInMeeting` tags, and `consentToProfileSharing` boolean
- Rationale: The roadmap explicitly states "ISO date strings, time ranges as minutes-from-midnight" for consistency with the space's `operatingHours` data model (Phase 31). Date strings simplify day-level queries (`by_space_date` index with date equality). Consent is required per-booking (not inherited from profile settings) per success criteria #4.
- Confidence: HIGH

**2. Calendar Component: react-day-picker**

- Decision: Install `react-day-picker` as the only new npm dependency. Use it for the date selection calendar with custom day rendering to show availability indicators.
- Rationale: The roadmap explicitly says "Install `react-day-picker` (the only new npm dependency in v1.5)". The codebase already uses `date-fns` (v4.1.0) which react-day-picker integrates with natively. Custom day modifiers will show "available", "nearing capacity", "at capacity" states per success criteria #5.
- Confidence: HIGH

**3. Soft Capacity Warning Strategy**

- Decision: Mutation returns `{ bookingId, capacityWarning?: 'nearing' | 'at_capacity' }` — never throws an error for capacity. Frontend shows warning toast/banner but allows booking to proceed. Capacity check counts `status in ['confirmed', 'pending']` for the date.
- Rationale: The roadmap and PROJECT.md both specify "Soft capacity: mutations return warnings, never throw errors on full spaces." The requirement says "soft warning when the space is nearing full, without blocking the booking."
- Confidence: HIGH

**4. Flexible Hours: Time Range Picker**

- Decision: Two time inputs (start/end) using native `<input type="time">` with 30-minute step. Display as "10:00 AM - 3:00 PM". Store as `startMinutes` (600) and `endMinutes` (900) integers.
- Rationale: The requirement says "flexible hours (e.g., '10am-3pm')". Using native time inputs avoids custom slider complexity. 30-minute steps are standard for co-working. Minutes-from-midnight storage matches the `operatingHours` pattern from Phase 31.
- Confidence: HIGH

**5. Consent Model: Per-Booking Required Checkbox**

- Decision: `consentToProfileSharing` is a required boolean (not optional) on `spaceBookings`. The booking form includes a checkbox: "I agree that attendees that day can see my name, headline, and skills." Booking mutation rejects if consent is false.
- Rationale: The roadmap says "Consent model: booking = consent to share booking profile (name + headline + skills). Consent stored per booking." This is distinct from the profile-level `privacySettings` — booking consent is specific to that day's attendees.
- Confidence: HIGH

**6. Attendee View: Dedicated Query Returns Consented Profiles Only**

- Decision: New query `getBookingAttendees(spaceId, date)` returns only bookings where `consentToProfileSharing = true` and `status = 'confirmed'`. For members, includes name/headline/skills from `profiles`. For guests (Phase 33), includes name/organization from `guestProfiles`.
- Rationale: Privacy-first design. Only consenting, confirmed attendees appear. Query runs client-side with member auth check. The profile subset (name + headline + skills) matches what's visible in the org directory.
- Confidence: HIGH

**7. "Working On" / "Interested In Meeting" Tags**

- Decision: Optional `workingOn` (string, max 140 chars) and `interestedInMeeting` (string, max 140 chars) fields on `spaceBookings`. Editable on the booking form and via a "My Bookings" page. Displayed in attendee view.
- Rationale: Requirement COWRK-08 says "optionally add a 'working on' or 'interested in meeting' tag." These encourage serendipitous conversations. Keeping them short (tweet-length) prevents abuse.
- Confidence: MEDIUM — exact field names and UI placement left to implementation

**8. My Bookings Route: `/org/$slug/space/bookings`**

- Decision: Route at `/org/$slug/space/bookings` shows the current user's upcoming and past bookings for this org's space. Includes cancel button for future bookings, edit button for tags.
- Rationale: Follows existing route patterns (`/org/$slug/events`, `/org/$slug/admin/members`). Nested under `/org/$slug/space/` to keep space features grouped.
- Confidence: HIGH

**9. Booking Page Route: `/org/$slug/space`**

- Decision: Main space page at `/org/$slug/space` shows: space info, calendar date picker, and after date selection: time picker, capacity indicator, attendee preview, consent checkbox, book button.
- Rationale: Single-page flow reduces friction. The user picks a date, sees who's there, selects times, and books — all without page navigation. Matches the "book spot with flexible hours" requirement.
- Confidence: HIGH

**10. Capacity Indicator: Visual States**

- Decision: Calendar day cells show: green dot (plenty of room), yellow dot (≥70% capacity), red dot (≥100% capacity). Booking page shows: "{X} / {capacity} booked" with color-coded text. Warning banner appears at ≥80% capacity.
- Rationale: Success criteria #2 says "current capacity with soft warning when nearing full." Visual indicators at multiple levels (calendar overview + booking detail) help users pick good days.
- Confidence: MEDIUM — exact thresholds (70%, 80%) are reasonable defaults but could be adjusted

**11. Booking Status State Machine**

- Decision: `status: 'pending' | 'confirmed' | 'cancelled'`. Members auto-confirm (status = 'confirmed' immediately). Guests (Phase 33) start as 'pending'. Users can cancel their own bookings.
- Rationale: The roadmap says "Members book directly" (no approval for members). The `requireApprovalForMembers` space setting exists but defaults to false. Cancelled is user-initiated; rejected is admin-initiated (Phase 33 guests).
- Confidence: HIGH

**12. Notification Type for Booking Confirmation**

- Decision: Add `'booking_confirmed'` to the `notifications.type` union. Create notification when a member books successfully, with `actionUrl` pointing to `/org/$slug/space/bookings`.
- Rationale: Follows the existing notification pattern (createNotification internal mutation). Confirmation notifications are expected UX for booking systems.
- Confidence: HIGH

**13. Plan Split: Backend-First Then Frontend**

- Decision: Split into 32-01 (Schema + Backend: `spaceBookings` table, booking mutations, attendee queries, capacity logic) and 32-02 (Frontend: booking page, calendar, my bookings, attendee view).
- Rationale: Matches Phase 30/31 pattern. Backend-first validates schema and mutations before UI work.
- Confidence: HIGH

**14. Authorization Model**

- Decision: Booking mutations require: (1) authenticated user, (2) active org membership. Query `getSpaceByOrgPublic` (already exists from Phase 31) handles member verification. New `createMemberBooking` mutation uses the same pattern.
- Rationale: Reuses the `getSpaceByOrgPublic` pattern from Phase 31 which verifies org membership without requiring admin role.
- Confidence: HIGH

---

### Uncertainties

> **Calendar library choice**: The roadmap says react-day-picker. However, I notice the codebase already has `date-fns` but no calendar component yet. Should we confirm react-day-picker is the right choice, or consider alternatives?
>
> - Option A: react-day-picker (recommended by roadmap) — lightweight, date-fns compatible, highly customizable
> - Option B: shadcn/ui Calendar component (uses react-day-picker under the hood anyway)
> - **Recommendation**: Option A directly, since shadcn Calendar is just a wrapper and we need custom day rendering for availability indicators

> **Capacity thresholds**: The exact percentages for "nearing capacity" warning are not specified.
>
> - Option A: 80% as the single warning threshold (simpler)
> - Option B: 70% for calendar indicator, 80% for booking page warning (more granular)
> - **Recommendation**: Option B for better UX, but this can be left to implementation discretion

---

### Claude's Discretion

- Exact styling of capacity indicators (dot colors, sizes, badge vs. text)
- Time picker increment (30 min recommended, but 15 min is also reasonable)
- Whether "My Bookings" shows a table or card layout (follow member list pattern)
- Toast vs. banner for capacity warnings
- Exact copy for consent checkbox ("I agree that..." wording)
- Whether to show attendee count on calendar day cells or just color dots
- Loading states and skeleton patterns (follow existing patterns)
- Mobile responsiveness of the calendar (react-day-picker handles this but may need CSS tweaks)

---

## Auto-Discuss Metadata

- **Rounds:** 1
- **Codex Available:** no
- **Uncertainties Resolution:** pending
- **Timestamp:** 2026-02-03

---

## Auto-Discuss Metadata

- **Rounds:** 2
- **Codex Available:** no
- **Uncertainties Resolution:**
- **Timestamp:** 2026-02-03T04:37:07Z

<details>
<summary>Codex Review (Round 2)</summary>

[READY] Codex not available

</details>
