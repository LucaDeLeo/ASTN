# Phase 27: Critical Security - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Close all exploitable auth gaps, harden OAuth flow, and defend LLM calls. All endpoints require proper authentication, OAuth is protected against CSRF and token theft, and LLM calls are defended against prompt injection with validated outputs. This is pre-BAISH-pilot hardening — no new features, only securing what exists.

</domain>

<decisions>
## Implementation Decisions

### Auth failure UX
- Unauthenticated users hitting protected pages: redirect to `/login` with a generic toast ("Sign in to continue")
- API-level auth failures (e.g. enrichment endpoints): same behavior — catch auth error, redirect to login with toast
- Non-admin users hitting admin endpoints: stay on page, toast says "You don't have permission" (distinct from auth failure — reveals they're logged in but not authorized)
- Toast messages are generic ("Sign in to continue"), not contextual per route

### LLM validation behavior
- Zod validation starts in **shadow mode**: log failures to Convex system logs (`console.error`) but don't block operations
- Review logs after BAISH pilot, then decide on enforcement
- Logging goes to Convex system logs (dashboard-visible), no dedicated table
- Strategy for handling validation failures (retry, degrade, error) per endpoint: Claude's discretion
- Prompt injection defense (XML delimiters, sanitization): invisible to users

### Input length limits
- Character limits exist on profile fields, shown in editor UI — counter appears only when approaching the limit (within ~20% of max), not always visible
- Limits are set high enough that normal users never hit them — these are defensive against prompt injection, not editorial constraints
- Server-side limits are a safety net; if hit, error message is specific but vague: "Content too long to process"
- Both profile fields AND enrichment chat messages have per-message length limits (defense in depth)

### Existing session handling
- Auth hardening deploys transparently — existing authenticated sessions stay valid, no forced re-login
- If a session expires mid-use (e.g. during enrichment conversation): save in-progress state, redirect to login, restore after re-auth
- OAuth redirectUri allowlist is hardcoded in code/env vars — changes require a deploy, no admin UI for this
- Luma API key stays in organizations table (it's per-org, not a global key) — the fix is ensuring `getLumaConfig`/`updateLumaConfig` are properly admin-gated, not moving the key to env vars. Admins who set the key can see it.
- Luma key migration from DB to env var is NOT applicable — requirement AUTH-09 is adjusted to "ensure admin-only access to Luma config endpoints"

### Claude's Discretion
- LLM validation failure handling strategy per endpoint (retry vs degrade vs error)
- Prompt injection defense visibility (confirmed: invisible to users)
- Exact character limits per field type
- PKCE and OAuth state validation implementation details
- requireAuth helper design and placement

</decisions>

<specifics>
## Specific Ideas

- "Make it clear when editing the field if there's a limit" — limits should be visible in the profile editor, not just enforced server-side
- Luma key is per-org, not global — the codebase review requirement to "move to env vars" doesn't apply. Real fix is admin-gating the endpoints.
- Shadow mode for Zod validation was chosen specifically to avoid surprises during BAISH pilot — enforce later based on data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 27-critical-security*
*Context gathered: 2026-01-31*
