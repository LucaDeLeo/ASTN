# Phase 19: Motion System - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Add purposeful animation that reinforces warmth - entrance animations, hover feedback, page transitions. Layout from Phase 18 is stable. This phase adds motion to existing elements, not new UI components.

</domain>

<decisions>
## Implementation Decisions

### Entrance choreography

- Fade up animation: cards fade in while sliding up slightly (10-20px)
- Full page choreography: page title fades in first, then cards stagger
- Stagger applies to list pages (matches, opportunities, home)

### Page transitions

- Shared element transitions: clicked card animates/morphs into detail page
- Crossfade fallback when no shared element exists (e.g., nav menu clicks)
- Reverse animation on back navigation (card returns to list position)
- Fast duration: 200-250ms for transitions

### Claude's Discretion

- Stagger timing (50ms vs 100ms) - pick what looks good with warm aesthetic
- Animation replay behavior on back navigation
- Exact easing curves and timing refinements
- Hover card lift distance and shadow behavior (roadmap says 150-300ms)
- Button squish feedback implementation details

</decisions>

<specifics>
## Specific Ideas

- Shared element transitions should feel like the card is "opening" into the detail view
- Fast transitions (200-250ms) to keep things snappy - users shouldn't feel like they're waiting
- Back navigation should feel like "closing" - reversing the forward animation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 19-motion-system_
_Context gathered: 2026-01-19_
