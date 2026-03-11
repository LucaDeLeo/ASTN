---
id: T01
parent: S01
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

# T01: 37-interactive-prompts 01

**# Plan 37-01 Summary: Schema + Backend**

## What Happened

# Plan 37-01 Summary: Schema + Backend

**Status:** Complete
**Commit:** a16fa24

## What was built

- **coursePrompts table** in `convex/schema.ts` with fields for title, body (markdown), attachedTo union (module or session_phase), fields array, revealMode, revealedAt, and metadata. Indexes: by_programId, by_moduleId, by_sessionId, by_programId_and_orderIndex.
- **coursePromptResponses table** with fieldResponses array, draft/submitted status, spotlight fields. Indexes: by_promptId, by_promptId_and_userId, by_programId_and_userId.
- **convex/course/\_helpers.ts** with shared auth helpers: requireOrgAdmin, checkProgramAccess, requireProgramAccess.
- **convex/course/prompts.ts** with create, update, remove, get, getByModule, getBySession, triggerReveal functions.
- **convex/course/responses.ts** with saveResponse, getMyResponse, getPromptResponses (visibility-filtered), toggleSpotlight functions.
- Installed react-markdown, remark-gfm, and shadcn radio-group component.

## Key decisions

- Used explicit table name pattern (`db.get('tableName', id)`) per project lint rules.
- Denormalized moduleId/sessionId as top-level optional fields for indexing.
- Visibility logic centralized in getPromptResponses with three modes handled via switch.
- Import sort order follows project alphabetical convention.

## Deviations

None.
