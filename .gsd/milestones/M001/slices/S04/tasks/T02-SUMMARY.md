---
id: T02
parent: S04
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration:
verification_result: passed
completed_at:
blocker_discovered: false
---

# T02: 40-live-sessions 02

**# Plan 40-02 Summary: Session Runner Backend**

## What Happened

# Plan 40-02 Summary: Session Runner Backend

## What was built

- 7 session runner mutations: `startSession`, `advancePhase`, `extendPhase`, `skipPhase`, `endSession`, `createAdHocPrompt`, `updatePresence`
- 2 pairing mutations: `generatePairs`, `setManualPairs`
- Fisher-Yates shuffle for random pairing, cross-choice grouping for complementary pairing
- One-live-session-per-program invariant enforced via `by_programId_and_status` index

## Files created

- `convex/course/sessionRunner.ts` — session lifecycle mutations
- `convex/course/sessionPairing.ts` — pairing algorithms

## Key decisions

- `startSession` enforces exactly one live session per program at the mutation level
- `advancePhase` records phase results (actualDurationMs) before moving to next phase
- `skipPhase` moves to next without recording results
- `createAdHocPrompt` creates a coursePrompt attached to current phase and adds to activePromptIds
- `updatePresence` uses `requireAuth` (not `requireOrgAdmin`) since participants call it
- Complementary pairing interleaves across choice groups for diversity
- Trio creation for odd participant count (last 3 grouped together)
- All facilitator mutations are idempotent (return null if session not in expected state)

## Commit

`ab8dad8` feat(40-02): add session runner backend with lifecycle, presence, pairing
