# Requirements: v1.4 Hardening

**Defined:** 2026-01-31
**Core Value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh

## v1.4 Requirements

Requirements for security hardening, bug fixes, and code quality improvements identified in the comprehensive codebase review.

### Authentication & Authorization

- [ ] **AUTH-01**: Enrichment sendMessage action requires authenticated user who owns the profile
- [ ] **AUTH-02**: Enrichment getMessagesPublic query requires authenticated user who owns the profile
- [ ] **AUTH-03**: Enrichment extractFromConversation action requires authenticated user who owns the profile
- [ ] **AUTH-04**: OAuth exchangeOAuthCode validates redirectUri against an allowlist of permitted origins
- [ ] **AUTH-05**: getCompleteness query requires authentication (or deprecate in favor of getMyCompleteness)
- [ ] **AUTH-06**: Shared requireAuth helper standardizes authentication checks across all endpoints

### OAuth Security

- [ ] **OAUTH-01**: Tauri mobile OAuth flow implements PKCE (S256 code_challenge)
- [ ] **OAUTH-02**: OAuth state parameter is validated on callback (stored in Tauri Store, not memory)
- [ ] **OAUTH-03**: OAuth access tokens are not returned to the client (handled server-side only)
- [ ] **OAUTH-04**: Console.log statements removed from OAuth flow in production

### LLM Safety

- [ ] **LLM-01**: Profile data in LLM prompts is wrapped in XML delimiters separating data from instructions
- [ ] **LLM-02**: Input length limits enforced on profile fields sent to LLM calls
- [ ] **LLM-03**: LLM tool_use responses validated at runtime with Zod schemas (matching, engagement, extraction)
- [ ] **LLM-04**: Zod schemas use permissive mode (.passthrough(), .optional()) to avoid silent match failures

### Bug Fixes

- [ ] **BUG-01**: Growth areas aggregated (not overwritten) across matching batches
- [ ] **BUG-02**: Date conversion uses Date.UTC() instead of new Date() in profiles.ts
- [ ] **BUG-03**: Navigation calls wrapped in useEffect in redirect components (profile, matches, settings)
- [ ] **BUG-04**: Engagement override expiration checked in query handlers (not just daily compute)

### Performance

- [ ] **PERF-01**: N+1 query in programs.ts resolved (batch participant counts)
- [ ] **PERF-02**: N+1 query in attendance/queries.ts resolved (batch event/org lookups)
- [ ] **PERF-03**: N+1 query in emails/send.ts resolved (batch user lookups)
- [ ] **PERF-04**: Rate limiting added between matching batch API calls

### Code Quality

- [ ] **QUAL-01**: CI pipeline via GitHub Actions (lint + typecheck + build on push/PR)
- [ ] **QUAL-02**: Pre-commit hooks via husky + lint-staged (lint + format on commit)
- [ ] **QUAL-03**: Dual lockfile resolved (remove package-lock.json, keep bun.lock)
- [ ] **QUAL-04**: .env.example documenting all required environment variables
- [ ] **QUAL-05**: test-upload.tsx route removed
- [ ] **QUAL-06**: Dead code removed (_STEP_LABELS in ProfileWizard)
- [ ] **QUAL-07**: Browser alert() replaced with toast notification in admin form
- [ ] **QUAL-08**: Error handling standardized (toast for user-facing, structured logging for server-side)
- [ ] **QUAL-09**: Timezone validation uses IANA database check (not just "/" presence)

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

| Feature | Reason |
|---------|--------|
| Tauri-specific fixes (7.1-7.5) | Deferred with mobile native work |
| Tauri mobile native features | Separate milestone |
| Auth middleware migration (customQuery/customMutation everywhere) | v1.5 — adopt for new endpoints, don't rewrite existing |
| Vector search / embeddings | Not needed per project constraints |
| Full prompt injection filtering | XML delimiters + length limits sufficient; content filtering is an anti-feature per research |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| AUTH-06 | TBD | Pending |
| OAUTH-01 | TBD | Pending |
| OAUTH-02 | TBD | Pending |
| OAUTH-03 | TBD | Pending |
| OAUTH-04 | TBD | Pending |
| LLM-01 | TBD | Pending |
| LLM-02 | TBD | Pending |
| LLM-03 | TBD | Pending |
| LLM-04 | TBD | Pending |
| BUG-01 | TBD | Pending |
| BUG-02 | TBD | Pending |
| BUG-03 | TBD | Pending |
| BUG-04 | TBD | Pending |
| PERF-01 | TBD | Pending |
| PERF-02 | TBD | Pending |
| PERF-03 | TBD | Pending |
| PERF-04 | TBD | Pending |
| QUAL-01 | TBD | Pending |
| QUAL-02 | TBD | Pending |
| QUAL-03 | TBD | Pending |
| QUAL-04 | TBD | Pending |
| QUAL-05 | TBD | Pending |
| QUAL-06 | TBD | Pending |
| QUAL-07 | TBD | Pending |
| QUAL-08 | TBD | Pending |
| QUAL-09 | TBD | Pending |
| A11Y-01 | TBD | Pending |
| A11Y-02 | TBD | Pending |
| A11Y-03 | TBD | Pending |
| A11Y-04 | TBD | Pending |
| VIS-01 | TBD | Pending |
| VIS-02 | TBD | Pending |

**Coverage:**
- v1.4 requirements: 37 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 37

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after initial definition*
