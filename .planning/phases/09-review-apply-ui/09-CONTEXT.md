# Phase 9: Review & Apply UI - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can review, edit, and confirm extracted data before it saves to their profile. This phase delivers the preview interface where users see extraction results from Phase 8, make inline edits, and confirm before data flows to their profile.

**Design constraint:** UI must be unified with the existing "Review Extracted Information" pattern from enrichment chat — card-based rows with accept/reject/edit icons.

</domain>

<decisions>
## Implementation Decisions

### Preview Layout
- Follow existing pattern: card-based rows per field group with accept (✓), reject (✗), edit (✏) icons
- Multi-entry fields (work history, education): expandable cards
  - Collapsed state shows: title + organization + dates (e.g., "Software Engineer at Anthropic (2022-2024)")
  - Expands to show full details
- Sections organized to match profile form order (Basic Info, Education, Work History, Skills, etc.)

### Inline Editing
- Trigger: click pencil icon (matches existing pattern)
- Complex fields (work entries): expand in place, fields become editable inline
- Skill tags: reuse existing profile skill picker component
- Edits auto-save on blur (no explicit save/cancel buttons)

### Gap Communication
- Missing fields shown with placeholder (e.g., "<Not found>") — visible but clearly empty
- Completeness indicator: field counter only (e.g., "8 of 12 fields extracted") — matches existing pattern
- Low-confidence extractions: visual indicator to distinguish from high-confidence (subtle badge or color)
- After apply: auto-redirect to enrichment chat for remaining gaps

### Confirmation Flow
- Individual field control: accept/reject per field, then "Apply Selected" (matches existing pattern)
- No undo after applying — user can edit profile normally afterward
- After apply: show success state with "Continue to enrichment" button

### Claude's Discretion
- Container approach (wizard step vs dedicated page) — determine based on existing patterns
- Merge strategy when user has existing profile data — determine appropriate approach
- Exact visual treatment of low-confidence indicator

</decisions>

<specifics>
## Specific Ideas

- Must visually unify with existing "Review Extracted Information" UI from enrichment chat
- Cards should have same structure: field label, value display, action icons on right
- Expandable cards for work/education should feel like accordion — smooth expand/collapse
- Counter at bottom: "X of Y fields will be applied" format

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-review-apply-ui*
*Context gathered: 2026-01-18*
