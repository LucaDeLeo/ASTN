---
phase: 11-org-discovery
plan: 01
subsystem: database
tags: [convex, schema, organizations, location, geo, privacy]

# Dependency graph
requires:
  - phase: 04-matching (v1.0)
    provides: Organizations table and orgMemberships foundation
provides:
  - Organizations table with location fields (city, country, isGlobal)
  - Location privacy setting (locationDiscoverable) in profiles
  - Geography-based org suggestion query (getSuggestedOrgs)
affects: [11-02-discovery-ui, events, org-discovery]

# Tech tracking
tech-stack:
  added: []
  patterns: [opt-in privacy for location, city-parsing from location string]

key-files:
  created:
    - convex/orgs/discovery.ts
  modified:
    - convex/schema.ts
    - convex/organizations.ts
    - convex/profiles.ts

key-decisions:
  - "Location discovery is opt-in (locationDiscoverable defaults to false)"
  - "Simple city parsing from 'City, Country' format for matching"
  - "Global orgs shown to all users; local orgs only when location enabled"

patterns-established:
  - "Org discovery query respects privacy settings before using location data"
  - "Suggestions exclude already-joined orgs via orgMemberships check"

# Metrics
duration: 2min
completed: 2026-01-19
---

# Phase 11 Plan 01: Discovery Backend Summary

**Organizations extended with location fields (city, country, isGlobal) and geography-based getSuggestedOrgs query respecting privacy settings**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-19T16:28:01Z
- **Completed:** 2026-01-19T16:30:59Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Extended organizations table with location fields (city, country, coordinates, isGlobal, description, memberCount) and appropriate indexes
- Added locationDiscoverable privacy setting to profiles with query/mutation
- Created getSuggestedOrgs query that returns geography-filtered org suggestions

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend organizations schema with location fields** - `1fb9e1d` (feat)
2. **Task 2: Add locationDiscoverable to profiles** - `2ff2af6` (feat)
3. **Task 3: Create getSuggestedOrgs discovery query** - `12d1f32` (feat)

## Files Created/Modified

- `convex/schema.ts` - Extended organizations table with location fields and indexes; added locationDiscoverable to privacySettings
- `convex/organizations.ts` - Updated AI_SAFETY_ORGANIZATIONS with location data and descriptions for all 19 orgs
- `convex/profiles.ts` - Added getLocationPrivacy query and updateLocationPrivacy mutation
- `convex/orgs/discovery.ts` - New file with getSuggestedOrgs query for geography-based suggestions

## Decisions Made

- **Opt-in location discovery:** locationDiscoverable defaults to false/undefined, requiring explicit user consent
- **Simple city parsing:** Parse first part of "City, Country" format for matching - sufficient for MVP
- **Global orgs as fallback:** When location disabled or no matches, show global orgs (80K Hours, Open Philanthropy, etc.)
- **Max 5 suggestions:** Limit results to prevent overwhelming users

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend foundation complete for org discovery
- Ready for 11-02: Discovery UI (suggested orgs cards, privacy toggle, quick join)
- Organizations have location data seeded; getSuggestedOrgs query ready for frontend consumption

---
*Phase: 11-org-discovery*
*Completed: 2026-01-19*
