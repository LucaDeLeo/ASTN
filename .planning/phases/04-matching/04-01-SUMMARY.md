---
phase: 04-matching
plan: 01
subsystem: database
tags: [convex, schema, matching, internal-queries, internal-mutations]

# Dependency graph
requires:
  - phase: 03-profiles
    provides: Profile schema with education, workHistory, skills, careerGoals, privacySettings
  - phase: 01-foundation-opportunities
    provides: Opportunities table with status, organization, deadline fields
provides:
  - matches table schema with tier/score/explanation/probability/recommendations
  - Internal queries for profile and opportunity data access
  - Internal mutations for match storage, clearing, and view tracking
affects:
  - 04-02 (match compute engine will use these queries/mutations)
  - 04-03 (matches dashboard will query match results)
  - 04-04 (recommendations UI will display match recommendations)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Internal queries/mutations in convex/matching/ for matching domain separation

key-files:
  created:
    - convex/matching/queries.ts
    - convex/matching/mutations.ts
  modified:
    - convex/schema.ts

key-decisions:
  - "Tier labels (great/good/exploring) instead of percentages per CONTEXT.md"
  - "isNew boolean tracks first-time matches vs recurring for prioritization"
  - "modelVersion field enables tracking which LLM version generated matches"
  - "Separate internal queries/mutations following enrichment/ pattern"

patterns-established:
  - "Matching domain uses internal functions only - public API comes in later plans"
  - "Match validation uses matchResultValidator for consistent LLM result handling"

# Metrics
duration: 3min
completed: 2026-01-18
---

# Phase 04 Plan 01: Match Data Layer Summary

**Convex schema with matches table, internal queries for profile/opportunity context, and internal mutations for match storage**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T05:07:17Z
- **Completed:** 2026-01-18T05:10:14Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added matches table with tier, score, explanation, probability, and recommendations fields
- Created internal queries for fetching profile and opportunity data for matching context
- Created internal mutations for saving, clearing, and marking matches as viewed
- Established matching domain directory structure (convex/matching/)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add matches table to schema** - `5e6b237` (feat)
2. **Task 2: Create internal queries for matching data access** - `32498a1` (feat)
3. **Task 3: Create internal mutations for match storage** - `39afb6d` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added matches table with 4 indexes (by_profile, by_profile_tier, by_opportunity, by_profile_new)
- `convex/matching/queries.ts` - Internal queries: getFullProfile, getCandidateOpportunities, getExistingMatches, getProfileByUserId
- `convex/matching/mutations.ts` - Internal mutations: saveMatches, clearMatchesForProfile, markMatchesViewed

## Decisions Made

- Used tier labels (great/good/exploring) instead of percentages per CONTEXT.md user requirements
- Track isNew boolean to enable "new high-fit" prioritization in UI
- Include modelVersion field for debugging which Claude model version generated matches
- Follow enrichment/ pattern with internal queries/mutations in dedicated matching/ directory

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data layer complete for match compute engine (04-02)
- Internal queries ready for context construction
- Internal mutations ready for storing LLM match results
- No blockers for proceeding to compute action

---
*Phase: 04-matching*
*Completed: 2026-01-18*
