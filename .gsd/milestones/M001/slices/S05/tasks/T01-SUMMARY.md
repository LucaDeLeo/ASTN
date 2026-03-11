---
id: T01
parent: S05
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

# T01: 41-participant-experience 01

**# Plan 41-01 Summary: Schema + Backend**

## What Happened

# Plan 41-01 Summary: Schema + Backend

## Status: Complete

## What was done

### Task 1: Schema and validator evolution

- **convex/schema.ts**: Updated `programModules.materials` object — `url` now optional, added `v.literal('audio')` to type union, added `isEssential: v.optional(v.boolean())`, added `storageId: v.optional(v.id('_storage'))`
- **convex/programs.ts**: Updated `materialValidator` to match schema. Created `materialReturnValidator` extending it with `audioUrl: v.optional(v.string())` for query returns
- **src/lib/program-constants.ts**: Updated `MaterialItem` interface with `url?`, `audio` type, `isEssential?`, `storageId?`, `audioUrl?`

### Task 2: Backend query and mutation updates

- **Audio URL resolution**: `getParticipantProgramView` (getProgramBySlug) resolves `storageId` → `audioUrl` inline via `ctx.storage.getUrl()`, following existing org logo pattern
- **Prompt completion**: Added `promptCompletionByModule` computation — queries `coursePrompts` by module, checks `coursePromptResponses` for submitted status per user
- **Blob cleanup in updateModule**: Compares old vs new storageIds, deletes orphaned blobs via `ctx.storage.delete()`
- **Blob cleanup in deleteModule**: Iterates materials and deletes all storageIds before deleting module
- **Type fixes**: Updated inline material type definitions in `$programSlug.tsx`, admin programs page, `MaterialChecklist.tsx`, and `ModuleFormDialog.tsx` validation

## Deviations

- Had to fix downstream type references across 4 additional frontend files beyond the plan scope (admin page, program page, MaterialChecklist, ModuleFormDialog) to maintain type safety after making `url` optional and adding `audio` type
- Used `filter(Boolean)` instead of type predicate for storageId filtering to avoid TypeScript Id type narrowing issues

## Commit

`7eda1ac` feat(41-01): evolve material schema for essential/optional, audio, and prompt completion
