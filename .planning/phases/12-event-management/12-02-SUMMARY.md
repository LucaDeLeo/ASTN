---
phase: 12-event-management
plan: 02
subsystem: ui, api
tags: [lu.ma, events, iframe, embed, org-admin, settings]

# Dependency graph
requires:
  - phase: 12-01
    provides: events table, lu.ma config fields on organizations, sync infrastructure
  - phase: 11-org-discovery
    provides: org pages, admin dashboard, membership structure
provides:
  - LumaEmbed component for embedding lu.ma calendars
  - Org events page at /org/$slug/events
  - Admin settings page at /org/$slug/admin/settings
  - Events navigation in org header and admin dashboard
affects: [12-03 (dashboard event aggregation)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Lu.ma iframe embedding with ?embed=true parameter'
    - 'Admin settings page pattern for org configuration'

key-files:
  created:
    - src/components/events/LumaEmbed.tsx
    - src/routes/org/$slug/events.tsx
    - src/routes/org/$slug/admin/settings.tsx
  modified:
    - convex/orgs/admin.ts
    - src/routes/org/$slug/index.tsx
    - src/routes/org/$slug/admin/index.tsx

key-decisions:
  - 'Lu.ma embed uses ?embed=true query param for clean iframe display'
  - 'Events button only shown when lumaCalendarUrl is configured'
  - 'Admin dashboard shows 4-column grid with Events status card'

patterns-established:
  - 'Admin settings page pattern: breadcrumb navigation, card-based form sections'
  - 'Integration status cards: green dot for connected, link to settings for unconfigured'

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 12 Plan 02: Org Event Pages Summary

**Org events page with lu.ma embed, admin settings for lu.ma configuration, and events navigation in org header and admin dashboard**

## Performance

- **Duration:** 4 min (265 seconds)
- **Started:** 2026-01-19T18:13:18Z
- **Completed:** 2026-01-19T18:17:43Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- LumaEmbed component that wraps lu.ma iframe with embed mode
- Public events page showing calendar when configured, empty state otherwise
- Admin settings page for configuring lu.ma calendar URL and API key
- Events button in org header (visible when lu.ma configured)
- Events status card and Settings button in admin dashboard

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LumaEmbed component and org events page** - `15b871e` (feat)
2. **Task 2: Create admin settings page with lu.ma configuration** - `9cfd2c2` (feat)
3. **Task 3: Add events navigation to org pages** - `7f17b20` (feat)

## Files Created/Modified

- `src/components/events/LumaEmbed.tsx` - Iframe wrapper component for lu.ma calendars
- `src/routes/org/$slug/events.tsx` - Public org events page with embed or empty state
- `src/routes/org/$slug/admin/settings.tsx` - Admin settings page with lu.ma config form
- `convex/orgs/admin.ts` - Added updateLumaConfig mutation and getLumaConfig query
- `src/routes/org/$slug/index.tsx` - Added Events button in org header
- `src/routes/org/$slug/admin/index.tsx` - Added Events status card and Settings button

## Decisions Made

- **Embed parameter:** Using `?embed=true` query parameter for lu.ma iframe embed mode (standard lu.ma approach)
- **Conditional visibility:** Events button in org header only shown when lumaCalendarUrl is configured
- **Admin dashboard layout:** Changed from 3-column to 4-column grid to accommodate Events status and Settings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - plan executed smoothly.

## User Setup Required

None - this plan only creates UI components and Convex mutations. Lu.ma API key configuration (from Plan 01) is optional and configured via the admin settings page created here.

## Next Phase Readiness

- Org events pages complete with lu.ma embed
- Admin settings allow lu.ma configuration
- Ready for Plan 03: Dashboard event aggregation across all org memberships

---

_Phase: 12-event-management_
_Completed: 2026-01-19_
