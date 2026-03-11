# T01: 41-participant-experience 01

**Slice:** S05 — **Milestone:** M001

## Description

Evolve the material schema and backend queries to support essential/optional flags, audio file storage, audio URL resolution, storage blob cleanup, and prompt completion data for continue-here markers.

Purpose: All four Phase 41 features (MOD-01 through MOD-04) depend on schema and backend changes. Consolidating them in one plan ensures the material object, validators, and queries evolve atomically without version conflicts.

Output: Updated schema, validators, mutations (with blob cleanup), and participant view query ready for frontend consumption.

## Must-Haves

- [ ] 'Schema accepts materials with isEssential flag and audio type with storageId'
- [ ] 'Existing materials (no isEssential field) are treated as essential by convention'
- [ ] 'Audio materials can be created without a url (url is optional)'
- [ ] 'getParticipantProgramView returns audioUrl for audio materials and promptCompletionByModule for continue-here'
- [ ] 'Orphaned storage blobs are deleted when audio materials are removed or replaced'

## Files

- `convex/schema.ts`
- `convex/programs.ts`
- `src/lib/program-constants.ts`
