# Phase 11: Org Discovery - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can discover and join relevant organizations based on geography and interests. This includes geography-based org suggestions on the dashboard, browsing/searching orgs with location filtering, and joining orgs via shareable invite links. Location-based suggestions must respect user privacy preferences.

</domain>

<decisions>
## Implementation Decisions

### Suggestion Display

- Horizontal carousel of org cards on dashboard
- Rich cards showing: org name, location, member count, description snippet, upcoming event count
- Show 5 orgs initially, scrollable if more exist
- Empty state: show nearby orgs with distance AND major global orgs as fallback

### Search & Browse UX

- Map + list split view for geographic discovery
- Filters: location (country/city) and org type
- Text search available but secondary to filters
- Map view included for visual geographic browsing

### Join Flow

- Confirmation step required — show org details before joining
- Org admin can choose: open joining or require approval
- Invite link format: `/org/{slug}/join` (clear which org)

### Location Privacy

- City-level granularity only — simple and good privacy
- Opt-in by default — location hidden until user explicitly enables
- Ask during profile onboarding, editable later in settings
- If no location: show prompt to enable AND display global orgs as fallback

### Claude's Discretion

- Map marker behavior (static vs clustered based on org density)
- Handling already-member invite link clicks
- Exact card styling and spacing

</decisions>

<specifics>
## Specific Ideas

No specific product references — open to standard approaches for map/list views and card layouts.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 11-org-discovery_
_Context gathered: 2026-01-19_
