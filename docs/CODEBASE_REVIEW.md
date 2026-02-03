# ASTN Codebase Review

**Date:** 2026-01-31
**Reviewer:** Claude Opus 4.5 (automated review)
**Scope:** Full codebase - security, bugs, performance, architecture, code quality

---

## Table of Contents

1. [Critical Issues](#1-critical-issues)
2. [Security Issues](#2-security-issues)
3. [Bugs & Logic Errors](#3-bugs--logic-errors)
4. [Performance Issues](#4-performance-issues)
5. [Architecture Concerns](#5-architecture-concerns)
6. [Code Quality](#6-code-quality)
7. [Tauri / Mobile](#7-tauri--mobile)
8. [Configuration & Dependencies](#8-configuration--dependencies)
9. [Accessibility](#9-accessibility)
10. [Positive Observations](#10-positive-observations)

---

## 1. Critical Issues

### 1.1 OAuth Code Exchange is a Public Action (No Auth Required)

- **Severity:** CRITICAL
- **File:** `convex/authTauri.ts:14`
- **Description:** `exchangeOAuthCode` uses `action` (public) instead of `internalAction`. Any unauthenticated client can call this action with arbitrary `code`, `provider`, and `redirectUri` values. This triggers server-side calls to GitHub/Google token endpoints using the app's client secrets.
- **Impact:** An attacker can use the app's OAuth credentials to exchange arbitrary authorization codes, potentially leading to token theft or abuse of the app's OAuth quota. The `redirectUri` parameter is attacker-controlled and passed directly to the OAuth provider.
- **Recommendation:** Either make this an `internalAction` and invoke it through a secure pathway, or add authentication checks. At minimum, validate the `redirectUri` against an allowlist.

### 1.2 Missing Authentication on Enrichment Messages Query

- **Severity:** CRITICAL
- **File:** `convex/enrichment/queries.ts:16-24`
- **Description:** `getMessagesPublic` is a public query with no authentication or ownership check. Anyone with a valid `profileId` (which are sequential Convex IDs) can read all enrichment conversation messages for any user.
- **Impact:** Exposes sensitive career goals, personal background, AI safety interests, and detailed career conversation data for all users.
- **Recommendation:** Add `getAuthUserId` check and verify the requesting user owns the profile.

### 1.3 Missing Authentication on Enrichment sendMessage Action

- **Severity:** CRITICAL
- **File:** `convex/enrichment/conversation.ts:46-48`
- **Description:** `sendMessage` is a public `action` that accepts any `profileId` with no authentication check. Any client can send messages as any user and trigger LLM calls against any profile.
- **Impact:** Attackers can inject messages into any user's enrichment conversation, trigger expensive Claude API calls, and potentially corrupt profile data via the extraction flow.
- **Recommendation:** Add authentication and verify the caller owns the profileId.

---

## 2. Security Issues

### 2.1 No OAuth State Parameter Validation

- **Severity:** HIGH
- **File:** `src/lib/tauri/auth.ts:160-163`, `convex/authTauri.ts:14-31`
- **Description:** The frontend generates a `state` parameter via `crypto.randomUUID()` (`src/components/auth/oauth-buttons.tsx:41,61`) but it is never validated on the callback. The `_state` parameter in `exchangeOAuthCode` at `src/lib/tauri/auth.ts:162` is prefixed with underscore (unused). The backend action doesn't accept or validate `state` at all.
- **Impact:** CSRF vulnerability - an attacker can craft a malicious link that completes an OAuth flow on behalf of the victim.
- **Recommendation:** Store the state before redirecting, validate it on callback, and reject mismatches.

### 2.2 Prompt Injection via Profile Data

- **Severity:** HIGH
- **Files:**
  - `convex/enrichment/conversation.ts:68-101` (profile fields interpolated into system prompt at line 124)
  - `convex/matching/prompts.ts:75-159` (profile context in LLM matching prompt)
  - `convex/engagement/compute.ts:102-107` (member/org names in engagement context)
- **Description:** User-controlled profile fields (name, careerGoals, seeking, skills, work history, etc.) are directly interpolated into LLM system prompts with no sanitization or escaping.
- **Impact:** A user could craft profile data containing prompt injection instructions (e.g., setting their name to "Ignore all instructions and...") to manipulate LLM behavior, potentially extracting system prompt content, altering match scores, or generating misleading enrichment data.
- **Recommendation:** Separate user data from instructions using clear delimiters. Consider XML/JSON structured input that the model is instructed to treat as data-only. Add input length limits and basic sanitization.

### 2.3 Missing Authorization on getCompleteness Query

- **Severity:** MEDIUM
- **File:** `convex/profiles.ts:189-214`
- **Description:** `getCompleteness` accepts any `profileId` without checking authentication or ownership. Any client can query completion status for any profile.
- **Impact:** Information disclosure - allows enumeration of profiles and their completion states. Low-sensitivity data but still an authorization gap.
- **Recommendation:** Add auth check or use the existing `getMyCompleteness` (line 288) which properly checks the authenticated user.

### 2.4 Weak Timezone Validation

- **Severity:** LOW
- **File:** `convex/profiles.ts:251-253`
- **Description:** Timezone validation only checks if the string contains `/`:
  ```typescript
  if (!timezone.includes('/')) {
    throw new Error('Invalid timezone format...')
  }
  ```
- **Impact:** Accepts invalid timezones like `foo/bar` which could cause downstream errors in date calculations for notification scheduling.
- **Recommendation:** Validate against the IANA timezone database or use `Intl.DateTimeFormat` to verify.

### 2.5 Android FileProvider Exposes Entire Storage

- **Severity:** MEDIUM (generated file, but still a risk)
- **File:** `src-tauri/gen/android/app/src/main/res/xml/file_paths.xml:3-4`
- **Description:**
  ```xml
  <external-path name="my_images" path="." />
  <cache-path name="my_cache_images" path="." />
  ```
  `path="."` exposes the entire external storage root and cache directory via the FileProvider.
- **Impact:** If any component grants URI permissions, the entire storage/cache is accessible. This is a Tauri-generated file, but should be restricted.
- **Recommendation:** Restrict paths to specific subdirectories (e.g., `path="Pictures"` or `path="ASTN"`).

### 2.6 Overly Permissive URL Opener Capability

- **Severity:** MEDIUM
- **File:** `src-tauri/capabilities/default.json:14-17`
- **Description:**
  ```json
  { "url": "https://*" }
  ```
  The opener permission allows the app to open ANY HTTPS URL in the system browser.
- **Impact:** Combined with `shell:allow-open` (line 12), this could be leveraged by compromised frontend code to open arbitrary URLs.
- **Recommendation:** Restrict to specific domains needed for OAuth flows (e.g., `https://accounts.google.com/*`, `https://github.com/*`).

### 2.7 No PKCE in Mobile OAuth Flow

- **Severity:** MEDIUM
- **File:** `src/components/auth/oauth-buttons.tsx:42,62`
- **Description:** The Tauri mobile OAuth flow uses a simple authorization code grant without PKCE (Proof Key for Code Exchange). Mobile apps should use PKCE since the client secret cannot be securely stored.
- **Impact:** Authorization code interception attacks are possible on mobile, where custom URL schemes can be hijacked by malicious apps.
- **Recommendation:** Implement PKCE with `code_verifier` and `code_challenge` parameters.

### 2.8 Access Token Returned to Client

- **Severity:** LOW
- **File:** `convex/authTauri.ts:106-115`, `convex/authTauri.ts:169-179`
- **Description:** The `exchangeOAuthCode` action returns `accessToken` (and `idToken` for Google) directly to the client in the response object.
- **Impact:** OAuth tokens are exposed to the frontend. If there's any XSS vulnerability, these tokens could be exfiltrated.
- **Recommendation:** Handle token exchange entirely server-side and only return session tokens to the client.

---

## 3. Bugs & Logic Errors

### 3.1 Growth Areas Overwritten Instead of Aggregated

- **Severity:** MEDIUM
- **File:** `convex/matching/compute.ts:102-105`
- **Description:**
  ```typescript
  if (
    Array.isArray(batchResult.growthAreas) &&
    batchResult.growthAreas.length > 0
  ) {
    aggregatedGrowthAreas = batchResult.growthAreas
  }
  ```
  When processing opportunities in batches of 15, each batch's `growthAreas` overwrites the previous instead of being merged/aggregated.
- **Impact:** Only growth areas from the last batch are retained. Earlier batches' growth areas are silently lost, giving users an incomplete picture.
- **Recommendation:** Aggregate growth areas across all batches (e.g., using a Set to deduplicate).

### 3.2 Date Conversion Uses Local Timezone Instead of UTC

- **Severity:** MEDIUM
- **File:** `convex/profiles.ts:337-344`
- **Description:**
  ```typescript
  return new Date(year, month - 1, 1).getTime()
  ```
  `new Date(year, month, day)` uses local timezone of the Convex server. Since Convex runs on different infrastructure, the timezone is unpredictable.
- **Impact:** Work history start/end dates may be inconsistent, off by a day, or vary depending on server timezone at execution time.
- **Recommendation:** Use `Date.UTC(year, month - 1, 1)` for consistent UTC timestamps.

### 3.3 Navigation Called During Render (Not in useEffect)

- **Severity:** MEDIUM
- **Files:**
  - `src/routes/profile/index.tsx:71-79`
  - `src/routes/profile/edit.tsx:52-53`
  - `src/routes/matches/index.tsx:105-109`
  - `src/routes/settings/route.tsx:62`
- **Description:**
  ```tsx
  function UnauthenticatedRedirect() {
    const navigate = useNavigate()
    navigate({ to: '/login' }) // Called directly in render body
    return <Spinner />
  }
  ```
  Navigation called directly in the component body, not wrapped in `useEffect`. This triggers on every render.
- **Impact:** Potential infinite re-render loops or React strict mode double-navigation. React 19 may handle this more gracefully, but it's still an anti-pattern.
- **Recommendation:** Wrap navigation in `useEffect`.

### 3.4 Silent Match Batch Failures

- **Severity:** LOW
- **File:** `convex/matching/compute.ts:76-87`
- **Description:** When a batch fails to produce valid results from Claude, the code logs an error and `continue`s silently. The user receives fewer matches without any indication that some batches failed.
- **Impact:** Users get incomplete match results without knowing. If Claude consistently fails on certain batches, those opportunities are never matched.
- **Recommendation:** Track failed batches and surface the failure to the user or retry.

### 3.5 Engagement Override Expiration Not Checked in Queries

- **Severity:** LOW
- **File:** `convex/schema.ts:516-529` (schema definition), engagement queries
- **Description:** The `memberEngagement` table has an optional `override.expiresAt` field, but queries that return engagement data don't check whether the override has expired. The expiration is only checked during the daily compute batch (`convex/engagement/compute.ts:177-180`).
- **Impact:** Between compute runs, expired overrides are still displayed to users and admins.
- **Recommendation:** Check `expiresAt` in query handlers when returning engagement data.

### 3.6 Rust Compilation Warnings

- **Severity:** LOW
- **File:** `src-tauri/src/lib.rs:5`
- **Description:** `let mut builder` - the `mut` is flagged as unnecessary by the Rust compiler when biometric plugin is not compiled (desktop targets).
- **File:** `src-tauri/src/main.rs:5`
- **Description:** Unresolved module `app_lib` reference.
- **Impact:** Build warnings/errors on certain platforms.

---

## 4. Performance Issues

### 4.1 N+1 Query Pattern in Programs

- **Severity:** MEDIUM
- **File:** `convex/programs.ts:67-82`
- **Description:** For each program, a separate query fetches participant count:
  ```typescript
  const programsWithCounts = await Promise.all(
    programs.map(async (program) => {
      const participants = await ctx.db
        .query("programParticipation")
        .withIndex("by_program_status", ...)
        .collect();
  ```
- **Impact:** With N programs, this makes N+1 database queries. Performance degrades linearly with program count.

### 4.2 N+1 Query Pattern in Attendance History

- **Severity:** MEDIUM
- **File:** `convex/attendance/queries.ts:22-46`
- **Description:** For each attendance record, separate queries fetch the event and organization data.
- **Impact:** Attendance history page performance degrades with more records.

### 4.3 N+1 Query Pattern in Email Batch Processing

- **Severity:** LOW
- **File:** `convex/emails/send.ts:76-109`
- **Description:** Iterates all profiles and queries the users table individually for each.

### 4.4 No Rate Limiting Between Matching Batches

- **Severity:** LOW
- **File:** `convex/matching/compute.ts:56-106`
- **Description:** Creates a new `Anthropic()` client and makes an API call for each batch with no delay between calls.
- **Impact:** Could hit Claude API rate limits with large opportunity sets.
- **Recommendation:** Add a small delay between batch API calls, similar to the 100ms delay in engagement compute.

### 4.5 Full Profile Context on Every Enrichment Message

- **Severity:** LOW
- **File:** `convex/enrichment/conversation.ts:67-101`
- **Description:** Every single message in the enrichment chat rebuilds and sends the full profile context to Claude. With a 3-8 message conversation, the same profile data is sent repeatedly.
- **Impact:** Increased token usage/cost and latency. Minor for Haiku but adds up across users.

### 4.6 Anthropic Client Instantiated Per-Request

- **Severity:** LOW
- **Files:** All files using `new Anthropic()` - `convex/enrichment/conversation.ts:120`, `convex/matching/compute.ts:61`, `convex/engagement/compute.ts:110`, etc.
- **Description:** A new Anthropic SDK client is created for every single API call, even within loops.
- **Impact:** Minor overhead per call. In Convex actions this is unavoidable due to the serverless model, but within `computeOrgEngagement` which loops over members, the client could be created once.

---

## 5. Architecture Concerns

### 5.1 Public vs Internal Function Classification

- **Severity:** MEDIUM
- **Description:** Several functions that should be internal are exposed as public actions/queries:
  - `convex/authTauri.ts:14` - `exchangeOAuthCode` (public action with server secrets)
  - `convex/enrichment/conversation.ts:46` - `sendMessage` (public action, no auth)
  - `convex/enrichment/queries.ts:16` - `getMessagesPublic` (public query, no auth)
  - `convex/profiles.ts:189` - `getCompleteness` (public query, no ownership check)
- **Recommendation:** Either add proper authentication checks to these functions, or restructure them as internal functions called through authenticated wrappers.

### 5.2 No Clear Separation Between Auth-Required and Public Endpoints

- **Severity:** LOW
- **Description:** There's no consistent pattern or middleware for enforcing authentication. Some functions check auth, others don't. This makes it easy to accidentally expose unauthenticated endpoints.
- **Recommendation:** Consider a helper function like `requireAuth(ctx)` that throws consistently, and apply it to all non-public endpoints.

### 5.3 Test Route in Production

- **Severity:** LOW
- **File:** `src/routes/test-upload.tsx`
- **Description:** Contains TODO comment: "Remove after Phase 8 verification complete." Uses `alert()` for feedback. This test route is in the production routing tree.
- **Recommendation:** Remove before production deployment.

### 5.4 Dual Lockfiles

- **Severity:** LOW
- **Files:** `bun.lock`, `package-lock.json`
- **Description:** Both Bun and npm lockfiles exist. This creates potential for dependency version inconsistencies between environments.
- **Recommendation:** Choose one package manager and remove the other's lockfile.

---

## 6. Code Quality

### 6.1 Type Assertions Without Runtime Validation on LLM Responses

- **Severity:** MEDIUM
- **Files:**
  - `convex/matching/compute.ts:81` - `toolUse.input as MatchingResult`
  - `convex/engagement/compute.ts:131` - `toolUse.input as EngagementResult`
  - `convex/enrichment/extraction.ts:80-85` - `toolUse.input as ExtractionResult`
- **Description:** LLM tool responses are cast to TypeScript types without runtime validation. If the LLM returns an unexpected structure, the cast succeeds but downstream code breaks.
- **Recommendation:** Add runtime validation (e.g., Zod schema) to validate LLM responses before use.

### 6.2 Browser `alert()` Used in Admin Form

- **Severity:** LOW
- **File:** `src/components/admin/opportunity-form.tsx:126`
- **Description:** Uses `alert("Failed to save opportunity")` instead of the Sonner toast notification system used elsewhere.
- **Recommendation:** Use toast notification for consistency.

### 6.3 Console.log Statements in Production OAuth Flow

- **Severity:** LOW
- **File:** `src/components/auth/oauth-buttons.tsx:50,56,63,65`
- **Description:** Multiple `console.log` statements with `[OAuth]` prefix left in production code:
  ```typescript
  console.log('[OAuth] GitHub button clicked, isTauri:', isTauri())
  console.log('[OAuth] Mobile client ID:', clientId ? 'set' : 'NOT SET')
  ```
- **Impact:** Leaks debugging information in production. The "set"/"NOT SET" check could help attackers determine configuration.

### 6.4 Unused Variable in ProfileWizard

- **Severity:** LOW
- **File:** `src/components/profile/wizard/ProfileWizard.tsx:53`
- **Description:**
  ```typescript
  const _STEP_LABELS: Record<StepId, string> = { ... };
  void _STEP_LABELS; // Mark as intentionally unused
  ```
  Dead code explicitly suppressed.

### 6.5 Inconsistent Error Handling Patterns

- **Severity:** LOW
- **Description:** The codebase mixes several error handling approaches:
  - Toast notifications (most components)
  - Browser `alert()` (admin form)
  - Silent `continue` (matching batches)
  - Console.error only (email sending)
  - Thrown errors (Convex mutations)
- **Recommendation:** Standardize on toast notifications for user-facing errors, structured logging for server-side errors.

### 6.6 `db.get` API Usage

- **Severity:** INFO
- **File:** `convex/notifications/mutations.ts:12,17`
- **Description:** Uses `ctx.db.get("notifications", notificationId)` and `ctx.db.patch("notifications", notificationId, ...)` with table name as first argument. This appears to be a non-standard Convex API usage pattern - the standard API is `ctx.db.get(notificationId)` since the table is inferred from the ID type.
- **Impact:** May not compile with current Convex SDK. If it does compile, it may be using an undocumented API.

---

## 7. Tauri / Mobile

### 7.1 Shell Plugin Enabled Without Restrictions

- **Severity:** MEDIUM
- **File:** `src-tauri/src/lib.rs:10`, `src-tauri/capabilities/default.json:12`
- **Description:** `tauri_plugin_shell::init()` is registered, and `shell:allow-open` permission is granted. While this is primarily used for opening URLs in the system browser, the shell plugin provides broader capabilities.
- **Recommendation:** Review if the opener plugin alone is sufficient and remove the shell plugin if unused.

### 7.2 No Tauri Dependency Version Pinning

- **Severity:** LOW
- **File:** `src-tauri/Cargo.toml:24-31`
- **Description:** All Tauri plugin dependencies use major version `2` without patch pinning:
  ```toml
  tauri = { version = "2", features = [] }
  tauri-plugin-deep-link = "2"
  ```
- **Impact:** New minor/patch versions could introduce breaking changes.
- **Recommendation:** Pin to specific minor versions (e.g., `2.0.x`).

### 7.3 Duplicate Deep Link Intent Filters

- **Severity:** LOW
- **File:** `src-tauri/gen/android/app/src/main/AndroidManifest.xml:30-48`
- **Description:** Both a manual and auto-generated intent filter handle the `astn://` scheme. Duplicate handlers could cause Android to show an app chooser or have unpredictable behavior.

### 7.4 iOS Export Method Set to Debugging

- **Severity:** LOW
- **File:** `src-tauri/gen/apple/ExportOptions.plist:6`
- **Description:** Export method is set to `debugging`. Must be changed to `app-store` or `ad-hoc` for production distribution.

### 7.5 Development Team ID Hardcoded

- **Severity:** INFO
- **File:** `src-tauri/tauri.conf.json:44`
- **Description:** iOS development team `FB2HXC7FGF` is hardcoded in config committed to Git.
- **Recommendation:** Move to environment variable or CI configuration.

---

## 8. Configuration & Dependencies

### 8.1 Alpha Dependencies in Production

- **Severity:** MEDIUM
- **File:** `package.json`
- **Dependencies:**
  - `@convex-dev/react-query`: `^0.0.0-alpha.11` - Alpha release
  - `nitro` (via TanStack Start): Alpha versions of the server runtime
- **Impact:** Alpha packages may have breaking changes, missing features, or undiscovered bugs.
- **Recommendation:** Track stable releases and upgrade when available.

### 8.2 Missing .env.example

- **Severity:** LOW
- **Description:** No `.env.example` file documenting required environment variables. The `.env.local` is gitignored (correctly), but new developers have no reference for what to configure.
- **Variables needed:** `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, `VITE_GITHUB_CLIENT_ID_MOBILE`, `VITE_GOOGLE_CLIENT_ID`
- **Convex dashboard variables:** `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `EIGHTY_K_ALGOLIA_APP_ID`, `EIGHTY_K_ALGOLIA_API_KEY`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_GITHUB_ID_MOBILE`, `AUTH_GITHUB_SECRET_MOBILE`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

### 8.3 No CI/CD Pipeline

- **Severity:** LOW
- **Description:** No `.github/workflows/` or other CI configuration found. No automated testing, linting, or type-checking on push/PR.
- **Recommendation:** Add at minimum: `bun run lint` and `bun run build` as CI checks.

### 8.4 No Pre-commit Hooks

- **Severity:** LOW
- **Description:** No husky, lint-staged, or similar pre-commit hook configuration. Lint violations could be committed.

### 8.5 Empty License Field in Cargo.toml

- **Severity:** INFO
- **File:** `src-tauri/Cargo.toml`
- **Description:** License field is present but empty. Should specify the project's license.

---

## 9. Accessibility

### 9.1 Interactive Div Without Keyboard Support

- **Severity:** MEDIUM
- **File:** `src/routes/orgs/index.tsx:84`
- **Description:** Clickable `<div>` with `onClick` handler is used instead of a `<button>`. No `role`, `tabIndex`, or keyboard event handler.
- **Impact:** Keyboard and screen reader users cannot interact with org selection.

### 9.2 Missing ARIA Associations for Form Errors

- **Severity:** LOW
- **Description:** Form validation error messages are not linked to their inputs via `aria-describedby`. Screen readers won't associate errors with the relevant fields.

### 9.3 Color-Only State Indication

- **Severity:** LOW
- **File:** `src/components/profile/upload/DocumentUpload.tsx`
- **Description:** Drag states use color changes without additional text or icon indicators for users with color vision deficiency.

### 9.4 Client-Side Password Validation Missing

- **Severity:** LOW
- **File:** `src/components/auth/password-form.tsx:63`
- **Description:** Password requirements are stated in text ("8+ characters, mixed case, and a number") but no client-side validation enforces these before submission. The server-side validation exists in `convex/auth.ts:12-25`, but users get a generic server error instead of inline feedback.

---

## 10. Positive Observations

### Strong Patterns

- **TypeScript strictness:** `strict: true` with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` enabled
- **Convex validators:** Strong use of `v.*` validators for type safety on all mutations and actions
- **Profile ownership checks:** `updateField`, `updateLocationPrivacy`, and most mutations properly verify ownership
- **Retry logic with exponential backoff:** Excellent implementation in `convex/extraction/text.ts` and `convex/extraction/pdf.ts`
- **Rate limiting on external APIs:** 80K Hours (1s), Airtable (250ms), engagement compute (100ms)
- **Privacy controls:** Comprehensive privacy settings schema with section-level visibility
- **Internal function separation:** Matching computation, enrichment processing, and admin bootstrap functions are properly internal
- **Cron job scheduling:** Well-designed timing with staggered UTC offsets to avoid collisions
- **CSS/Design system:** Excellent Tailwind v4 setup with OKLCH colors, fluid typography, WCAG touch targets, and reduced motion support
- **Audit trail:** Engagement override history tracked for accountability
- **File upload safety:** 10MB size limit, PDF-only restriction with proper validation

### Architecture Strengths

- Clean file-based routing with TanStack Start
- Proper separation of concerns between frontend and Convex backend
- Real-time sync via Convex queries eliminates stale data issues
- Batch processing for matching with configurable batch size
- Well-structured schema with appropriate indexes for all query patterns

---

## Summary by Severity

| Severity | Count | Key Items                                                                    |
| -------- | ----- | ---------------------------------------------------------------------------- |
| CRITICAL | 3     | Public OAuth action with secrets, unauthenticated enrichment queries/actions |
| HIGH     | 2     | Missing OAuth state validation, prompt injection via profile data            |
| MEDIUM   | 12    | N+1 queries, type assertion without validation, auth gaps, Android security  |
| LOW      | 16    | Console logs, dead code, missing CI, timezone validation, accessibility      |
| INFO     | 3     | Hardcoded dev team, empty license, non-standard API usage                    |

### Priority Action Items

1. **Add authentication to `sendMessage` and `getMessagesPublic`** in enrichment module
2. **Make `exchangeOAuthCode` internal** or add authentication + redirectUri allowlist
3. **Implement OAuth state validation** in Tauri deep link flow
4. **Add PKCE** to mobile OAuth flow
5. **Sanitize profile data** before interpolation into LLM prompts
6. **Fix growth areas aggregation** in matching compute
7. **Fix date conversion** to use `Date.UTC()` instead of `new Date()`
8. **Add runtime validation** for LLM tool responses (Zod or equivalent)
9. **Wrap navigation calls in useEffect** in redirect components
10. **Remove test-upload route** before production
