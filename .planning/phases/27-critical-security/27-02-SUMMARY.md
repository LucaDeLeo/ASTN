---
phase: 27-critical-security
plan: 02
subsystem: auth
tags: [oauth, pkce, csrf, tauri, security, deep-link, redirect-uri]

# Dependency graph
requires:
  - phase: none
    provides: existing OAuth code exchange flow in authTauri.ts and tauri/auth.ts
provides:
  - redirectUri allowlist on server-side OAuth code exchange
  - PKCE S256 code_challenge in Tauri OAuth authorization URLs
  - Persistent PKCE storage via Tauri Store (survives app kill)
  - OAuth state parameter validation on callback (CSRF defense)
  - codeVerifier forwarded to GitHub/Google token exchange
  - Console.log cleanup across OAuth flow files
affects:
  - 27-03 (remaining security hardening)
  - future mobile OAuth testing

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PKCE S256 via Web Crypto API (no external deps)"
    - "Tauri Store persistence for OAuth state (replaces module-level variables)"
    - "redirectUri allowlist on server-side with env var extension"
    - "5-minute TTL on stored PKCE data"

key-files:
  created: []
  modified:
    - convex/authTauri.ts
    - src/lib/tauri/auth.ts
    - src/components/auth/oauth-buttons.tsx
    - src/router.tsx

key-decisions:
  - "PKCE uses Web Crypto API (no new deps) for code_verifier generation and SHA-256 hashing"
  - "Tauri Store replaces module-level variables for PKCE data persistence (survives app kill)"
  - "5-minute TTL on stored PKCE data to prevent stale state"
  - "Token exposure flagged as TODO for post-pilot (not changed in Phase 27 per CONTEXT.md)"
  - "Web OAuth flow (non-Tauri) left unchanged -- @convex-dev/auth handles its own flow"

patterns-established:
  - "storePKCEData/getPKCEData/clearPKCEData: persistent OAuth state via Tauri Store"
  - "generateCodeVerifier/generateCodeChallenge: PKCE S256 helpers using Web Crypto"
  - "ALLOWED_REDIRECT_URIS: server-side allowlist for redirect URI validation"

# Metrics
duration: 10min
completed: 2026-02-02
---

# Phase 27 Plan 02: OAuth Hardening Summary

**PKCE S256 with Tauri Store persistence, redirectUri allowlist, state validation, and console.log cleanup across server and client OAuth flow**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-02T21:34:46Z
- **Completed:** 2026-02-02T21:44:13Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added ALLOWED_REDIRECT_URIS server-side allowlist blocking open redirect attacks
- Added PKCE S256 support (code_challenge in auth URLs, code_verifier in token exchange)
- Replaced fragile module-level pendingOAuthProvider with persistent Tauri Store
- Added OAuth state parameter validation on deep-link callback (CSRF defense)
- Removed all console.log statements from OAuth flow files (oauth-buttons, auth, router)
- Wired codeVerifier through entire flow: oauth-buttons -> Tauri Store -> deep-link callback -> router.tsx -> exchangeOAuthCode -> GitHub/Google token endpoints
- Web OAuth flow (non-Tauri) remains completely unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add redirectUri allowlist and PKCE support to server-side OAuth exchange** - `7769e7f` (feat)
2. **Task 2: Add PKCE generation, Tauri Store persistence, state validation, and console.log cleanup** - `5a32e4d` (feat -- bundled with 27-01 docs commit due to concurrent execution)

**Note:** Task 2 changes were inadvertently included in the 27-01 plan's docs commit (5a32e4d) which ran concurrently. The changes are correct and verified -- they just landed in a different commit than expected.

## Files Created/Modified

- `convex/authTauri.ts` - ALLOWED_REDIRECT_URIS allowlist, codeVerifier optional arg, code_verifier in GitHub/Google POST bodies, TODO for post-pilot token exposure fix
- `src/lib/tauri/auth.ts` - PKCE helpers (generateCodeVerifier, generateCodeChallenge, base64UrlEncode), Tauri Store persistence (storePKCEData, getPKCEData, clearPKCEData with 5min TTL), async handleDeepLinkUrl with state validation, removed pendingOAuthProvider/setPendingOAuthProvider/determineProvider, removed console.log statements
- `src/components/auth/oauth-buttons.tsx` - Replaced setPendingOAuthProvider with PKCE generation + storePKCEData, added code_challenge and code_challenge_method=S256 to both Google and GitHub auth URLs, removed all console.log statements
- `src/router.tsx` - Updated deep-link callback to receive and pass codeVerifier from PKCE store, removed console.log statements

## Decisions Made

- **Web Crypto API for PKCE:** No new dependencies needed -- crypto.getRandomValues and crypto.subtle.digest are available in both browser and Tauri WebView
- **Tauri Store over module variables:** Module-level variables (pendingOAuthProvider) are lost when iOS/Android kills the app. Tauri Store persists to disk and survives cold starts
- **5-minute TTL:** Prevents stale PKCE data from interfering with future OAuth flows if the user abandons the flow
- **Token exposure deferred:** Per CONTEXT.md, the current pattern of returning accessToken/idToken to the client is flagged as a TODO for post-pilot fix, not changed in Phase 27
- **redirectUri allowlist with env var:** Hardcoded list plus optional AUTH_REDIRECT_URI_WEB env var allows web callback without hardcoding the domain

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 2 client-side changes were inadvertently committed as part of the 27-01 plan's docs commit (5a32e4d) which executed concurrently. The code is correct and all verification checks pass -- the changes just ended up in a neighboring commit rather than a dedicated 27-02 commit. This is a process issue, not a code issue.

## User Setup Required

None - no external service configuration required. The AUTH_REDIRECT_URI_WEB env var is optional (for web OAuth callback URL flexibility).

## Next Phase Readiness

- OAuth flow fully hardened with PKCE, state validation, and redirectUri allowlist
- All console.log statements removed from OAuth security-sensitive code paths
- PKCE storage is persistent and survives mobile app kill (Tauri Store)
- Ready for plan 27-03 (LLM output validation and prompt injection defense)

---
*Phase: 27-critical-security*
*Completed: 2026-02-02*
