# Roadmap: ASTN

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-01-18)
- 🚧 **v1.1 Profile Input Speedup** - Phases 7-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) - SHIPPED 2026-01-18</summary>

See `.planning/milestones/v1.0-ROADMAP.md` for full v1.0 roadmap details.

**Summary:**
- Phase 1: Foundation + Opportunities (4 plans)
- Phase 2: Authentication (2 plans)
- Phase 3: Profiles (4 plans)
- Phase 4: Matching (3 plans)
- Phase 5: Engagement + Org (6 plans)
- Phase 6: Polish + Tech Debt (2 plans)

**Total:** 21 plans completed

</details>

### 🚧 v1.1 Profile Input Speedup (In Progress)

**Milestone Goal:** Reduce friction in profile creation by letting users upload CVs/PDFs or paste text, have LLM extract structured data, auto-fill form, user reviews, then enrichment chat fills gaps.

**Phase Numbering:**
- Integer phases (7, 8, 9, 10): Planned milestone work
- Decimal phases (8.1, 8.2): Urgent insertions if needed (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 7: File Upload Foundation** - Upload infrastructure and UI
- [ ] **Phase 8: LLM Extraction Core** - PDF/text extraction with Claude Haiku
- [ ] **Phase 9: Review & Apply UI** - Preview, inline editing, apply to profile
- [ ] **Phase 10: Wizard Integration** - Entry points and context-aware enrichment

## Phase Details

### Phase 7: File Upload Foundation

**Goal**: Users can upload PDFs or paste text with clear feedback and error handling
**Depends on**: Phase 6 (v1.0 complete)
**Requirements**: UPLD-01, UPLD-02, UPLD-03, UPLD-04, UPLD-05, UPLD-06
**Success Criteria** (what must be TRUE):
  1. User can drag a PDF onto the upload zone and see it accepted
  2. User can click a button to open file picker and select a PDF
  3. User can paste a block of text containing career info
  4. User sees progress indicator while file uploads
  5. User sees file size limit (10MB) displayed before attempting upload
  6. User sees clear error message with recovery options if upload fails
**Plans**: 4 plans in 3 waves

Plans:
- [x] 07-01-PLAN.md — Backend infrastructure (schema + upload mutations)
- [x] 07-02-PLAN.md — Upload hook and utilities (state machine + progress)
- [x] 07-03-PLAN.md — Upload zone UI (drag-drop, preview, progress bar)
- [x] 07-04-PLAN.md — Text paste zone + verification checkpoint

### Phase 8: LLM Extraction Core

**Goal**: System extracts structured profile data from uploaded documents using Claude Haiku 4.5
**Depends on**: Phase 7 (upload infrastructure exists)
**Requirements**: EXTR-01, EXTR-02, EXTR-03, EXTR-07
**Success Criteria** (what must be TRUE):
  1. System extracts name, email, location, education, and work history from PDF content
  2. System suggests matching ASTN skills based on extracted content
  3. System recovers gracefully from extraction failures (retry option, paste fallback, manual entry)
  4. Extraction completes within reasonable time (~5-10 seconds for typical resume)
**Plans**: 3 plans in 3 waves

Plans:
- [ ] 08-01-PLAN.md — Extraction foundation (schema + prompts + skill matching)
- [ ] 08-02-PLAN.md — Extraction actions (PDF + text extraction with retry)
- [ ] 08-03-PLAN.md — Extraction UI (progress, error handling, test integration)

### Phase 9: Review & Apply UI

**Goal**: Users can review, edit, and confirm extracted data before it saves to their profile
**Depends on**: Phase 8 (extraction produces data to review)
**Requirements**: EXTR-04, EXTR-05, EXTR-06, INTG-02
**Success Criteria** (what must be TRUE):
  1. User sees extraction preview showing all extracted fields organized by section
  2. User can edit any extracted field inline before saving
  3. User sees gap identification showing what percentage was extracted and what enrichment chat will help with
  4. Confirmed extracted data auto-fills corresponding profile form fields
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

### Phase 10: Wizard Integration

**Goal**: Profile creation offers multiple seamless entry points with context-aware follow-up
**Depends on**: Phase 9 (review UI exists)
**Requirements**: INTG-01, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. Profile wizard offers four clear entry points: upload, paste, manual, chat-first
  2. Enrichment chat knows what data was extracted and skips redundant questions
  3. User can switch from upload flow to manual entry at any point without losing progress
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 7 → 7.1 (if any) → 8 → 8.1 (if any) → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation + Opportunities | v1.0 | 4/4 | Complete | 2026-01-17 |
| 2. Authentication | v1.0 | 2/2 | Complete | 2026-01-17 |
| 3. Profiles | v1.0 | 4/4 | Complete | 2026-01-17 |
| 4. Matching | v1.0 | 3/3 | Complete | 2026-01-18 |
| 5. Engagement + Org | v1.0 | 6/6 | Complete | 2026-01-18 |
| 6. Polish + Tech Debt | v1.0 | 2/2 | Complete | 2026-01-18 |
| 7. File Upload Foundation | v1.1 | 4/4 | Complete | 2026-01-18 |
| 8. LLM Extraction Core | v1.1 | 0/3 | Not started | - |
| 9. Review & Apply UI | v1.1 | 0/TBD | Not started | - |
| 10. Wizard Integration | v1.1 | 0/TBD | Not started | - |

---
*v1.1 roadmap created: 2026-01-18*
