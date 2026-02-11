---
phase: 35-generation
plan: 02
subsystem: llm-pipeline
tags: [convex, anthropic, haiku, tool-choice, zod, career-actions, scheduler]

# Dependency graph
requires:
  - phase: 35-01
    provides: careerActions table, Zod validation schemas, internal queries, saveGeneratedActions mutation
provides:
  - ACTION_GENERATION_SYSTEM_PROMPT enforcing personalization, anti-hallucination, type variety
  - generateCareerActionsTool Anthropic tool definition for structured 3-5 action output
  - buildActionGenerationContext composing profile + growth areas + preserved actions
  - computeActionsForProfile internalAction with Haiku 4.5 LLM pipeline
  - Scheduler trigger in triggerMatchComputation for fire-and-forget action generation
affects: [35-03 (UI display), 36 (completion loop)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    [
      fire-and-forget scheduler trigger alongside matching,
      growth area aggregation from match recommendations for LLM context,
      shadow-mode Zod validation for LLM output,
    ]

key-files:
  created:
    - convex/careerActions/prompts.ts
    - convex/careerActions/compute.ts
  modified:
    - convex/matches.ts
    - convex/_generated/api.d.ts
    - src/components/actions/ActionCard.tsx
    - src/components/actions/CompletedActionsSection.tsx

key-decisions:
  - 'Aggregated match recommendations as growth area context for LLM instead of stored growth areas (not persisted in DB)'
  - 'Used shadow-mode Zod validation matching existing matching pipeline pattern'

patterns-established:
  - 'Fire-and-forget action generation: scheduler.runAfter(0) alongside matching, non-blocking, silent failure'
  - 'Growth area aggregation: flatMap match recommendations into type/action pairs for LLM context'

# Metrics
duration: 6min
completed: 2026-02-11
---

# Phase 35 Plan 02: LLM Generation Pipeline Summary

**Haiku 4.5 career action generation with forced tool_choice, growth area context from match recommendations, and fire-and-forget scheduler trigger alongside matching**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-11T01:28:43Z
- **Completed:** 2026-02-11T01:35:19Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- System prompt enforces personalization (must reference profile elements), anti-hallucination (no specific resources), type variety (3+ types), and deduplication (avoids preserved actions)
- Single Haiku 4.5 call with forced tool_choice produces structured 3-5 action output with type, title, description, rationale, and profileBasis
- Action generation runs fire-and-forget alongside matching via ctx.scheduler.runAfter(0) -- failures logged silently, never affect match computation
- Growth areas extracted from existing match recommendations and preserved action context passed to LLM for informed generation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create prompts module with system prompt and tool definition** - `cc89c6a` (feat)
2. **Task 2: Create compute action and wire trigger into match computation** - `f0ab4bd` (feat)

## Files Created/Modified

- `convex/careerActions/prompts.ts` - System prompt, Anthropic tool definition, and context builder function
- `convex/careerActions/compute.ts` - internalAction calling Haiku 4.5 with profile + growth area + preserved action context
- `convex/matches.ts` - Added scheduler.runAfter trigger for action generation in triggerMatchComputation
- `convex/_generated/api.d.ts` - Auto-regenerated to include careerActions/compute module
- `src/components/actions/ActionCard.tsx` - Fixed status type to include 'dismissed' (pre-existing file)
- `src/components/actions/CompletedActionsSection.tsx` - Fixed status type to include 'dismissed' (pre-existing file)

## Decisions Made

- Aggregated match recommendations (type + action pairs) as growth area context for the LLM, since growth areas from matching are not persisted in the database -- they are computed per-batch and accumulated but not stored per-match
- Used shadow-mode Zod validation (log errors, accept data) matching the existing matching pipeline pattern, allowing generation to succeed even with minor schema deviations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed ActionCard and CompletedActionsSection status type**

- **Found during:** Task 2 (pre-commit hook failure)
- **Issue:** Pre-existing ActionCard.tsx (from prior Plan 03 prototype) and CompletedActionsSection.tsx defined status as `'active' | 'saved' | 'in_progress' | 'done'` but Convex data includes `'dismissed'`. tsc --noEmit in pre-commit hook failed.
- **Fix:** Added 'dismissed' to the status union type in both components
- **Files modified:** src/components/actions/ActionCard.tsx, src/components/actions/CompletedActionsSection.tsx
- **Verification:** tsc --noEmit and bun run lint both pass
- **Committed in:** f0ab4bd (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to unblock commit due to pre-existing prototype files with incomplete types. No scope creep.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None - no external service configuration required. ANTHROPIC_API_KEY is already configured in Convex dashboard.

## Next Phase Readiness

- LLM generation pipeline complete, ready for Plan 03's UI integration
- computeActionsForProfile registered in Convex and triggerable via match refresh
- buildActionGenerationContext and buildProfileContext available for any future context construction needs
- ActionCard and CompletedActionsSection type fixes ensure Plan 03 UI components will compile cleanly

## Self-Check: PASSED

- All 2 created files exist on disk
- All 4 modified files exist on disk
- Both task commits (cc89c6a, f0ab4bd) verified in git log

---

_Phase: 35-generation_
_Completed: 2026-02-11_
