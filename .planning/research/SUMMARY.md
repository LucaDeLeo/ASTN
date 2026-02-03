# Project Research Summary: v1.2 Org CRM & Events

**Project:** AI Safety Talent Network (ASTN) - Milestone v1.2
**Domain:** Community management, event management, engagement scoring
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

- **Zero new dependencies required**: The existing ASTN stack (Convex, TanStack, Resend, Claude Haiku) handles 100% of v1.2 requirements. No npm installs needed.
- **Self-updating CRM is the key differentiator**: Unlike traditional org CRMs where members never update data, ASTN's members maintain their own profiles (for matching value) while orgs get a CRM view. This solves the fundamental CRM data-decay problem.
- **Three critical pitfalls to design around**: (1) notification fatigue will destroy engagement if not architected with batching from day one, (2) post-event attendance tracking fails at <10% completion if feedback is required before confirmation, (3) real-time CRM dashboards will create performance/cost explosion at 50+ members.
- **LLM engagement scoring must be explainable with admin override**: The AI safety community is particularly sensitive to opaque AI systems. Scores need visible input signals and human override capability.
- **Build order is critical**: Events depend on org discovery, attendance depends on events, engagement scoring depends on attendance data. Cannot parallelize these phases.

## Key Findings

### Stack Decisions

**Use (already installed):**

- **Convex scheduler + crons**: Event reminders, attendance prompts, engagement recomputation
- **date-fns + date-fns-tz**: Timezone handling for events (already has IANA timezone pattern)
- **@convex-dev/resend**: Event notifications using existing email batch patterns
- **Claude Haiku 4.5**: Engagement scoring (same pattern as matching/compute.ts)
- **Convex search indexes**: Member directory search (already using for skillsTaxonomy)

**Do NOT add:**

- **FullCalendar/react-big-calendar**: Overkill for simple event list. Use shadcn/ui cards.
- **rrule**: Only if recurring events become a requirement (not in initial scope)
- **Push notification services**: Email sufficient for pilot phase
- **moment-timezone/dayjs/luxon**: Already have date-fns-tz

### Table Stakes vs Differentiators

**Must have (orgs expect these):**

- Member directory with search/filter
- Event creation, listing, RSVP
- Event notifications (email reminders)
- Attendance tracking (post-event confirmation)
- Basic org stats (member counts, breakdown by career stage)
- CSV export of member data

**Differentiators (competitive advantage):**

- Self-updating profiles (members maintain for personal value, orgs benefit)
- LLM-computed engagement levels with transparency
- Admin override for engagement with audit trail
- Post-event "Did you attend?" with 1-click confirmation (separate from feedback)
- Geography-based org suggestions
- Configurable notification preferences per-org

**Defer to v2+:**

- Real-time chat/messaging (creates spam burden, LinkedIn 2.0 problem)
- Event ticketing/payments (Luma/Eventbrite do this well)
- Complex event check-in (QR codes, NFC badges)
- Gamification (badges, streaks)
- Recurring event management (manual duplication is fine at current scale)

### Architecture Highlights

**New tables required:**

1. `events` - Event details, timing, location, status
2. `eventAttendance` - RSVP status, attendance confirmation, feedback
3. `engagementLogs` - Activity records (event_attended, profile_updated, etc.)
4. `memberEngagement` - Computed engagement level per member per org

**Key patterns to follow:**

- LLM scoring pattern from `matching/compute.ts` (Haiku 4.5, tool_use, internal actions)
- Cron pattern from `crons.ts` (hourly reminders, daily recomputation)
- Email batch pattern from `emails/batchActions.ts`

**Anti-patterns to avoid:**

- Real-time subscriptions for aggregate CRM views (use pagination + refresh)
- Storing engagement in profile (coupling; use separate table)
- Single engagement score across orgs (per-membership, not per-user)
- Blocking attendance on feedback (separate 1-click confirmation from optional feedback)

### Top Pitfalls to Avoid

1. **Notification fatigue** - Design with batching/digest as default. Implement notification budget (max 3 non-urgent per day). Build granular per-org preferences from start.

2. **Post-event attendance abandonment** - Separate attendance confirmation (1-click "Yes/No") from feedback (optional follow-up). Send within 2-4 hours of event end. Never require feedback before confirming attendance.

3. **CRM dashboard performance explosion** - Do NOT use real-time subscriptions for member lists. Use server-side pagination, denormalized stats documents, fetch full profiles only on member detail click.

4. **LLM engagement trust collapse** - Make scoring explainable (show input signals). Provide admin override with audit trail. Use engagement "levels" not numeric scores to avoid false precision.

5. **Location privacy exposure** - Explicit consent for location-based suggestions. Filter on backend, never expose user location to org admins. Allow opt-out of location-based discovery.

## Implications for Roadmap

### Phase 1: Org Discovery Foundation

**Rationale:** Events and CRM require discoverable orgs. Foundation must exist first.
**Delivers:** Searchable org list, geography-based suggestions, invite links
**Addresses:** Org discovery features from FEATURES.md
**Avoids:** Location privacy exposure (design consent model)
**Schema:** Add location, coordinates, description, website to organizations table

### Phase 2: Events Core

**Rationale:** Attendance tracking (Phase 3) requires events to exist
**Delivers:** Event creation by admins, event listing, RSVP functionality
**Uses:** Convex scheduler for reminders, date-fns-tz for timezone handling
**Avoids:** RSVP no-shows (implement waitlist, reminders with easy cancel)
**Schema:** New events table, eventAttendance table

### Phase 3: Attendance Tracking

**Rationale:** Engagement scoring (Phase 4) requires attendance data
**Delivers:** Post-event "Did you attend?" flow, feedback collection, attendance history on profiles
**Implements:** Email notifications via Resend (existing pattern)
**Avoids:** Low completion rate (1-click confirmation, send within 2-4 hours)

### Phase 4: Notification System

**Rationale:** Events and attendance create notification needs; must batch properly
**Delivers:** Configurable event reminders, notification preferences UI, batched delivery
**Avoids:** Notification fatigue (budget, batching, granular preferences)
**Schema:** Extend notificationPreferences with eventReminders, orgAnnouncements

### Phase 5: Engagement Scoring

**Rationale:** Requires attendance data from Phase 3 to be meaningful
**Delivers:** LLM-computed engagement levels, admin override capability, engagement signals display
**Uses:** Claude Haiku 4.5 (same as matching), internal actions pattern
**Avoids:** Trust collapse (explainable scores, override with audit trail)
**Schema:** engagementLogs table, memberEngagement table

### Phase 6: CRM Dashboard

**Rationale:** Pulls together all data from previous phases
**Delivers:** Member directory with engagement, filtering by level, export, org stats
**Avoids:** Performance explosion (server-side pagination, no real-time aggregates)
**Implements:** Virtual scrolling for member lists (TanStack Virtual)

### Phase Ordering Rationale

- **Sequential dependencies**: Org discovery -> Events -> Attendance -> Engagement -> CRM. Each phase produces data the next phase consumes.
- **Notification system must be designed early** (Phase 4) before multiple notification sources (events, reminders, attendance prompts) create fatigue.
- **Engagement scoring waits for attendance data** to avoid computing meaningless scores.
- **CRM dashboard comes last** because it aggregates data from all other features.

### Research Flags

**Phases needing deeper research during planning:**

- **Phase 4 (Notifications)**: Need to finalize notification budget rules, batching windows, preference schema details
- **Phase 5 (Engagement)**: Need to refine LLM prompt for engagement scoring, decide engagement level thresholds

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Org Discovery)**: Standard search + location patterns, well-documented
- **Phase 2 (Events Core)**: Common event CRUD, many examples
- **Phase 3 (Attendance)**: Simple confirmation flow, existing email patterns
- **Phase 6 (CRM Dashboard)**: Extends existing admin patterns, pagination well-documented

## Confidence Assessment

| Area         | Confidence  | Notes                                                                        |
| ------------ | ----------- | ---------------------------------------------------------------------------- |
| Stack        | HIGH        | Zero new deps; all patterns verified against existing codebase               |
| Features     | MEDIUM-HIGH | Table stakes clear; differentiators validated against Oxford OAISI reference |
| Architecture | HIGH        | Builds on proven Convex patterns; schema extensions straightforward          |
| Pitfalls     | MEDIUM-HIGH | Industry patterns well-documented; Convex-specific warnings verified         |

**Overall confidence:** HIGH

### Gaps to Address

- **Notification frequency defaults**: Need user testing to find optimal defaults for event reminders
- **Engagement level thresholds**: "Highly engaged = 3+ events" is arbitrary; may need adjustment per org
- **Privacy consent UX**: Location consent flow needs design; research provides principles, not specifics

## Open Questions for Requirements

1. **Should engagement scores be visible to members?** Research suggests admin-only, but AI safety community values transparency.
2. **What's the maximum notification frequency users will tolerate?** Start conservative (weekly digest) or aggressive (every event)?
3. **Should invite links require admin approval for new members?** Some orgs want gatekeeping, others want open access.
4. **How granular should event type filtering be?** Start with broad categories or let orgs define custom types?

## Sources

### Primary (HIGH confidence)

- ASTN codebase (package.json, schema.ts, matching/compute.ts, crons.ts)
- Convex documentation on scheduled functions, cron jobs, search indexes
- date-fns and date-fns-tz documentation

### Secondary (MEDIUM confidence)

- iMIS, Association Analytics, Rhythm Software on engagement scoring models
- EventX, vFairs, Qualtrics on event attendance tracking
- Typeform on post-event survey timing (42% higher response within 2 hours)
- MagicBell, Courier.com on notification fatigue patterns

### Tertiary (validation needed)

- Engagement level thresholds (3+ events = highly engaged) - needs org-specific tuning
- Notification budget (max 3/day) - needs user testing

---

_Research completed: 2026-01-19_
_Ready for roadmap: yes_
