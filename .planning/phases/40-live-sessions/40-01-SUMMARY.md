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
