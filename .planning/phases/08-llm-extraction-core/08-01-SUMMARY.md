---
phase: 08-llm-extraction-core
plan: 01
subsystem: api
tags: [claude, anthropic, extraction, skills, schema]

# Dependency graph
requires:
  - phase: 07-file-upload
    provides: uploadedDocuments table and file storage infrastructure
provides:
  - extractedData schema field for storing extraction results
  - ExtractionResult type matching profile schema
  - extractProfileTool Claude tool definition
  - EXTRACTION_SYSTEM_PROMPT for resume parsing
  - matchSkillsToTaxonomy utility for skill normalization
affects: [08-02, 08-03, 09-review-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Claude tool calling for structured extraction"
    - "Skill fuzzy matching with 0.7 threshold"

key-files:
  created:
    - convex/extraction/prompts.ts
    - convex/extraction/skills.ts
  modified:
    - convex/schema.ts

key-decisions:
  - "Only name required in extraction schema - resumes vary widely"
  - "YYYY-MM format for work dates from LLM for parsing flexibility"
  - "0.7 similarity threshold for fuzzy skill matching"

patterns-established:
  - "extraction module structure: prompts.ts + skills.ts"
  - "ExtractionResult interface mirroring extractedData schema"

# Metrics
duration: 3min
completed: 2026-01-18
---

# Phase 8 Plan 01: Extraction Foundation Summary

**Claude tool definition with ExtractionResult type, schema update for extractedData storage, and skill matching utility with fuzzy matching**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T18:53:34Z
- **Completed:** 2026-01-18T18:56:03Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Schema updated with extractedData field matching profile structure for seamless data transfer
- Claude tool definition ready for forced tool_choice extraction
- Skill matching utility with 3-tier matching (exact, alias, fuzzy)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update schema with extractedData field** - `1b893cd` (feat)
2. **Task 2: Create extraction prompts and tool definition** - `bba7ac3` (feat)
3. **Task 3: Create skill matching utility** - `c8c95f5` (feat)

## Files Created/Modified
- `convex/schema.ts` - Added extractedData object to uploadedDocuments, added "extracting" status
- `convex/extraction/prompts.ts` - ExtractionResult interface, extractProfileTool definition, EXTRACTION_SYSTEM_PROMPT
- `convex/extraction/skills.ts` - matchSkillsToTaxonomy function with fuzzy matching

## Decisions Made
- Only name required in extraction tool schema - resumes vary widely and many fields optional
- Used YYYY-MM string format for workHistory dates from LLM (easier parsing than timestamps)
- Set 0.7 similarity threshold for fuzzy skill matching (standard for string similarity)
- Separated rawSkills (from document) and skills (matched to taxonomy) for traceability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ExtractionResult type ready for pdf.ts and text.ts actions
- extractProfileTool ready for Claude messages.create with forced tool_choice
- matchSkillsToTaxonomy ready to normalize extracted skills against taxonomy
- Schema supports "extracting" status for progress tracking

---
*Phase: 08-llm-extraction-core*
*Completed: 2026-01-18*
