# Research Summary: v1.1 Document Upload

**Project:** ASTN v1.1 Profile Input Speedup
**Domain:** Resume/CV parsing with LLM extraction for profile auto-fill
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

ASTN v1.1 adds PDF upload and text paste capabilities to reduce profile creation friction. The implementation leverages existing patterns in the codebase: Convex file storage for uploads, `unpdf` for PDF text extraction, and Claude's tool-use API for structured data extraction (same pattern already proven in `convex/enrichment/extraction.ts`). The stack requires only one new dependency (`unpdf` + `pdfjs-dist`) since Claude API integration already exists.

The recommended approach is an "upload-review-confirm" flow where users upload a resume, see extracted data in a review screen, edit inline as needed, then explicitly save to their profile. This addresses the #1 user complaint in resume parsing: auto-saving incorrect data without consent. The existing enrichment chat then becomes context-aware, skipping questions about already-extracted information and focusing on career goals and AI safety interests that resumes typically lack.

Key risks center on PDF parsing failures (multi-column layouts, scanned documents, LinkedIn PDF format quirks) and LLM extraction accuracy. Mitigations include: using Claude Haiku for cost-effective extraction, requiring explicit user confirmation for all extracted fields, providing text paste as a fallback when PDF parsing fails, and tracking user edit patterns to improve prompts over time.

## Key Findings

### Recommended Stack

The stack builds on existing ASTN infrastructure with minimal additions.

**Core technologies:**

- **Convex File Storage** (built-in): Upload/store PDFs using `generateUploadUrl()` pattern - no external storage needed
- **unpdf + pdfjs-dist** (new): Modern PDF text extraction, no native dependencies, works in Convex Node.js runtime
- **Claude Haiku 4.5** (existing): Fast, cheap extraction (~$0.001/resume) using tool_choice for guaranteed structured output
- **@anthropic-ai/sdk** (existing): Already in package.json at v0.71.2

**Why not alternatives:**

- pdf-parse: Unmaintained since 2019, security concerns
- Claude Sonnet: Overkill cost for extraction where Haiku suffices
- External storage (S3/R2): Unnecessary complexity when Convex storage is included

### Expected Features

**Must have (table stakes):**

- PDF upload with drag-and-drop zone
- Text paste alternative for users without file access
- Progress/status indicators during upload and extraction
- Editable extraction preview - users MUST review before save
- Clear error handling with recovery options (retry, paste instead, manual entry)
- File size limits displayed upfront (10MB max)

**Should have (differentiators):**

- Skills taxonomy mapping - extract "ML safety" and suggest matching ASTN taxonomy skills
- Gap identification - "Resume filled 60% of profile, enrichment chat can help with the rest"
- AI safety context understanding - recognize safety orgs, research roles
- LinkedIn PDF format optimization

**Defer (v2+):**

- DOCX support
- OCR for scanned PDFs (Claude Vision)
- Batch document upload
- Research publication detection

### Architecture Approach

The architecture adds a new "upload-first" entry point to the profile wizard while reusing the existing extraction review pattern from enrichment. Two new components (`DocumentUpload`, `ExtractionPreview`) handle the upload and review UI. A new Convex action (`extractFromDocument`) performs PDF parsing and LLM extraction server-side where the API key lives.

**Major components:**

1. **DocumentUpload component** (`src/components/profile/upload/`) - Drag-drop zone, file picker, paste textarea
2. **ExtractionPreview component** (`src/components/profile/upload/`) - Field-by-field review with inline editing
3. **extractFromDocument action** (`convex/documents/extraction.ts`) - PDF text extraction + Claude tool-use
4. **uploadDocument mutation** (`convex/documents/upload.ts`) - Generate upload URL, track upload status

**Data flow:** Upload -> Convex storage -> PDF text extraction (unpdf) -> LLM structured extraction (Claude) -> Preview UI -> User confirms -> Apply to profile -> Context-aware enrichment chat

### Critical Pitfalls

1. **Auto-saving without user review** - Never commit extracted data automatically. Always show review screen. Users hate discovering wrong data was saved. Prevention: Explicit per-section confirmation required.

2. **PDF text extraction failures** - Multi-column layouts, scanned PDFs, and LinkedIn exports break naive parsers. Prevention: Validate extraction quality (>500 chars/page), fallback to text paste, test with diverse real resumes.

3. **Schema mismatch losing data** - LLM outputs dates as strings, combines fields wrong, or creates structures that don't match Convex schema. Prevention: Use Claude tool_choice for structured output, provide exact schema in prompt, validate before saving.

4. **Date parsing ambiguity** - "03/04/2020" is ambiguous, "2020" alone loses granularity. Prevention: Store dates with granularity metadata, display as extracted ("2020" not "January 1, 2020"), use mid-year for year-only dates.

5. **Cost explosion from large documents** - Claude charges per token, visual PDF processing is expensive. Prevention: Limit to 3-4 page resumes, use Haiku not Sonnet, cache extractions by file hash, rate limit to 3 extractions/day initially.

## Implications for Roadmap

Based on research, suggested phase structure with 5 phases:

### Phase 1: File Upload Foundation

**Rationale:** Infrastructure must exist before extraction can work. Security controls prevent attacks from day one.
**Delivers:** Convex storage integration, upload mutation, size/type validation, rate limiting, basic upload UI
**Addresses:** Table stakes (file upload, progress indicators)
**Avoids:** Pitfall #5 (security vulnerabilities), Pitfall #6 (cost explosion via rate limiting)

### Phase 2: LLM Extraction Core

**Rationale:** Extraction is the core value - once upload works, extraction enables the user benefit.
**Delivers:** PDF text extraction (unpdf), Claude extraction action, structured output schema, date parsing with granularity
**Uses:** unpdf + pdfjs-dist (new), existing Claude/Anthropic SDK
**Implements:** extractFromDocument action
**Avoids:** Pitfall #2 (extraction failures), Pitfall #3 (schema mismatch), Pitfall #4 (date ambiguity)

### Phase 3: Review & Apply UI

**Rationale:** Without review UI, extraction data cannot reach user profiles. This is the critical trust-building moment.
**Delivers:** ExtractionPreview component, inline field editing, accept/reject per field, apply to profile mutation
**Addresses:** Table stakes (editable extracted data, clear field mapping)
**Avoids:** Pitfall #1 (no user verification)

### Phase 4: Wizard Integration

**Rationale:** Once the upload-extract-review flow works standalone, integrate into existing profile wizard.
**Delivers:** ProfileWizard modification with import step, text paste alternative flow, context-aware enrichment prompts
**Addresses:** Table stakes (text paste, manual fallback), differentiator (gap identification for enrichment)
**Implements:** Modified enrichment that skips questions about extracted data

### Phase 5: Polish & Monitoring

**Rationale:** After core flow works, add refinements and operational visibility.
**Delivers:** Skills taxonomy mapping, extraction analytics (track edits), error handling improvements, graceful degradation for partial failures
**Addresses:** Differentiators (taxonomy-aware extraction, confidence display)
**Avoids:** Common mistake #7 (no feedback loop)

### Phase Ordering Rationale

- **Phase 1 before 2:** Cannot extract from documents without upload infrastructure
- **Phase 2 before 3:** Cannot review what hasn't been extracted
- **Phase 3 before 4:** Review UI should work standalone before wizard integration
- **Phase 4 after 3:** Integration is easier when components are already proven
- **Phase 5 last:** Polish requires working core to refine

This ordering also staggers risk: Phase 1-2 are technical risks (will the libraries work?), Phase 3-4 are UX risks (will users understand the flow?), Phase 5 is optimization.

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 2:** Test unpdf with diverse real-world resumes before committing to implementation. May need Claude Vision fallback for complex layouts.
- **Phase 4:** Enrichment chat prompt engineering may need iteration to correctly leverage extracted context.

**Phases with standard patterns (skip research-phase):**

- **Phase 1:** Convex file storage is well-documented, straightforward implementation
- **Phase 3:** UI patterns are clear from features research (review screen with inline edit)
- **Phase 5:** Analytics and monitoring are standard operational concerns

## Confidence Assessment

| Area         | Confidence | Notes                                                                    |
| ------------ | ---------- | ------------------------------------------------------------------------ |
| Stack        | HIGH       | Verified against Convex docs, existing codebase patterns, npm ecosystem  |
| Features     | HIGH       | Well-established domain, multiple sources agree on table stakes          |
| Architecture | HIGH       | Extends existing enrichment patterns, Convex docs verified               |
| Pitfalls     | HIGH       | Multiple sources document same issues, PDF parsing is known-hard problem |

**Overall confidence:** HIGH

### Gaps to Address

- **unpdf library validation:** Less battle-tested than pdf.js directly. Recommend creating test suite with diverse PDFs early in Phase 2.
- **LinkedIn PDF format:** Needs specific testing - common user source but known to have parsing quirks.
- **Cost monitoring specifics:** How to alert on per-user cost anomalies in Convex? Research during Phase 5 planning.
- **Date granularity schema:** May require schema migration if `startDate` field needs to change from simple number to object with granularity.

## Sources

### Primary (HIGH confidence)

- Existing ASTN codebase: `convex/enrichment/extraction.ts` - proven tool_choice pattern
- Existing ASTN codebase: `package.json` - @anthropic-ai/sdk v0.71.2 already present
- Convex File Storage: https://docs.convex.dev/file-storage/upload-files
- Claude Tool Use: https://platform.claude.com/cookbook/tool-use-extracting-structured-json
- Claude PDF Support: https://platform.claude.com/docs/en/build-with-claude/pdf-support

### Secondary (MEDIUM confidence)

- unpdf library: https://github.com/unjs/unpdf (UnJS ecosystem, actively maintained)
- Multiple UX studies on job application frustrations and resume parsing expectations
- Lightcast Skills Taxonomy documentation
- OWASP file upload security guidelines

### Tertiary (validated via search, needs implementation testing)

- Specific token costs for PDF visual processing
- LinkedIn PDF export structure quirks
- Date parsing edge cases in international formats

---

_Research completed: 2026-01-18_
_Ready for requirements: yes_
