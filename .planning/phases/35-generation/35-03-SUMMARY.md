---
phase: 35-generation
plan: 03
subsystem: ui
tags:
  [
    react,
    tailwind,
    violet,
    career-actions,
    matches-page,
    dashboard,
    convex-mutations,
  ]

# Dependency graph
requires:
  - phase: 35-01
    provides: careerActions schema, getMyActions query, status transition mutations
provides:
  - ActionCard component with 8 type badges, status buttons, and hover actions
  - CareerActionsSection self-contained data-fetching section
  - CompletedActionsSection collapsible section with progress indicator
  - cancelAction mutation for in_progress -> active transition
  - Matches page "Your Next Moves" integration between tiers and growth areas
  - Dashboard "Your Next Moves" preview with top 2 active actions
affects: [36 (completion loop UI)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      violet-accent card system distinct from emerald/blue/amber match tiers,
      self-contained section component with own query + mutation wiring,
    ]

key-files:
  created:
    - src/components/actions/ActionCard.tsx
    - src/components/actions/CareerActionsSection.tsx
    - src/components/actions/CompletedActionsSection.tsx
  modified:
    - convex/careerActions/mutations.ts
    - src/routes/matches/index.tsx
    - src/routes/index.tsx

key-decisions:
  - 'Added cancelAction mutation (in_progress -> active) to support Cancel button on in-progress actions'
  - 'CareerActionsSection is self-contained: fetches own data via useQuery, wires all 6 mutations internally'

patterns-established:
  - 'Violet card system: ActionCard uses violet-200 border, violet-100/violet-800 badges, violet-600 primary buttons'
  - 'Self-contained section: CareerActionsSection owns its data fetching and mutation wiring, no props needed from parent'

# Metrics
duration: 7min
completed: 2026-02-11
---

# Phase 35 Plan 03: Career Actions UI Summary

**Violet-accented ActionCard system with 8 type badges, status-dependent buttons, and page integration into matches and dashboard**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-11T01:28:21Z
- **Completed:** 2026-02-11T01:36:01Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- ActionCard renders violet-accented cards with type badges (8 distinct icons), personalized rationale, and status-dependent CTA buttons
- CareerActionsSection self-contained component fetches actions via useQuery and wires 6 mutations (save, dismiss, start, complete, unsave, cancel)
- CompletedActionsSection collapsible section with progress indicator following SavedMatchesSection pattern
- Matches page shows "Your Next Moves" between match tier sections and growth areas
- Dashboard shows top 2 active actions between "Your Top Matches" and "Suggested Organizations"
- Empty state guidance text when user has profile but no actions generated

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ActionCard component with type badges and status-dependent buttons** - `ad9a589` (feat)
2. **Task 2: Create section components and integrate into matches page + dashboard** - `1718214` (feat)

## Files Created/Modified

- `src/components/actions/ActionCard.tsx` - Violet card with typeConfig (8 icons), HoverActions (save/dismiss), StatusButtons (per-status CTAs)
- `src/components/actions/CareerActionsSection.tsx` - Self-contained section with useQuery + 6 useMutation hooks, empty state, grid layout
- `src/components/actions/CompletedActionsSection.tsx` - Collapsible section with sessionStorage persistence, progress indicator
- `convex/careerActions/mutations.ts` - Added cancelAction mutation (in_progress -> active, clears startedAt)
- `src/routes/matches/index.tsx` - Added CareerActionsSection import and render between tiers and growth areas
- `src/routes/index.tsx` - Added actions query, 3 mutations, and "Your Next Moves" section with top 2 actions

## Decisions Made

- Added `cancelAction` mutation to `convex/careerActions/mutations.ts` since Plan 01 only created 5 mutations (save, dismiss, start, complete, unsave) but the in_progress -> active transition needed its own mutation to clear `startedAt`
- Made CareerActionsSection fully self-contained (fetches own data, wires own mutations) rather than requiring props from parent -- simplifies integration into both matches page and dashboard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added cancelAction mutation**

- **Found during:** Task 2 (CareerActionsSection implementation)
- **Issue:** Plan 01 did not include a cancelAction mutation for the in_progress -> active transition. The cancel button on in-progress actions needs this to clear startedAt and reset status.
- **Fix:** Added `cancelAction` mutation following the same verifyActionOwnership pattern as other mutations. Valid from `in_progress` only, sets `status: 'active'` and `startedAt: undefined`.
- **Files modified:** convex/careerActions/mutations.ts
- **Verification:** Lint + build pass, Convex deploy succeeds
- **Committed in:** 1718214 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical functionality)
**Impact on plan:** Necessary to complete the cancel-progress UX flow. Explicitly called out in the plan as needed.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All action UI components complete, ready for Phase 36 completion loop
- ActionCard supports 'done' status rendering (completedAt display) for Phase 36's completion enrichment flow
- cancelAction mutation available for Phase 36 if needed for completion flow cancellation

## Self-Check: PASSED

- All 3 created files exist on disk
- Both task commits (ad9a589, 1718214) verified in git log
- CareerActionsSection integrated into matches page and dashboard

---

_Phase: 35-generation_
_Completed: 2026-02-11_
