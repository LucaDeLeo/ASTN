# Requirements: ASTN v1.5 Org Onboarding & Co-working

**Defined:** 2026-02-03
**Core Value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh

## v1.5 Requirements

### Org Onboarding

- [x] **ORGON-01**: Org can submit application to join ASTN (name, description, city/country, website, contact person, reason for joining)
- [x] **ORGON-02**: ASTN platform admin can view pending org applications in a review queue
- [x] **ORGON-03**: ASTN platform admin can approve or reject org applications with a reason
- [x] **ORGON-04**: Rejected applicant sees rejection reason; approved applicant receives notification with link to configure
- [x] **ORGON-05**: Applicant can check application status (pending/approved/rejected) at a stable URL
- [x] **ORGON-06**: Duplicate org detection prevents the same org from applying twice
- [ ] **ORGON-07**: Approved org admin completes self-configuration wizard (logo, description, space config, invite link generation)
- [ ] **ORGON-08**: Org admin sees progressive onboarding checklist showing setup completion progress
- [ ] **ORGON-09**: Org admin can bulk-invite initial members via email during setup

### Co-working Space

- [ ] **COWRK-01**: Org admin can configure co-working space (capacity, operating hours per day-of-week, space name/description)
- [ ] **COWRK-02**: Members can book a spot for a specific day with flexible hours ("10am-3pm")
- [ ] **COWRK-03**: Booking page shows current capacity with soft warnings when nearing full (allows overbooking)
- [ ] **COWRK-04**: Members can cancel their own bookings
- [ ] **COWRK-05**: Members see who else is booked for the same day (booking = consent to profile visibility)
- [ ] **COWRK-06**: Members can view their today/upcoming bookings in a personal view
- [ ] **COWRK-07**: Calendar date picker shows availability per day when booking
- [ ] **COWRK-08**: Members can optionally add a "what I'm working on" or "interested in meeting" tag when booking

### Guest Access

- [ ] **GUEST-01**: Non-members can create a lightweight guest account (name + email) with minimal friction
- [ ] **GUEST-02**: Org admin can define custom visit application fields (e.g., "How did you hear about us?", "Interest in AI safety?")
- [ ] **GUEST-03**: Guest fills org-customized visit application form when requesting a visit for a specific day
- [ ] **GUEST-04**: Org admin can approve or reject guest visit applications with optional message
- [ ] **GUEST-05**: Guest receives notification (email + in-app) when visit is approved or rejected
- [ ] **GUEST-06**: Approved guests appear alongside members on that day's booking view
- [ ] **GUEST-07**: Org can share a public visit request page (e.g., `/org/baish/visit`) for guests to apply
- [ ] **GUEST-08**: Guest info pre-fills ASTN profile fields if guest later creates a full account
- [ ] **GUEST-09**: Org admin can view guest visit history (past approved visits per guest)
- [ ] **GUEST-10**: Org admin can batch-approve multiple guest applications at once

### Admin Dashboard

- [ ] **ADMIN-01**: Org admin sees today's bookings overview (members + approved guests)
- [ ] **ADMIN-02**: Org admin can view upcoming bookings in calendar or list view
- [ ] **ADMIN-03**: Org admin has a dedicated guest application review queue
- [ ] **ADMIN-04**: Org admin can view booking history with date range filtering
- [ ] **ADMIN-05**: Org admin can configure space settings (capacity, hours, custom guest form fields)
- [ ] **ADMIN-06**: Org admin can manually add or remove bookings on behalf of members
- [ ] **ADMIN-07**: Org admin sees utilization statistics (weekly/monthly rates, peak days, average bookings)
- [ ] **ADMIN-08**: Org admin sees guest conversion tracking (guests who became org members)
- [ ] **ADMIN-09**: Org admin can export booking data as CSV

## Future Requirements

Deferred to later milestones:

- Recurring bookings ("every Tuesday") -- regulars can book one-off daily for now
- Booking from event context (cross-link events + bookings)
- Attendance vs booking comparison (who booked vs who actually showed up)
- Space configuration preview (admin sees member-facing page before publishing)
- Utilization insights for members ("Tuesdays are quiet, Thursdays are busy")
- Auto-approval rules for visit applications ("auto-approve ASTN members" toggle)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hourly time slots | Wrong model for community spaces; daily bookings with flexible hours sufficient |
| Hard capacity limits | Community spaces use soft warnings; overcapacity rare at 10-30 desks |
| Desk assignment / specific desk booking | Commercial co-working complexity; community spaces have open seating |
| Room booking system | Different domain with time slots, equipment, AV -- separate feature |
| Payment/billing for bookings | Community spaces are free for members; guest access is approved, not paid |
| Check-in/check-out tracking | Adds friction; booking = intent to attend |
| Multi-space per org | One space per org for now; BAISH has one office |
| Recurring guest access | Guests should become members if regular; each visit is separate |
| Self-service org creation (no approval) | AI safety community requires trust gating |
| Org billing/subscription | ASTN is not a SaaS platform |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ORGON-01 | Phase 30 | Complete |
| ORGON-02 | Phase 30 | Complete |
| ORGON-03 | Phase 30 | Complete |
| ORGON-04 | Phase 30 | Complete |
| ORGON-05 | Phase 30 | Complete |
| ORGON-06 | Phase 30 | Complete |
| ORGON-07 | Phase 31 | Pending |
| ORGON-08 | Phase 31 | Pending |
| ORGON-09 | Phase 31 | Pending |
| COWRK-01 | Phase 31 | Pending |
| COWRK-02 | Phase 32 | Pending |
| COWRK-03 | Phase 32 | Pending |
| COWRK-04 | Phase 32 | Pending |
| COWRK-05 | Phase 32 | Pending |
| COWRK-06 | Phase 32 | Pending |
| COWRK-07 | Phase 32 | Pending |
| COWRK-08 | Phase 32 | Pending |
| GUEST-01 | Phase 33 | Pending |
| GUEST-02 | Phase 33 | Pending |
| GUEST-03 | Phase 33 | Pending |
| GUEST-04 | Phase 33 | Pending |
| GUEST-05 | Phase 33 | Pending |
| GUEST-06 | Phase 33 | Pending |
| GUEST-07 | Phase 33 | Pending |
| GUEST-08 | Phase 33 | Pending |
| GUEST-09 | Phase 33 | Pending |
| GUEST-10 | Phase 33 | Pending |
| ADMIN-01 | Phase 34 | Pending |
| ADMIN-02 | Phase 34 | Pending |
| ADMIN-03 | Phase 34 | Pending |
| ADMIN-04 | Phase 34 | Pending |
| ADMIN-05 | Phase 34 | Pending |
| ADMIN-06 | Phase 34 | Pending |
| ADMIN-07 | Phase 34 | Pending |
| ADMIN-08 | Phase 34 | Pending |
| ADMIN-09 | Phase 34 | Pending |

**Coverage:**
- v1.5 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 -- Phase 30 requirements (ORGON-01 to ORGON-06) marked Complete*
