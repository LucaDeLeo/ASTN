# Phase 12: Event Management - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Org admins can set up event feeds (via lu.ma integration) and users can view events from their orgs on their dashboard. RSVPs happen on lu.ma directly. Native event creation and attendance tracking are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Lu.ma Integration
- Import-only integration: org admin provides lu.ma calendar URL
- Configurable in org settings AND optionally during org creation
- Daily cron sync for background updates
- Fresh fetch on page load with 1-hour cache
- No manual event creation — all events come from lu.ma

### Event Display (Org Page)
- Lu.ma embed widget on org's event page (their styling, always current)
- List view + calendar view with toggle
- Default to list view
- Upcoming events first (chronological), past events shown below

### RSVP Flow
- Link-out only — RSVPs happen on lu.ma
- Lu.ma embed handles RSVP interaction on org pages
- No RSVP tracking in ASTN (Phase 14 handles post-event attendance)

### Dashboard Integration
- All orgs' events shown, user's joined orgs prioritized
- Events grouped by org with section headers ("BAISH Events", etc.)
- User's orgs appear first
- "Events from other orgs" section below for non-member orgs
- Dashboard event cards show event info + small "View on lu.ma" link

### Claude's Discretion
- Dashboard events section layout style (carousel, list, grid)
- Event card design and information density
- Calendar view implementation details
- Caching strategy details

</decisions>

<specifics>
## Specific Ideas

- Use lu.ma embed widget rather than building custom event rendering for org pages
- Dashboard needs to fetch/aggregate events across orgs (can't use embed there)
- Similar patterns to Phase 11 org discovery (carousel, sections)

</specifics>

<deferred>
## Deferred Ideas

- Full lu.ma bi-directional sync (OAuth, webhooks, create events from ASTN) — future phase
- Google Calendar integration — future phase
- Native event creation (manual entry without lu.ma) — if needed later
- RSVP status sync from lu.ma API — not needed with link-out approach

</deferred>

---

*Phase: 12-event-management*
*Context gathered: 2026-01-19*
