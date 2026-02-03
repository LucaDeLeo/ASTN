# Pitfalls Research: Document Parsing + LLM Extraction

**Domain:** Resume/CV parsing with LLM extraction for profile auto-fill
**Researched:** 2026-01-18
**Project context:** ASTN career platform adding PDF upload, text paste, and LLM-powered structured data extraction for v1.1 milestone

---

## Critical Pitfalls

These mistakes cause significant rework, user trust issues, or security vulnerabilities.

### Pitfall 1: Trusting LLM Output Without User Verification

**Risk:** LLM extracts plausible-sounding but incorrect data. User accepts auto-filled profile without reviewing, leading to wrong information that affects match quality. Common errors:

- Inventing job titles that sound similar to actual ones
- Fabricating dates when originals are ambiguous (e.g., "2020" becomes "January 2020")
- Hallucinating skills mentioned in passing as core competencies
- Misattributing achievements between multiple jobs listed
- Extracting aspirational statements as current facts ("seeking ML role" -> current title: "ML Engineer")

**Warning signs:**

- High user acceptance rate (>90%) on first pass - indicates users aren't actually reviewing
- Support tickets about incorrect profile information
- Match quality complaints despite "complete" profiles
- Extraction confidence scores don't correlate with actual accuracy

**Prevention:**

1. **Never auto-save extracted data** - require explicit user confirmation per section
2. **Show extraction confidence** - flag low-confidence extractions visually (yellow/orange highlighting)
3. **Side-by-side view** - show source text alongside extracted fields so users can verify
4. **Editable inline** - let users fix errors without leaving the review flow
5. **Track acceptance patterns** - if user always accepts instantly, prompt them to slow down

**Phase:** Core extraction implementation (first phase of feature)

---

### Pitfall 2: PDF Text Extraction Failures

**Risk:** PDFs are notoriously difficult to parse. Text extraction fails silently, producing garbage or incomplete data that the LLM then hallucinates around. Common failure modes:

- Multi-column layouts extracted as interleaved gibberish
- Tables rendered as disconnected text fragments
- Scanned PDFs (images) producing no text at all
- Embedded fonts causing character mapping issues (ligatures, special characters)
- Headers/footers repeated throughout extracted text
- LinkedIn PDF exports with specific formatting that breaks parsers

**Warning signs:**

- Extracted text length much shorter than expected for page count
- Lots of "[?]" or replacement characters in output
- Repeated phrases (headers/footers extracted per page)
- Numbers appearing without context (orphaned from their labels)

**Prevention:**

1. **Use Claude's native PDF support** - send PDF directly to API rather than extracting text first. Claude handles visual parsing much better than text extraction libraries.
2. **Validate extraction quality** before LLM processing:
   - Check character count vs page count (< 500 chars/page is suspicious)
   - Check for encoding errors (replacement characters)
   - Detect likely scanned PDFs (very low text, or OCR artifacts)
3. **Fall back gracefully** - if PDF parsing fails, prompt user to paste text instead
4. **Test with real resumes** - collect diverse samples (LinkedIn exports, Word->PDF, LaTeX, design-heavy creative CVs)

**Phase:** File upload + parsing (before LLM extraction)

---

### Pitfall 3: Schema Mismatch Leading to Data Loss

**Risk:** LLM extracts data that doesn't fit your schema, causing silent data loss or corruption. Your ASTN schema has specific structures (e.g., `workHistory` array with `organization`, `title`, `startDate`, `endDate`). If LLM outputs:

- Dates as strings ("March 2020") instead of timestamps
- Combined fields ("Software Engineer at Google") instead of separate title/org
- Nested structures that don't match (skills with proficiency levels when schema expects flat array)

**Warning signs:**

- Validation errors on database insert
- Partial profile saves (some fields work, others don't)
- Type coercion producing wrong values (string "2020" -> number 2020 interpreted as Unix timestamp)

**Prevention:**

1. **Use Claude's structured outputs** (now in public beta) - guarantees JSON matches your schema via constrained decoding
2. **Provide exact schema in prompt** with examples showing expected format:
   ```typescript
   // In your extraction prompt:
   "Extract work history matching this exact structure:
   {
     organization: string,
     title: string,
     startDate: number (Unix timestamp, null if unknown),
     endDate: number (Unix timestamp, null if current),
     current: boolean
   }"
   ```
3. **Validate before saving** - use Convex validators to catch schema violations
4. **Handle partial extraction** - if some fields can't be extracted, save what you can and flag gaps for user

**Phase:** LLM extraction implementation

---

### Pitfall 4: Date Parsing Ambiguity

**Risk:** Dates in resumes are notoriously ambiguous and inconsistent. LLM may interpret incorrectly:

- "03/04/2020" - is this March 4th or April 3rd? (US vs international)
- "2020" alone - becomes January 1st 2020 vs December 31st 2020 vs null?
- "Present" / "Current" / "Ongoing" - how to represent?
- "Summer 2019" / "Q3 2020" - partial date information
- "3 years at Google" - no specific dates, just duration

Your schema uses `startDate: v.optional(v.number())` (Unix timestamp) which loses the "I only know the year" nuance.

**Warning signs:**

- Work history appears out of order
- Gaps in employment that don't actually exist
- Duration calculations that seem wrong to users

**Prevention:**

1. **Extract dates with granularity metadata**:
   ```typescript
   {
     startDate: number | null,
     startDateGranularity: "year" | "month" | "day" | "unknown",
     // Store "2020" as Jan 1 2020 timestamp + granularity: "year"
   }
   ```
2. **Be conservative** - if only year is known, use mid-year (June) as less wrong than January
3. **Show dates as extracted** in review UI - "2020" not "January 1, 2020"
4. **Let user fix easily** - date picker should handle partial dates gracefully
5. **Consider schema evolution** - you may want to store raw extracted date string alongside parsed timestamp

**Phase:** Schema design (before implementation) + extraction implementation

---

### Pitfall 5: File Upload Security Vulnerabilities

**Risk:** Accepting file uploads opens attack vectors:

- Malware disguised as PDFs
- Path traversal attacks in filenames
- Denial of service via huge files
- Polyglot files (valid PDF that's also executable)
- SSRF if fetching files from user-provided URLs

**Warning signs:**

- Server crashes or hangs during upload
- Unusual file sizes or processing times
- Files with suspicious names or extensions

**Prevention:**

1. **Validate aggressively on upload**:
   - File size limit (10MB max for resumes is plenty)
   - MIME type check (application/pdf only)
   - Magic bytes verification (PDF signature: %PDF-)
   - Filename sanitization (strip paths, special characters)
2. **Use Convex storage** - files stored in Convex's `_storage` table, not on disk
3. **Process in isolation** - PDF parsing happens in Claude API, not your infrastructure
4. **Don't trust filenames** - generate UUIDs for storage, keep original name as metadata only
5. **Rate limit uploads** - prevent abuse (e.g., max 5 uploads per hour per user)
6. **Scan if processing locally** - if you extract text yourself before sending to Claude, consider malware scanning

**Phase:** File upload implementation (first)

---

### Pitfall 6: Cost Explosion from PDF Processing

**Risk:** Claude API charges per token. PDFs with images/visual elements are processed as images, which is expensive:

- Each page processed visually costs ~1,000-2,000 tokens
- A 10-page resume could cost $0.05-0.15 per extraction (using Sonnet)
- Users uploading multiple versions, or re-processing frequently, adds up
- Malicious users could upload large documents to rack up costs

**Warning signs:**

- API costs growing faster than user growth
- Single users with disproportionate costs
- Processing very long documents (10+ pages for a resume is unusual)

**Prevention:**

1. **Limit page count** - resumes shouldn't be more than 3-4 pages. Reject or truncate longer documents.
2. **Cache aggressively** - if same file is uploaded twice (hash match), reuse extraction
3. **Use Haiku for initial pass** - extract basic structure with cheaper model, only use Sonnet for complex cases
4. **Show cost to user** - "Processing your 8-page document..." encourages concise uploads
5. **Rate limit extractions** - max 3 extractions per day per user during initial launch
6. **Monitor per-user costs** - alert on anomalies

**Phase:** Implementation with monitoring from day one

---

## Common Mistakes

Less critical but worth avoiding.

### Mistake 1: Over-Extracting to Empty Fields

**Risk:** LLM tries to fill every schema field even when source doesn't have that information, leading to:

- Generic placeholder text ("Responsible for various tasks")
- Reasonable-sounding fabrications
- Overly confident extraction from ambiguous context

**Prevention:**

- Explicitly instruct LLM to return null/empty for missing fields
- Validate that extracted text actually appears in source (or close paraphrase)
- Prefer "unknown" over "guessed"

**Phase:** Prompt engineering

---

### Mistake 2: Ignoring Source Document Type

**Risk:** LinkedIn PDF exports, Word documents, creative resumes, and academic CVs have very different structures. One-size-fits-all extraction produces poor results.

**Prevention:**

- Detect document type from structure/content
- Use type-specific extraction prompts
- Test with samples of each type you expect to support

**Phase:** Extraction implementation

---

### Mistake 3: No Graceful Degradation

**Risk:** When extraction partially fails, the whole flow breaks. User gets error message and loses confidence.

**Prevention:**

- Extract what you can, flag what you can't
- Allow manual entry alongside auto-fill
- "We extracted 5 of 8 fields - please fill in the rest"

**Phase:** UX design + implementation

---

### Mistake 4: Storing Raw Uploads Indefinitely

**Risk:** Privacy/compliance issues from retaining original documents. GDPR right to deletion, storage costs.

**Prevention:**

- Delete uploaded files after extraction (keep only extracted data)
- Or: explicit user consent for storage, with clear deletion path
- Document retention policy

**Phase:** Architecture decision (early)

---

### Mistake 5: Skills Extraction Without Taxonomy Mapping

**Risk:** LLM extracts "ML", "Machine Learning", "machine-learning", "deep learning" as separate skills. Your `skillsTaxonomy` table exists but isn't used during extraction.

**Prevention:**

- Post-process extracted skills against taxonomy
- Map variants to canonical names
- Flag unrecognized skills for user confirmation (might be new/valid)

**Phase:** Extraction + taxonomy integration

---

### Mistake 6: Blocking UI During Processing

**Risk:** PDF extraction + LLM processing takes 5-15 seconds. If UI is blocked, users think it's broken and navigate away.

**Prevention:**

- Upload happens instantly (to Convex storage)
- Processing happens async (Convex action)
- Show progress/status in real-time
- Allow user to continue other tasks while processing

**Phase:** UX + architecture

---

### Mistake 7: No Extraction Feedback Loop

**Risk:** You never learn which extractions are wrong because you don't track user edits. Cannot improve prompts or detect systematic errors.

**Prevention:**

- Track: extracted value, accepted/rejected, final value
- Use existing `enrichmentExtractions` table pattern (status: pending/accepted/rejected/edited)
- Periodic review of rejection patterns to improve prompts

**Phase:** Data model + analytics

---

## Testing Considerations

### Test Data Requirements

1. **Diverse resume formats:**
   - LinkedIn PDF export (common, specific structure)
   - Word document converted to PDF
   - LaTeX-generated academic CV (common in AI safety field)
   - Design-heavy creative resume (columns, graphics)
   - Simple text-based resume
   - Multi-page long-form CV (academics)

2. **Edge cases:**
   - Non-English resumes (or mixed language)
   - Resumes with only education (recent grad)
   - Very senior (10+ jobs) resumes
   - Career changers with unrelated history
   - Incomplete/partial resumes
   - AI safety specific content (alignment research, safety orgs)

3. **Adversarial inputs:**
   - Very large files (test size limits)
   - Corrupted PDFs
   - Password-protected PDFs
   - Scanned image PDFs
   - Empty PDFs
   - PDFs with embedded malware signatures (for security testing)

### Key Metrics to Track

| Metric                          | Target | Warning Threshold                              |
| ------------------------------- | ------ | ---------------------------------------------- |
| Extraction success rate         | >95%   | <90%                                           |
| User edit rate after extraction | 20-50% | <10% (not reviewing) or >70% (poor extraction) |
| Average extraction time         | <10s   | >20s                                           |
| Cost per extraction             | <$0.10 | >$0.25                                         |
| Field accuracy (sampled)        | >90%   | <80%                                           |
| Date parsing accuracy           | >85%   | <75%                                           |

### Integration Test Scenarios

1. **Happy path:** Upload PDF -> extract -> review -> save -> profile populated
2. **Partial extraction:** Some fields extract, others need manual entry
3. **Extraction failure:** PDF can't be parsed -> graceful fallback to text paste
4. **Duplicate detection:** Same file uploaded twice -> cache hit
5. **Schema validation:** Extracted data doesn't match schema -> validation catches it
6. **Concurrent uploads:** Multiple users uploading simultaneously
7. **Text paste flow:** User pastes LinkedIn text -> extraction works without PDF
8. **Large file rejection:** 50MB file uploaded -> rejected with helpful message

---

## Phase-Specific Warnings Summary

| Phase                 | Critical Pitfalls                                 | Key Prevention                             |
| --------------------- | ------------------------------------------------- | ------------------------------------------ |
| **File Upload**       | #5 Security, #6 Cost                              | Size/type validation, rate limiting        |
| **PDF Parsing**       | #2 Extraction failures                            | Use Claude native PDF, fallback to paste   |
| **Schema Design**     | #3 Schema mismatch, #4 Date ambiguity             | Structured outputs, granularity metadata   |
| **LLM Extraction**    | #1 No verification, Mistake #1 Over-extraction    | User review required, null for unknowns    |
| **UX Implementation** | Mistake #3 No degradation, Mistake #6 Blocking UI | Async processing, partial success handling |
| **Post-Processing**   | Mistake #5 Skills mapping                         | Taxonomy integration                       |
| **Operations**        | #6 Cost monitoring, Mistake #4 Storage retention  | Alerts, deletion policy                    |

---

## Implementation Recommendations

Based on pitfall analysis, recommended implementation order:

### Phase 1: File Upload Foundation

1. Convex storage integration with size/type validation
2. Security controls (rate limiting, filename sanitization)
3. Basic upload UI with progress indication

### Phase 2: LLM Extraction Core

1. Claude API integration with native PDF support
2. Structured outputs for schema compliance
3. Extraction prompt with explicit null handling
4. Date parsing with granularity tracking

### Phase 3: User Review Flow

1. Side-by-side review UI (source + extracted)
2. Inline editing for corrections
3. Confidence indicators
4. Save/reject per section

### Phase 4: Polish + Monitoring

1. Skills taxonomy mapping
2. Cost monitoring and alerts
3. Extraction analytics (track edits)
4. Text paste alternative flow

---

## Sources

- Exa search: PDF parsing challenges, LLM structured extraction pitfalls
- Exa search: Claude API PDF processing, structured outputs
- Exa search: File upload security best practices (OWASP, OPSWAT)
- Exa search: Resume parsing with LLMs (Datumo, Textkernel)
- Convex documentation: File storage, schema validation
- Anthropic documentation: PDF support, structured outputs (Nov 2025)
- NNGroup: Form auto-fill UX patterns (EAS framework)
- Amazon PARSE paper: Schema optimization for LLM extraction
- Reducto blog: Document extraction schema pitfalls
- DateParser library documentation: Date parsing ambiguity handling

**Confidence:** HIGH for pitfalls #1-6 (well-documented in multiple sources), MEDIUM for common mistakes (based on general patterns and project-specific inference).
