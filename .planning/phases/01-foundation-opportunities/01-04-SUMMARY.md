---
phase: 01-foundation-opportunities
plan: 04
subsystem: ui
tags: [tanstack-router, convex, react, url-sync, filters, components]

# Dependency graph
requires:
  - phase: 01-02
    provides: Opportunity model and public queries (list, search, get)
provides:
  - Opportunity card component with Lyra styling
  - Opportunity list component with staggered animations
  - Filter bar with URL sync (role, location, search)
  - Opportunities list page at /opportunities
  - Opportunity detail page at /opportunities/$id
  - PublicHeader component for public routes
affects: [02-user-profiles, 03-matching]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TanStack Router URL search params for filter state
    - Convex useQuery with conditional skip pattern
    - Staggered animation with animationDelay

key-files:
  created:
    - src/components/opportunities/opportunity-card.tsx
    - src/components/opportunities/opportunity-list.tsx
    - src/components/opportunities/opportunity-filters.tsx
    - src/components/opportunities/opportunity-detail.tsx
    - src/routes/opportunities/index.tsx
    - src/routes/opportunities/$id.tsx
    - src/components/layout/public-header.tsx
  modified: []

key-decisions:
  - "URL-synced filters for shareable links (TanStack Router search params)"
  - "Replaced pathless _public.tsx layout with shared PublicHeader component"
  - "Staggered animation delay of 50ms per card for dynamic reveal"

patterns-established:
  - "Filter state in URL: useSearch/useNavigate for filter sync"
  - "Conditional Convex queries: useQuery with 'skip' for conditional fetching"
  - "Lyra aesthetic: rounded-sm (sharp), font-mono for titles, hover:-translate-y-0.5"

# Metrics
duration: 12min
completed: 2026-01-17
---

# Phase 01 Plan 04: Public Opportunity Browsing Summary

**Public opportunity browsing UI with URL-synced filters, card list with staggered animations, and full detail pages with source attribution**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-17T22:54:00Z
- **Completed:** 2026-01-17T23:06:22Z
- **Tasks:** 5
- **Files modified:** 11

## Accomplishments

- Opportunity card component with Lyra styling (boxy/sharp edges, mono fonts, hover lift)
- Filter bar with role type, location/remote, and search filters synced to URL
- Opportunities list page with staggered reveal animations
- Detail page with full information, apply button, and source attribution
- PublicHeader component extracted for reuse across public pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Create opportunity card and list components** - `01655fc` (feat)
2. **Task 2: Create filter bar with URL sync** - `8508268` (feat)
3. **Task 3: Create opportunities list page** - `701bd7e` (feat)
4. **Task 4: Create opportunity detail page** - `90fd14b` (feat)
5. **Task 5: Verify browsing experience** - User approved (checkpoint)

## Files Created/Modified

- `src/components/opportunities/opportunity-card.tsx` - Card component with Lyra styling and hover effects
- `src/components/opportunities/opportunity-list.tsx` - List with staggered animation and loading/empty states
- `src/components/opportunities/opportunity-filters.tsx` - Filter bar with URL sync via TanStack Router
- `src/components/opportunities/opportunity-detail.tsx` - Full detail view with source attribution
- `src/routes/opportunities/index.tsx` - List page with validateSearch for URL params
- `src/routes/opportunities/$id.tsx` - Detail page with dynamic route param
- `src/components/layout/public-header.tsx` - Shared header for public pages
- `src/components/ui/empty.tsx` - Empty state component
- `src/components/ui/spinner.tsx` - Loading spinner component

## Decisions Made

- **URL-synced filters:** Using TanStack Router search params for shareable filter state
- **Conditional queries:** Using Convex useQuery with "skip" pattern based on search vs list mode
- **Animation timing:** 50ms stagger delay per card for dynamic reveal without being distracting

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed route conflict with _public.tsx layout**
- **Found during:** Task 3 (Create opportunities list page)
- **Issue:** Pathless `_public.tsx` layout conflicted with existing route structure
- **Fix:** Removed pathless layout, created shared `PublicHeader` component instead, updated opportunities pages to include header directly
- **Files modified:** src/routes/_public.tsx (removed), src/components/layout/public-header.tsx (created), src/routes/opportunities/index.tsx, src/routes/opportunities/$id.tsx
- **Verification:** Routes load correctly, header displays on both pages
- **Committed in:** 90fd14b (Task 4 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Route architecture simplified. Shared component approach is more flexible than pathless layout.

## Issues Encountered

None - plan executed smoothly after route architecture adjustment.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Opportunity browsing complete (OPPS-01, OPPS-02, OPPS-06)
- Foundation phase complete with aggregation and public UI
- Ready for Phase 2: User profiles and authentication

---
*Phase: 01-foundation-opportunities*
*Completed: 2026-01-17*
