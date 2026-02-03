# Phase 7: File Upload Foundation - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can upload PDFs or paste text with clear feedback and error handling. This phase builds the upload infrastructure and UI. Extraction logic (Phase 8) and review UI (Phase 9) are separate.

</domain>

<decisions>
## Implementation Decisions

### Overall personality

- Playful confidence — bold colors, bouncy micro-interactions, encouraging copy
- Not generic/safe; should feel distinctive and memorable
- Balance playfulness on entry with smooth elegance once file is present

### Upload zone design

- Prominent card with illustration, instructions, and visible "Browse" button
- Single file only (one resume/CV at a time)
- On drag hover: reveal animation — hidden element animates in to "catch" the file
- After file selected: zone transforms smoothly to show filename, size, and remove/replace button
- Success state: smooth morph — elegant transform, satisfying but not over the top

### Text paste experience

- Paste is fallback — appears as secondary option below the primary upload zone
- On click: reveal with flair — playful animation matching upload zone energy
- Placeholder: encouraging — "Paste your resume, LinkedIn summary, or anything career-related..."
- Limits: soft warning — no hard limit, friendly nudge if text seems excessive

### Progress & status

- Animated horizontal progress bar with percentage displayed
- Distinct processing state — "Analyzing your resume..." with different animation than upload progress
- No cancel option — operations are fast, simpler flow

### Error handling

- Wrong format: quick shake animation + inline message — playful but clear
- Too large (>10MB): prevent + explain — shows actual size vs limit, suggests compression
- Network error: retry button + paste fallback suggestion
- Error duration: until action — errors persist until user tries again or dismisses

### Claude's Discretion

- The reveal element design (character, shape, icon that "catches" the file)
- Exact animation timing and easing curves
- Color palette choices within "playful confidence" direction
- Typography choices
- Specific copy for error messages and placeholders

</decisions>

<specifics>
## Specific Ideas

- Reveal animation on drop hover should feel like something is excited/ready to receive the file
- Processing state should feel distinct from upload progress (different animation style)
- Errors should be "quick shake + message" — playful but clear, not scolding

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 07-file-upload-foundation_
_Context gathered: 2026-01-18_
