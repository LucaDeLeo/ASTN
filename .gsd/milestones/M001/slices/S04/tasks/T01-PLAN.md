# T01: 40-live-sessions 01

**Slice:** S04 — **Milestone:** M001

## Description

Create the schema foundation for the session runner and session phase CRUD backend.

Purpose: All other Phase 40 plans depend on these tables and setup mutations. This plan establishes the data model and the pre-session workflow where facilitators define the agenda.
Output: Five new schema tables, migrated coursePrompts attachedTo union, and session phase CRUD in convex/course/sessionSetup.ts + queries in convex/course/sessionQueries.ts.

## Must-Haves

- [ ] 'Five new tables exist in schema: sessionPhases, sessionLiveState, sessionPresence, sessionPairAssignments, sessionPhaseResults'
- [ ] 'coursePrompts.attachedTo.session_phase uses phaseId (Id<sessionPhases>) instead of phaseIndex (number)'
- [ ] 'Facilitator can create, update, reorder, and delete session phases for a given session'
- [ ] 'Phase CRUD is blocked while a live session is running for that session'
- [ ] 'Session phases can reference coursePrompts via promptIds array and optional pairConfig'

## Files

- `convex/schema.ts`
- `convex/course/sessionSetup.ts`
- `convex/course/sessionQueries.ts`
