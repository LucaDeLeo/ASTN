# Phase 10: Wizard Integration - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Profile creation offers multiple seamless entry points with context-aware follow-up. Wires together existing pieces (upload, paste, extraction, review, enrichment chat, manual forms) into a cohesive wizard. No new extraction or upload features — this is orchestration and UX polish.

</domain>

<decisions>
## Implementation Decisions

### Entry Point Presentation

- Stacked list layout with primary option highlighted at top
- Upload PDF is the primary/recommended option
- Include "How to get your LinkedIn PDF" link under upload option (opens instructions on click)
- Each option has label + one-line description (no time estimates)
- Four entry points: Upload PDF, Paste text, Manual entry, Chat-first

### Flow Transitions

- Step indicator at top showing wizard progress ("1. Input → 2. Review → 3. Enrich")
- Back button during extraction/review keeps extracted data, allows re-upload
- After applying extracted data: show summary screen with offer to continue to enrichment
- "Your profile is X% complete. Skip enrichment?" with clear skip button (soft nudge, not blocking)

### Context Handoff to Enrichment

- Enrichment chat starts with explicit summary: "I see you uploaded a CV. I found your name, 3 jobs, 2 degrees..."
- Trust the review step — don't re-verify extracted items in chat
- Chat-first entry point: ask "Do you have a CV I could look at?" before starting questions
- Consistent friendly tone regardless of entry point (no adaptation based on context)

### Claude's Discretion

- Exact wording of step indicator labels
- LinkedIn PDF instruction content and presentation
- Summary screen layout and copy
- How to handle edge cases (partial uploads, network failures mid-flow)

</decisions>

<specifics>
## Specific Ideas

- LinkedIn PDF tip is specifically important — many users don't know this is possible
- Summary after extraction should show what percentage was filled and what gaps remain

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 10-wizard-integration_
_Context gathered: 2026-01-19_
