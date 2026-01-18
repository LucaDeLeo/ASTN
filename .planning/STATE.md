# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** v1.1 Profile Input Speedup - Phase 9 in progress

## Current Position

Phase: 9 of 10 (Review & Apply UI)
Plan: 2 of 3 complete
Status: In progress
Last activity: 2026-01-18 - Completed 09-02-PLAN.md (Review UI Components)

Progress: [████████████████████████████░░] 94% (30/32 plans complete)

## Milestone History

- v1.0 MVP - 6 phases, 21 plans - shipped 2026-01-18

## Performance Metrics

**Velocity:**
- Total plans completed: 30 (v1.0: 21 + v1.1 Phase 7: 4 + Phase 8: 3 + Phase 9: 2)
- Average duration: N/A (not tracked in v1.0)
- Total execution time: N/A

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v1.0 totals | 21 | N/A | N/A |
| 07-file-upload | 4 | ~72min | ~18min |
| 08-llm-extraction | 3 | ~33min | ~11min |
| 09-review-apply-ui | 2 | 7min | 3.5min |

*Tracking begins fresh for v1.1*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.1]: Claude Haiku 4.5 for extraction (fast, cheap at ~$0.001/resume)
- [v1.1]: Extract-then-discard for privacy (no document retention)
- [v1.1]: Explicit user review required before applying extracted data
- [07-04]: Soft character limit warning at 10k chars (non-blocking)
- [07-04]: Collapsible text paste by default, expands on click
- [08-01]: Only name required in extraction schema - resumes vary widely
- [08-01]: 0.7 similarity threshold for fuzzy skill matching
- [08-02]: Claude Haiku model version claude-haiku-4-5-20251001
- [08-02]: MAX_RETRIES=3 with exponential backoff (1s, 2s, 4s)
- [08-03]: Simulated stage progression for UX (extraction is single server action)
- [08-03]: Grid overlay pattern for smooth state-based UI transitions
- [09-01]: Review items use dot notation IDs (education.0, workHistory.1)
- [09-01]: Email extracted for display but not applied to profile
- [09-02]: Status-based card styling matches ExtractionReview.tsx exactly
- [09-02]: CSS grid trick for smooth expand/collapse animation

### Pending Todos

- [ ] Buy domain (astn.ai or similar) and set up email sending via Resend
  - Verify domain in Resend dashboard (add DNS records)
  - Create API key and add `RESEND_API_KEY` to Convex environment variables
  - Currently hardcoded to send from `notifications@astn.ai`
- [ ] Remove test-upload.tsx route after development complete

### Blockers/Concerns

- [Ongoing]: 80K Hours Algolia credentials need to be extracted from page source
- [Ongoing]: aisafety.com Airtable credentials need to be obtained from their team

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 09-02-PLAN.md (Review UI Components)
Resume file: None
Next action: Continue with 09-03-PLAN.md (Integration & Apply)

---
*State initialized: 2026-01-17*
*Last updated: 2026-01-18 - Completed 09-02-PLAN.md (Review UI Components)*
