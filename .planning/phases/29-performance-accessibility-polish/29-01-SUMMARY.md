---
phase: 29-performance-accessibility-polish
plan: 01
subsystem: performance
tags:
  [
    convex,
    n-plus-1,
    batch-queries,
    rate-limiting,
    scheduled-actions,
    anthropic-api,
  ]

# Dependency graph
requires:
  - phase: 28-quality-gates-bug-fixes
    provides: CI pipeline and pre-commit hooks to catch regressions from performance refactors
provides:
  - Batched attendance queries (events + orgs via Promise.all + Map lookup)
  - Batched email user lookups (ctx.db.get with Id cast instead of full-table scan)
  - Batched program participant profile lookups
  - Chained scheduled action architecture for matching compute with rate limiting
  - Incremental batch result saving via saveBatchResults mutation
  - Exponential backoff on Anthropic API rate limit errors
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Two-pass batch pattern: collect IDs into Set, batch fetch via Promise.all, build Map for O(1) lookup'
    - 'Chained scheduled actions: ctx.scheduler.runAfter chains for long-running compute avoiding 10-min timeout'
    - 'Exponential backoff: Math.min(1000 * Math.pow(2, retryCount), 60000) for rate limit retries'
    - 'Idempotency guard via runTimestamp for batch saves'

key-files:
  created: []
  modified:
    - convex/attendance/queries.ts
    - convex/emails/send.ts
    - convex/programs.ts
    - convex/matching/compute.ts
    - convex/matching/mutations.ts
    - convex/matches.ts

key-decisions:
  - 'Task 1 changes committed as part of 29-02 plan execution (co-located in same commit)'
  - 'Growth areas accumulated via scheduler arguments rather than transient DB fields'
  - 'MatchComputationResult fields made optional to support async return shape'

patterns-established:
  - 'Two-pass batch pattern for N+1 resolution in Convex queries'
  - 'Chained ctx.scheduler.runAfter for long-running compute with per-batch saves'

# Metrics
duration: ~45min
completed: 2026-02-02
---

# Phase 29 Plan 01: N+1 Query Resolution & Rate-Limited Matching Summary

**Batched attendance/email/program queries via two-pass Set+Map pattern, and chained scheduled action architecture for matching compute with exponential backoff rate limiting**

## Performance

- **Duration:** ~45 min (across two execution sessions)
- **Started:** 2026-02-02
- **Completed:** 2026-02-02
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Eliminated all N+1 query patterns in hot-path database queries: 3 attendance functions, 4 email batch functions, 1 program participant function
- Replaced full-table-scan `ctx.db.query("users").filter()` with direct `ctx.db.get("users", id)` lookups in all 4 email batch functions
- Refactored matching compute from synchronous batch loop to chained scheduled actions with 1-second rate limiting between batches
- Added exponential backoff (max 10 retries, up to 60s delay) for Anthropic API rate limit errors (429)
- Added incremental `saveBatchResults` mutation with idempotency guards via `runTimestamp`
- Added performance logging (read counts, wall-clock timing) across all optimized functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Batch N+1 fixes in attendance, emails, and programs queries** - `9b019e2` (feat) -- co-committed with 29-02 accessibility changes
2. **Task 2: Rate-limited matching with chained scheduled actions** - `fcb1f8f` (feat)

## Files Created/Modified

- `convex/attendance/queries.ts` - Batched event+org lookups in getMyAttendanceHistory, getPendingPrompts, getMyAttendanceSummary using Set dedup + Promise.all + Map lookup
- `convex/emails/send.ts` - Direct ID-based user lookups via ctx.db.get("users", id as Id<"users">) replacing full-table-scan filter pattern in 4 batch functions
- `convex/programs.ts` - Batched profile lookups in getProgramParticipants, performance log in getOrgPrograms
- `convex/matching/compute.ts` - Chained scheduled action architecture: computeMatchesForProfile schedules first batch, processMatchBatch handles per-batch LLM calls with rate limiting and exponential backoff
- `convex/matching/mutations.ts` - New saveBatchResults mutation for incremental batch saving, deduplicateGrowthAreas helper moved from compute.ts, growthAreaValidator
- `convex/matches.ts` - Updated MatchComputationResult interface (all fields optional) for async return shape

## Decisions Made

- **Growth areas via scheduler args:** Accumulated growth areas passed through scheduler arguments between batches rather than storing in transient DB fields -- avoids schema changes and keeps state self-contained in the action chain
- **MatchComputationResult optional fields:** Made matchCount, message, and totalBatches all optional since the async architecture returns `{ message, totalBatches }` without matchCount
- **Task 1 co-committed with 29-02:** The N+1 batch fixes were committed in the same commit as 29-02 accessibility changes because they were executed in parallel during wave 1

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed MatchComputationResult type incompatibility**

- **Found during:** Task 2 (Rate-limited matching)
- **Issue:** `convex/matches.ts` had `MatchComputationResult` with required `matchCount: number` but new `computeMatchesForProfile` returns `{ message: string, totalBatches: number }` (no matchCount field), causing TypeScript error
- **Fix:** Made all fields optional in the interface: `matchCount?: number; message?: string; totalBatches?: number`
- **Files modified:** convex/matches.ts
- **Verification:** `bun run build` passes
- **Committed in:** fcb1f8f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary type fix for cross-file compatibility. No scope creep.

## Issues Encountered

- **Linter/formatter reverting Write tool output:** The development environment has a save-on-write formatter that reverts files if written format doesn't match expectations. Resolved by writing each file in its pre-existing format convention (mutations.ts: double quotes + semicolons, compute.ts: single quotes + no semicolons).
- **Pre-commit hook TypeScript check:** The husky pre-commit hook runs `tsc --noEmit` which caught the MatchComputationResult type mismatch. Fixed by updating the interface.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All N+1 patterns resolved, ready for BAISH pilot scale (50-100 profiles)
- Matching compute can now process unlimited batches without hitting Convex 10-minute timeout
- Rate limiting prevents Anthropic API 429 errors during large matching runs
- Performance logging enables monitoring batch timing and read counts in Convex dashboard

---

_Phase: 29-performance-accessibility-polish_
_Completed: 2026-02-02_
