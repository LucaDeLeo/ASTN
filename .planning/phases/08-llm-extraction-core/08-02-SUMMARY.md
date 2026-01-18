---
phase: 08-llm-extraction-core
plan: 02
subsystem: api
tags: [claude, anthropic, extraction, pdf, convex-actions]

# Dependency graph
requires:
  - phase: 08-01
    provides: ExtractionResult type, extractProfileTool definition, matchSkillsToTaxonomy utility
  - phase: 07-file-upload
    provides: uploadedDocuments table with storageId references
provides:
  - extractFromPdf action for PDF document extraction
  - extractFromText action for pasted text extraction
  - Extraction mutations for status updates and result persistence
  - Extraction queries for document retrieval and status polling
affects: [08-03, 09-review-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Claude document content blocks for PDF extraction"
    - "Exponential backoff retry (3 attempts: 1s, 2s, 4s)"
    - "internalMutation/internalQuery for action support functions"

key-files:
  created:
    - convex/extraction/pdf.ts
    - convex/extraction/text.ts
    - convex/extraction/mutations.ts
    - convex/extraction/queries.ts
  modified: []

key-decisions:
  - "Claude Haiku 4.5 model version: claude-haiku-4-5-20251001"
  - "MAX_RETRIES = 3 with exponential backoff"
  - "Skill matching happens in action after extraction"

patterns-established:
  - "PDF extraction via base64 document content block"
  - "Status flow: pending_extraction -> extracting -> extracted/failed"
  - "Actions call internal mutations/queries for database access"

# Metrics
duration: 5min
completed: 2026-01-18
---

# Phase 8 Plan 02: Extraction Actions Summary

**PDF and text extraction actions using Claude Haiku 4.5 with document content blocks, exponential backoff retry, and skill taxonomy matching**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-18T18:58:00Z
- **Completed:** 2026-01-18T19:03:04Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- PDF extraction retrieves file from Convex storage, converts to base64, sends via Claude document content block
- Text extraction processes pasted resume text through same extraction pipeline
- Both actions retry 3x with exponential backoff (1s, 2s, 4s) on Claude API failures
- Extraction results persisted with matched skills from taxonomy

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PDF extraction action** - `0e08615` (feat)
2. **Task 2: Create text extraction action** - `6b22a8b` (feat)
3. **Task 3: Create extraction mutations and queries** - `fd9bfe5` (feat)

**Lint fixes:** `efd1a35` (style: fix lint errors in extraction module)

## Files Created/Modified
- `convex/extraction/pdf.ts` - extractFromPdf action with Claude document content block
- `convex/extraction/text.ts` - extractFromText action for pasted text
- `convex/extraction/mutations.ts` - updateDocumentStatus, saveExtractionResult mutations
- `convex/extraction/queries.ts` - getDocument, getSkillsTaxonomy, getDocumentStatus queries

## Decisions Made
- Used Claude Haiku 4.5 model version `claude-haiku-4-5-20251001` for fast, cheap extraction
- Set MAX_RETRIES = 3 with exponential backoff (1s, 2s, 4s delays)
- Skill matching happens in action after Claude extraction, before saving results
- Used internalMutation/internalQuery pattern for database operations called by actions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed lint errors for explicit table IDs**
- **Found during:** Task 3 verification
- **Issue:** Convex lint rule requires explicit table name in db.patch/db.get calls
- **Fix:** Changed `ctx.db.patch(documentId, {...})` to `ctx.db.patch("uploadedDocuments", documentId, {...})`
- **Files modified:** convex/extraction/mutations.ts, convex/extraction/queries.ts
- **Verification:** `bun run lint` passes for extraction files
- **Committed in:** fd9bfe5 (part of Task 3 commit)

**2. [Rule 3 - Blocking] Fixed lint errors in prompts.ts and skills.ts**
- **Found during:** Task 3 verification
- **Issue:** Array type syntax `string[]` forbidden, must use `Array<string>`; Anthropic import must be type-only
- **Fix:** Updated type syntax and import statement
- **Files modified:** convex/extraction/prompts.ts, convex/extraction/skills.ts
- **Verification:** `bun run lint` passes for extraction files
- **Committed in:** efd1a35 (separate style commit)

---

**Total deviations:** 2 auto-fixed (2 blocking - lint compliance)
**Impact on plan:** All auto-fixes necessary for lint compliance. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. ANTHROPIC_API_KEY already configured in Convex dashboard from enrichment feature.

## Next Phase Readiness
- extractFromPdf ready to be triggered after file upload
- extractFromText ready for text paste workflow
- Status queries ready for frontend polling
- Phase 08-03 (trigger integration) can wire up document upload to extraction

---
*Phase: 08-llm-extraction-core*
*Completed: 2026-01-18*
