# Phase 8: LLM Extraction Core - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

System extracts structured profile data (name, email, location, education, work history) from uploaded documents using Claude Haiku 4.5, and suggests matching ASTN skills based on extracted content. The extraction pipeline processes uploaded files and pasted text from Phase 7, producing structured data for review in Phase 9.

</domain>

<decisions>
## Implementation Decisions

### Extraction confidence
- All extracted data requires user confirmation before being applied to profile
- User can edit any extracted field during review (Phase 9)
- No need for confidence thresholds or "needs review" flags — everything goes to user review anyway

### Error handling
- Auto-retry 2-3x with backoff before surfacing errors to user
- When all retries fail, offer full fallback menu: Try again, Paste text instead, Enter manually, Contact support
- Don't pre-validate PDF text extraction — attempt extraction and let it fail naturally if no extractable content
- Error messages show brief context with specific reason (e.g., "Couldn't read your document - file appears to be image-only") without technical jargon

### Processing feedback
- Show progress stages during extraction: "Reading document..." → "Extracting info..." → "Matching skills..."
- No time estimates — just stage names (extraction time varies too much)
- No cancel button — extraction is fast enough (~5-10s) that waiting is simpler
- Auto-navigate to review screen when extraction completes — seamless flow

### Claude's Discretion
- How to handle partial data (e.g., work history with only year, no months)
- How to handle multiple values found for single field (e.g., two emails)
- Threshold for sparse document warnings
- Sensible minimums for work history entries (likely: company + role required, dates optional)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-llm-extraction-core*
*Context gathered: 2026-01-18*
