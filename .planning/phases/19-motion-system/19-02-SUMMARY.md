---
phase: 19-motion-system
plan: 02
subsystem: ui
tags: [animation, stagger, view-transitions, tanstack-router, css]

# Dependency graph
requires:
  - phase: 19-01
    provides: AnimatedCard component with stagger support
provides:
  - Match cards with staggered entrance animation on /matches page
  - Dashboard event cards with staggered entrance animation
  - Page navigation with smooth crossfade via View Transitions API
affects: [20-ux-refinements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AnimatedCard wrapper for list stagger (matches, events)
    - View Transitions API for page navigation crossfade

key-files:
  created: []
  modified:
    - src/components/matches/MatchTierSection.tsx
    - src/routes/index.tsx
    - src/router.tsx
    - src/styles/app.css

key-decisions:
  - "View transition duration uses --duration-normal (250ms) for subtle page crossfade"
  - "Stagger index resets per org section in Dashboard for visual grouping"

patterns-established:
  - "List stagger: Wrap mapped items with AnimatedCard index={index}"
  - "Page transitions: TanStack Router defaultViewTransition: true + CSS ::view-transition"

# Metrics
duration: 3min
completed: 2026-01-20
---

# Phase 19 Plan 02: List Stagger & Page Entrance Summary

**Staggered card entrance animations on match/event lists and smooth crossfade page transitions using View Transitions API**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-20T03:12:00Z
- **Completed:** 2026-01-20T03:15:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Match cards stagger in when MatchTierSection renders (all tiers: great, good, exploring)
- Dashboard event cards stagger in for both user org events and discover events
- Page navigation uses browser-native View Transitions API with 250ms crossfade
- All animations respect prefers-reduced-motion user preference

## Task Commits

Each task was committed atomically:

1. **Task 1: Add staggered animations to MatchTierSection** - `635e854` (feat)
2. **Task 2: Add staggered animations to Dashboard event cards** - `0c883ad` (feat)
3. **Task 3: Enable view transitions in router and add CSS** - `1826080` (feat)

## Files Created/Modified
- `src/components/matches/MatchTierSection.tsx` - Wraps MatchCard with AnimatedCard for stagger
- `src/routes/index.tsx` - Wraps EventCard instances with AnimatedCard for stagger
- `src/router.tsx` - Added defaultViewTransition: true to enable View Transitions API
- `src/styles/app.css` - Added ::view-transition CSS rules with reduced motion support

## Decisions Made
- View transition uses --duration-normal (250ms) with --ease-gentle for subtle page crossfade
- Stagger index resets per section (each org's events, discover events) rather than continuous numbering

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Motion system complete: core primitives (19-01) + applied animations (19-02)
- Cards, buttons, lists, and page transitions all have consistent motion language
- Phase 20 UX refinements can build on established motion patterns

---
*Phase: 19-motion-system*
*Completed: 2026-01-20*
