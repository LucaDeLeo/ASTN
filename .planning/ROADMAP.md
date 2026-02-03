# Roadmap: ASTN

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-01-18)
- ✅ **v1.1 Profile Input Speedup** - Phases 7-10 (shipped 2026-01-19)
- ✅ **v1.2 Org CRM & Events** - Phases 11-16 (shipped 2026-01-19)
- ✅ **v1.3 Visual Overhaul** - Phases 17-20 (shipped 2026-01-20)
- ⏸️ **v2.0 Mobile + Tauri** - Phases 21-23, 26 complete; Phase 25 deferred
- 🚧 **v1.4 Hardening** - Phases 27-29 (in progress)

## Overview

v1.4 closes all security vulnerabilities, bugs, and code quality gaps identified in the comprehensive codebase review before the BAISH pilot. The approach is strict: critical security fixes first (unauthenticated endpoints, OAuth gaps, LLM safety), then quality gates and bug fixes (CI pipeline, pre-commit hooks, correctness issues), then performance and polish (N+1 queries, accessibility, visual coverage gaps). Each phase delivers independently verifiable improvements and the ordering prevents regressions -- CI from Phase 28 catches issues introduced in Phase 29.

## Phases

- [x] **Phase 27: Critical Security** - Close exploitable auth gaps, harden OAuth flow, defend LLM calls
- [x] **Phase 28: Quality Gates & Bug Fixes** - CI pipeline, pre-commit hooks, correctness fixes, error handling
- [ ] **Phase 29: Performance, Accessibility & Polish** - N+1 query resolution, ARIA/keyboard support, visual coverage

## Phase Details

<details>
<summary>v1.0 through v2.0 (Phases 1-26) -- see MILESTONES.md</summary>

Previous milestones are documented in `.planning/MILESTONES.md`. Phases 1-23 and 26 are complete. Phase 25 (Tauri native) is deferred.

</details>

### v1.4 Hardening (In Progress)

**Milestone Goal:** Fix all security vulnerabilities, bugs, performance issues, and code quality gaps from the codebase review before the BAISH pilot launch.

#### Phase 27: Critical Security

**Goal**: All endpoints require proper authentication, OAuth flow is secure against CSRF and token theft, and LLM calls are defended against prompt injection with validated outputs
**Depends on**: Nothing (first phase of v1.4; no dependency on deferred Phase 25)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, OAUTH-01, OAUTH-02, OAUTH-03, OAUTH-04, LLM-01, LLM-02, LLM-03, LLM-04
**Plans:** 3 plans

Plans:

- [x] 27-01-PLAN.md -- Authentication hardening (requireAuth helper, ownership checks on enrichment endpoints, getCompleteness deprecation, admin.ts CRUD auth, listAll admin gate)
- [x] 27-02-PLAN.md -- OAuth security (PKCE for Tauri mobile, state validation, redirectUri allowlist, Tauri Store persistence, console.log cleanup)
- [x] 27-03-PLAN.md -- LLM safety (XML delimiters for prompt separation, input length limits, Zod runtime validation for tool_use responses in shadow mode)

#### Phase 28: Quality Gates & Bug Fixes

**Goal**: CI pipeline and pre-commit hooks catch regressions automatically, all known bugs are fixed, and error handling is consistent across the codebase
**Depends on**: Phase 27 (security fixes must land before establishing quality gates that validate them)
**Requirements**: QUAL-01, QUAL-02, QUAL-03, QUAL-04, QUAL-05, QUAL-06, QUAL-07, QUAL-08, QUAL-09, BUG-01, BUG-02, BUG-03, BUG-04
**Success Criteria** (what must be TRUE):

1. Every push and PR triggers GitHub Actions CI that runs lint, typecheck, and build -- failures block merge
2. Every git commit runs lint-staged via husky pre-commit hook, catching formatting and lint issues before they reach CI
3. Growth areas from multi-batch matching runs are aggregated (not overwritten) -- user sees all growth areas across all matched opportunities
4. Navigation-during-render warnings are eliminated -- redirect components use useEffect for router.navigate calls
5. Error messages shown to users are toast notifications (not browser alert() dialogs), and server-side errors use structured logging (not console.log)
   **Plans:** 3 plans

Plans:

- [x] 28-01-PLAN.md -- CI pipeline and developer experience (GitHub Actions workflow, husky + lint-staged, .env.example, dual lockfile cleanup)
- [x] 28-02-PLAN.md -- Bug fixes and data correctness (growth area aggregation, Date.UTC conversion, navigation useEffect wrapping, engagement override expiration, IANA timezone validation)
- [x] 28-03-PLAN.md -- Code quality cleanup (test route removal, dead code, alert-to-toast, structured logging standardization)

#### Phase 29: Performance, Accessibility & Polish

**Goal**: Database queries are efficient at scale, interactive elements are keyboard-accessible with proper ARIA attributes, and v1.3 visual treatment covers all remaining pages
**Depends on**: Phase 28 (CI catches regressions from performance and UI changes)
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04, A11Y-01, A11Y-02, A11Y-03, A11Y-04, VIS-01, VIS-02
**Success Criteria** (what must be TRUE):

1. Programs, attendance, and email batch queries use batched lookups instead of per-item queries -- no N+1 patterns remain in hot paths
2. Matching batch API calls include rate limiting to avoid hitting Anthropic rate limits during large compute runs
3. User can navigate all interactive elements (org cards, drag handles, form fields) via keyboard with visible focus indicators and correct ARIA roles
4. Form validation errors are programmatically linked to their inputs via aria-describedby, and password validation shows inline feedback before form submission
5. GradientBg warm background appears on settings, attendance, and org admin pages, and all 35+ headings use font-display class instead of font-bold
   **Plans:** 3 plans

Plans:

- [ ] 29-01-PLAN.md -- N+1 query resolution and rate limiting (batch attendance/email/program queries, chained scheduled actions for matching with exponential backoff)
- [ ] 29-02-PLAN.md -- Accessibility hardening (password inline validation checklist, OrgCard keyboard nav, drag state non-color indicators, aria-describedby on all data-entry forms)
- [ ] 29-03-PLAN.md -- Visual coverage (GradientBg on remaining user-facing pages, font-display heading sweep across 17 files)

## Progress

**Execution Order:** Phase 27 -> Phase 28 -> Phase 29

| Phase                                   | Milestone | Plans Complete | Status      | Completed  |
| --------------------------------------- | --------- | -------------- | ----------- | ---------- |
| 27. Critical Security                   | v1.4      | 3/3            | ✓ Complete  | 2026-02-02 |
| 28. Quality Gates & Bug Fixes           | v1.4      | 3/3            | ✓ Complete  | 2026-02-02 |
| 29. Performance, Accessibility & Polish | v1.4      | 0/3            | Not started | -          |

---

_Roadmap created: 2026-01-20_
_Last updated: 2026-02-02 -- Phase 28 complete (3/3 plans, verified 18/18 must-haves)_
