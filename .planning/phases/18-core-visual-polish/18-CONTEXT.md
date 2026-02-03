# Phase 18: Core Visual Polish - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply warm visual treatment consistently across all pages — backgrounds, shadows, typography, and layout using the tokens established in Phase 17. This phase uses existing tokens to transform the app's appearance; it does not define new tokens or add motion.

</domain>

<decisions>
## Implementation Decisions

### Warmth Application

- Coral warmth is a **visible accent** — clear presence, not just undertone
- Warmth appears in **both** shadows AND backgrounds for layered effect
- GradientBg usage is **contextual** — Claude decides which pages get gradients vs solid warm backgrounds based on page purpose and content density

### Page Hierarchy

- Pages have **themed variations** — same system but tuned per page type (list vs detail vs form)
- List pages: **Warm cards on light background** — cards have warm tint, background is lighter
- Detail page headers: Claude's discretion based on content structure
- **Admin pages get a dot grid pattern** — visual differentiation that signals "different part of the app"

### Component Density

- Overall feel: **Compact & dense** — information-forward, minimal wasted space
- Opportunity/match cards: **Information-rich** — show as much as fits (tags, dates, description snippet, tier)
- Forms: **Tight grouping** — related fields close together, compact sections
- Content width: **Medium container** (~900-1100px max) — typical app width, not prose-narrow

### Claude's Discretion

- Which pages get gradient backgrounds vs solid warm backgrounds
- Detail page hero/header prominence
- Exact spacing values within the compact philosophy

</decisions>

<specifics>
## Specific Ideas

- Admin pages should have a dot grid pattern in the background to clearly differentiate from user-facing pages
- Cards should feel information-rich — users shouldn't need to click to get key details
- "Compact & dense" means information-forward, not cramped — maintain readability

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 18-core-visual-polish_
_Context gathered: 2026-01-19_
