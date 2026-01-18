---
phase: 04-matching
plan: 02
subsystem: api
tags: [convex, anthropic, llm, matching, tool-use, batch-processing]

# Dependency graph
requires:
  - phase: 04-01
    provides: Matches table schema, internal queries/mutations for match data
  - phase: 03-profiles
    provides: Profile schema with education, workHistory, skills, enrichmentSummary
  - phase: 01-foundation-opportunities
    provides: Opportunities table with status, organization, requirements
provides:
  - Prompts module with system prompt and tool definition for structured LLM output
  - Compute action that batch-scores opportunities using Claude Sonnet 4.5
  - Public queries returning matches grouped by tier for UI consumption
  - Trigger action for UI-initiated match computation
affects:
  - 04-03 (matches dashboard will display results from getMyMatches)
  - 04-04 (recommendations will use growthAreas from match results)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Programmatic context construction for LLM input (buildProfileContext, buildOpportunitiesContext)
    - Forced tool_choice for guaranteed structured output
    - internalAction for LLM compute to enable calling from public actions

key-files:
  created:
    - convex/matching/prompts.ts
    - convex/matching/compute.ts
    - convex/matches.ts
  modified: []

key-decisions:
  - "Use internalAction for compute to avoid TypeScript circular reference with public triggerMatchComputation"
  - "Batch 15 opportunities per LLM call for efficient context usage"
  - "Cap at 50 opportunities per profile for pilot (configurable)"
  - "Explicit type annotations in action handlers to break TypeScript inference cycles"

patterns-established:
  - "Context builders produce markdown-formatted strings for LLM consumption"
  - "Tool definition with forced tool_choice guarantees structured output"
  - "Public actions call internal actions for LLM work"
  - "Match results include tier, score, strengths, gap, probability, recommendations"

# Metrics
duration: 5min
completed: 2026-01-18
---

# Phase 04 Plan 02: Match Compute Engine Summary

**Claude Sonnet 4.5 batch matching with programmatic context construction, forced tool_choice for structured output, and public API for UI consumption**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-18T05:12:02Z
- **Completed:** 2026-01-18T05:17:28Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created prompts module with system prompt, context builders, and tool definition for structured matching output
- Built compute action that batch-scores opportunities against profiles using Claude Sonnet 4.5
- Exposed public queries (getMyMatches, getMatchById, getNewMatchCount) and actions (triggerMatchComputation, markMatchesViewed) for UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Create prompts and tool definitions** - `cba6dae` (feat)
2. **Task 2: Create compute action with LLM batch matching** - `e5f7f71` (feat)
3. **Task 2 fix: TypeScript type inference** - `01245c4` (fix)
4. **Task 3: Create public queries for UI consumption** - `1cb171f` (feat)

## Files Created/Modified

- `convex/matching/prompts.ts` - System prompt, buildProfileContext, buildOpportunitiesContext, matchOpportunitiesTool, MatchingResult type
- `convex/matching/compute.ts` - computeMatchesForProfile internalAction with batch processing
- `convex/matches.ts` - Public queries (getMyMatches, getMatchById, getNewMatchCount) and actions (triggerMatchComputation, markMatchesViewed)

## Decisions Made

- Used `internalAction` instead of `action` for compute to avoid TypeScript circular type inference when calling from public triggerMatchComputation
- Added explicit type annotations (`: Promise<T>`, `: { _id: Id<"profiles"> } | null`) to break TypeScript inference cycles in Convex actions
- Batch size of 15 opportunities per LLM call balances context efficiency with comprehensive matching

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript circular type inference**
- **Found during:** Task 3 (public queries)
- **Issue:** TypeScript reported circular reference errors when action called another action via `api`
- **Fix:** Changed compute action to `internalAction`, call via `internal.matching.compute`, added explicit return type annotations
- **Files modified:** convex/matching/compute.ts, convex/matches.ts
- **Verification:** `npx convex dev --once` succeeds with no type errors
- **Committed in:** `01245c4` (fix), `1cb171f` (feat)

---

**Total deviations:** 1 auto-fixed (blocking TypeScript issue)
**Impact on plan:** TypeScript pattern adjustment. No scope creep, implementation matches plan intent.

## Issues Encountered

None - all tasks completed after resolving the TypeScript type inference issue.

## User Setup Required

None - no external service configuration required. ANTHROPIC_API_KEY already configured in Phase 03.

## Next Phase Readiness

- Match compute engine complete for dashboard UI (04-03)
- Public API ready: `api.matches.getMyMatches`, `api.matches.triggerMatchComputation`
- Growth areas data structure ready for recommendations display (04-04)
- No blockers for proceeding to matches dashboard

---
*Phase: 04-matching*
*Completed: 2026-01-18*
