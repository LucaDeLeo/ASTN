# Requirements: v1.4 Hardening

**Defined:** 2026-01-31
**Core Value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh

## v1.4 Requirements

Requirements for security hardening, bug fixes, and code quality improvements identified in the comprehensive codebase review.

### Authentication & Authorization

- [x] **AUTH-01**: Enrichment sendMessage action requires authenticated user who owns the profile
- [x] **AUTH-02**: Enrichment getMessagesPublic query requires authenticated user who owns the profile
- [x] **AUTH-03**: Enrichment extractFromConversation action requires authenticated user who owns the profile
- [x] **AUTH-04**: OAuth exchangeOAuthCode validates redirectUri against an allowlist of permitted origins
- [x] **AUTH-05**: getCompleteness query requires authentication (or deprecate in favor of getMyCompleteness)
- [x] **AUTH-06**: Shared requireAuth helper standardizes authentication checks across all endpoints

### OAuth Security

- [x] **OAUTH-01**: Tauri mobile OAuth flow implements PKCE (S256 code_challenge)
- [x] **OAUTH-02**: OAuth state parameter is validated on callback (stored in Tauri Store, not memory)
- [~] **OAUTH-03**: OAuth access tokens are not returned to the client (handled server-side only) -- _deferred to post-pilot per CONTEXT.md_
- [x] **OAUTH-04**: Console.log statements removed from OAuth flow in production

### LLM Safety

- [x] **LLM-01**: Profile data in LLM prompts is wrapped in XML delimiters separating data from instructions
- [x] **LLM-02**: Input length limits enforced on profile fields sent to LLM calls
- [x] **LLM-03**: LLM tool_use responses validated at runtime with Zod schemas (matching, engagement, extraction)
- [x] **LLM-04**: Zod schemas use permissive mode (.passthrough(), .optional()) to avoid silent match failures

### Bug Fixes

- [x] **BUG-01**: Growth areas aggregated (not overwritten) across matching batches
- [x] **BUG-02**: Date conversion uses Date.UTC() instead of new Date() in profiles.ts
- [x] **BUG-03**: Navigation calls wrapped in useEffect in redirect components (profile, matches, settings)
- [x] **BUG-04**: Engagement override expiration checked in query handlers (not just daily compute)

### Performance

- [ ] **PERF-01**: N+1 query in programs.ts resolved (batch participant counts)
- [ ] **PERF-02**: N+1 query in attendance/queries.ts resolved (batch event/org lookups)
- [ ] **PERF-03**: N+1 query in emails/send.ts resolved (batch user lookups)
- [ ] **PERF-04**: Rate limiting added between matching batch API calls

### Code Quality

- [x] **QUAL-01**: CI pipeline via GitHub Actions (lint + typecheck + build on push/PR)
- [x] **QUAL-02**: Pre-commit hooks via husky + lint-staged (lint + format on commit)
- [x] **QUAL-03**: Dual lockfile resolved (remove package-lock.json, keep bun.lock)
- [x] **QUAL-04**: .env.example documenting all required environment variables
- [x] **QUAL-05**: test-upload.tsx route removed
- [x] **QUAL-06**: Dead code removed (\_STEP_LABELS in ProfileWizard)
- [x] **QUAL-07**: Browser alert() replaced with toast notification in admin form
- [x] **QUAL-08**: Error handling standardized (toast for user-facing, structured logging for server-side)
- [x] **QUAL-09**: Timezone validation uses IANA database check (not just "/" presence)

### Accessibility

- [ ] **A11Y-01**: Interactive org div converted to button with keyboard support and ARIA role
- [ ] **A11Y-02**: Form validation errors linked to inputs via aria-describedby
- [ ] **A11Y-03**: Client-side password validation with inline feedback before submission
- [ ] **A11Y-04**: Drag state indication uses icon/text in addition to color

### Visual Polish

- [ ] **VIS-01**: GradientBg applied to settings, attendance, and org admin pages
- [ ] **VIS-02**: 35+ headings updated from font-bold to font-display

## v1.5+ Requirements

Deferred to future releases.

### Extended Hardening

- **QUAL-10**: Rate limiting on public-facing endpoints (convex-helpers rateLimit)
- **QUAL-11**: Row-level security via convex-helpers for sensitive tables
- **QUAL-12**: Anthropic client reuse within batch loops (engagement compute)
- **QUAL-13**: Full profile context caching for enrichment chat (avoid resending per message)

## Out of Scope

| Feature                                                           | Reason                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Tauri-specific fixes (7.1-7.5)                                    | Deferred with mobile native work                                                             |
| Tauri mobile native features                                      | Separate milestone                                                                           |
| Auth middleware migration (customQuery/customMutation everywhere) | v1.5 -- adopt for new endpoints, don't rewrite existing                                      |
| Vector search / embeddings                                        | Not needed per project constraints                                                           |
| Full prompt injection filtering                                   | XML delimiters + length limits sufficient; content filtering is an anti-feature per research |

## Traceability

| Requirement | Phase    | Status                |
| ----------- | -------- | --------------------- |
| AUTH-01     | Phase 27 | Complete              |
| AUTH-02     | Phase 27 | Complete              |
| AUTH-03     | Phase 27 | Complete              |
| AUTH-04     | Phase 27 | Complete              |
| AUTH-05     | Phase 27 | Complete              |
| AUTH-06     | Phase 27 | Complete              |
| OAUTH-01    | Phase 27 | Complete              |
| OAUTH-02    | Phase 27 | Complete              |
| OAUTH-03    | Phase 27 | Deferred (post-pilot) |
| OAUTH-04    | Phase 27 | Complete              |
| LLM-01      | Phase 27 | Complete              |
| LLM-02      | Phase 27 | Complete              |
| LLM-03      | Phase 27 | Complete              |
| LLM-04      | Phase 27 | Complete              |
| BUG-01      | Phase 28 | Complete              |
| BUG-02      | Phase 28 | Complete              |
| BUG-03      | Phase 28 | Complete              |
| BUG-04      | Phase 28 | Complete              |
| QUAL-01     | Phase 28 | Complete              |
| QUAL-02     | Phase 28 | Complete              |
| QUAL-03     | Phase 28 | Complete              |
| QUAL-04     | Phase 28 | Complete              |
| QUAL-05     | Phase 28 | Complete              |
| QUAL-06     | Phase 28 | Complete              |
| QUAL-07     | Phase 28 | Complete              |
| QUAL-08     | Phase 28 | Complete              |
| QUAL-09     | Phase 28 | Complete              |
| PERF-01     | Phase 29 | Pending               |
| PERF-02     | Phase 29 | Pending               |
| PERF-03     | Phase 29 | Pending               |
| PERF-04     | Phase 29 | Pending               |
| A11Y-01     | Phase 29 | Pending               |
| A11Y-02     | Phase 29 | Pending               |
| A11Y-03     | Phase 29 | Pending               |
| A11Y-04     | Phase 29 | Pending               |
| VIS-01      | Phase 29 | Pending               |
| VIS-02      | Phase 29 | Pending               |

**Coverage:**

- v1.4 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---

_Requirements defined: 2026-01-31_
_Last updated: 2026-02-02 -- Phase 28 requirements marked Complete (13/13 BUG + QUAL)_
