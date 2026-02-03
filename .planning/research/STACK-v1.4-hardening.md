# Technology Stack: v1.4 Hardening

**Project:** ASTN (AI Safety Talent Network)
**Milestone:** v1.4 -- Security Hardening, Bug Fixes, Code Quality
**Researched:** 2026-01-31

## Executive Summary

The v1.4 hardening milestone requires surprisingly few new dependencies. The codebase already contains most of what is needed -- Zod is installed (v3.25.76 via transitive dependency), the Anthropic SDK already ships Zod-based tool helpers (`betaZodTool`), `convex-helpers` is installed with rate limiting and custom function wrappers, and `@convex-dev/auth` already implements PKCE internally for its managed OAuth flows. The primary gaps are: (1) making Zod an explicit dependency rather than transitive, (2) adding pre-commit tooling (husky + lint-staged), and (3) creating GitHub Actions workflows from scratch (none exist today).

---

## Current Stack (No Changes Needed)

These are already installed and sufficient for v1.4. Listed for reference only.

| Technology        | Version                     | Role                                                |
| ----------------- | --------------------------- | --------------------------------------------------- |
| Convex            | ^1.31.6                     | Backend (DB, functions, real-time)                  |
| @convex-dev/auth  | ^0.0.90                     | Authentication (already has PKCE for managed OAuth) |
| @auth/core        | 0.39                        | OAuth provider definitions                          |
| @anthropic-ai/sdk | ^0.71.2                     | LLM integration (has `betaZodTool` helper)          |
| convex-helpers    | 0.1.111                     | Custom functions, rate limiting, row-level security |
| TypeScript        | ^5.9.2                      | Type checking (strict mode enabled)                 |
| ESLint            | via @tanstack/eslint-config | Linting (flat config, already configured)           |
| Prettier          | ^3.6.2                      | Formatting (already configured)                     |
| Bun               | (runtime)                   | Package manager and runtime                         |

---

## New Dependencies Required

### 1. Zod (Promote from transitive to explicit)

|                |                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Package**    | `zod`                                                                                            |
| **Version**    | `^3.25.76` (stay on 3.x for now; Zod 4 stable exists but 3.25 is what the Anthropic SDK bundles) |
| **Purpose**    | Runtime validation of LLM tool_use responses                                                     |
| **Confidence** | HIGH -- verified in node_modules                                                                 |

**Why:** Zod 3.25.76 is already in `node_modules` as a transitive dependency of `@anthropic-ai/sdk` (peer dep: `"zod": "^3.25.0 || ^4.0.0"`). However, it is not listed in `package.json`. It must be made explicit because:

1. The codebase will directly import `zod` in Convex functions for LLM response validation
2. Transitive dependencies can disappear on version bumps
3. The Anthropic SDK's `betaZodTool` helper requires Zod to be importable

**Why NOT Zod 4:** Zod 4 is stable (v4.3.6 as of Jan 2025), but the Anthropic SDK v0.71.2 uses `z.toJSONSchema()` which works in both 3.25+ and 4.x. Staying on 3.25.x avoids any import path changes (`zod` vs `zod/v4`) and keeps compatibility simple. Upgrade to Zod 4 can happen later as a separate concern.

**Integration pattern -- LLM response validation:**

The current codebase uses unsafe `as` type assertions on every LLM tool_use response:

```typescript
// CURRENT (unsafe -- 4 files do this)
const batchResult = toolUse.input as MatchingResult // matching/compute.ts:81
const result = toolUse.input as EngagementResult // engagement/compute.ts:131
return toolUse.input as ExtractionResult // extraction/text.ts:65
return toolUse.input as ExtractionResult // enrichment/extraction.ts:82
```

**Replace with Zod schemas that serve triple duty:**

```typescript
import { z } from 'zod'

// 1. Define schema (single source of truth)
const MatchingResultSchema = z.object({
  matches: z.array(
    z.object({
      opportunityId: z.string(),
      tier: z.enum(['great', 'good', 'exploring']),
      score: z.number().min(0).max(100),
      strengths: z.array(z.string()),
      gap: z.string().optional(),
      interviewChance: z.enum([
        'Strong chance',
        'Good chance',
        'Moderate chance',
      ]),
      ranking: z.string(),
      confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      recommendations: z.array(
        z.object({
          type: z.enum(['specific', 'skill', 'experience']),
          action: z.string(),
          priority: z.enum(['high', 'medium', 'low']),
        }),
      ),
    }),
  ),
  growthAreas: z.array(
    z.object({
      theme: z.string(),
      items: z.array(z.string()),
    }),
  ),
})

// 2. Derive TypeScript type (replaces manual interface)
type MatchingResult = z.infer<typeof MatchingResultSchema>

// 3. Validate at runtime (replaces unsafe `as` cast)
const parsed = MatchingResultSchema.safeParse(toolUse.input)
if (!parsed.success) {
  console.error('LLM returned invalid structure:', parsed.error.issues)
  continue // or retry
}
const batchResult = parsed.data // fully typed AND validated
```

**Files to modify:** 4 files with LLM tool_use responses + 3 prompt files with interfaces:

- `convex/matching/compute.ts` (line 81) -- replace `as MatchingResult`
- `convex/engagement/compute.ts` (line 131) -- replace `as EngagementResult`
- `convex/extraction/text.ts` (line 65) -- replace `as ExtractionResult`
- `convex/enrichment/extraction.ts` (line 82) -- replace `as ExtractionResult`
- `convex/matching/prompts.ts` -- add Zod schema, derive `MatchingResult` type from it
- `convex/engagement/prompts.ts` -- add Zod schema, derive `EngagementResult` type from it
- `convex/extraction/prompts.ts` -- add Zod schema, derive `ExtractionResult` type from it

**Note on `betaZodTool`:** The Anthropic SDK's `betaZodTool` could potentially replace the manual JSON schema tool definitions AND add automatic input validation. However, this is a "Beta" API and runs through the SDK's tool runner -- which may not be compatible with Convex's `"use node"` action pattern that requires direct `messages.create()` calls. Recommendation: Use Zod schemas for validation only (`.safeParse()`), keep the existing manual JSON schema tool definitions. Evaluate `betaZodTool` as a separate future improvement.

```bash
bun add zod@^3.25
```

### 2. Husky (Pre-commit hook manager)

|                |                                           |
| -------------- | ----------------------------------------- |
| **Package**    | `husky`                                   |
| **Version**    | `^9.0.1`                                  |
| **Purpose**    | Git hook management for pre-commit checks |
| **Confidence** | HIGH -- verified via official docs        |

**Why:** No git hooks exist in this project. Pre-commit hooks enforce quality gates before code reaches the remote. Husky v9 uses Git's native `core.hooksPath`, is 2kB with zero dependencies, and runs in ~1ms.

**Why husky over alternatives:**

- `simple-git-hooks`: Simpler but less ecosystem support, no per-hook config files
- `lefthook`: Written in Go, faster for large monorepos -- overkill for this project
- `pre-commit` (Python): Wrong ecosystem for a JS/TS project
- Husky v9 is the standard for JS/TS projects and pairs perfectly with lint-staged

```bash
bun add -D husky@^9
bunx husky init
```

This creates `.husky/pre-commit` which will call lint-staged.

### 3. lint-staged (Run linters on staged files only)

|                |                                                               |
| -------------- | ------------------------------------------------------------- |
| **Package**    | `lint-staged`                                                 |
| **Version**    | `^15.x` (latest 15.x)                                         |
| **Purpose**    | Run ESLint + Prettier only on changed files during pre-commit |
| **Confidence** | HIGH -- standard pairing with husky                           |

**Why:** Running `bun run lint` checks the entire codebase (~15s). Pre-commit should only check staged files for speed. lint-staged provides this filtering.

**Configuration (in `package.json`):**

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

**`.husky/pre-commit` content:**

```bash
bunx lint-staged
```

**Important:** TypeScript type-checking (`tsc`) should NOT run in lint-staged because `tsc` needs the full project context, not individual files. Type-checking belongs in CI only.

```bash
bun add -D lint-staged@^15
```

---

## CI/CD: GitHub Actions (No npm packages needed)

No GitHub Actions workflows exist in this project (`.github/workflows/` does not exist at the repo root). The project currently deploys via Vercel's Git integration for the frontend and `npx convex deploy` for the backend.

### Recommended Workflow Structure

**File:** `.github/workflows/ci.yml`

This is infrastructure configuration, not a package dependency. The workflow should:

1. **On PR / push to main:** Run quality checks
2. **On merge to main:** Deploy Convex functions + trigger Vercel build

**CI checks to run (in order of speed):**

| Check             | Command                                       | Time (est.) | Purpose                                     |
| ----------------- | --------------------------------------------- | ----------- | ------------------------------------------- |
| Type check        | `bunx tsc --noEmit`                           | ~10s        | Catch type errors across full project       |
| Convex type check | `bunx convex typecheck`                       | ~5s         | Validate Convex function types specifically |
| Lint              | `bunx eslint . --ext ts,tsx --max-warnings 0` | ~10s        | Code quality and style                      |
| Build             | `bun run build`                               | ~20s        | Verify production build works               |

**Required GitHub secrets:**

| Secret              | Source                                                               | Purpose                          |
| ------------------- | -------------------------------------------------------------------- | -------------------------------- |
| `CONVEX_DEPLOY_KEY` | Convex Dashboard > Project Settings > Generate Production Deploy Key | Authenticate `npx convex deploy` |

**Deploy command:**

```bash
npx convex deploy --cmd 'bun run build' --cmd-url-env-var-name VITE_CONVEX_URL
```

This single command: (a) deploys Convex functions, (b) sets `VITE_CONVEX_URL` env var, (c) runs frontend build. The `CONVEX_DEPLOY_KEY` env var is read automatically.

**Note on Bun in CI:** GitHub Actions has `oven-sh/setup-bun@v2` for Bun installation. Use it instead of Node.js setup since the project uses `bun.lock`.

### Skeleton CI Workflow

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx tsc --noEmit
      - run: bunx eslint . --ext ts,tsx --max-warnings 0
      - run: bun run build

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: npx convex deploy --cmd 'bun run build' --cmd-url-env-var-name VITE_CONVEX_URL
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

### Lockfile Cleanup

The project has BOTH `bun.lock` and `package-lock.json`. This is a bug -- only `bun.lock` should exist since Bun is the package manager. Delete `package-lock.json` and add it to `.gitignore`.

---

## Security Hardening: Patterns (Not packages)

These hardening items require code changes, not new dependencies.

### A. Auth Gap Fixes (Use existing `@convex-dev/auth`)

**Finding:** The codebase review identified critical public endpoints missing authentication:

1. **`convex/admin.ts`** -- `createOpportunity`, `updateOpportunity`, `deleteOpportunity`, `archiveOpportunity` are public mutations with NO auth check. Anyone with the Convex URL can call these.
2. **`convex/enrichment/conversation.ts`** -- `sendMessage` is a public action that calls Claude. No auth check = unauthenticated users can burn API credits.
3. **`convex/extraction/text.ts`** -- `extractFromText` is a public action that calls Claude. Same problem.
4. **`convex/enrichment/extraction.ts`** -- `extractFromConversation` is a public action that calls Claude. Same problem.

**Fix pattern (already used correctly in `upload.ts`, `profiles.ts`):**

```typescript
import { auth } from './auth'

export const someEndpoint = mutation({
  args: {
    /* ... */
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) {
      throw new Error('Not authenticated')
    }
    // ... rest of handler
  },
})
```

For admin-only endpoints (`admin.ts`), add role checking after authentication by verifying the user has an admin `orgMembership`.

**Recommended (longer-term):** Use `convex-helpers` custom function wrappers to create `authenticatedMutation`, `authenticatedAction`, and `adminMutation` that enforce auth checks at the wrapper level. This prevents forgetting auth checks in new endpoints.

```typescript
// convex/lib/functions.ts
import {
  customMutation,
  customAction,
} from 'convex-helpers/server/customFunctions'
import { mutation, action } from '../_generated/server'
import { auth } from '../auth'

export const authenticatedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    return { ctx: { ...ctx, userId }, args: {} }
  },
})

export const authenticatedAction = customAction(action, {
  args: {},
  input: async (ctx) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    return { ctx: { ...ctx, userId }, args: {} }
  },
})
```

**No new packages needed.** `convex-helpers` 0.1.111 is already installed with `customFunctions` support.

### B. OAuth PKCE for Managed Flows (Already implemented)

**Key finding:** `@convex-dev/auth` already implements PKCE for its managed OAuth flows. Verified in source code:

```
@convex-dev/auth/src/server/provider_utils.ts:139:  const checks = c.checks ?? ["pkce"];
@convex-dev/auth/src/server/oauth/checks.ts:74:     export const pkce = { ... }
@convex-dev/auth/src/server/oauth/authorizationUrl.ts:73:  if (provider.checks?.includes("pkce")) {
@convex-dev/auth/src/server/oauth/authorizationUrl.ts:81:      authParams.set("code_challenge", pkce.codeChallenge);
@convex-dev/auth/src/server/oauth/authorizationUrl.ts:82:      authParams.set("code_challenge_method", "S256");
```

Default behavior is `checks: ["pkce"]` -- PKCE is ON by default for all managed OAuth providers. The web OAuth flows (GitHub, Google) through `@convex-dev/auth` are already secure.

**The actual gap is in `convex/authTauri.ts`:**

The Tauri mobile OAuth flow (`exchangeOAuthCode` action) does a MANUAL code exchange -- it bypasses `@convex-dev/auth` entirely and directly calls GitHub/Google token endpoints. This custom flow:

1. Has NO PKCE (no `code_verifier` / `code_challenge`)
2. Has NO OAuth `state` parameter validation (no CSRF protection)
3. Is a public action callable by anyone with a code + provider name
4. Returns access tokens directly -- no session management

**Fix approach for Tauri OAuth (code changes only, no new packages):**

- Add `code_verifier` parameter to `exchangeOAuthCode` args
- Generate `code_challenge` on the Tauri client side using Web Crypto API before redirecting to OAuth provider
- Include `code_verifier` in the token exchange request
- Add `state` parameter with server-side nonce validation (store nonce in Convex table, verify on callback)
- Consider whether to integrate this flow back into `@convex-dev/auth` instead of maintaining a parallel implementation

### C. Prompt Injection Defense (Code patterns, not libraries)

No dedicated "prompt injection defense" library is needed or recommended. The standard defense-in-depth approach:

1. **Input length limits:** Cap user input strings before they reach prompts (e.g., max 10,000 chars for resume text, max 500 chars per chat message). Currently NO length limits exist on any LLM input.
2. **Structured output via tools:** Already done correctly -- all LLM calls use `tool_choice: { type: "tool", name: "..." }` which forces structured output and makes injection-based data exfiltration much harder.
3. **Input/output separation in prompts:** Use clear delimiters to separate system instructions from user content:
   ```
   <user_resume>${sanitizedText}</user_resume>
   Extract profile information from the above document.
   ```
4. **Post-processing validation with Zod:** Already recommended above -- validates LLM output matches expected schema before it enters the database.
5. **No system access:** Claude tool_use calls return data to the application, not to the user. Even if prompt injection changes the LLM output, Zod validation catches structural anomalies.

**Do NOT add:**

- `rebuff` or similar "prompt injection detection" packages -- they add latency, have high false-positive rates, and the attack surface here is limited
- Custom regex-based injection filters -- they are easily bypassed and create false security

### D. Rate Limiting for LLM Endpoints (Use existing convex-helpers)

`convex-helpers` already provides rate limiting. Apply it to public LLM-calling endpoints to prevent API credit abuse:

- `convex/enrichment/conversation.ts` -- `sendMessage` (user-facing chat)
- `convex/extraction/text.ts` -- `extractFromText` (resume parsing)
- `convex/enrichment/extraction.ts` -- `extractFromConversation` (profile extraction)
- `convex/matches.ts` -- `triggerMatchComputation` (user-triggered matching)

**Note:** The `convex-helpers` rate limiter may work as a simple in-function check or may need a Convex component setup. Verify during implementation whether `convex/convex.config.ts` needs an update.

---

## What NOT to Add

| Library                     | Why Considered                | Why Rejected                                                                                                                                             |
| --------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vitest` / `jest`           | Testing framework for CI      | v1.4 scope is hardening, not test infrastructure. Tests are a separate milestone. Adding a test framework without tests adds complexity with zero value. |
| `zod@4`                     | Latest Zod version            | Anthropic SDK peer dep supports it, but 3.25.x is already installed and working. Upgrade is unnecessary churn for this milestone.                        |
| `@anthropic-ai/sdk` upgrade | SDK has newer features        | v0.71.2 already has the Zod helpers needed. Upgrading mid-hardening adds risk.                                                                           |
| `helmet` / `cors` packages  | HTTP security headers         | Not applicable. Convex handles HTTP layer. Frontend is served by Vercel. No Express/Hono server to protect.                                              |
| `dompurify` / `xss`         | XSS protection                | React 19 already escapes output by default. Convex validates input types via `v.string()` etc. No raw HTML rendering in the app.                         |
| `jsonwebtoken` / `jose`     | JWT handling                  | `@convex-dev/auth` handles all token management internally. Do not duplicate.                                                                            |
| `bcrypt` / `argon2`         | Password hashing              | `@convex-dev/auth` Password provider handles hashing internally.                                                                                         |
| `rebuff` / prompt guard     | Prompt injection detection    | High false-positive rate, adds latency, limited attack surface. Schema validation via Zod is a better defense.                                           |
| `commitlint`                | Enforce commit message format | Nice-to-have but not a security concern. Adds friction to a small team. Defer.                                                                           |

---

## Installation Summary

### New dependencies (1 runtime, 2 dev):

```bash
# Runtime: explicit Zod dependency (already in node_modules, making it explicit)
bun add zod@^3.25

# Dev: pre-commit hooks
bun add -D husky@^9 lint-staged@^15

# Initialize husky
bunx husky init
```

**Total new packages: 3** (zod, husky, lint-staged)

### Files to create:

| File                       | Purpose                                       |
| -------------------------- | --------------------------------------------- |
| `.github/workflows/ci.yml` | CI pipeline (type check, lint, build, deploy) |
| `.husky/pre-commit`        | Pre-commit hook calling lint-staged           |

### Files to delete:

| File                | Reason                                                         |
| ------------------- | -------------------------------------------------------------- |
| `package-lock.json` | Dual lockfile with `bun.lock`. Only Bun lockfile should exist. |

### Config to add to `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

### Code files to modify (no new deps needed):

| File                                | Change                                                  | Priority |
| ----------------------------------- | ------------------------------------------------------- | -------- |
| `convex/admin.ts`                   | Add auth + admin role checks to all 4 mutations         | CRITICAL |
| `convex/enrichment/conversation.ts` | Add auth check to `sendMessage`                         | CRITICAL |
| `convex/extraction/text.ts`         | Add auth check to `extractFromText`                     | CRITICAL |
| `convex/enrichment/extraction.ts`   | Add auth check to `extractFromConversation`             | CRITICAL |
| `convex/authTauri.ts`               | Add PKCE + state validation to manual OAuth flow        | HIGH     |
| `convex/matching/prompts.ts`        | Add Zod schema, derive `MatchingResult` from it         | HIGH     |
| `convex/engagement/prompts.ts`      | Add Zod schema, derive `EngagementResult` from it       | HIGH     |
| `convex/extraction/prompts.ts`      | Add Zod schema, derive `ExtractionResult` from it       | HIGH     |
| `convex/enrichment/extraction.ts`   | Also has its own `ExtractionResult` interface (line 43) | HIGH     |
| `convex/matching/compute.ts`        | Replace `as MatchingResult` with `.safeParse()`         | HIGH     |
| `convex/engagement/compute.ts`      | Replace `as EngagementResult` with `.safeParse()`       | HIGH     |
| `convex/extraction/text.ts`         | Replace `as ExtractionResult` with `.safeParse()`       | HIGH     |
| `convex/enrichment/extraction.ts`   | Replace `as ExtractionResult` with `.safeParse()`       | HIGH     |
| `.gitignore`                        | Add `package-lock.json` line                            | LOW      |

---

## Alternatives Considered

| Category           | Recommended                      | Alternative                       | Why Not                                                                  |
| ------------------ | -------------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| Runtime validation | Zod 3.25 (`.safeParse()`)        | `valibot`, `arktype`, `typebox`   | Zod already installed, Anthropic SDK has Zod helpers, ecosystem standard |
| Runtime validation | Zod 3.25 manual parse            | Anthropic `betaZodTool`           | Beta API, may not work with Convex action pattern, larger refactor scope |
| Pre-commit hooks   | husky v9 + lint-staged           | lefthook                          | Overkill for single-package repo; husky is simpler and more widely known |
| Pre-commit hooks   | husky v9 + lint-staged           | simple-git-hooks                  | Less ecosystem support, fewer features for per-hook config               |
| CI/CD              | GitHub Actions                   | CircleCI, GitLab CI               | Project is on GitHub, Actions is native and free for public repos        |
| CI/CD              | Single workflow file             | Separate check + deploy workflows | Keep it simple for a small team -- one workflow, conditional deploy job  |
| Auth wrappers      | `convex-helpers` customFunctions | Manual auth checks per file       | Custom function wrappers prevent forgetting auth checks; DRY             |
| OAuth PKCE (Tauri) | Add to existing manual flow      | Rewrite to use @convex-dev/auth   | Integration unclear for deep-link flows, manual fix is simpler           |

---

## Sources

| Source                                                               | Confidence         | What it told us                                                          |
| -------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------ |
| `node_modules/@convex-dev/auth/src/server/oauth/checks.ts`           | HIGH (source code) | PKCE is default-enabled (`checks ?? ["pkce"]`) with S256                 |
| `node_modules/@convex-dev/auth/src/server/oauth/authorizationUrl.ts` | HIGH (source code) | Sets `code_challenge` and `code_challenge_method` params                 |
| `node_modules/@anthropic-ai/sdk/src/helpers/beta/zod.ts`             | HIGH (source code) | SDK has `betaZodTool` with Zod validation built in                       |
| `node_modules/@anthropic-ai/sdk/package.json`                        | HIGH (source code) | Zod peer dep: `"^3.25.0 \|\| ^4.0.0"`, optional                          |
| `node_modules/zod/package.json`                                      | HIGH (source code) | v3.25.76 already installed as transitive dep                             |
| `node_modules/convex-helpers/server/customFunctions.ts`              | HIGH (source code) | `customMutation`, `customAction` wrappers available                      |
| `node_modules/convex-helpers/server/rateLimit.ts`                    | HIGH (source code) | Rate limiting utilities available                                        |
| Convex official docs (production/hosting)                            | MEDIUM (WebFetch)  | `npx convex deploy --cmd` with `CONVEX_DEPLOY_KEY`                       |
| Zod official docs (zod.dev)                                          | MEDIUM (WebFetch)  | Zod 4 is stable, package name still `zod`, install via `npm install zod` |
| Husky official docs (typicode.github.io/husky)                       | MEDIUM (WebFetch)  | v9.0.1, uses `core.hooksPath`, 2kB, zero deps                            |
| `convex/authTauri.ts`                                                | HIGH (source code) | Manual OAuth exchange has no PKCE, no state validation                   |
| `convex/admin.ts`                                                    | HIGH (source code) | No auth import, no auth checks on any mutation                           |
| `convex/enrichment/conversation.ts`                                  | HIGH (source code) | `sendMessage` is public action, no auth check                            |
| `convex/extraction/text.ts`                                          | HIGH (source code) | `extractFromText` is public action, no auth check                        |
