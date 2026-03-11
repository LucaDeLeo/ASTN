---
id: S04
parent: M001
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

# S04: Live Sessions

**# Plan 40-01 Summary: Schema Foundation + Session Phase CRUD**

## What Happened

# Plan 40-01 Summary: Schema Foundation + Session Phase CRUD

## What was built

- 5 new Convex tables: `sessionPhases`, `sessionLiveState`, `sessionPresence`, `sessionPairAssignments`, `sessionPhaseResults`
- Migrated `coursePrompts.attachedTo.session_phase` from `phaseIndex: v.number()` to `phaseId: v.id('sessionPhases')`
- 4 session setup mutations: `createPhase`, `updatePhase`, `reorderPhases`, `deletePhase`
- 6 session queries: `getSessionPhases`, `getLiveState`, `getPresence`, `getPairAssignments`, `getPhaseResults`, `getMyPairs`

## Files created/modified

- `convex/schema.ts` — added 5 tables with indexes
- `convex/course/sessionSetup.ts` — new file, phase CRUD mutations
- `convex/course/sessionQueries.ts` — new file, session read queries
- `convex/course/prompts.ts` — migrated attachedTo validator
- `src/components/course/PromptForm.tsx` — updated TypeScript interface

## Key decisions

- Separated hot state (`sessionLiveState`) from stable definitions (`sessionPhases`) per research recommendations
- `requireNotLive` helper checks live state before allowing phase edits
- Presence filtering by 30s heartbeat window done in app code (acceptable at BAISH scale)
- `getMyPairs` returns partner userIds from most recent assignment for the phase

## Commit

`0badf24` feat(40-01): add session runner schema and phase CRUD

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

# Plan 40-03 Summary: Facilitator UI

## What was built

- `SessionSetup` — phase list editor with add form, reorder, start session button
- `SessionRunner` — two-column live dashboard with timer, controls, presence, prompts, pairs
- `PhaseCard` — individual phase display with inline editing, reorder buttons, delete
- `LiveTimer` — countdown timer component (red pulse <60s, "Time's up" at 0)
- `PresenceIndicator` — real-time submitted/typing/idle counts with badges
- `AdHocPromptDialog` — dialog form to create ad-hoc prompts during live session
- `PairDisplay` — pair assignment display with generate buttons (Random/Complementary)
- Dedicated `/session-runner` route under admin programs

## Files created

- `src/components/session/SessionSetup.tsx`
- `src/components/session/SessionRunner.tsx`
- `src/components/session/PhaseCard.tsx`
- `src/components/session/LiveTimer.tsx`
- `src/components/session/PresenceIndicator.tsx`
- `src/components/session/AdHocPromptDialog.tsx`
- `src/components/session/PairDisplay.tsx`
- `src/routes/org/$slug/admin/programs/$programId/session-runner.tsx`

## Files modified

- `src/routes/org/$slug/admin/programs/$programId/index.tsx` — moved from `$programId.tsx`, added "Run Session" links

## Key decisions

- Route restructured: `$programId.tsx` → `$programId/index.tsx` to allow sibling `session-runner.tsx`
- Two-column layout: main area (80%) for current phase + sidebar (20%) for phase timeline
- Controls: Next Phase, +1 min, +5 min, Skip, Ad-Hoc Prompt, End Session
- Completed state shows summary card with phase count, duration, attendance
- Session runner route uses `sessionId` search param to support multiple sessions per program

## Commit

`ed8eaed` feat(40-03): add facilitator session runner UI

# Plan 40-04 Summary: Participant Live View

## What was built

- `ParticipantLiveView` — live session banner on participant program page
- `ParticipantPairView` — shows participant's pair/trio assignment
- Presence heartbeat every 10s while live session is active
- Focus/blur handlers for typing/idle presence status updates
- Integration into program page (renders above Session Timeline)

## Files created

- `src/components/session/ParticipantLiveView.tsx`
- `src/components/session/ParticipantPairView.tsx`

## Files modified

- `src/routes/org/$slug/program/$programSlug.tsx` — added ParticipantLiveView import and placement

## Key decisions

- Component iterates all sessions and renders banner only for running one (avoids conditional hooks)
- At BAISH scale (~6 sessions), querying liveState per session is acceptable
- Only renders for enrolled participants (`participation` check in parent)
- Presence heartbeat uses `useEffect` with 10s interval, silent failure on errors
- PromptRenderer reused in `participate` mode for active prompts
- ParticipantPairView queries `getMyPairs` and shows partner names via user lookup

## Commit

`42de110` feat(40-04): add participant live view with real-time session banner
