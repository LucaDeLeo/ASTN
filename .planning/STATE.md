# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** Phase 29 — Final phase (v1.4 Hardening)

## Current Position

Phase: 28 of 29 (Quality Gates & Bug Fixes) -- COMPLETE
Plan: 3 of 3 in phase 28 (all complete)
Status: Phase 28 complete
Last activity: 2026-02-02 — Completed 28-03-PLAN.md (dead code, toast, structured logging)

Progress: [████████░░] 78% of v1.4 (7/9 plans)

## Milestone History

- v1.0 MVP - 6 phases, 21 plans - shipped 2026-01-18
- v1.1 Profile Input Speedup - 4 phases, 13 plans - shipped 2026-01-19
- v1.2 Org CRM & Events - 6 phases, 20 plans - shipped 2026-01-19
- v1.3 Visual Overhaul - 4 phases (17-20), 13 plans - shipped 2026-01-20
- v2.0 Mobile + Tauri (partial) - Phases 21-23, 26 complete (16 plans). Phase 25 deferred.

**Total:** 24 phases, 83 plans across 4 shipped milestones + partial v2.0

## Performance Metrics

**Velocity:**

- Total plans completed: 90
- v1.4 plans completed: 7
- Total execution time: ~20 hours (across all milestones)

## Pending Todos

- [ ] Buy domain (astn.ai or similar) and set up email sending via Resend
- [ ] Configure 80K Hours Algolia credentials
- [ ] Obtain aisafety.com Airtable credentials from their team
- [ ] Configure Lu.ma API key for orgs needing event sync

## Blockers/Concerns

- Zod validation schemas must be tested against real LLM outputs before enforcing (shadow mode first)
- Auth migration must not break existing authenticated sessions (graceful errors, not exceptions)

## Decisions Made (v1.4)

| Decision                                                                   | Rationale                                                                     | Phase |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----- |
| Defer Tauri/mobile native work                                             | Focus on hardening before new platform work                                   | -     |
| Skip Tauri-specific fixes (7.1-7.5)                                        | Only relevant when mobile work resumes                                        | -     |
| Security first, then CI, then polish                                       | Exploitable vulns must close before anything else                             | 27-29 |
| 3 phases for 37 requirements                                               | Natural clustering by risk level and dependency                               | 27-29 |
| requireAnyOrgAdmin for legacy admin endpoints                              | No orgId in frontend admin routes; verify any-org admin                       | 27-01 |
| Queries return empty/null for unauthorized                                 | Graceful degradation matches frontend fallback patterns                       | 27-01 |
| Deprecate getCompleteness rather than remove                               | No frontend callers but safer to keep with auth gate                          | 27-01 |
| Web Crypto API for PKCE (no new deps)                                      | crypto.getRandomValues + crypto.subtle.digest available in browser and Tauri  | 27-02 |
| Tauri Store replaces module-level variables                                | Module vars lost on app kill; Store persists to disk                          | 27-02 |
| Token exposure deferred to post-pilot                                      | Per CONTEXT.md; focus on PKCE + allowlist first                               | 27-02 |
| Shadow mode for Zod LLM validation                                         | Log failures but never block operations; test against real outputs first      | 27-03 |
| Permissive schemas with .passthrough()                                     | Allow extra fields and optional omissions to avoid false positives            | 27-03 |
| XML delimiter pattern for all LLM prompts                                  | Structural separation of user data from system instructions                   | 27-03 |
| Generic error messages for input limits                                    | "Content too long to process" rather than revealing specific limits           | 27-03 |
| Deduplicate growth areas by normalized theme, rank by frequency, cap at 10 | Prevents unbounded growth while preserving most-mentioned items               | 28-02 |
| getEffectiveLevel with Date.now() in queries                               | Real-time expiration checking instead of relying on batch compute             | 28-02 |
| hasOverride also checks expiration                                         | UI should not show override indicators for expired overrides                  | 28-02 |
| Remove --ext flag from eslint (flat config v9+)                            | Deprecated in eslint v9+; file patterns in eslint.config.mjs                  | 28-01 |
| Full typecheck in pre-commit hook                                          | TypeScript needs full project context; partial check misses cross-file errors | 28-01 |
| Delete package-lock.json, standardize on bun.lock                          | Single lockfile avoids confusion; bun is the project package manager          | 28-01 |
| JSON structured logging via convex/lib/logging.ts                          | Machine-parseable logs for Convex dashboard and log aggregation               | 28-03 |
| Error toasts persist with duration: Infinity                               | Users must see failures; auto-dismiss would hide errors                       | 28-03 |
| Logging utility is pure module (no "use node")                             | Works in both Node actions and Convex mutations without restrictions          | 28-03 |

## Session Continuity

Last session: 2026-02-02
Stopped at: Completed 28-03-PLAN.md (dead code, toast, structured logging)
Resume file: None
Next action: Begin Phase 29 (final phase of v1.4)

---

_State initialized: 2026-01-17_
_Last updated: 2026-02-02 — Completed 28-03 (dead code removal, toast migration, structured logging)_
