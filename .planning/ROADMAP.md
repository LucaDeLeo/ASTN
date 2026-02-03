# Roadmap: ASTN

## Milestones

- **v1.0 MVP** - Phases 1-6 (shipped 2026-01-18)
- **v1.1 Profile Input Speedup** - Phases 7-10 (shipped 2026-01-19)
- **v1.2 Org CRM & Events** - Phases 11-16 (shipped 2026-01-19)
- **v1.3 Visual Overhaul** - Phases 17-20 (shipped 2026-01-20)
- **v2.0 Mobile + Tauri** - Phases 21-23, 26 complete; Phase 25 deferred
- **v1.4 Hardening** - Phases 27-29 (shipped 2026-02-02) — [details](milestones/v1.4-ROADMAP.md)
- **v1.5 Org Onboarding & Co-working** - Phases 30-34 — [details](milestones/v1.5-ROADMAP.md)

## Current

**v1.5 Org Onboarding & Co-working** - Phases 30-34 — [details](milestones/v1.5-ROADMAP.md)

Enable orgs to self-onboard through an application flow, configure co-working spaces, and provide member booking + guest visit management.

| Phase                                          | Goal                                                     | Plans   | Requirements                       |
| ---------------------------------------------- | -------------------------------------------------------- | ------- | ---------------------------------- |
| 30 - Platform Admin + Org Application          | Orgs apply to join ASTN; platform admins approve         | 2 plans | 6 (ORGON-01 to ORGON-06)           |
| 31 - Org Self-Configuration + Space Definition | Approved orgs configure themselves and define space      | 2 plans | 4 (ORGON-07 to ORGON-09, COWRK-01) |
| 32 - Member Booking + Consent + Attendee View  | Members book spots and see who else is coming            | 2 plans | 7 (COWRK-02 to COWRK-08)           |
| 33 - Guest Access + Visit Applications         | Non-members apply for visits; guest-to-member conversion | 3 plans | 10 (GUEST-01 to GUEST-10)          |
| 34 - Admin Dashboard + Stats                   | Org admins manage bookings, guests, and utilization      | 4 plans | 9 (ADMIN-01 to ADMIN-09)           |

### Phase 34: Admin Dashboard + Stats ✓

**Goal:** Org admins manage bookings, guests, and utilization with comprehensive dashboards.

**Plans:**

- [x] 34-01-PLAN.md — Backend admin queries and mutations for booking management
- [x] 34-02-PLAN.md — Bookings admin page with today/calendar/list/history views
- [x] 34-03-PLAN.md — Manual booking dialog and CSV export components
- [x] 34-04-PLAN.md — Dashboard stats integration and full feature wiring

---

_Roadmap created: 2026-01-20_
_Last updated: 2026-02-03 -- Phase 34 complete (v1.5 milestone complete)_
