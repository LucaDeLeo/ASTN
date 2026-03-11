# T02: 41-participant-experience 02

**Slice:** S05 — **Milestone:** M001

## Description

Add facilitator-side UI for marking materials as essential/optional and uploading audio files in the module form dialog.

Purpose: These two capabilities are entirely facilitator-facing and modify the same form component. Combining them avoids touching ModuleFormDialog twice.

Output: ModuleFormDialog with essential/optional toggle per material, audio type in material type picker, and inline audio file upload. MaterialIcon with audio icon support.

## Must-Haves

- [ ] 'Facilitator can toggle a material between essential and optional in the module form'
- [ ] 'Facilitator can upload an MP3 audio file as a material via inline file picker'
- [ ] 'Audio type shows a headphones/audio icon in the material type selector'
- [ ] 'Audio materials show an upload button instead of a URL input'

## Files

- `src/components/programs/ModuleFormDialog.tsx`
- `src/components/programs/MaterialIcon.tsx`
