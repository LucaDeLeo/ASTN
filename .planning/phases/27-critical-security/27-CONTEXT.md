# Phase 27: Critical Security - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Close all exploitable auth gaps, harden OAuth flow, and defend LLM calls. All endpoints require proper authentication, OAuth is protected against CSRF and token theft, and LLM calls have validation infrastructure in place (shadow mode — logging, not blocking — with enforcement deferred to post-pilot). This is pre-BAISH-pilot hardening — no new features, only securing what exists.

</domain>

<decisions>
## Implementation Decisions

### Auth failure UX
- **Backend** returns proper errors: 401 for unauthenticated, 403 for insufficient permissions. No server-side redirects.
- **Client-side** auth error handler catches these and redirects to `/login` with a generic toast ("Sign in to continue")
- Non-admin users hitting admin endpoints: stay on page, toast says "You don't have permission" (distinct from auth failure — user knows they're logged in but not authorized)
- Toast messages are generic ("Sign in to continue"), not contextual per route

### Admin auth scope
All admin-facing operations must require authenticated org admin. Specifically:
- **Opportunity CRUD** (`convex/opportunities.ts`) — `createOpportunity`, `updateOpportunity`, `deleteOpportunity`, `archiveOpportunity` — currently **unprotected**, need auth added
- **Luma config** (`convex/orgs/admin.ts`) — `getLumaConfig`, `updateLumaConfig` — already have admin checks, verify they're solid
- **Member management** (`convex/orgs/admin.ts`) — `removeMember`, `promoteToAdmin`, `demoteToMember`, invite link CRUD — already protected, verify
- **Program management** (`convex/programs.ts`) — CRUD, enrollment, attendance — already protected, verify
- **Engagement overrides** (`convex/engagement/mutations.ts`) — `overrideEngagement`, `clearOverride` — already protected, verify
- **Member data queries** (`convex/orgs/members.ts`) — admin profile/attendance/engagement views — already protected, verify

The critical gap is opportunity CRUD — the other categories need verification, not new implementation.

### LLM validation behavior
- Zod validation starts in **shadow mode**: validation runs on all LLM tool_use responses, failures are logged to Convex system logs (`console.error`), but operations are **not blocked**
- This means "validated outputs" = validation infrastructure is in place and running; enforcement is deferred to post-pilot after reviewing logs
- Review logs after BAISH pilot, then decide on enforcement
- Logging goes to Convex system logs (dashboard-visible), no dedicated table
- Strategy for handling validation failures (retry, degrade, error) per endpoint: Claude's discretion
- XML delimiters for prompt injection defense apply to **all LLM prompt calls** — matching, enrichment, and extraction. Every place user-supplied content enters a prompt gets XML-delimited separation between user content and system instructions.
- Prompt injection defense is invisible to users

### Input length limits
- Character limits exist on profile fields, shown in editor UI — counter appears only when approaching the limit (within ~20% of max), not always visible
- Limits are set high enough that normal users never hit them — these are defensive against prompt injection, not editorial constraints
- Server-side limits are a safety net; if hit, error message is specific but vague: "Content too long to process"
- Both profile fields AND enrichment chat messages have per-message length limits (defense in depth)

### Existing session handling
- Auth hardening deploys transparently — existing authenticated sessions stay valid, no forced re-login
- If a session expires mid-use (e.g. during enrichment conversation): save in-progress state to **client localStorage** before redirect to login, restore after re-auth
- OAuth redirectUri allowlist is hardcoded in code/env vars — changes require a deploy, no admin UI for this
- Luma API key stays in organizations table (it's per-org, not a global key) — the fix is ensuring `getLumaConfig`/`updateLumaConfig` are properly admin-gated, not moving the key to env vars. Admins who set the key can see it.
- Luma key migration from DB to env var is NOT applicable — requirement AUTH-09 is adjusted to "ensure admin-only access to Luma config endpoints"

### Claude's Discretion
- OAuth token handling and PKCE implementation details (storage strategy for web vs Tauri)
- LLM validation failure handling strategy per endpoint (retry vs degrade vs error)
- Exact character limits per field type
- requireAuth helper design and placement

</decisions>

<specifics>
## Specific Ideas

- "Make it clear when editing the field if there's a limit" — limits should be visible in the profile editor, not just enforced server-side
- Luma key is per-org, not global — the codebase review requirement to "move to env vars" doesn't apply. Real fix is admin-gating the endpoints.
- Shadow mode for Zod validation was chosen specifically to avoid surprises during BAISH pilot — enforce later based on data
- Opportunity CRUD in `convex/opportunities.ts` is the biggest auth gap — four mutations with zero auth checks

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 27-critical-security*
*Context gathered: 2026-01-31*
