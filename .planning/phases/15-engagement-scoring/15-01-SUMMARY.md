---
phase: 15-engagement-scoring
plan: 01
subsystem: backend
tags: [llm, anthropic, convex, cron, engagement, classification]

# Dependency graph
requires:
  - phase: 14-attendance-tracking
    provides: Attendance data for engagement signals
provides:
  - memberEngagement table for per-org engagement levels
  - LLM-based engagement classification with explanations
  - Daily cron job for batch engagement computation
  - Override capability with audit trail
affects: [16-crm-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - LLM classification with forced tool_use for structured output
    - Per-org engagement scoring (not global)
    - Dual explanations (admin-detailed, user-friendly)

key-files:
  created:
    - convex/engagement/prompts.ts
    - convex/engagement/queries.ts
    - convex/engagement/mutations.ts
    - convex/engagement/compute.ts
  modified:
    - convex/schema.ts
    - convex/crons.ts

key-decisions:
  - "Claude Haiku for cost-effective engagement classification"
  - "100ms delay between member classifications for rate limiting"
  - "Override expiration checked during batch computation"
  - "User-facing text never shows 'At Risk' - softer language used"

patterns-established:
  - "Engagement level per user-org pair (not global)"
  - "Dual explanation generation (admin + user)"
  - "Override with required notes and audit history"

# Metrics
duration: 6min
completed: 2026-01-19
---

# Phase 15 Plan 01: Engagement Scoring Backend Summary

**LLM-based engagement classification with 5 levels (highly_engaged/moderate/at_risk/new/inactive), dual explanations for admins and users, and daily batch computation via cron**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-19T20:49:07Z
- **Completed:** 2026-01-19T20:55:07Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Created memberEngagement and engagementOverrideHistory schema tables with proper indexes
- Built LLM classification tool using Claude Haiku with forced tool_use for consistent structured output
- Implemented engagement compute action that gathers attendance signals and generates classifications
- Added daily cron at 4 AM UTC for batch engagement computation across all orgs
- Override system with required notes and audit trail for admin manual adjustments

## Task Commits

Each task was committed atomically:

1. **Task 1: Add engagement schema tables** - `217f12f` (feat)
2. **Task 2: Create engagement prompts and tool definition** - `6b0bbb9` (feat)
3. **Task 3: Create engagement compute action and cron** - `4337cde` (feat)

## Files Created/Modified
- `convex/schema.ts` - Added memberEngagement and engagementOverrideHistory tables
- `convex/engagement/prompts.ts` - LLM tool definition, system prompt, context builder
- `convex/engagement/queries.ts` - Internal/public queries for engagement data
- `convex/engagement/mutations.ts` - Save scores, override, clear override
- `convex/engagement/compute.ts` - LLM classification action, batch processing
- `convex/crons.ts` - Daily engagement computation cron at 4 AM UTC

## Decisions Made
- Used Claude Haiku (claude-haiku-4-5-20251001) for cost-effective classification
- 100ms delay between member classifications to avoid rate limiting
- 500ms delay between orgs during batch processing
- Override expiration checked and cleared during computation cycle
- User-facing explanations never show "At Risk" - use softer language per CONTEXT.md
- Stale threshold of 24 hours for score recomputation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused import in mutations.ts**
- **Found during:** Task 3 verification
- **Issue:** TypeScript error for unused import of EngagementSignals and EngagementLevel types
- **Fix:** Removed the unused import
- **Files modified:** convex/engagement/mutations.ts
- **Verification:** Lint passes
- **Committed in:** 4337cde (amended)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor cleanup, no scope change.

## Issues Encountered
- Initial circular type inference in runEngagementBatch action - fixed by adding explicit return type annotation

## User Setup Required

None - no external service configuration required. Uses existing ANTHROPIC_API_KEY already configured in Convex dashboard.

## Next Phase Readiness
- Engagement backend complete, ready for UI implementation in Plan 02
- memberEngagement table populated by daily cron (or manual trigger)
- Admin override mutations ready for dashboard integration

---
*Phase: 15-engagement-scoring*
*Completed: 2026-01-19*
