# Phase 29: Performance, Accessibility & Polish - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the existing app efficient at database scale, keyboard/screen-reader accessible, and visually consistent across all pages. No new features — fix N+1 query patterns, add ARIA/keyboard support to interactive elements, and extend v1.3 visual treatment to uncovered pages. This is the final hardening phase before the BAISH pilot.

</domain>

<decisions>
## Implementation Decisions

### N+1 resolution strategy

- Default to two-pass pattern: collect all IDs up front → batch `ctx.db.get()` with `Promise.all` → build a Map for O(1) lookup. Replace `.filter()` on user IDs with `ctx.db.get()` (cast `userId as Id<"users">` — schema uses `v.string()` but values are valid user IDs). Claude's discretion on single-query vs two-pass per specific case, but two-pass is the default.
- Anthropic API rate limiting during matching: queue and retry with exponential backoff — all matches must eventually complete, no partial runs. Must use **chained scheduled actions** (`ctx.scheduler.runAfter()`) instead of a single long-running action loop — Convex actions have a 10-minute timeout and backoff retries can stack up. Each batch saves progress via mutation before scheduling the next.
- Events query pagination: simple limit + "Load more" button (not cursor-based infinite scroll — pilot scale doesn't need it)
- Add performance logging alongside the N+1 fixes: log **read counts per query execution** and **action wall-clock time** (not query latency — Convex queries are reactive/cached). Use the structured logging utility from Phase 28 (convex/lib/logging.ts).

### Keyboard navigation scope

- Org cards become a single tab stop — Enter key activates the card
- Keyboard navigation scope follows what the phase requirements specify (org cards, drag handles, form fields)
- Focus indicators: stick with shadcn/ui default focus styles, no custom focus ring
- Drag-and-drop keyboard degradation: Claude's discretion on the most accessible approach

### Accessibility feedback style

- Inline form validation fires on type (real-time), not on blur
- aria-describedby treatment applies to every form field app-wide, not just the ones called out in requirements
- Password validation: checklist style showing each rule (length, special char, etc.) with check/X indicators updating as the user types
- ARIA live regions for both toast notifications and major content updates (match results loading, etc.)

### Visual consistency approach

- GradientBg warm background goes on every page for full consistency (not just the three missing ones)
- Font-display vs font-bold heading sweep: Claude's discretion based on visual hierarchy (page/section headings likely get font-display, small card labels may stay font-bold)
- Trivial visual fixes (< 1 line change) are allowed if encountered while touching pages
- GradientBg placement pattern (per-page vs layout-level): Claude's discretion based on the existing codebase pattern

### Claude's Discretion

- N+1 resolution approach — two-pass is the default, but Claude may use single-query where it's simpler (e.g., `Promise.all` with `ctx.db.get()` for small known sets)
- Drag-and-drop keyboard alternative (arrow keys vs up/down buttons)
- Font-display heading granularity (which heading levels get it)
- GradientBg injection pattern (per-page opt-in vs route-level wrapper)

</decisions>

<specifics>
## Specific Ideas

- Password checklist should show each rule with a visual check/X indicator, updating in real-time as the user types
- Rate limiting for Anthropic API should guarantee completion — queue everything, retry with backoff, never leave a matching run half-done. Use chained scheduled actions so each batch is its own action invocation (avoids 10-min timeout).
- "Load more" for events is sufficient at pilot scale (50-100 profiles)
- Performance logging should track read counts and action duration, not query latency. Use structured logging from Phase 28 (convex/lib/logging.ts).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 29-performance-accessibility-polish_
_Context gathered: 2026-02-02_
