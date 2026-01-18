---
phase: 07-file-upload-foundation
plan: 02
subsystem: ui
tags: [react, hooks, xhr, upload, state-machine, convex]

# Dependency graph
requires:
  - phase: 07-01
    provides: Convex upload mutations (generateUploadUrl, saveDocument)
provides:
  - uploadWithProgress utility for XHR-based file uploads with progress
  - useFileUpload hook with 5-state discriminated union state machine
affects: [07-03, 07-04, phase-8]

# Tech tracking
tech-stack:
  added: []
  patterns: [discriminated-union-state-machine, xhr-upload-progress]

key-files:
  created:
    - src/components/profile/upload/utils/uploadWithProgress.ts
    - src/components/profile/upload/hooks/useFileUpload.ts
  modified: []

key-decisions:
  - "Used XHR instead of fetch for upload progress (fetch lacks upload.onprogress)"
  - "Discriminated union for type-safe state transitions"
  - "Keep file reference on error to enable retry without re-selecting"

patterns-established:
  - "Upload state machine: idle -> selected -> uploading -> success/error"
  - "Retry pattern: error -> selected (preserves file)"

# Metrics
duration: 4min
completed: 2026-01-18
---

# Phase 7 Plan 02: Upload Hook and Utilities Summary

**XHR-based upload utility with progress tracking and React hook encapsulating 3-step Convex upload flow as a 5-state machine**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-18T17:07:48Z
- **Completed:** 2026-01-18T17:11:57Z
- **Tasks:** 2
- **Files modified:** 2 created

## Accomplishments

- Created uploadWithProgress utility using XMLHttpRequest for progress events
- Built useFileUpload hook with discriminated union state machine (idle/selected/uploading/success/error)
- Integrated Convex mutations (generateUploadUrl, saveDocument) into hook
- Implemented retry capability that preserves file reference after errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create uploadWithProgress utility** - `c163755` (feat)
2. **Task 2: Create useFileUpload hook** - `91a7586` (feat)

## Files Created/Modified

- `src/components/profile/upload/utils/uploadWithProgress.ts` - XHR upload with progress callback, handles network errors and aborts
- `src/components/profile/upload/hooks/useFileUpload.ts` - State machine hook with selectFile/clearFile/upload/retry actions

## Decisions Made

1. **XHR over fetch**: The fetch API lacks upload progress events. XMLHttpRequest provides upload.onprogress for tracking upload percentage.
2. **Discriminated union type**: TypeScript discriminated unions provide compile-time safety for state transitions. Each state has only the properties relevant to that state.
3. **File preservation on error**: When upload fails, the file reference is kept in state. This enables retry without requiring user to re-select the file.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Upload utilities ready for UI components in 07-03
- Hook provides complete interface for drag-drop and file picker integration
- No blockers for next plan

---
*Phase: 07-file-upload-foundation*
*Completed: 2026-01-18*
