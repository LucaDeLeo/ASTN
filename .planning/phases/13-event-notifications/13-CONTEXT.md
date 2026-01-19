# Phase 13: Event Notifications - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive configurable notifications about events from their orgs. Includes frequency preferences, event type filtering, and reminder timing. Notification batching prevents fatigue. In-app and email channels supported.

</domain>

<decisions>
## Implementation Decisions

### Notification Frequency
- Four tiers: All / Daily digest / Weekly digest / None
- Weekly digest sent Sunday evening
- Daily digest timing: Claude's discretion
- Default for new users: Weekly digest (safe, not overwhelming)

### Batching & Rate Limiting
- "All" frequency has rate limiting to prevent spam (Claude decides limits)
- Digests batch all events since last digest
- Notifications batch properly per research concern about fatigue

### Reminder Timing
- Three options available: 1 week before / 1 day before / 1 hour before
- Users can enable any combination of these
- Default: 1 day + 1 hour before (two reminders)

### Reminder Audience
- Reminders sent to anyone who viewed the event
- Broader reach than just RSVP'd users — may convert interest to attendance

### Channels
- Email + in-app for this phase
- Push notifications planned for later (out of scope)
- In-app: Toast notifications + persisted in bell icon notification center

### Notification Content
- Medium detail level: title, date, org, link, description snippet, location
- Enough context to decide without clicking through
- Action buttons: "View event" + "RSVP on lu.ma"

### Claude's Discretion
- Rate limiting specifics for "All" frequency (reasonable limits to prevent overload)
- Event type taxonomy (use lu.ma types or define our own)
- Type filtering scope (global vs per-org)
- Whether to allow muting specific orgs
- Digest layout (chronological vs grouped by org)
- Daily digest timing
- Email template design
- Toast notification duration and positioning

</decisions>

<specifics>
## Specific Ideas

- Research flagged "notification fatigue is #1 threat" — batching from day one is critical
- Existing pattern from Phase 12: events grouped by org name on dashboard — may inform digest layout
- Lu.ma link-out for RSVP already established in Phase 12

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 13-event-notifications*
*Context gathered: 2026-01-19*
