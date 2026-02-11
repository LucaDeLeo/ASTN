---
phase: 35-generation
plan: 01
subsystem: database
tags: [convex, zod, schema, career-actions, status-machine]

# Dependency graph
requires: []
provides:
  - careerActions table with 8-type union, 5-status union, indexes
  - Zod validation schemas for LLM output parsing
  - Internal queries for profile and action data retrieval
  - Public getMyActions query with grouped status response
  - 5 status transition mutations with ownership verification
  - saveGeneratedActions internal mutation preserving user-modified actions
affects: [35-02 (LLM pipeline), 35-03 (UI display), 36 (completion loop)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      verifyActionOwnership helper for DRY mutation auth,
      status-grouped query response,
    ]

key-files:
  created:
    - convex/careerActions/validation.ts
    - convex/careerActions/queries.ts
    - convex/careerActions/mutations.ts
  modified:
    - convex/schema.ts

key-decisions:
  - 'Used verifyActionOwnership helper to DRY ownership checks across 5 public mutations'
  - 'Cleared stale prototype data from previous careerActions iteration before schema push'

patterns-established:
  - 'verifyActionOwnership: reusable auth+ownership helper returning {action, profile} for mutation use'
  - 'Status-grouped query response: getMyActions returns {active, inProgress, saved, completed, hasProfile}'

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 35 Plan 01: Career Actions Data Layer Summary

**Convex careerActions table with 8-type/5-status schema, Zod validation for LLM output, grouped queries, and ownership-verified status transition mutations**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-11T01:21:13Z
- **Completed:** 2026-02-11T01:25:18Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- careerActions table deployed to Convex with 8-type union, 5-status union, profileBasis, timestamp fields, and by_profile/by_profile_status indexes
- Zod validation schemas (actionItemSchema, actionResultSchema) ready for Plan 02's LLM pipeline output parsing
- Public getMyActions query returns actions grouped by status (active, inProgress, saved, completed) with profile existence check
- 5 public status transition mutations enforce legal transitions with ownership verification via shared helper
- saveGeneratedActions internal mutation preserves saved/in_progress/done actions during regeneration (critical for ACTN-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add careerActions table to schema + create Zod validation** - `11e98e7` (feat)
2. **Task 2: Create queries and mutations for career actions** - `2cbeffe` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added careerActions table definition with 8-type union, 5-status union, and 2 indexes
- `convex/careerActions/validation.ts` - Zod schemas for actionTypes, actionItemSchema, actionResultSchema
- `convex/careerActions/queries.ts` - getFullProfile, getExistingActions, getPreservedActions (internal), getMyActions (public)
- `convex/careerActions/mutations.ts` - saveGeneratedActions (internal), saveAction, dismissAction, startAction, completeAction, unsaveAction (public)

## Decisions Made

- Used `verifyActionOwnership` shared helper to avoid repeating auth+ownership logic across 5 mutations (mirrors matches.ts pattern but extracted to a function for DRY)
- Cleared stale prototype careerActions data (5 documents with old schema fields like `category`, `computedAt`, `reasoning`) before pushing new schema

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Cleared stale prototype data from careerActions table**

- **Found during:** Task 1 (schema push)
- **Issue:** 5 existing careerActions documents from a prior prototype used different field names (category/computedAt/reasoning instead of type/generatedAt/rationale), causing schema validation failure on push
- **Fix:** Used `npx convex import --table careerActions --replace -y --format jsonArray` with empty array to clear table before schema push
- **Files modified:** None (data-only operation)
- **Verification:** `npx convex dev --once` succeeded after clearing
- **Committed in:** 11e98e7 (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to unblock schema push. No scope creep.

## Issues Encountered

None beyond the stale data deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema and data layer complete, ready for Plan 02's LLM generation pipeline
- getFullProfile and getPreservedActions queries ready for compute.ts context construction
- saveGeneratedActions ready to receive LLM pipeline output
- All 5 public mutations ready for Plan 03's UI integration

## Self-Check: PASSED

- All 3 created files exist on disk
- Both task commits (11e98e7, 2cbeffe) verified in git log
- careerActions table confirmed in schema.ts

---

_Phase: 35-generation_
_Completed: 2026-02-11_
