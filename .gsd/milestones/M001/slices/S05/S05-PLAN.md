# S05: Participant Experience

**Goal:** Evolve the material schema and backend queries to support essential/optional flags, audio file storage, audio URL resolution, storage blob cleanup, and prompt completion data for continue-here markers.
**Demo:** Evolve the material schema and backend queries to support essential/optional flags, audio file storage, audio URL resolution, storage blob cleanup, and prompt completion data for continue-here markers.

## Must-Haves

## Tasks

- [x] **T01: 41-participant-experience 01**
  - Evolve the material schema and backend queries to support essential/optional flags, audio file storage, audio URL resolution, storage blob cleanup, and prompt completion data for continue-here markers.

Purpose: All four Phase 41 features (MOD-01 through MOD-04) depend on schema and backend changes. Consolidating them in one plan ensures the material object, validators, and queries evolve atomically without version conflicts.

Output: Updated schema, validators, mutations (with blob cleanup), and participant view query ready for frontend consumption.

- [x] **T02: 41-participant-experience 02**
  - Add facilitator-side UI for marking materials as essential/optional and uploading audio files in the module form dialog.

Purpose: These two capabilities are entirely facilitator-facing and modify the same form component. Combining them avoids touching ModuleFormDialog twice.

Output: ModuleFormDialog with essential/optional toggle per material, audio type in material type picker, and inline audio file upload. MaterialIcon with audio icon support.

- [x] **T03: 41-participant-experience 03**
  - Implement participant-facing UI for all four module enhancements: essential/optional visual distinction, inline audio playback, time-to-session indicator, and continue-here progress marker.

Purpose: These features all appear on the participant program page and its MaterialChecklist sub-component. Grouping them avoids touching $programSlug.tsx and MaterialChecklist.tsx multiple times.

Output: Participants see essential vs optional badges on materials, can play audio inline, see time-to-session awareness, and get a visual marker pointing to their next incomplete item.

## Files Likely Touched

- `convex/schema.ts`
- `convex/programs.ts`
- `src/lib/program-constants.ts`
- `src/components/programs/ModuleFormDialog.tsx`
- `src/components/programs/MaterialIcon.tsx`
- `src/components/programs/MaterialChecklist.tsx`
- `src/routes/org/$slug/program/$programSlug.tsx`
