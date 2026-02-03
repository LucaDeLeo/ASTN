---
phase: 27-critical-security
plan: 03
subsystem: security
tags: [prompt-injection, zod, xml-delimiters, llm-validation, input-limits]

# Dependency graph
requires:
  - phase: 27-critical-security (plan 01)
    provides: requireAuth helper, profile ownership checks on enrichment endpoints
provides:
  - XML prompt injection defense on all 6 LLM call entry points
  - Shadow-mode Zod validation on all 5 tool_use response parsing points
  - Field length limits module (convex/lib/limits.ts)
  - 4 validation schema files for matching, engagement, enrichment, extraction
affects: [28-important-security, 29-nice-to-have-security]

# Tech tracking
tech-stack:
  added: [zod@3.25 (explicit dependency)]
  patterns:
    [
      XML-delimited user data in LLM prompts,
      shadow-mode Zod validation,
      centralized field limits,
    ]

key-files:
  created:
    - convex/lib/limits.ts
    - convex/matching/validation.ts
    - convex/engagement/validation.ts
    - convex/enrichment/validation.ts
    - convex/extraction/validation.ts
  modified:
    - convex/matching/compute.ts
    - convex/matching/prompts.ts
    - convex/engagement/compute.ts
    - convex/engagement/prompts.ts
    - convex/enrichment/conversation.ts
    - convex/enrichment/extraction.ts
    - convex/extraction/text.ts
    - convex/extraction/pdf.ts
    - convex/extraction/prompts.ts

key-decisions:
  - 'Shadow mode for Zod validation: log failures but never block operations (pilot safety)'
  - 'Permissive schemas with .passthrough() and .optional() -- catch structural issues without false positives'
  - 'matchItemSchema recommendations uses .default([]) so downstream code always gets an array'
  - 'z.coerce.number() for score fields to handle LLM returning strings'
  - 'z.string() (not z.enum) for interviewChance, ranking, confidence -- LLM may use unexpected values'
  - 'XML tag names chosen to match data semantics: candidate_profile, opportunities, profile_data, member_data, document_content, conversation'
  - 'enrichment extraction restructured from multi-message to single XML-wrapped user message'
  - 'Profile context truncated at 50K chars as safety net against abnormally large profiles'

patterns-established:
  - 'XML delimiter pattern: wrap user data in named XML tags, add system prompt instruction that tagged content is data not instructions'
  - "Shadow validation pattern: safeParse + console.error('[LLM_VALIDATION_FAIL] subsystem') + fallback to raw input"
  - "Input length enforcement pattern: check FIELD_LIMITS before LLM call, throw generic 'Content too long to process'"

# Metrics
duration: 5min
completed: 2026-02-02
---

# Phase 27 Plan 03: LLM Output Validation and Prompt Injection Defense Summary

**XML-delimited prompt injection defense on all 6 LLM entry points, shadow-mode Zod validation on all 5 tool_use responses, and input length limits with zod as explicit dependency**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-02T21:48:03Z
- **Completed:** 2026-02-02T21:53:00Z
- **Tasks:** 2
- **Files modified:** 16 (5 created, 9 modified, plus package.json and bun.lock)

## Accomplishments

- XML structural separation on all 6 LLM prompt entry points prevents prompt injection by clearly marking user data boundaries
- Shadow-mode Zod validation on all 5 tool_use response parsing points catches malformed LLM responses at runtime without blocking operations
- Field length limits module provides centralized constants for chat messages (5K chars), document text (100K chars), and profile fields
- All validation schemas are permissive (passthrough, optional, coerce) to avoid false positives with real LLM output

## Task Commits

Each task was committed atomically:

1. **Task 1: Create validation schemas, limits module, and install zod** - `3e47e82` (feat)
2. **Task 2: Add XML delimiters, Zod shadow validation, input limits** - `ac7eff5` (feat)

## Files Created/Modified

- `convex/lib/limits.ts` - Field length limit constants (FIELD_LIMITS) and validateFieldLength helper
- `convex/matching/validation.ts` - Permissive Zod schema for matching LLM responses (matchResultSchema)
- `convex/engagement/validation.ts` - Zod schema for engagement classification (engagementResultSchema)
- `convex/enrichment/validation.ts` - Zod schema for enrichment extraction (extractionResultSchema)
- `convex/extraction/validation.ts` - Zod schema for document extraction (documentExtractionResultSchema)
- `convex/matching/prompts.ts` - XML delimiters (<candidate_profile>, <opportunities>), data handling instruction
- `convex/matching/compute.ts` - Zod shadow validation on matching tool_use response
- `convex/engagement/prompts.ts` - XML delimiters (<member_data>), data handling instruction
- `convex/engagement/compute.ts` - Zod shadow validation on engagement tool_use response
- `convex/enrichment/conversation.ts` - XML delimiters (<profile_data>), chat message length limit, context truncation
- `convex/enrichment/extraction.ts` - XML delimiters (<conversation>), Zod shadow validation, restructured to single message
- `convex/extraction/text.ts` - XML delimiters (<document_content>), Zod shadow validation, document text length limit
- `convex/extraction/pdf.ts` - Instruction boundary in text block, Zod shadow validation
- `convex/extraction/prompts.ts` - Data handling instruction for document extraction

## Decisions Made

- **Shadow mode over enforcement:** Zod validation logs failures but never blocks operations. This protects pilot users from false positives while giving visibility into LLM output quality via Convex dashboard logs.
- **Permissive schemas:** All schemas use `.passthrough()` (allow extra fields) and `.optional()` (handle omitted fields). `z.string()` used instead of `z.enum()` for fields where LLM may use unexpected but valid values.
- **matchItemSchema.recommendations defaults to []:** Uses `.default([])` so downstream `saveMatches` always receives an array even when LLM omits the recommendations field.
- **enrichment extraction restructured:** Changed from multi-message conversation format to single user message with XML-wrapped conversation transcript. Tool_choice forces tool use regardless, and the XML boundary provides clear data separation.
- **Generic error messages for input limits:** "Content too long to process" rather than revealing specific limits to potential attackers.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 27 (Critical Security) is now complete: auth (01), OAuth (02), and LLM defense (03) all shipped
- Shadow-mode validation logs are ready to monitor in Convex dashboard
- Future phases can graduate from shadow mode to enforcement once real LLM outputs are validated
- Input length limits can be extended to per-field profile validation in Phase 29

---

_Phase: 27-critical-security_
_Completed: 2026-02-02_
