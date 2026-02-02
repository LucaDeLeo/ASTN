---
phase: 28
plan: 03
subsystem: code-quality-logging
tags:
  [
    dead-code,
    toast-notifications,
    structured-logging,
    convex,
    sonner,
    json-logging,
  ]
dependencies:
  requires:
    - 28-02 (quality gates bug fixes)
  provides:
    - Shared structured logging utility at convex/lib/logging.ts
    - JSON-formatted log output across all 13 Convex server files
    - Toast-based error notifications in admin forms
    - Clean codebase with no dead code artifacts
  affects: []
tech-stack:
  added: []
  patterns:
    - 'Structured JSON logging via log(level, message, context) utility'
    - 'Toast notifications with persistent error duration (Infinity) for admin forms'
key-files:
  created:
    - convex/lib/logging.ts
  modified:
    - src/components/admin/opportunity-form.tsx
    - src/components/profile/wizard/ProfileWizard.tsx
    - src/routeTree.gen.ts
    - convex/aggregation/sync.ts
    - convex/aggregation/aisafety.ts
    - convex/aggregation/eightyK.ts
    - convex/aggregation/syncMutations.ts
    - convex/emails/batchActions.ts
    - convex/engagement/compute.ts
    - convex/enrichment/extraction.ts
    - convex/events/sync.ts
    - convex/events/lumaClient.ts
    - convex/extraction/pdf.ts
    - convex/extraction/text.ts
    - convex/matching/compute.ts
    - convex/notifications/realtime.ts
  deleted:
    - src/routes/test-upload.tsx
key-decisions:
  - decision: 'Structured logging utility outputs JSON with level, message, timestamp, and spread context'
    rationale: 'JSON format is parseable by log aggregation tools and searchable in Convex dashboard'
  - decision: 'Error toasts use duration: Infinity to persist until manually dismissed'
    rationale: 'Per project CONTEXT.md -- error toasts must not auto-dismiss so users see the failure'
  - decision: 'Logging utility is a pure module (no "use node") that works in both Node actions and Convex mutations'
    rationale: 'Allows single import path across all Convex file types without environment restrictions'
metrics:
  duration: 8m
  completed: 2026-02-02
---

# Phase 28 Plan 03: Dead Code Removal, Toast Migration, and Structured Logging

Deleted dead code (test-upload route, \_STEP_LABELS), replaced alert() with sonner toast in admin forms, and standardized all 13 Convex server files to use JSON-structured logging via a shared convex/lib/logging.ts utility.

## Performance

| Metric         | Value                |
| -------------- | -------------------- |
| Duration       | 8 minutes            |
| Started        | 2026-02-02T23:07:43Z |
| Completed      | 2026-02-02T23:16:01Z |
| Tasks          | 2/2                  |
| Files created  | 1                    |
| Files modified | 16                   |
| Files deleted  | 1                    |

## Accomplishments

### Task 1: Remove dead code and replace alert() with toast

- Deleted `src/routes/test-upload.tsx` (test artifact from Phase 8)
- Removed `_STEP_LABELS` constant and void statement from ProfileWizard
- Replaced `alert("Failed to save opportunity")` with `toast.error("Failed to save opportunity", { duration: Infinity })` in opportunity-form
- Regenerated `routeTree.gen.ts` after route deletion

### Task 2: Structured logging utility and migration

- Created `convex/lib/logging.ts` with `log(level, message, context?)` function
- Outputs JSON with `{ level, message, timestamp, ...context }` format
- Routes to `console.error` for errors, `console.warn` for warnings, `console.log` for info
- Migrated all operational logging in 13 Convex files:
  - **aggregation**: sync.ts (4 instances), aisafety.ts (3), eightyK.ts (3), syncMutations.ts (2)
  - **emails**: batchActions.ts (16 instances)
  - **engagement**: compute.ts (8 instances)
  - **enrichment**: extraction.ts (1 instance)
  - **events**: sync.ts (8 instances), lumaClient.ts (1 instance)
  - **extraction**: pdf.ts (1), text.ts (1)
  - **matching**: compute.ts (3 instances)
  - **notifications**: realtime.ts (1 instance)
- Zero remaining raw `console.log`/`console.error` in convex/ (except the logging utility itself)

## Task Commits

| Task | Name                                                    | Commit    | Key Changes                                                |
| ---- | ------------------------------------------------------- | --------- | ---------------------------------------------------------- |
| 1    | Remove dead code and replace alert() with toast         | `b1058b3` | Delete test-upload.tsx, remove \_STEP_LABELS, alert->toast |
| 2    | Structured logging utility and migrate all Convex files | `7a0f673` | Create convex/lib/logging.ts, migrate 13 files             |

## Decisions Made

1. **JSON structured logging format**: Each log entry contains `{ level, message, timestamp, ...context }` as a JSON string, enabling machine-parseable logs in the Convex dashboard.

2. **Error toast persistence**: Error toasts use `duration: Infinity` per CONTEXT.md guidance, ensuring users always see failure messages until they manually dismiss them.

3. **Pure utility module**: The logging utility does not use `"use node"` directive, making it importable from both Node action files and standard Convex mutation/query files without environment restrictions.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

Phase 28 (Quality Gates & Bug Fixes) is now complete with all 3 plans executed:

- 28-01: CI pipeline and developer experience
- 28-02: Bug fixes (growth areas, dates, timezones, engagement, navigation)
- 28-03: Dead code removal, toast migration, structured logging

Ready for Phase 29 (final phase).
