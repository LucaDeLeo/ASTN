# Requirements: ASTN v1.1 Profile Input Speedup

**Defined:** 2026-01-18
**Core Value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh

## v1.1 Requirements

Requirements for profile input speedup. Each maps to roadmap phases.

### Upload

- [ ] **UPLD-01**: User can upload PDF via drag-and-drop zone
- [ ] **UPLD-02**: User can upload PDF via file picker button
- [ ] **UPLD-03**: User can paste text block with career info
- [ ] **UPLD-04**: User sees progress indicator during upload
- [ ] **UPLD-05**: User sees file size limit (10MB) before uploading
- [ ] **UPLD-06**: User sees clear error message if upload fails

### Extraction

- [ ] **EXTR-01**: System extracts structured data from PDF using Claude Haiku 4.5 Vision
- [ ] **EXTR-02**: System extracts: name, email, location, education, work history
- [ ] **EXTR-03**: System suggests matching ASTN skills from extracted content
- [ ] **EXTR-04**: User sees extraction preview with all extracted fields
- [ ] **EXTR-05**: User can edit any extracted field inline before saving
- [ ] **EXTR-06**: User sees gap identification ("X% extracted, chat will help with rest")
- [ ] **EXTR-07**: System handles extraction errors gracefully (retry, paste fallback, manual)

### Integration

- [ ] **INTG-01**: Profile wizard offers four entry points: upload, paste, manual, chat
- [ ] **INTG-02**: Extracted data auto-fills profile form fields
- [ ] **INTG-03**: Enrichment chat is context-aware (skips questions about extracted data)
- [ ] **INTG-04**: User can switch from upload to manual entry at any point

## v2 Requirements

Deferred to future release.

### Document Support

- **DOC-01**: User can upload DOCX files
- **DOC-02**: System handles scanned PDFs with degraded quality gracefully

### Advanced Extraction

- **ADV-01**: System detects research publications from resume
- **ADV-02**: System shows confidence scores for extracted fields

## Out of Scope

Explicitly excluded for v1.1.

| Feature | Reason |
|---------|--------|
| LinkedIn URL scraping | ToS risk, complexity, PDF export covers use case |
| DOCX support | PDF covers 90%+ of resumes, add later if needed |
| OCR for scanned PDFs | Haiku Vision handles most cases, defer edge cases |
| Batch document upload | Single document sufficient for profile creation |
| Document retention after extraction | Privacy concern, extract and discard |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPLD-01 | Phase 7 | Pending |
| UPLD-02 | Phase 7 | Pending |
| UPLD-03 | Phase 7 | Pending |
| UPLD-04 | Phase 7 | Pending |
| UPLD-05 | Phase 7 | Pending |
| UPLD-06 | Phase 7 | Pending |
| EXTR-01 | Phase 8 | Pending |
| EXTR-02 | Phase 8 | Pending |
| EXTR-03 | Phase 8 | Pending |
| EXTR-04 | Phase 9 | Pending |
| EXTR-05 | Phase 9 | Pending |
| EXTR-06 | Phase 9 | Pending |
| EXTR-07 | Phase 8 | Pending |
| INTG-01 | Phase 10 | Pending |
| INTG-02 | Phase 9 | Pending |
| INTG-03 | Phase 10 | Pending |
| INTG-04 | Phase 10 | Pending |

**Coverage:**
- v1.1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-01-18*
*Last updated: 2026-01-18 — traceability updated with phase mappings*
