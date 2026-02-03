# Features Research: v1.5 Co-working & Org Onboarding

**Domain:** Community co-working space management & organization onboarding
**Researched:** 2026-02-03
**Mode:** Ecosystem (feature landscape for small community spaces, not commercial co-working)

## Summary

Co-working space management for small community hubs (10-30 desks) needs to be dramatically simpler than commercial platforms like Nexudus, Cobot, or Optix. Those platforms solve billing, access control, meeting room hourly rates, and multi-location management -- none of which apply here. ASTN's co-working feature replaces informal processes (WhatsApp messages, Google Forms, spreadsheet tracking) with structured booking and guest approval, layered on top of the existing org membership and profile infrastructure. The key insight: for community spaces, the booking system is really a **visibility and consent tool** (who's going to be there, are they okay sharing their profile) rather than a resource allocation system.

The org onboarding flow fills a clear gap in the existing system: organizations are currently seeded by developers via `internalMutation` calls, and there is no self-service path for a new org to join ASTN. The approval gate (ASTN admin reviews applications) is essential for the AI safety community context where trust matters.

## Org Onboarding Features

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Application form with org details | Orgs need a self-service way to apply, not ask a developer | Low | Name, description, city/country, website, contact person, reason for joining |
| ASTN admin review queue | Someone must approve orgs before they go live; AI safety is trust-sensitive | Low | List of pending applications with approve/reject actions |
| Rejection with reason | Applicants need feedback, not silence | Low | Free-text reason field, shown to applicant |
| Approval notification | Org admin needs to know they're approved and what to do next | Low | In-app notification + email with link to configure |
| Org self-configuration wizard | After approval, org admin must set up their space before members join | Med | Step-through: logo upload, description, Lu.ma link, space config, invite link generation |
| Application status tracking | Applicant should see "pending", "approved", "rejected" without emailing anyone | Low | Simple status page at a stable URL |
| Duplicate detection | Prevent the same org from applying twice | Low | Check slug/name uniqueness before submission |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Pre-fill from existing org data | If org exists in ASTN's seeded list, pre-fill fields so they just claim ownership | Low | Match against `organizations` table by name/slug |
| Progressive onboarding checklist | After approval, show "3 of 5 steps complete" so admins know what to configure next | Med | Reuse the profile completeness pattern from user profiles |
| Invite-first member seeding | Let org admin paste emails to bulk-invite initial members during setup | Med | Important for BAISH-type orgs that already have a community |
| Admin notes on applications | ASTN super-admin can add internal notes to applications (e.g., "spoke with them at conference") | Low | Not shown to applicant |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Self-service org creation (no approval) | AI safety community requires trust gating; random orgs should not appear | Always require ASTN admin approval |
| Complex multi-step application | These are small community orgs, not enterprise tenants; keep it to one form | Single page form, not a 5-step wizard |
| Org billing/subscription | ASTN is not a SaaS platform charging orgs | No billing infrastructure needed |
| Org-to-org hierarchy | No parent/child org relationships | Each org is independent |
| Custom domain per org | Massive complexity for zero value at this scale | Standard `/org/{slug}` URL pattern |

## Co-working Space Features

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Space configuration (per org) | Admin defines: capacity, operating hours, days open, space name/description | Med | Stored on `organizations` table or new `coworkingSpaces` table |
| Operating hours display | Members need to know when the space is open before booking | Low | Simple hours display per day-of-week |
| Daily booking (one-off, full day) | Core action: "I want to come on Thursday" | Low | Date picker + confirm, no hourly slots needed |
| Capacity display with soft warnings | "8 of 15 desks booked" -- warn at 80%, allow overbooking | Low | Count bookings for date, show against capacity |
| Booking cancellation | People's plans change; must be able to cancel | Low | Simple cancel button on own booking |
| See who else is booked (with consent) | Core value of community spaces -- know who you'll work alongside | Med | Only show profiles of people who consented (booking = consent per spec) |
| Today/upcoming bookings view | Quick glance: am I booked today? What's coming up? | Low | Personal booking list filtered by date |
| Calendar/date picker for booking | Visual way to pick a date and see availability | Med | Calendar component showing booked counts per day |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Profile preview for co-present members | See mini-profiles of who's booked the same day -- this is unique to ASTN because profiles already exist | Med | Leverage existing profile data + privacy settings |
| "I'm interested in meeting..." tag on booking | When booking, optionally tag what you're working on or who you'd like to meet | Low | Free text or tag selection, shown to other attendees |
| Booking from event context | If attending an org event at the space, offer to book the space for the same day | Low | Cross-link between events and bookings |
| Repeat booking (same day each week) | For regulars who come every Tuesday, reduce friction | Med | Generate individual daily bookings for N weeks ahead |
| Utilization insights for members | "Tuesdays are usually quiet, Thursdays are busy" to help members pick good days | Low | Aggregate historical bookings into simple heatmap |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Hourly time slots | Massive complexity, wrong model for community spaces where people come for the day | Daily bookings only (as spec requires) |
| Hard capacity limits (block booking) | Community spaces should use soft warnings, not hard blocks; overcapacity is rare at 10-30 desks | Soft warning at threshold (e.g., 80%), allow booking anyway |
| Desk assignment / specific desk booking | Individual desk selection is commercial co-working complexity; community spaces have open seating | Just "book a spot", not "book desk #7" |
| Room booking system | Different domain; rooms have time slots, equipment, AV -- out of scope | Defer entirely unless explicitly requested |
| Payment/billing for bookings | Community spaces are typically free for members; guest access is approved, not paid | No payment integration |
| Check-in/check-out tracking | Adds friction for casual community use; attendance tracking already exists for events | Booking = intent to attend, not verified presence |
| Waitlists | At 10-30 desks, soft capacity with human coordination handles overflow | Show "space is full" but still allow booking; admin can manage |
| Multi-space booking | One org = one space for now; BAISH has one office | Defer multi-space to future if needed |

## Guest Access Features

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Quick guest account creation | Guests need minimal friction to apply; they don't have ASTN profiles yet | Med | Lightweight signup: name, email, (optional) brief bio. NOT full ASTN registration |
| Visit application form (org-customizable) | Each org may want different info from guests (e.g., "How did you hear about us?", "What's your interest in AI safety?") | Med | Org admin defines custom fields; guest fills them when requesting a visit |
| Org admin approval/rejection of guest visits | Core flow: guest applies, admin reviews, approves or rejects | Med | Notification to admin, review queue, approve/reject with optional message |
| Guest notification of approval/rejection | Guest needs to know if they can come | Low | Email + in-app notification to guest account |
| Approved guest appears on booking day | Other members should see guests who are approved for a given day | Low | Guest bookings show alongside member bookings |
| Guest info visible to org admin | Admin needs to see who's coming and their application answers | Low | Part of admin booking/attendance view |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Guest-to-member conversion with data pre-fill | If guest later creates full ASTN profile, their guest info (name, bio, visit history) pre-fills the profile | Med | Map guest account data to profile fields; this is a killer feature that rewards guests for the info they already provided |
| Public visit request page (shareable link) | Org can share a URL (e.g., `/org/baish/visit`) that anyone can use to request a visit without navigating ASTN | Low | Single public page, no auth required to view (auth required to submit) |
| Guest visit history | Track which guests have visited before and how many times -- helps admin evaluate repeat visitors for membership | Low | Query past approved guest bookings per guest account |
| Guest profile card | Minimal profile shown to members on booking day: name, bio, interest area | Low | Derived from guest application fields, distinct from full ASTN profile |
| Batch guest approvals | Admin can approve multiple guest requests at once for a busy day | Low | Multi-select + approve action in admin queue |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full ASTN registration required for guests | Massive friction; guests may never come back, forcing full profile creation wastes everyone's time | Lightweight guest account (name + email minimum) |
| Automatic guest approval | Defeats the purpose; orgs want to vet who visits their space | Always require org admin approval |
| Guest self-booking (no application) | Guests should not book directly; the application form is the filtering mechanism | Application -> approval -> booking flow |
| Recurring guest access | Guests should eventually become members if they're regulars; recurring access blurs the line | Each visit is a separate application, or admin invites guest to become member |
| Anonymous guest visits | Privacy matters, but completely anonymous visits defeat the community purpose | Minimum: name + email required |
| Complex guest tiers (day pass, week pass, etc.) | Commercial co-working complexity; community spaces have one guest type | Single guest type: approved visitor for a specific day |

## Admin Dashboard Features

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Today's bookings overview | Admin needs to see who's coming today at a glance | Low | List of members + approved guests for today |
| Upcoming bookings calendar | See bookings for the next week/month | Med | Calendar view or list view with day grouping |
| Guest application queue | Pending guest visit requests need a clear review interface | Med | List with application details, approve/reject buttons |
| Booking history | See past bookings for utilization tracking | Low | Paginated list with date filtering |
| Space configuration panel | Admin sets capacity, hours, custom application fields | Med | Settings page under org admin |
| Manual booking management | Admin can add/remove bookings on behalf of members | Low | Override capability for edge cases |
| Member booking list | See all bookings for a specific member | Low | Part of existing CRM member profile view |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Utilization statistics | Weekly/monthly utilization rate, peak days, average bookings -- helps justify space costs to funders | Med | Aggregate queries on booking data, charts |
| Guest conversion tracking | How many guests became members? Important metric for community growth | Med | Track guest account -> org membership conversions |
| Exportable booking data (CSV) | Consistent with existing CRM export functionality; useful for reporting to funders/stakeholders | Low | Reuse existing CSV export pattern from CRM |
| Space configuration preview | Admin sees what the booking page looks like to members before publishing | Low | Preview mode for the member-facing booking page |
| Attendance vs booking comparison | Compare who booked vs who actually showed up (if attendance data exists) | Med | Cross-reference bookings with any attendance tracking |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time occupancy tracking | Requires hardware (sensors, badge readers) that community spaces don't have | Bookings as proxy for attendance |
| Revenue/billing dashboards | No money changes hands in community co-working | Utilization metrics only |
| Multi-space management | Single space per org for now | Defer to future if demand appears |
| Complex role-based access for space management | Existing admin/member roles are sufficient | Reuse existing `requireOrgAdmin` pattern |
| Automated space capacity optimization | Over-engineering for 10-30 desks | Simple utilization stats are sufficient |

## Feature Dependencies

### Dependencies on Existing ASTN Features

| New Feature | Depends On | How |
|-------------|-----------|-----|
| Org application + approval | `organizations` table, ASTN admin concept | Applications create new org records; need ASTN-level admin role (distinct from org admin) |
| Org self-configuration | `organizations` table, `orgMemberships` | Extends org record with space config; uses existing admin auth |
| Member daily booking | `orgMemberships`, `profiles` | Booking requires org membership; profile data shown to co-present members |
| Guest quick account | Auth system (`@convex-dev/auth`) | Guest accounts use existing auth but with minimal profile requirements |
| Guest visit application | Custom form fields per org | New `coworkingSpaces` or org extension table for form config |
| Consent-based profile visibility | `profiles.privacySettings` | Booking = consent to show profile, extends existing privacy model |
| Admin booking dashboard | Existing CRM dashboard pattern | Same layout, similar queries, just booking data |
| CSV export for bookings | Existing CSV export in CRM | Reuse the exact same export pattern |
| Guest-to-profile pre-fill | Profile creation wizard | Map guest data to profile fields during onboarding |
| Booking notifications | Existing notification system | New notification types for booking confirmations, guest approvals |
| Utilization stats | Existing org stats pattern (`orgs/stats.ts`) | Same aggregation approach, different data source |

### New Infrastructure Required

| Component | Why Needed | Complexity |
|-----------|-----------|------------|
| ASTN super-admin role | Org approval requires a platform-level admin, not an org admin | Low -- add `isSuperAdmin` flag to users or separate table |
| Guest accounts (lightweight) | Guests need auth without full profile | Med -- extend auth to support minimal accounts, or use existing auth with a "guest" flag |
| Co-working space config (per org) | Space capacity, hours, custom form fields | Med -- new table or extend `organizations` |
| Bookings table | Core data model for daily bookings | Med -- new `coworkingBookings` table |
| Guest visit applications table | Track guest applications with custom field responses | Med -- new `guestVisitApplications` table |
| Custom form builder (simple) | Orgs define custom questions for guest applications | Med -- JSON schema for form fields, dynamic rendering |

### Suggested Build Order (Dependencies Flow)

```
1. ASTN super-admin role + org application/approval
   (Foundation: nothing else works without approved orgs)
        |
        v
2. Co-working space configuration (capacity, hours, form fields)
   (Depends on: approved org with admin)
        |
        v
3. Member daily booking + consent + "who's here" view
   (Depends on: space config for capacity/hours)
        |
        v
4. Guest account creation + visit application + org approval
   (Depends on: space config for custom form, booking system for approved guests)
        |
        v
5. Admin dashboard (bookings, guests, utilization)
   (Depends on: booking data existing to display)
        |
        v
6. Guest-to-profile pre-fill + polish
   (Depends on: guest accounts with data, profile creation wizard)
```

## Domain Patterns from Industry Research

### From Nexudus, Optix, Cobot (Commercial Platforms)

These platforms solve problems ASTN does **not** have (billing, access control hardware, multi-location management), but their feature patterns reveal what users expect:

1. **Self-service booking is universal.** Members always book themselves; admin override exists but is rarely needed.
2. **Visitor management is always approval-based.** No commercial platform allows walk-in guest booking. Pre-registration with admin approval is standard.
3. **Capacity is displayed, not enforced.** Even commercial platforms use "show availability" rather than hard blocks for desk booking (rooms are different -- they do enforce).
4. **Check-in is separate from booking.** Booking = intent. Check-in = presence. ASTN should not conflate these. The spec wisely avoids check-in.
5. **Analytics focus on utilization.** The primary admin metric is "how full is the space?" not "how much revenue?". This maps perfectly to ASTN's non-commercial model.

### Community Space vs Commercial Space Differences

| Aspect | Commercial (WeWork, Nexudus) | Community (ASTN target) |
|--------|------------------------------|------------------------|
| Booking model | Hourly/monthly plans | Daily one-off |
| Payment | Per-desk pricing | Free for members |
| Guest access | Day pass purchase | Application + approval |
| Capacity enforcement | Hard limits (paid desks) | Soft warnings |
| Identity | Anonymous, transactional | Profile-based, community |
| Primary metric | Revenue per desk | Utilization + community engagement |
| Access control | Badge/key hardware | Trust-based |

## MVP Recommendation

For MVP, prioritize in this order:

1. **Org application + ASTN admin approval** (Table stakes -- unlocks everything else)
2. **Space configuration** (Table stakes -- defines capacity and hours)
3. **Member daily booking with consent** (Table stakes -- core user action)
4. **Guest quick account + visit application + approval** (Table stakes -- replaces Google Forms)
5. **Admin booking dashboard** (Table stakes -- admin needs visibility)
6. **"Who's here" profile view** (Differentiator -- the unique ASTN value)

Defer to post-MVP:
- Repeat booking: Nice but not essential, regulars can book daily
- Utilization statistics: Helpful but can be added after booking data accumulates
- Guest-to-profile pre-fill: Valuable but depends on guests actually creating profiles later
- Booking-from-event-context: Cross-feature nice-to-have

## Sources

- Nexudus features page (WebFetch, 2026-02-03): Desk/room booking, visitor management, member management, admin tools, analytics -- confirms standard patterns [MEDIUM confidence]
- Optix features page (WebFetch, 2026-02-03): Desk booking automation, visitor/delivery management, CRM lead-to-member, check-ins, analytics [MEDIUM confidence]
- Cobot features page (WebFetch, 2026-02-03): Self-service/admin-only booking, external bookings with custom pricing, member portal, multi-location analytics, access control integration [MEDIUM confidence]
- ASTN codebase analysis: `convex/schema.ts`, `convex/organizations.ts`, `convex/orgs/admin.ts`, `convex/programs.ts` -- existing patterns for org admin, membership, approval flows, program management [HIGH confidence]
- Domain expertise: Co-working space management patterns, community space operations, approval flow UX [MEDIUM confidence -- based on training data, not verified against 2026 sources]

## Confidence: MEDIUM-HIGH

Stack and architecture patterns are HIGH confidence (based on existing codebase analysis and well-established domain patterns). Feature categorization is MEDIUM-HIGH confidence -- the table stakes vs differentiator split is based on industry platform analysis plus the specific ASTN community context. The main uncertainty is around custom form builder complexity (how flexible do org-defined guest application forms need to be?) and the ASTN super-admin role design (simple flag vs. separate table vs. dedicated admin app).
