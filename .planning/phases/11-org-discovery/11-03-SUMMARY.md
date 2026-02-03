---
phase: 11-org-discovery
plan: 03
subsystem: ui
tags: [react, leaflet, map, organizations, browse, search, filter]

# Dependency graph
requires:
  - phase: 11-01
    provides: Organizations table with location fields and discovery queries
provides:
  - /orgs browse page with split map/list view
  - OrgMap component with Leaflet markers
  - OrgFilters component with search and country filter
  - getAllOrgs query with filtering
affects: [events, org-profile, member-directory]

# Tech tracking
tech-stack:
  added: ['@types/leaflet (dev)', 'leaflet@1.9.4 (CDN)']
  patterns:
    [CDN-loaded libraries with type-only imports, split view responsive layout]

key-files:
  created:
    - src/routes/orgs/index.tsx
    - src/components/org/OrgMap.tsx
    - src/components/org/OrgFilters.tsx
  modified:
    - convex/orgs/discovery.ts
    - src/routes/__root.tsx

key-decisions:
  - 'Leaflet via CDN avoids npm dependency, types via @types/leaflet for dev safety'
  - 'Map hidden on mobile (lg:block) for better UX on small screens'
  - 'Search requires 2+ characters before querying to reduce API calls'

patterns-established:
  - 'CDN script loading via TanStack Start root layout links/scripts'
  - 'Split view pattern: map left, list right, responsive at lg breakpoint'

# Metrics
duration: 6min
completed: 2026-01-19
---

# Phase 11 Plan 03: Browse UI Summary

**Org browse page at /orgs with interactive Leaflet map, search, and country filters - split view on desktop, list-only on mobile**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-19T16:33:00Z
- **Completed:** 2026-01-19T16:39:03Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Created getAllOrgs query with search and country filtering, computing member counts
- Built OrgFilters component with debounce-ready search input and country dropdown
- Built OrgMap component using Leaflet CDN with interactive markers and popups
- Created /orgs browse page with responsive split map/list view

## Task Commits

Each task was committed atomically:

1. **Task 1: Add getAllOrgs query with filtering** - `d255c04` (feat)
2. **Task 2: Create OrgFilters component** - `15d6964` (feat)
3. **Task 3: Create OrgMap component with Leaflet** - `087cb4b` (feat)
4. **Task 4: Create /orgs browse page** - `f7d097d` (feat)

## Files Created/Modified

- `convex/orgs/discovery.ts` - Added getAllOrgs and getOrgCountries queries for browse page
- `src/components/org/OrgFilters.tsx` - Search input and country dropdown with clear button
- `src/components/org/OrgMap.tsx` - Interactive Leaflet map with org markers and popups
- `src/routes/orgs/index.tsx` - Browse page with split view, selection sync, loading/empty states
- `src/routes/__root.tsx` - Added Leaflet CSS/JS CDN links

## Decisions Made

- **Leaflet via CDN:** Avoids npm dependency while maintaining type safety via @types/leaflet
- **Map desktop-only:** Hidden on mobile (lg:block) for cleaner mobile experience
- **Search debounce ready:** Interface supports debounce; queries when 2+ chars entered
- **Selection sync:** Clicking map marker or list item highlights both, opens marker popup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Org browse page complete at /orgs
- Map displays orgs with coordinates; list shows all orgs
- Ready for linking from navigation and dashboard
- Next phases can add coordinate data to more organizations for map display

---

_Phase: 11-org-discovery_
_Completed: 2026-01-19_
