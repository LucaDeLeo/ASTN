---
phase: 01-foundation-opportunities
plan: 03
subsystem: aggregation
tags: [algolia, airtable, cron, sync, deduplication, string-similarity]

# Dependency graph
requires:
  - phase: 01-02
    provides: Convex schema with opportunities table and indexes
provides:
  - 80K Hours Algolia adapter for fetching job listings
  - aisafety.com Airtable adapter for fetching job listings
  - Sync orchestration with parallel source fetching
  - Fuzzy duplicate detection using string-similarity
  - Auto-archiving of stale opportunities
  - Daily cron job at 6 AM UTC
affects: [01-04, 02-profiles, 03-matching]

# Tech tracking
tech-stack:
  added: [algoliasearch, string-similarity-js]
  patterns:
    [
      internal-action-for-external-apis,
      separate-node-actions-from-mutations,
      fuzzy-dedup-with-threshold,
    ]

key-files:
  created:
    - convex/aggregation/eightyK.ts
    - convex/aggregation/aisafety.ts
    - convex/aggregation/dedup.ts
    - convex/aggregation/sync.ts
    - convex/aggregation/syncMutations.ts
    - convex/crons.ts
  modified:
    - package.json
    - bun.lock

key-decisions:
  - 'Use internalAction for adapter functions to enable calling from sync orchestrator'
  - 'Separate Node.js actions from mutations (Convex requires mutations in non-Node runtime)'
  - 'Fuzzy match threshold 0.85 for titles, 0.8 for organizations'
  - 'Rate limiting: 1s between Algolia pages, 250ms between Airtable pages'

patterns-established:
  - 'Aggregation pattern: Node.js action fetches external API, returns normalized data'
  - 'Sync pattern: Parallel fetch sources, upsert with dedup, archive missing'
  - 'Dedup pattern: Check by sourceId first, then fuzzy match by org + title'

# Metrics
duration: 5min
completed: 2026-01-17
---

# Phase 1 Plan 3: Opportunity Aggregation Summary

**80K Hours Algolia and aisafety.com Airtable adapters with daily sync, fuzzy deduplication, and auto-archiving**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-17T22:30:58Z
- **Completed:** 2026-01-17T22:35:57Z
- **Tasks:** 4
- **Files created:** 6

## Accomplishments

- 80K Hours adapter queries Algolia API for structured job data
- aisafety.com adapter fetches from Airtable REST API
- Sync orchestration fetches both sources in parallel
- Fuzzy duplicate detection merges listings from different sources
- Auto-archiving removes opportunities that disappear from sources
- Daily cron job scheduled at 6 AM UTC

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 80K Hours Algolia adapter** - `eeda19b` (feat)
2. **Task 2: Create aisafety.com Airtable adapter** - `94c3093` (feat)
3. **Task 3: Create sync orchestration with deduplication** - `4cc4354` (feat)
4. **Task 4: Set up cron job for daily sync** - `a7d0c7f` (feat)

## Files Created/Modified

- `convex/aggregation/eightyK.ts` - 80K Hours Algolia adapter with pagination and normalization
- `convex/aggregation/aisafety.ts` - aisafety.com Airtable adapter with pagination and normalization
- `convex/aggregation/dedup.ts` - Fuzzy string matching for title and organization
- `convex/aggregation/sync.ts` - Orchestration action calling adapters in parallel
- `convex/aggregation/syncMutations.ts` - Upsert and archive mutations
- `convex/crons.ts` - Daily sync job definition

## Decisions Made

- **Convex ESM import**: Used `import { algoliasearch } from "algoliasearch"` (not default import) for ESM compatibility
- **Action/Mutation separation**: Convex Node.js actions cannot contain mutations in same file, so syncMutations.ts is separate from sync.ts
- **Internal actions**: Changed adapters from public `action` to `internalAction` so sync.ts can call them

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Algolia ESM import**

- **Found during:** Task 1 (80K Hours adapter)
- **Issue:** `import algoliasearch from "algoliasearch"` failed with "No matching export for default"
- **Fix:** Changed to named import `import { algoliasearch } from "algoliasearch"`
- **Files modified:** convex/aggregation/eightyK.ts
- **Verification:** `bunx convex dev --once` succeeded
- **Committed in:** eeda19b

**2. [Rule 3 - Blocking] Separated Node.js actions from mutations**

- **Found during:** Task 3 (Sync orchestration)
- **Issue:** Convex error "Only actions can be defined in Node.js" when mutations were in same file as actions
- **Fix:** Split mutations into syncMutations.ts, kept actions in sync.ts with "use node"
- **Files modified:** Created convex/aggregation/syncMutations.ts, updated convex/aggregation/sync.ts
- **Verification:** `bunx convex dev --once` succeeded
- **Committed in:** 4cc4354

**3. [Rule 3 - Blocking] Changed adapters to internalAction**

- **Found during:** Task 3 (Sync orchestration)
- **Issue:** TypeScript error "Property 'eightyK' does not exist on type" because public actions not in internal API
- **Fix:** Changed adapters from `action` to `internalAction` so they appear in `internal.aggregation.*`
- **Files modified:** convex/aggregation/eightyK.ts, convex/aggregation/aisafety.ts
- **Verification:** `bunx convex dev --once` succeeded
- **Committed in:** 4cc4354

---

**Total deviations:** 3 auto-fixed (3 blocking issues)
**Impact on plan:** All fixes necessary for Convex runtime compatibility. No scope creep.

## Issues Encountered

None beyond the blocking issues documented above.

## User Setup Required

**External services require manual configuration:**

To enable sync, add these environment variables to Convex dashboard:

```bash
# 80K Hours Algolia (extract from 80000hours.org/jobs page source)
EIGHTY_K_ALGOLIA_APP_ID=
EIGHTY_K_ALGOLIA_API_KEY=

# aisafety.com Airtable (provided by their team)
AISAFETY_AIRTABLE_API_KEY=
AISAFETY_AIRTABLE_BASE_ID=
AISAFETY_AIRTABLE_TABLE_NAME=Jobs
```

**Verification:** Run `aggregation.sync.triggerSync` from Convex dashboard to test sync manually.

## Next Phase Readiness

- Aggregation infrastructure complete
- Ready for Phase 2 (User Profiles) - no blockers
- Credentials needed from 80K Hours page source and aisafety.com team before sync will fetch data
- Manual trigger available for testing once credentials are configured

---

_Phase: 01-foundation-opportunities_
_Completed: 2026-01-17_
