# S04: Live Sessions

**Goal:** Create the schema foundation for the session runner and session phase CRUD backend.
**Demo:** Create the schema foundation for the session runner and session phase CRUD backend.

## Must-Haves

## Tasks

- [x] **T01: 40-live-sessions 01**
  - Create the schema foundation for the session runner and session phase CRUD backend.

Purpose: All other Phase 40 plans depend on these tables and setup mutations. This plan establishes the data model and the pre-session workflow where facilitators define the agenda.
Output: Five new schema tables, migrated coursePrompts attachedTo union, and session phase CRUD in convex/course/sessionSetup.ts + queries in convex/course/sessionQueries.ts.

- [x] **T02: 40-live-sessions 02**
  - Build the live session lifecycle backend: facilitator control mutations, presence tracking, pairing algorithms, and ad-hoc prompt support.

Purpose: This is the core runtime engine. It manages the real-time state that both facilitator and participant UIs will subscribe to. Without this, no live session can run.
Output: sessionRunner.ts (lifecycle mutations), sessionPairing.ts (pairing algorithms), extended sessionQueries.ts (presence, pairs, results queries).

- [x] **T03: 40-live-sessions 03**
  - Build the facilitator-facing session runner UI: phase setup editor and live session dashboard.

Purpose: The facilitator needs to define session agenda (phases with titles, durations, prompts, pair configs) and then run the session live with real-time controls.
Output: Dedicated session runner route and session component library (setup, runner, timer, presence, pairs, ad-hoc prompts).

- [x] **T04: 40-live-sessions 04**
  - Build the participant's real-time view of live sessions and integrate it into the existing program page.

Purpose: Participants need to see the current phase, timer, active prompts, and their pair assignment in real-time as the facilitator runs the session. This is the participant half of the live session experience.
Output: ParticipantLiveView banner component, ParticipantPairView component, and program page integration.

## Files Likely Touched

- `convex/schema.ts`
- `convex/course/sessionSetup.ts`
- `convex/course/sessionQueries.ts`
- `convex/course/sessionRunner.ts`
- `convex/course/sessionPairing.ts`
- `convex/course/sessionQueries.ts`
- `src/routes/org/$slug/admin/programs/$programId/session-runner.tsx`
- `src/components/session/SessionSetup.tsx`
- `src/components/session/PhaseCard.tsx`
- `src/components/session/SessionRunner.tsx`
- `src/components/session/LiveTimer.tsx`
- `src/components/session/PresenceIndicator.tsx`
- `src/components/session/PairDisplay.tsx`
- `src/components/session/AdHocPromptDialog.tsx`
- `src/components/session/ParticipantLiveView.tsx`
- `src/components/session/ParticipantPairView.tsx`
- `src/routes/org/$slug/program/$programSlug.tsx`
