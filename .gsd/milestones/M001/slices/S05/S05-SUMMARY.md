---
id: S05
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

# S05: Participant Experience

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

# Plan 41-02 Summary: Facilitator UI

## Status: Complete

## What was done

### MaterialIcon.tsx

- Added `Headphones` import from lucide-react
- Added `case 'audio'` returning `<Headphones>` icon

### ModuleFormDialog.tsx — Essential/Optional toggle

- Each material card has a clickable "Essential" / "Optional" toggle at bottom
- Default: `isEssential: undefined` (treated as essential)
- Click toggles between essential (undefined) and optional (false)
- Visual: essential = bold slate-600, optional = muted slate-400

### ModuleFormDialog.tsx — Audio upload

- Added "Audio" option to material type `<Select>` dropdown
- When type is `audio`: shows file upload button instead of URL input
- Upload flow: file input → validate MIME (`audio/*`) → `generateUploadUrl` → POST file → store `storageId`
- Shows spinner during upload, "Audio uploaded" confirmation after
- "Replace" button for re-upload when storageId exists
- Auto-fills label from filename on first upload
- Switching type away from audio clears storageId

### ModuleFormDialog.tsx — Validation

- Updated material validation: `m.url?.trim() || m.storageId` (accepts audio materials without URL)
- Strips `audioUrl` before sending to mutation (server-computed field)
- Casts `storageId` to `Id<'_storage'>` for Convex type compatibility

## Deviations

- None — implemented exactly as planned

## Commit

`333f37f` feat(41-02,03): facilitator UI + participant UI for module enhancements

# Plan 41-03 Summary: Participant UI

## Status: Complete

## What was done

### MaterialChecklist.tsx — Essential/Optional distinction (MOD-01)

- Materials with `isEssential === false` show "(optional)" label in muted text
- Progress summary counts only essential materials: `{essentialCompleted}/{essentialMaterials.length} done`
- `remainingMinutes` and `totalMinutes` exclude optional materials

### MaterialChecklist.tsx — Audio playback (MOD-02)

- Audio materials render label as text (not link) with `<audio controls preload="none">` player below
- Non-audio materials render existing `<a href>` link pattern
- Audio without `audioUrl` shows "(audio unavailable)" fallback

### MaterialChecklist.tsx — Continue-here highlight (MOD-04)

- Accepts `continueHereIndex?: number` prop
- Matching material gets blue left border (`border-l-2 border-blue-500 pl-2`) and "Continue here" badge

### $programSlug.tsx — Time-to-session indicator (MOD-03)

- `daysUntilSession()` helper: calendar-day diff using `startOfDay` normalization (timezone-safe)
- `TimeToSessionIndicator` component: finds nearest future session, computes remaining essential pre-work minutes from linked modules
- Displays as blue callout card: "Session title · In X days · ~Yh Zm pre-work remaining"
- Shows "Today" / "Tomorrow" / "All pre-work complete" variants

### $programSlug.tsx — Continue-here logic (MOD-04)

- Computes `continueHere` in `useMemo`: iterates modules by orderIndex, finds first incomplete essential material, then checks prompts via `promptCompletionByModule`
- Passes `continueHereIndex` to `MaterialChecklist` and `isContinueHere` to `ModulePrompts` for the matching module

### $programSlug.tsx — ProgressSection (MOD-01)

- `totalMaterials` counts only essential materials (`isEssential !== false`)
- `completedMaterials` cross-references progress entries with material's `isEssential` flag

### ModulePrompts.tsx — Continue-here

- Accepts `isContinueHere?: boolean` prop
- When true: blue left border and "Continue here" badge on exercises section

## Deviations

- None — all four requirements implemented as planned

## Commit

`333f37f` feat(41-02,03): facilitator UI + participant UI for module enhancements
