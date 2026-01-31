# Project Research Summary

**Project:** ASTN v1.4 — Security Hardening, Bug Fixes, Code Quality
**Domain:** Hardening pass for production Convex + TanStack Start + React 19 web app with LLM integration
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

The v1.4 hardening milestone addresses 36 identified issues across security, bugs, performance, and code quality in the existing ASTN codebase. The research reveals that most hardening work requires **code changes, not new dependencies** — the stack already contains what's needed. Zod is already installed (transitively), @convex-dev/auth already implements PKCE for managed OAuth, and convex-helpers provides custom function wrappers for auth middleware. The primary gaps are: (1) making Zod an explicit dependency, (2) adding pre-commit tooling (husky + lint-staged), and (3) creating CI/CD workflows from scratch.

The critical security vulnerabilities fall into three categories: **unauthenticated endpoints** (3 LLM-calling actions and 1 admin mutation with no auth checks), **OAuth security gaps** (Tauri mobile flow lacks PKCE and state validation), and **LLM safety** (prompt injection risk via undelimited user data, no runtime validation of structured outputs). All can be fixed with existing dependencies using well-documented Convex and Anthropic patterns. The research identified strong consensus across all dimensions: authentication must come first, PKCE is required for mobile OAuth, Zod schemas should define both types and validation, and XML-delimited prompt boundaries are the recommended defense against injection.

The moderate-impact issues (N+1 queries, navigation-during-render bugs, growth area aggregation bug) are straightforward fixes but must be approached carefully: Convex's reactive query model means traditional N+1 optimizations can backfire, and adding Zod validation that's too strict will cause silent match failures. The research emphasizes **testing against real production LLM outputs**, not mocked data, before enforcing validation.

## Key Findings

### Recommended Stack

The current stack is sufficient for all v1.4 hardening work. Only 3 new packages are needed: Zod (promote from transitive to explicit), husky (pre-commit hooks), and lint-staged (staged file filtering).

**Core technologies (no changes):**
- Convex ^1.31.6 + @convex-dev/auth ^0.0.90 — Backend already implements PKCE for managed OAuth
- @anthropic-ai/sdk ^0.71.2 — Already bundles Zod peer dependency and betaZodTool helper
- convex-helpers 0.1.111 — Provides customMutation/customQuery wrappers for auth middleware
- TypeScript ^5.9.2 + ESLint + Prettier — Type checking and linting already configured

**New dependencies required:**
- `zod@^3.25` — Runtime validation of LLM responses (already in node_modules, make explicit)
- `husky@^9` + `lint-staged@^15` — Pre-commit hooks for quality gates

**Infrastructure (no npm packages):**
- `.github/workflows/ci.yml` — CI/CD pipeline for type check, lint, build, deploy (create from scratch)
- Delete `package-lock.json` — Dual lockfile bug, keep only `bun.lock`

**Critical insight:** @convex-dev/auth ALREADY implements PKCE with S256 for managed OAuth flows (verified in source code: `checks ?? ["pkce"]` is the default). The OAuth gap is in the **Tauri mobile flow** (`convex/authTauri.ts`), which bypasses @convex-dev/auth entirely and does manual code exchange with no PKCE or state validation.

### Expected Features (Table Stakes vs Differentiators)

**Must have (table stakes — missing = exploitable vulnerability):**
- TS-1: Authentication on enrichment endpoints (`sendMessage`, `getMessagesPublic` have no auth checks)
- TS-2: Secure OAuth code exchange (`exchangeOAuthCode` is public, accepts attacker-controlled redirectUri)
- TS-3: OAuth state parameter validation (frontend generates state, backend never validates)
- TS-4: PKCE for mobile OAuth (Tauri flow lacks code_verifier/code_challenge)
- TS-5: LLM prompt injection defense (user data interpolated directly into prompts with no delimiters)
- TS-6: Runtime validation of LLM outputs (unsafe `as` type assertions on all LLM tool_use responses)
- TS-7: Authorization check on `getCompleteness` (public query accepts arbitrary profileId)

**Should have (differentiators — demonstrate security maturity):**
- DF-1: Consistent auth middleware (customQuery/customMutation pattern eliminates "forgot auth check" bugs)
- DF-2: CI/CD pipeline (catches type errors, lint violations before production)
- DF-3: Production console.log cleanup (remove debugging info from OAuth flows)
- DF-4: Error handling standardization (prevent stack trace leakage, structured logging)
- DF-5: Test route and dead code removal (reduce attack surface)
- DF-6: N+1 query resolution (performance improvement for scale beyond pilot)
- DF-7: Fix navigation-during-render anti-pattern (React best practices)
- DF-8: Bug fix — Growth areas aggregation (correctness fix for multi-batch matching)
- DF-9: Bug fix — Date.UTC for date conversion (timezone-independent work history dates)
- DF-10: Dual lockfile cleanup (eliminate dependency version confusion)

**Anti-features (deliberately NOT build):**
- AF-1: Do NOT build custom rate limiter (Convex has platform-level protection; fix is proper auth)
- AF-2: Do NOT build complex permission system (binary admin/member model is sufficient for pilot)
- AF-3: Do NOT add E2E encryption for enrichment messages (breaks LLM re-processing)
- AF-4: Do NOT overcomplicate auth middleware (single-layer customQuery wrapper is sufficient)
- AF-5: Do NOT add pre-commit hooks during hardening (CI catches same issues, less friction)
- AF-6: Do NOT build LLM output content filtering (doubles cost/latency, low risk surface)
- AF-7: Do NOT migrate to different auth provider (issues are in check usage, not provider)

### Architecture Approach

The hardening work integrates with existing architecture through 7 integration points, requiring 4 new files and modifications to 14 existing files. The approach emphasizes **defense in depth** with authentication, input validation, and structural separation working together.

**Integration points:**
1. **Authentication hardening** — Create `convex/lib/auth.ts` with `requireAuth` helper, add auth + ownership checks to 4 unprotected endpoints
2. **OAuth PKCE + state** — Add PKCE helpers to Tauri client, persist code_verifier to Tauri Store (not memory), validate state on callback, forward verifier to backend
3. **LLM prompt separation** — Wrap user data in XML tags (`<candidate_profile>`, `<opportunities>`), add boundary instructions to system prompts
4. **LLM response validation** — Create Zod schemas in `convex/matching/validation.ts` and `convex/engagement/validation.ts`, use `.safeParse()` instead of `as` casts
5. **N+1 query fixes** — Use `Promise.all` with `ctx.db.get(id)` for parallelism, cache repeated lookups (orgs), denormalize counts for reactive queries
6. **CI/CD integration** — GitHub Actions workflow with Bun setup, Convex codegen, type check, lint, build, deploy (needs CONVEX_DEPLOY_KEY secret)
7. **Frontend useEffect fixes** — Wrap `navigate()` calls in `useEffect`, fix dependency arrays

**Key architectural insight from Convex patterns:** N+1 queries are less catastrophic in Convex than traditional SQL (functions run on the same machine as the database, `ctx.db.get(id)` is O(1)), but `ctx.db.query(...).collect()` inside loops is still wasteful. The fix is to distinguish between **reactive queries** (frontend-facing, optimize via denormalization) and **internal queries** (cron/actions, optimize via batching).

**Authentication pattern consensus:** All three researchers agree on the `customQuery`/`customMutation` wrapper pattern using `convex-helpers`. This is the officially recommended Convex pattern and prevents "forgot to add auth check" bugs by enforcing auth at the wrapper level.

**LLM safety pattern consensus:** All researchers recommend XML tag delimiters for structural separation (not content filtering/sanitization) because AI safety career descriptions legitimately contain phrases like "prompt engineering" and "instruction following" that would trigger keyword-based filters.

### Critical Pitfalls

**Pitfall 1: Auth Migration Breaks Existing Authenticated Users Mid-Session**
- Adding auth checks to `sendMessage`, `getMessagesPublic`, `getCompleteness` can cause race conditions where the user IS authenticated but the auth token isn't available in Convex context at the exact moment the function runs
- **Mitigation:** Return graceful errors (empty array) not thrown exceptions for queries; test full enrichment flow after each auth change; deploy frontend + backend atomically

**Pitfall 2: Making exchangeOAuthCode Internal Breaks Tauri Mobile Login Entirely**
- The obvious fix for the public OAuth code exchange is to make it `internalAction`, but this function MUST be client-callable for deep link callbacks
- **Mitigation:** Do NOT make internal; instead add redirect URI allowlist, state validation, PKCE verification; OR create thin public wrapper that validates inputs and calls internal action for actual exchange

**Pitfall 3: Adding Zod Validation to LLM Responses Causes Silent Match Failures**
- Schemas that are too strict (required fields the LLM sometimes omits, enums that don't match LLM's exact output) fail validation, and the `continue` on batch failure swallows errors
- **Mitigation:** Write PERMISSIVE schemas (use `.optional()`, `.passthrough()`, `z.coerce.number()`); test against real production LLM outputs in shadow mode before enforcing; log full LLM response on validation failure

**Pitfall 4: PKCE Implementation Creates Subtle Race Conditions in Mobile OAuth**
- Storing `code_verifier` in module-level variables means it's lost when the app is killed/recreated between OAuth redirect and callback (iOS aggressively kills background apps)
- **Mitigation:** Use `@tauri-apps/plugin-store` to persist code_verifier and state to disk before OAuth redirect; read back on callback; handle missing data gracefully

**Pitfall 5: N+1 Query "Fix" Breaks Convex's Reactive Query Model**
- Traditional batching makes queries reactive to MORE documents (adding member to program A causes program B to re-query)
- **Mitigation:** Distinguish reactive queries (denormalize counts on parent table) from internal queries (batch freely); profile before "fixing" — at 50-100 users, N+1 is acceptable

**Pitfall 6: Scope Creep — Hardening Pass Becomes a Refactoring Pass**
- Codebase has natural rough edges from rapid development; temptation to "clean up while fixing" adds risk without hardening value
- **Mitigation:** Strict boundary = fix only the 36 identified issues; categorize MUST (security) / SHOULD (bugs) / NICE (code quality); each fix in isolated commit; hard scope boundary = if touching >3 files, it's scope creep

## Implications for Roadmap

Based on research consensus, suggested phase structure prioritizes **critical security fixes first**, then **code quality patterns**, then **polish**. The research strongly recommends against trying to fix all 36 issues simultaneously.

### Phase 1: Critical Security Fixes (do first, in order)
**Rationale:** These are the highest-risk items. `sendMessage` allows unauthenticated LLM calls (costs real money). `getMessagesPublic` leaks conversation history. `exchangeOAuthCode` exposes OAuth client secrets. Must close these before anything else.

**Delivers:**
- Authentication on all enrichment endpoints (TS-1)
- Secure OAuth flow with state validation and PKCE (TS-2, TS-3, TS-4)
- LLM prompt injection defense via XML delimiters (TS-5)
- Runtime validation for LLM outputs (TS-6)
- Auth check on `getCompleteness` (TS-7)

**Addresses features:** TS-1 through TS-7 (all table stakes)

**Avoids pitfalls:** Pitfall 1 (auth migration breaks users), Pitfall 2 (OAuth internal breaks mobile), Pitfall 3 (strict Zod breaks matches), Pitfall 4 (PKCE race conditions)

**Estimated effort:** 12-18 hours

**Research flag:** Phase 1 has well-documented patterns (Convex auth, RFC 7636 PKCE, Anthropic XML delimiters) — no additional research needed. However, requires careful testing against real production data for Zod validation (shadow mode before enforcement).

### Phase 2: Code Quality and Patterns (do second)
**Rationale:** Establishes patterns that prevent future vulnerabilities. Auth middleware prevents "forgot to check auth" bugs going forward. CI/CD catches regressions before they reach production. Bug fixes improve correctness.

**Delivers:**
- Auth middleware wrappers with convex-helpers (DF-1)
- CI/CD pipeline + dual lockfile cleanup (DF-2, DF-10)
- Bug fixes: growth areas aggregation, date conversion (DF-8, DF-9)
- Navigation-during-render fix (DF-7)

**Uses stack elements:** convex-helpers (customMutation), GitHub Actions, Bun setup

**Implements architecture:** Custom function wrappers pattern (already used for requireOrgAdmin, generalize it)

**Estimated effort:** 8-12 hours

**Research flag:** CI/CD workflow requires understanding Convex deployment pattern (`npx convex deploy --cmd`) and CONVEX_DEPLOY_KEY setup — standard pattern, no deep research needed. Pitfall 7 warns about dual lockfile + codegen failures; remove package-lock.json first.

### Phase 3: Polish (do if time permits)
**Rationale:** Improves UX and reduces attack surface but not critical for security posture. Can defer to v1.5 if needed.

**Delivers:**
- Console.log cleanup with dev guards (DF-3)
- Dead code removal (test-upload route) (DF-5)
- Error handling standardization (DF-4)
- N+1 query resolution (DF-6)

**Estimated effort:** 6-10 hours

**Research flag:** DF-4 (error standardization) touches many files and requires UX decisions (which toasts to show). DF-6 (N+1) requires profiling real queries — Pitfall 5 warns against premature optimization. Consider deferring to separate performance milestone.

### Phase Ordering Rationale

- **Security first:** Critical auth gaps (unauthenticated endpoints, OAuth vulnerabilities) must be fixed before anything else. These are exploitable remotely.
- **Patterns second:** Auth middleware and CI/CD establish quality gates that prevent new vulnerabilities from being introduced.
- **Performance last:** At 50-100 user pilot scale, N+1 queries are noticeable but not breaking. Fix after security is solid.
- **Dependencies inform order:** PKCE (Phase 1) requires Tauri Store persistence solution before implementation. Zod validation requires testing against real LLM outputs before enforcement. CI/CD requires dual lockfile cleanup first.
- **Pitfall avoidance:** Strict phase separation prevents scope creep (Pitfall 6). Auth fixes in Phase 1 are isolated from refactoring work. Each phase delivers working code, not half-finished improvements.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 1 (Zod validation):** Requires collecting real production LLM responses to validate schema strictness. Run in shadow mode (log validation results without rejecting) for 1-2 days before enforcing.
- **Phase 1 (PKCE on Tauri):** Requires understanding Tauri Store API for persistence. The `@tauri-apps/plugin-store` is installed but not currently used. May need Tauri mobile testing device for cold-start scenario.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Auth checks):** Well-documented Convex pattern. Copy existing `requireOrgAdmin` pattern from programs.ts.
- **Phase 1 (OAuth state validation):** RFC 6749 Section 10.12, standard OAuth pattern. Generate nonce, store, validate on callback.
- **Phase 2 (Auth middleware):** Official Convex pattern from stack.convex.dev/custom-functions. Clear examples exist.
- **Phase 2 (CI/CD):** Standard GitHub Actions + Bun + Convex deploy pattern. Skeleton workflow provided in STACK.md research.
- **Phase 3 (Bug fixes):** All are simple code changes (date conversion = one-line fix, growth areas = change assignment to array merge).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified by reading node_modules source code (Zod 3.25.76 present, @convex-dev/auth has PKCE, convex-helpers has customFunctions). All recommendations based on installed packages. |
| Features | HIGH | Based on direct codebase analysis of all 36 issues identified in CODEBASE_REVIEW.md. Every table stakes item has specific file + line number references. |
| Architecture | HIGH | Integration points verified by reading actual Convex function implementations. OAuth flow traced from frontend (oauth-buttons.tsx) through backend (authTauri.ts) to provider. |
| Pitfalls | HIGH | All critical pitfalls based on code analysis, not speculation. Auth context differences between queries/mutations/actions verified. Module-level variable persistence issue in Tauri flow confirmed. |

**Overall confidence:** HIGH

### Consensus Across Researchers

**Strong agreement on:**
- Authentication must come first (all 4 researchers flag unauthenticated endpoints as CRITICAL)
- PKCE is required for Tauri mobile OAuth (RFC 7636, Google mandates, GitHub strongly recommends)
- Zod schemas should be permissive, not strict (FEATURES researcher warns about enum mismatches, PITFALLS researcher details silent match failures)
- XML tag delimiters for prompt separation (not content filtering) — ARCHITECTURE and FEATURES both recommend this specific Anthropic pattern
- convex-helpers customMutation pattern for auth middleware (STACK, ARCHITECTURE, FEATURES all recommend same approach)
- Scope discipline required (PITFALLS researcher dedicates entire pitfall to scope creep; FEATURES researcher creates anti-features list)

**No conflicts detected:** All four research dimensions aligned on technical approach. The only variance is emphasis (STACK focuses on dependencies, FEATURES on categorization, ARCHITECTURE on integration patterns, PITFALLS on failure modes).

### Gaps to Address

**During Phase 1 planning:**
- **Zod schema strictness:** Test validation against 10-20 real production LLM responses from matching, engagement, and extraction before finalizing schemas. Capture both successful and edge-case responses (LLM sometimes omits optional fields).
- **Tauri Store API:** Verify `@tauri-apps/plugin-store` can persist data across cold starts. Test on iOS if possible (Android is less aggressive about killing apps).
- **Frontend error handling for auth:** Verify all callers of `getMessagesPublic`, `sendMessage`, `getCompleteness` have proper error handling for null/empty returns. Map every `useQuery(api.enrichment.*)` call in the codebase.

**During Phase 2 planning:**
- **CI Convex codegen setup:** Determine whether to use dev deployment or production deployment for type generation. Dev is safer (no risk of deploying broken code) but requires separate CONVEX_DEPLOYMENT secret.
- **Auth middleware migration strategy:** Decide whether to migrate all existing functions to `authedQuery`/`authedMutation` in Phase 2, or only use wrappers for new functions. Migration touches 20+ files; isolated wrapper creation touches 1 file.

**Open questions for requirements definition:**
- **Console.log removal scope:** Remove all (may lose debugging capability per Pitfall 10) or guard behind `import.meta.env.DEV` (keeps debugging in dev mode)?
- **N+1 optimization threshold:** At what scale (users, programs, events) should denormalization be implemented? Current consensus is "defer to v1.5" but specific triggers would help.
- **Error standardization UI:** Which errors should show toasts vs which should fail silently? Needs UX decision, not just technical implementation.

## Sources

### Primary (HIGH confidence)
- **Direct codebase analysis** — All 36 issues from CODEBASE_REVIEW.md verified by reading actual code (convex/*.ts, src/**)
- **node_modules source code** — @convex-dev/auth PKCE implementation verified in `src/server/oauth/checks.ts` and `authorizationUrl.ts`
- **Anthropic SDK source** — betaZodTool helper verified in `@anthropic-ai/sdk/src/helpers/beta/zod.ts`
- **Installed package.json files** — Zod 3.25.76 version confirmed in node_modules/zod/package.json
- **convex-helpers source** — customMutation/customAction wrappers verified in node_modules/convex-helpers/server/customFunctions.ts

### Secondary (MEDIUM confidence)
- **Convex official docs** — Authentication patterns (docs.convex.dev/auth/functions-auth), custom functions pattern (stack.convex.dev/custom-functions), N+1 query guidance (stack.convex.dev/functional-relationships-helpers)
- **RFC 7636** — PKCE specification for authorization code flow
- **RFC 6749 Section 10.12** — OAuth state parameter CSRF protection
- **GitHub OAuth docs** — PKCE S256 support confirmed
- **Google OAuth docs** — Native app PKCE recommendation
- **Anthropic prompt engineering guidance** — XML delimiter pattern (well-established pattern from training data; current docs had redirect issue but pattern is standard)

### Tertiary (LOW confidence)
- None — all findings verified with primary or secondary sources

---
**Research completed:** 2026-01-31
**Ready for roadmap:** Yes
**Total estimated effort:** 26-40 hours across 3 phases
**Critical path:** Phase 1 (security fixes) → Phase 2 (patterns + CI) → Phase 3 (polish)
