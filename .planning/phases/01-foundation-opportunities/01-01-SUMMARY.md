---
phase: 01-foundation-opportunities
plan: 01
subsystem: infra
tags: [tanstack-start, convex, convex-auth, tailwind, shadcn-ui, typescript]

# Dependency graph
requires: []
provides:
  - TanStack Start + Convex project scaffold
  - Convex Auth with OAuth (GitHub, Google) and Password providers
  - shadcn/ui components with coral accent
  - Landing page with ASTN branding
affects: [01-02, 01-03, 01-04, phase-2-auth]

# Tech tracking
tech-stack:
  added:
    - '@tanstack/react-start@1.132.2'
    - 'convex@1.31.0'
    - '@convex-dev/auth@0.0.90'
    - '@auth/core@0.39.1'
    - '@convex-dev/react-query@0.0.0-alpha.11'
    - '@tanstack/react-query@5.89.0'
    - 'tailwindcss@4.1.13'
    - 'shadcn/ui (new-york style)'
  patterns:
    - Convex + TanStack Query integration via ConvexQueryClient
    - File-based routing with TanStack Router
    - Tailwind CSS v4 with OKLCH color variables
    - Convex Auth with authTables in schema

key-files:
  created:
    - convex/auth.ts
    - convex/auth.config.ts
    - convex/http.ts
    - src/lib/utils.ts
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/input.tsx
    - components.json
  modified:
    - convex/schema.ts
    - src/routes/__root.tsx
    - src/routes/index.tsx
    - src/styles/app.css
    - package.json

key-decisions:
  - 'Used @auth/core@0.39 for compatibility with @convex-dev/auth (customFetch export)'
  - 'Removed template sample files (myFunctions.ts, anotherPage.tsx) for clean slate'
  - 'Used OKLCH color format for coral accent (0.70 0.16 30)'
  - 'Deferred OAuth credential setup to Phase 2 (no auth needed for browsing)'

patterns-established:
  - 'Convex schema with authTables spread'
  - 'TanStack Start route structure in src/routes/'
  - 'shadcn/ui components in src/components/ui/'
  - 'Utility function cn() for Tailwind class merging'

# Metrics
duration: 6min
completed: 2026-01-17
---

# Phase 01 Plan 01: Project Bootstrap Summary

**TanStack Start + Convex scaffold with Convex Auth (OAuth + Password), shadcn/ui coral theme, and ASTN landing page**

## Performance

- **Duration:** 6 min (continuation from Task 2)
- **Started:** 2026-01-17T22:10:34Z
- **Completed:** 2026-01-17T22:16:08Z
- **Tasks:** 4 (1 pre-completed, 3 executed)
- **Files modified:** 22

## Accomplishments

- TanStack Start + Convex project with TanStack Query integration
- Convex Auth configured with GitHub, Google, and Password providers
- shadcn/ui initialized with coral/salmon accent color
- Landing page with ASTN branding and call-to-action

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize project with Convex TanStack Start template** - `2791417` (feat) - pre-completed
2. **Task 2: Configure Convex Auth for TanStack Start** - `0d96f73` (feat)
3. **Task 3: Generate Convex Auth secret** - (no commit - env vars set during Task 2 init)
4. **Task 4: Configure shadcn/ui with Lyra style and coral accent** - `1711e48` (feat)

## Files Created/Modified

- `convex/schema.ts` - Database schema with authTables
- `convex/auth.ts` - Convex Auth config with GitHub, Google, Password providers
- `convex/auth.config.ts` - Auth provider configuration
- `convex/http.ts` - HTTP routes for auth
- `src/lib/utils.ts` - cn() helper for Tailwind class merging
- `src/routes/__root.tsx` - Root layout with ConvexProvider (via router.tsx)
- `src/routes/index.tsx` - Landing page with ASTN branding
- `src/styles/app.css` - Tailwind CSS with coral accent variables
- `src/components/ui/button.tsx` - shadcn button component
- `src/components/ui/card.tsx` - shadcn card component
- `src/components/ui/badge.tsx` - shadcn badge component
- `src/components/ui/input.tsx` - shadcn input component
- `components.json` - shadcn/ui configuration

## Decisions Made

- **@auth/core version:** Used 0.39.1 for compatibility with @convex-dev/auth (0.34.3 lacked customFetch export)
- **Template cleanup:** Removed myFunctions.ts and anotherPage.tsx to start clean
- **Color format:** Used OKLCH for coral accent (oklch 0.70 0.16 30) as Tailwind v4 default
- **OAuth deferral:** OAuth credentials not configured - not needed until Phase 2 user auth

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed @auth/core version mismatch**

- **Found during:** Task 2 (Convex Auth configuration)
- **Issue:** @convex-dev/auth@0.0.90 requires customFetch export from @auth/core, but template installed @auth/core@0.34.3 which lacks it
- **Fix:** Updated to @auth/core@0.39.1 which has the customFetch export
- **Files modified:** package.json, bun.lock
- **Verification:** `bunx convex dev --once` succeeds
- **Committed in:** 0d96f73 (Task 2 commit)

**2. [Rule 3 - Blocking] Removed template sample files referencing deleted schema table**

- **Found during:** Task 2 (Convex schema update)
- **Issue:** myFunctions.ts referenced 'numbers' table which was removed when schema changed to authTables
- **Fix:** Deleted myFunctions.ts and README.md from convex/
- **Files modified:** convex/myFunctions.ts (deleted), convex/README.md (deleted)
- **Verification:** `bunx convex dev --once` succeeds
- **Committed in:** 0d96f73 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for build to succeed. No scope creep.

## Issues Encountered

- Landing page "Browse Opportunities" button initially used Link to `/opportunities` which doesn't exist yet - changed to span with TODO comment for 01-02

## User Setup Required

None - no external service configuration required for this plan. OAuth credentials will be configured in Phase 2.

## Next Phase Readiness

- Project foundation complete and building
- Convex connected and schema deployed
- Ready for 01-02: Opportunity schema and browse functionality
- shadcn/ui components available for UI development

---

_Phase: 01-foundation-opportunities_
_Completed: 2026-01-17_
