# Project Research Summary: v1.5 Org Onboarding & Co-working

**Project:** AI Safety Talent Network (ASTN) - Milestone v1.5
**Domain:** Org onboarding, co-working space management, guest access
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

- **v1.5 is a CRUD + workflow milestone, not an AI/LLM milestone.** Every feature (org applications, space booking, guest access, admin dashboards) is standard approval-workflow and booking logic. Zero LLM calls, zero new external services, zero new env variables. The only new npm dependency is `react-day-picker` for the calendar UI.
- **The existing codebase already contains proven patterns for every major v1.5 workflow.** Org application approval mirrors `programParticipation` status flows. Space admin permissions reuse `requireOrgAdmin`. Notifications extend the existing type union. Forms follow the existing `useState` pattern. The architecture risk is low because this is pattern replication, not greenfield design.
- **Guest identity is the single hardest architectural decision.** Guests need lightweight accounts (name + email) without triggering full profile expectations (engagement scoring, match computation, CRM visibility). The recommendation is to use real auth accounts (not Anonymous provider) with a separate `guestProfiles` table, keeping guest data isolated from the `profiles` table until explicit conversion. This decision must be made before any feature code is written.
- **The temporal model for flexible-hour bookings ("10am-3pm") is the second biggest risk.** Storing times as minutes-from-midnight in the space's local timezone (not UTC) and computing capacity per-hour-slot within transactional Convex mutations prevents both timezone bugs and race conditions. Getting this wrong means rewriting all booking logic.
- **Platform admin is a new authorization layer that must be cleanly separated from org admin.** A BAISH org admin should not be able to approve new organizations joining the ASTN network. A dedicated `platformAdmins` table with a `requirePlatformAdmin` helper is the cleanest approach.
- **Five new Convex tables, 11 new routes, and 7 new notification types are needed.** This is a substantial but well-scoped addition to the existing schema (currently ~15 tables, ~27 routes). All new tables are additive; modifications to existing tables use only optional fields, so schema migration is low-risk.

## Key Findings

### Stack Decisions

The existing stack handles v1.5 with minimal additions. One new dependency is required:

- **react-day-picker ^9.13.0**: Calendar UI for booking date selection and admin bookings view. It is the standard behind shadcn/ui's Calendar component, depends on date-fns (already installed), and adds ~45KB before tree-shaking.

Everything else maps to what is already installed and proven:

| Capability | Existing Solution |
|---|---|
| Approval workflows | `programParticipation` status pattern |
| Auth (including guests) | `@convex-dev/auth` Password + OAuth providers |
| Custom form rendering | JSON schema + dynamic React (`useState` pattern) |
| Email notifications | `@convex-dev/resend` + `@react-email/components` |
| Timezone handling | `date-fns-tz` |
| Real-time booking updates | Convex subscriptions (built-in) |
| Admin stats | `orgs/stats.ts` aggregation pattern |

**Rejected libraries:** FullCalendar (150KB, overkill), react-big-calendar (overkill), react-hook-form (inconsistent with codebase), recharts (stat cards are sufficient at pilot scale), rrule (recurring bookings out of scope).

**No new environment variables.** No additional LLM costs. Email volume stays within Resend free tier.

See: `STACK-v1.5-coworking-onboarding.md`

### Table Stakes vs Differentiators

**Must have (table stakes):**
- Org application form + ASTN admin review queue + approval/rejection with notifications
- Space configuration: capacity, operating hours, timezone, name/description
- Member daily booking with date picker, time range selection, and soft capacity warnings
- Guest quick account creation (name + email, not full ASTN registration)
- Guest visit application with org-customizable form fields + org admin approval
- "Who's here" attendee list with consent-based profile visibility
- Admin dashboard: today's bookings, upcoming calendar, guest application queue, booking history

**Should have (differentiators):**
- Profile preview for co-present members (leverages existing profile data -- unique to ASTN)
- Guest-to-member conversion with data pre-fill (killer feature for the guest funnel)
- Progressive onboarding checklist for newly approved orgs
- Utilization insights (peak days, average bookings, guest vs member ratio)
- CSV export for bookings (reuse existing CRM export pattern)

**Defer to post-v1.5:**
- Repeat/recurring booking (regulars can book daily for now)
- Booking-from-event-context cross-linking
- Real-time occupancy tracking (requires hardware)
- Room booking system (different domain)
- Payment/billing (community spaces are free)
- Hourly time slots, desk assignment, waitlists

**Key insight:** For community spaces (10-30 desks), the booking system is a **visibility and consent tool** (who is coming, are they okay sharing their profile) rather than a resource allocation system. This is fundamentally different from commercial co-working platforms.

See: `FEATURES-v1.5-coworking-onboarding.md`

### Architecture Highlights

**Five new tables:**
1. `orgApplications` -- org onboarding applications with status workflow (pending/approved/rejected/withdrawn)
2. `coworkingSpaces` -- per-org space definitions with capacity, operating hours (minutes-from-midnight per day), timezone, custom visit application fields, guest access toggles
3. `spaceBookings` -- daily bookings with ISO date strings, time ranges (minutes-from-midnight), booking type (member/guest), status workflow, consent flag, application responses
4. `guestProfiles` -- lightweight guest info (name, email, organization, role) with `hasFullProfile` conversion tracking
5. `platformAdmins` -- small table of platform-level admin user IDs

**Modified tables:**
- `organizations` -- add optional `contactEmail`, `website`, `socialLinks`, `hasCoworkingSpace` fields
- `notifications` -- extend type union with 7 new notification types; add optional `bookingId` and `applicationId` reference fields

**New Convex file structure:**
```
convex/
  applications/     # Org application submit, approve, reject, withdraw
  spaces/           # Space CRUD, booking mutations, capacity queries, stats
  guests/           # Guest profile CRUD, conversion to full profile
  platformAdmin/    # Platform admin checks, pending application queries
```

**Key patterns:**
- Dates stored as ISO strings ("2026-02-15"), times as minutes-from-midnight -- avoids UTC/timezone conversion bugs for inherently local bookings
- Capacity checks + booking inserts in single Convex mutation (transactional, no race conditions)
- Soft capacity: mutations return warnings, never throw errors on full spaces
- Guest accounts use real `@convex-dev/auth` accounts (not Anonymous provider) for persistent identity, notifications, and later conversion
- 11 new routes: 5 org-scoped member routes, 4 org admin routes, 2 platform admin routes

See: `ARCHITECTURE-v1.5-coworking-onboarding.md`

### Top Pitfalls to Avoid

1. **Guest users polluting the identity model (CRITICAL):** Guests must not trigger engagement scoring, match computation, or appear in CRM member lists. Use a separate `guestProfiles` table and audit all existing `auth.getUserId()` call sites (~15+ files) for guest vs full user behavior. Decide the identity architecture before writing any feature code.

2. **Flexible-hour bookings without a temporal model (CRITICAL):** Store times as minutes-from-midnight in the space's local timezone. Compute capacity per hourly slot. Check capacity + insert booking in a single Convex mutation to prevent race conditions. Never store booking times as UTC timestamps.

3. **Platform admin conflated with org admin (CRITICAL):** Create a separate `platformAdmins` table and `requirePlatformAdmin` helper. Never reuse `requireAnyOrgAdmin` for platform-level actions. Document the permission matrix (platform admin / org admin / member / guest) before building features.

4. **Org application workflow without state discipline (HIGH):** Define explicit legal state transitions. Validate transitions in mutations (e.g., can only approve from "pending", not from "rejected"). Store audit trail of who changed state and when. Design re-application flow (new record, not mutation of old one).

5. **Consent model under-specified for booking visibility (HIGH):** Booking consent is separate from general profile privacy settings. Define a "booking profile" subset (name + headline + skills only). Store consent per booking, not globally. Create a dedicated `bookingProfile` query that returns only the consented subset.

See: `PITFALLS-v1.5-coworking-onboarding.md`

## Implications for Roadmap

### Phase 1: Platform Admin + Org Application (Foundation)

**Rationale:** Everything else depends on organizations existing in the system. The org application flow is the entry gate. Platform admin authorization must be established first to avoid security issues in later phases.

**Delivers:** Self-service org application, ASTN admin review queue, approval that creates org + admin membership, application status tracking.

**Features addressed:** Org application form, ASTN admin review queue, rejection with reason, approval notification, application status tracking, duplicate detection.

**Pitfalls to avoid:** Platform admin vs org admin role confusion (#3), state machine discipline for application workflow (#4), auth helper consolidation (I-2).

**Stack:** No new dependencies. Extends existing `organizations`, `orgMemberships`, `notifications`.

**Estimated scope:** `platformAdmins` table, `orgApplications` table, `requirePlatformAdmin` helper, 2 platform admin routes, 2 applicant routes, notification integration.

### Phase 2: Org Self-Configuration + Space Definition

**Rationale:** Approved orgs need to configure themselves and define their co-working space before anyone can book. Space configuration includes the custom visit application form fields that the guest flow depends on.

**Delivers:** Org settings extension (contact, website, social links), co-working space creation with capacity/hours/timezone, custom visit application field builder, guest access toggle.

**Features addressed:** Org self-configuration wizard, space configuration, operating hours display, custom visit application forms.

**Pitfalls to avoid:** Operating hours timezone handling (#9 -- use minutes-from-midnight + IANA timezone), custom form schema model (#5 -- template approach with predefined field types, not a full form builder), orgMemberships overload (I-1 -- keep space config in separate `coworkingSpaces` table).

**Stack:** No new dependencies. New `coworkingSpaces` table. Extend `organizations` with optional fields.

### Phase 3: Member Booking + Consent + Attendee View

**Rationale:** Members are the primary users and their flow is simpler than guests (no approval typically needed). The booking infrastructure built here is shared by the guest flow in Phase 4.

**Delivers:** Date picker booking UI, flexible time range selection, soft capacity warnings, "who's here" attendee list with profile consent, personal booking list, booking confirmation notifications.

**Features addressed:** Daily booking, capacity display with soft warnings, booking cancellation, consent-based profile visibility, calendar/date picker, profile preview for co-present members.

**Pitfalls to avoid:** Temporal model for capacity (#2 -- hourly slots, transactional checks), consent model (#6 -- separate booking visibility scope, per-booking consent), soft capacity UX (#7 -- show actual numbers, clear copy), cancellation edge cases (#13 -- simple policy for MVP).

**Stack:** `react-day-picker` installed here. New `spaceBookings` table. shadcn/ui Calendar + DatePicker components. 3 member-facing routes.

### Phase 4: Guest Access + Visit Applications

**Rationale:** Guest flow is the most architecturally complex piece (account creation + application + approval + potential conversion) and depends on the booking infrastructure from Phase 3.

**Delivers:** Guest quick account creation, visit application form (with org-customized fields), org admin approval/rejection of guest visits, guest notification flow, guest-to-member conversion with profile pre-fill.

**Features addressed:** Quick guest account creation, visit application form, org admin approval/rejection, guest notification, guest appears on booking day, guest-to-profile pre-fill, public visit request page.

**Pitfalls to avoid:** Guest identity model (#1 -- separate `guestProfiles` table, audit existing `getUserId` calls), guest-to-member conversion data loss (#8 -- email-based linking, pre-fill mapping defined up front), reusing programs pattern as-is (I-5 -- separate table and flow for visit applications), visit approval without notifications (#12 -- notify admins immediately).

**Stack:** No new dependencies. New `guestProfiles` table. 2 guest-facing routes.

### Phase 5: Admin Dashboard for Bookings + Stats

**Rationale:** Admin tools depend on booking data existing from Phases 3-4. Building the dashboard last means admins already have notification-based approval flow while the full dashboard is developed.

**Delivers:** Admin bookings calendar view, daily booking detail, guest application review queue, utilization statistics, integration with existing org admin dashboard.

**Features addressed:** Today's bookings overview, upcoming bookings calendar, guest application queue, booking history, utilization statistics, CSV export.

**Pitfalls to avoid:** Dashboard overload (#11 -- separate tab for space management, date-scoped queries, denormalized stats), notification preferences for new types (I-3 -- extend preferences system with booking category).

**Stack:** No new dependencies. 4 admin routes. Reuses existing stat card and CSV export patterns.

### Phase Ordering Rationale

- **Foundation first:** Platform admin + org application must come first because every subsequent feature requires an approved org to exist.
- **Configuration before consumption:** Space definition (Phase 2) must precede booking (Phase 3) because you cannot book a space that has not been defined.
- **Members before guests:** Member booking (Phase 3) is simpler (authenticated, known, auto-approved) and establishes the shared booking infrastructure that guest access (Phase 4) builds on.
- **Guest access is the most complex flow:** It touches auth, a new table, custom forms, approval workflows, notifications, and conversion -- so it comes after all supporting infrastructure is in place.
- **Admin dashboard last:** Admins can manage via notifications + inline approval during Phases 3-4. The full dashboard (Phase 5) is an optimization over the existing workflow, not a blocker.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 4 (Guest Access):** The guest identity architecture has the most open design questions. The conversion flow (guest -> member with data pre-fill) needs explicit field mapping. Auth flow for guest sign-up with return URL needs UX validation.
- **Phase 3 (Member Booking):** The consent model for booking-based profile visibility needs precise specification. What fields are exposed? How does it interact with existing privacy settings? This should be nailed down in requirements.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Platform Admin + Org Application):** Well-documented approval workflow pattern. Directly mirrors existing `programParticipation` status flow with a new auth helper.
- **Phase 2 (Space Configuration):** Straightforward CRUD for space settings. The custom form field schema is a known pattern (JSON schema + dynamic rendering).
- **Phase 5 (Admin Dashboard):** Follows established admin dashboard patterns from existing CRM. Calendar view with react-day-picker is standard.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Single new dependency identified. All other capabilities verified against existing `package.json` and codebase patterns. |
| Features | MEDIUM-HIGH | Table stakes validated against commercial platforms (Nexudus, Optix, Cobot). Community-space-specific adaptations are inference-based but well-reasoned. |
| Architecture | HIGH | Based on 650+ lines of existing schema analysis, 2000+ lines of existing Convex functions, and proven patterns. |
| Pitfalls | HIGH | Specific to this project's codebase. Integration pitfalls identified by cross-referencing existing code with new requirements. |

**Overall confidence:** HIGH

### Gaps to Address

- **Guest sign-up friction:** The recommendation is real auth accounts over Anonymous, but the actual UX friction of "name + email + password" for a one-time visit should be validated. Magic link (email-based) auth could reduce friction without schema changes.
- **Custom form field complexity:** How flexible do org-defined guest application forms actually need to be? The template approach (text, textarea, select, checkbox) covers 95% of cases, but should be confirmed with BAISH as the pilot org.
- **Consent model granularity:** The spec says "booking = consent to share profile" but does not specify which profile fields. The recommendation (name + headline + skills) needs explicit confirmation.
- **Re-application flow:** Can a rejected org re-apply? The recommendation (new application record preserving rejection history) needs product confirmation.
- **Multi-space per org:** Architecture supports it (separate `coworkingSpaces` table with `orgId`), but the MVP assumes one space per org. Should this constraint be enforced or just documented?

## Sources

### Primary (HIGH confidence)
- ASTN codebase: `convex/schema.ts` (657 lines), `convex/lib/auth.ts`, `convex/orgs/admin.ts`, `convex/orgs/membership.ts`, `convex/programs.ts`, `convex/attendance/`, `convex/notifications/`, `convex/orgs/stats.ts`, `package.json`
- ASTN codebase: 27 existing routes in `src/routes/`
- Project context: `.planning/PROJECT.md`, `.planning/MILESTONES.md`
- react-day-picker npm registry: version 9.13.0, date-fns dependency verification
- shadcn/ui Calendar + DatePicker documentation
- Convex auth patterns: `@convex-dev/auth` v0.0.90

### Secondary (MEDIUM confidence)
- Nexudus features page: desk/room booking, visitor management, admin tools, analytics
- Optix features page: desk booking automation, visitor management, CRM, check-ins
- Cobot features page: self-service booking, external bookings, member portal, analytics
- Prior research: `STACK-v1.2-crm-events.md` patterns and decisions

### Tertiary (LOW confidence)
- Domain expertise on community co-working space patterns (based on training data, not verified against 2026 sources)

---
*Research completed: 2026-02-03*
*Ready for roadmap: yes*
