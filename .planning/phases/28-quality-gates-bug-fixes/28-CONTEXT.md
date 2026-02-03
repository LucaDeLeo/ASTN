# Phase 28: Quality Gates & Bug Fixes - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

CI pipeline and pre-commit hooks catch regressions automatically, all known bugs are fixed, and error handling is consistent across the codebase. Covers GitHub Actions, husky/lint-staged, bug fixes for growth area aggregation, navigation warnings, engagement override expiration, org membership race conditions, and code quality cleanup (dead code, alert-to-toast, error standardization, timezone validation).

</domain>

<decisions>
## Implementation Decisions

### Error notification UX

- Toast positioning and styling: Claude's discretion (pick what fits the existing layout)
- Error toasts persist until manually dismissed; success/info toasts auto-dismiss after ~5s
- Include action buttons where applicable — Retry for failed mutations, Undo for destructive actions
- Server-side error logging: Claude's discretion (simplest approach that improves observability over console.log)

### CI & commit gate strictness

- CI failures block PR merges (required status checks on GitHub)
- Pre-commit hooks NOT bypassable — no --no-verify escape hatch
- Lint-staged runs lint + format + typecheck on pre-commit (thorough, even if ~10-15s)
- CI includes test step now (`bun test`) — passes vacuously if no tests exist, ready for future
- CI runs: lint, typecheck, build, test on every push and PR

### Growth area aggregation

- Dedup strategy: Claude's discretion (balance accuracy with simplicity)
- Source attribution: Claude's discretion (based on what data model supports easily)
- Display limit: Cap at ~10 most frequent growth areas, ranked by frequency across batches
- Run behavior: Each full matching run replaces previous growth areas; batches within a single run are aggregated together

### Cleanup boundaries

- Dead code: Claude audits and decides what to remove — scan for dead exports, unused components, unreachable routes
- Error handling: Standardize ALL Convex functions with consistent error handling patterns (not just fix existing console.log/alert instances)
- .env.example: Comprehensive — every env var with comments explaining purpose and where to get the value
- Dual lockfile: Remove package-lock.json entirely — bun.lockb is source of truth

### Claude's Discretion

- Toast notification positioning and visual styling
- Server-side structured logging format (replacing console.log)
- Growth area dedup algorithm (exact match, fuzzy, or LLM-based)
- Growth area source attribution (show counts or not, based on data model)
- Dead code identification and removal scope

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants strictness (block merges, no bypass, thorough pre-commit) and completeness (standardize all functions, comprehensive env docs, audit all dead code).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 28-quality-gates-bug-fixes_
_Context gathered: 2026-02-02_
