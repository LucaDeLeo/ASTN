# Phase 15: Engagement Scoring - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

System computes explainable engagement levels (Highly Engaged / Moderate / At Risk / New / Inactive) using LLM reasoning, with org admin override capability. Engagement data feeds into CRM dashboard (Phase 16).

</domain>

<decisions>
## Implementation Decisions

### Scoring Inputs
- Weight attendance heavily — primary engagement signal built in Phase 14
- Login frequency matters less (noise-prone, someone attending events but not logging in is still engaged)
- Profile completeness is one-time signal (distinguishes "New" from established)

Signal weights:
- **High:** Event attendance (confirmed), attendance recency
- **Medium:** Event RSVPs (intent signals), profile updates
- **Low:** Login frequency

Initial thresholds (may need per-org tuning):
- Highly Engaged: 3+ events in 90 days
- Moderate: 1-2 events in 90 days
- At Risk: No events in 90+ days but was previously active
- New: Joined within 60 days
- Inactive: No activity in 180+ days

### Level Presentation
- Subtle, not gamified — this is CRM tooling, not a game
- Users can see their level on profile (not prominently displayed)
- No leaderboards or comparisons between members
- Level shown to org admins in member directory (primary audience)
- "At Risk" never shown to users — use softer language like "Reconnecting" if user-facing

### Override Workflow
- One-click level change from member profile view in admin dashboard
- Notes field required for any override (even brief: "spoke at meetup yesterday")
- Override history visible to admins (audit trail)
- No notification to user when level is overridden — internal CRM operation
- Override persists until admin clears it or optionally sets expiry

### Explanation Depth
- **Admin view:** Full explanation with input signals ("Attended 4 events in last 60 days, most recent Jan 15. Profile updated this month.")
- **User view:** Simple, friendly messaging if shown ("You've been active at local events!")
- LLM generates both versions — detailed for admin, encouraging for user
- No actionable suggestions in v1 — descriptive explanations only

### Claude's Discretion
- Exact prompt engineering for LLM scoring calls
- Caching/recomputation strategy for engagement scores
- Edge case handling (user in multiple orgs — score per org or global?)
- Batch computation approach (all users vs on-demand)

</decisions>

<specifics>
## Specific Ideas

- Engagement levels modeled after typical community management categories
- LLM provides natural language reasoning rather than just threshold math — captures nuance like "hasn't attended recently but gave positive feedback last time"
- Override workflow inspired by CRM tools where human judgment trumps algorithms

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-engagement-scoring*
*Context gathered: 2026-01-19*
