# Phase 28: Quality Gates & Bug Fixes - Research

**Researched:** 2026-02-02
**Domain:** CI/CD pipelines, git hooks, bug fixes, code quality standardization
**Confidence:** HIGH

## Summary

This phase covers three distinct domains: (1) CI pipeline and developer experience tooling (GitHub Actions, husky, lint-staged), (2) bug fixes for known issues (growth area aggregation, Date.UTC conversion, navigation-during-render, engagement override expiration, org membership race condition), and (3) code quality cleanup (dead code removal, alert-to-toast migration, error handling standardization, timezone validation).

The codebase is a TanStack Start + Convex project using bun as the package manager. Sonner toast notifications are already installed and wired into the root layout at `src/routes/__root.tsx`. The project has eslint, prettier, and TypeScript strict mode already configured. No `.github/` directory, `.husky/` directory, or `.env.example` file exists yet. A stale `package-lock.json` (236KB) coexists with `bun.lock` (222KB).

**Primary recommendation:** Implement in three sequential sub-phases -- CI/DX first (establishes quality gates), then bug fixes (under the new gates), then cleanup (polishing pass).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| husky | latest (v9+) | Git hooks manager | Official docs recommend; init via `bunx husky init`, configure via `.husky/pre-commit` |
| lint-staged | latest (v15+) | Run linters on staged files only | Standard pairing with husky; config in `package.json` or `.lintstagedrc.js` |
| sonner | ^2.0.7 (already installed) | Toast notifications | Already in project at `src/routes/__root.tsx` line 154; `<Toaster position="top-right" richColors />` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| oven-sh/setup-bun@v2 | v2 | GitHub Actions bun setup | CI workflow -- sets up bun runtime on ubuntu-latest |
| actions/checkout@v4 | v4 | Git checkout in CI | Every CI workflow job |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| husky | simple-git-hooks | Husky is more established; simple-git-hooks is smaller but less featured |
| lint-staged | nano-staged | lint-staged is the ecosystem standard; nano-staged is faster but less tested |

**Installation:**
```bash
bun add -D husky lint-staged
```

## Architecture Patterns

### Recommended Project Structure (new files)
```
.github/
  workflows/
    ci.yml                 # CI pipeline (lint, typecheck, build, test)
.husky/
  pre-commit              # Runs lint-staged
.env.example              # Documents all env vars
```

### Pattern 1: GitHub Actions CI for Bun
**What:** Single workflow file that runs lint, typecheck, build, and test on every push and PR.
**When to use:** Every GitHub-hosted project.
**Example:**
```yaml
# Source: oven-sh/setup-bun official docs + verified patterns
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run build
      - run: bun test
```

**Key details:**
- `bun install --frozen-lockfile` ensures reproducible installs (fails if lockfile is out of date)
- `concurrency` with `cancel-in-progress: true` saves CI minutes on rapid pushes
- The `lint` script in package.json currently runs `tsc && eslint .` -- this covers both typecheck and lint in one step
- However, the CI decision says: separate lint, typecheck, build, test steps. The `lint` script should be split into `lint` (eslint only) and `typecheck` (tsc only) in package.json for clearer CI output
- `bun test` passes vacuously if no test files exist (per Bun docs)

### Pattern 2: Husky + lint-staged Pre-commit Hook
**What:** Pre-commit hook that runs lint-staged on staged files.
**When to use:** Every commit.
**Example:**
```bash
# .husky/pre-commit
bunx lint-staged
```

```json
// package.json lint-staged config
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

**Key decision from CONTEXT.md:** lint-staged runs lint + format + typecheck. For typecheck on staged files only, use `tsc-files` or run full `tsc --noEmit` (since TypeScript needs full project context). Full `tsc --noEmit` is recommended -- it's ~10-15s but catches real issues.

### Pattern 3: Engagement Override Expiration in Queries
**What:** Check `override.expiresAt` against `Date.now()` in query handlers, not just in the daily compute batch.
**When to use:** Every query that returns engagement level.
**Example:**
```typescript
// Helper function for determining effective level
function getEffectiveLevel(engagement: EngagementRecord): string {
  if (engagement.override) {
    // Check expiration in query (not just daily compute)
    if (engagement.override.expiresAt && engagement.override.expiresAt < Date.now()) {
      return engagement.level; // Override expired, use computed level
    }
    return engagement.override.level;
  }
  return engagement.level;
}
```

### Pattern 4: Growth Area Aggregation Across Batches
**What:** Collect growth areas from ALL batches within a single matching run, deduplicate, rank by frequency.
**When to use:** Multi-batch matching runs (>15 opportunities).
**Current bug:** Line 112 in `convex/matching/compute.ts` overwrites `aggregatedGrowthAreas` instead of appending:
```typescript
// BUG: Overwrites instead of aggregating
if (Array.isArray(batchResult.growthAreas) && batchResult.growthAreas.length > 0) {
  aggregatedGrowthAreas = batchResult.growthAreas;  // <-- OVERWRITE
}
```
**Fix pattern:** Accumulate all growth areas, then deduplicate and rank:
```typescript
// Accumulate from each batch
if (Array.isArray(batchResult.growthAreas) && batchResult.growthAreas.length > 0) {
  aggregatedGrowthAreas.push(...batchResult.growthAreas);
}
// After all batches: deduplicate items within themes, merge same-theme entries, cap at 10
```

### Pattern 5: Toast Notification for Errors (Sonner)
**What:** Replace `alert()` calls with `toast.error()` from sonner.
**When to use:** All user-facing error notifications.
**Example:**
```typescript
import { toast } from 'sonner';

// Error toast persists until dismissed (per CONTEXT.md)
toast.error('Failed to save opportunity', { duration: Infinity });

// Success toast auto-dismisses (~5s)
toast.success('Opportunity saved');

// With retry action
toast.error('Failed to save opportunity', {
  duration: Infinity,
  action: {
    label: 'Retry',
    onClick: () => handleSubmit(),
  },
});
```

### Anti-Patterns to Avoid
- **Calling navigate() during render:** Causes React warnings. Always wrap in `useEffect`. Six components have this bug (see Pitfall 2).
- **`new Date(year, month - 1, 1)` for timestamps:** Uses local timezone. Use `Date.UTC(year, month - 1, 1)` for timezone-independent timestamps.
- **Checking timezone with `includes("/")`.** "America/New_York" passes, but "Etc/UTC" also passes, while "InvalidTimezone/Fake" also passes. Use `Intl.supportedValuesOf('timeZone')` for proper IANA validation.
- **Using `console.log` in Convex functions:** No structured logging. Replace with structured format including context.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Git hooks | Shell scripts in `.git/hooks/` | husky v9 | Cross-platform, survives `git clone`, team-portable |
| Staged file linting | Custom git diff parsing | lint-staged | Handles edge cases (renames, binary files, partial staging) |
| Toast notifications | Custom notification component | sonner (already installed) | Already wired into root layout, provides all needed features |
| CI pipeline | Custom bash scripts | GitHub Actions YAML | Standard, maintained, has bun action |
| IANA timezone validation | Regex or string checks | `Intl.supportedValuesOf('timeZone')` | Runtime API that uses the system's IANA database; always current |

**Key insight:** The project already has most infrastructure in place (sonner, eslint, prettier, typescript strict mode). This phase is about wiring things together (CI, hooks) and fixing inconsistencies.

## Common Pitfalls

### Pitfall 1: Growth Area Overwrite Bug
**What goes wrong:** When matching runs process >15 opportunities (multiple batches), only the last batch's growth areas survive. Earlier batches' growth areas are silently lost.
**Why it happens:** Line 112 of `convex/matching/compute.ts` uses assignment (`=`) instead of spread/push.
**How to avoid:** Accumulate growth areas across batches, then deduplicate and cap at 10.
**Warning signs:** Users report fewer growth areas than expected; growth areas change when the same matching run produces the same results.
**Affected files:** `convex/matching/compute.ts` (line 110-113)

### Pitfall 2: Navigation During Render
**What goes wrong:** React renders a component, which calls `navigate()` synchronously during render, triggering a state update in the middle of the render cycle. Produces console warnings about state updates during rendering.
**Why it happens:** `UnauthenticatedRedirect` components call `navigate()` directly in the function body instead of inside `useEffect`.
**How to avoid:** Always wrap `navigate()` calls in `useEffect(() => { navigate(...); }, [navigate])`.
**Files needing fix (5 components):**
- `src/routes/profile/index.tsx` (line 73) -- MISSING useEffect
- `src/routes/profile/edit.tsx` (line 53) -- MISSING useEffect
- `src/routes/profile/attendance.tsx` (line 44) -- MISSING useEffect
- `src/routes/admin/route.tsx` (line 64) -- MISSING useEffect
- `src/routes/settings/route.tsx` (line 62) -- MISSING useEffect

**Already fixed (2 components):**
- `src/routes/matches/index.tsx` (line 107) -- HAS useEffect
- `src/routes/matches/$id.tsx` (line 66) -- HAS useEffect

### Pitfall 3: Date.UTC vs new Date() in Profile Conversion
**What goes wrong:** `new Date(year, month - 1, 1)` creates a date in the user's local timezone. A date entered as "2024-03" could be stored as Feb 29 23:00 UTC or March 1 00:00 UTC depending on the user's timezone.
**Why it happens:** JavaScript's `new Date(year, month, day)` uses local timezone, not UTC.
**How to avoid:** Use `Date.UTC(year, month - 1, 1)` which always returns UTC milliseconds.
**Affected file:** `convex/profiles.ts` line 348

### Pitfall 4: Engagement Override Expiration Not Checked in Queries
**What goes wrong:** An admin sets a temporary engagement override that expires in 7 days. After 7 days, the override appears expired in the daily compute batch, but the query handlers still return the expired override level to users. Users see stale override levels until the next daily compute runs.
**Why it happens:** Override expiration is only checked in `convex/engagement/compute.ts` (line 184-195), not in the three query handlers that return engagement levels.
**How to avoid:** Add expiration check in a shared helper used by all three query functions.
**Affected files:**
- `convex/engagement/queries.ts` line 112 (`getMemberEngagement`)
- `convex/engagement/queries.ts` line 166 (`getOrgEngagementForAdmin`)
- `convex/engagement/queries.ts` line 203 (`getMemberEngagementForAdmin`)

### Pitfall 5: Org Membership First-Member Race Condition
**What goes wrong:** If two users join an empty org simultaneously, both could see `existingMembers === null` and both get assigned "admin" role.
**Why it happens:** The check at `convex/orgs/membership.ts` line 108-113 reads existing members and then inserts, but Convex mutations are serializable per-document, not per-query. Two concurrent mutations could both read "no members" before either writes.
**How to avoid:** Use a Convex `unique()` approach or add a denormalized "has admin" flag on the org document that can be atomically checked. Alternatively, since Convex mutations are transactional within a single mutation, and the read + write happens in the same mutation, this is actually safe IF Convex serializes conflicting transactions. Need to verify Convex's concurrency model.
**Note:** Convex mutations are serialized at the database level -- two conflicting mutations touching the same documents will be retried. The `.first()` read followed by `.insert()` within a single mutation is atomic. This may NOT be a real race condition in Convex's model. **Confidence: MEDIUM** -- verify with Convex docs.

### Pitfall 6: lint-staged Typecheck Complexity
**What goes wrong:** Running `tsc --noEmit` on individual staged files doesn't work because TypeScript needs full project context (imports, type definitions, etc.).
**Why it happens:** TypeScript is a whole-program analyzer, not a per-file linter.
**How to avoid:** Run `tsc --noEmit` on the entire project (not per-file). This is slower (~10-15s) but catches real type errors. The decision from CONTEXT.md accepts this tradeoff.
**Implementation:** In lint-staged config, use a function that runs full tsc regardless of which files are staged:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```
Then in `.husky/pre-commit`, run tsc separately before lint-staged:
```bash
#!/usr/bin/env sh
bun run typecheck
bunx lint-staged
```

### Pitfall 7: Dual Lockfile Confusion
**What goes wrong:** `package-lock.json` (npm) and `bun.lock` (bun) can drift, causing different dependency trees depending on which tool is used.
**Where:** Root directory has both files (236KB npm lockfile, 222KB bun lockfile).
**How to avoid:** Delete `package-lock.json`, keep only `bun.lock`. CI uses `bun install --frozen-lockfile`.

## Code Examples

### GitHub Actions CI Workflow
```yaml
# .github/workflows/ci.yml
# Source: oven-sh/setup-bun@v2 official docs, verified patterns
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: Lint, Typecheck, Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Typecheck
        run: bun run typecheck

      - name: Build
        run: bun run build

      - name: Test
        run: bun test
```

### Husky Setup
```bash
# Install
bun add -D husky lint-staged

# Init (creates .husky/ directory and adds prepare script)
bunx husky init
```

```bash
# .husky/pre-commit
bun run typecheck
bunx lint-staged
```

### package.json Script Updates
```json
{
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

### UnauthenticatedRedirect Fix Pattern
```typescript
// Source: React docs on side effects
function UnauthenticatedRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/login" });
  }, [navigate]);
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <Spinner />
    </div>
  );
}
```

### Date.UTC Fix
```typescript
// convex/profiles.ts convertDateString function
function convertDateString(dateStr?: string): number | undefined {
  if (!dateStr || dateStr.toLowerCase() === "present") return undefined;
  const parts = dateStr.split("-");
  if (parts.length < 2) return undefined;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return undefined;
  return Date.UTC(year, month - 1, 1);  // UTC, not local timezone
}
```

### IANA Timezone Validation
```typescript
// Replace simple "/" check with IANA database lookup
function isValidIANATimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
```
**Note:** `Intl.supportedValuesOf('timeZone')` returns the full list but requires Node 18+. The `Intl.DateTimeFormat` approach is more portable and catches invalid timezones by throwing on construction. Both are valid; `Intl.DateTimeFormat` is safer for Convex's Node runtime.

### Growth Area Aggregation Fix
```typescript
// convex/matching/compute.ts -- replace lines 110-113
// Accumulate growth areas from each batch
if (Array.isArray(batchResult.growthAreas) && batchResult.growthAreas.length > 0) {
  aggregatedGrowthAreas.push(...batchResult.growthAreas);
}

// After all batches: deduplicate and cap
// Merge items under matching themes, then rank by frequency
function deduplicateGrowthAreas(
  areas: Array<{ theme: string; items: string[] }>
): Array<{ theme: string; items: string[] }> {
  const themeMap = new Map<string, Map<string, number>>();
  for (const area of areas) {
    const normalizedTheme = area.theme.toLowerCase().trim();
    if (!themeMap.has(normalizedTheme)) {
      themeMap.set(normalizedTheme, new Map());
    }
    const itemMap = themeMap.get(normalizedTheme)!;
    for (const item of area.items) {
      const normalizedItem = item.toLowerCase().trim();
      itemMap.set(normalizedItem, (itemMap.get(normalizedItem) || 0) + 1);
    }
  }

  return Array.from(themeMap.entries()).map(([theme, items]) => ({
    theme: theme.charAt(0).toUpperCase() + theme.slice(1),
    items: Array.from(items.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item]) => item.charAt(0).toUpperCase() + item.slice(1)),
  }));
}
```

### Structured Logging Pattern for Convex
```typescript
// Simple structured logging replacement for console.log
// Convex captures stdout as logs in the dashboard
function log(level: "info" | "warn" | "error", message: string, context?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// Usage:
log("info", "Starting opportunity sync", { source: "80k_hours" });
log("error", "Failed to sync org", { orgId, error: String(error) });
```

**Note on Convex logging:** Convex dashboard already captures console.log/error output. The structured JSON format makes it searchable and parseable. This is the simplest approach that improves observability (per CONTEXT.md discretion).

### .env.example Template
```bash
# .env.example -- All environment variables for ASTN

# === Vite (client-side, prefixed with VITE_) ===
VITE_CONVEX_URL=             # Convex deployment URL (from `npx convex dev`)

# === Convex Dashboard Environment Variables ===
# Set these in the Convex dashboard (https://dashboard.convex.dev), NOT in .env.local
ANTHROPIC_API_KEY=           # Anthropic API key for LLM features (matching, enrichment, engagement)
RESEND_API_KEY=              # Resend API key for transactional emails
EIGHTY_K_ALGOLIA_APP_ID=    # 80,000 Hours Algolia app ID (opportunity sync)
EIGHTY_K_ALGOLIA_API_KEY=   # 80,000 Hours Algolia search key (opportunity sync)
AIRTABLE_TOKEN=             # Airtable Personal Access Token (aisafety.com sync)
AIRTABLE_BASE_ID=           # Airtable base ID for aisafety.com jobs
AIRTABLE_TABLE_NAME=        # Airtable table name (default: "Jobs")

# === Auth (Convex Dashboard) ===
AUTH_GITHUB_ID=              # GitHub OAuth app client ID
AUTH_GITHUB_SECRET=          # GitHub OAuth app client secret
AUTH_GOOGLE_ID=              # Google OAuth client ID
AUTH_GOOGLE_SECRET=          # Google OAuth client secret

# === Tauri-specific (optional, for desktop app) ===
VITE_GOOGLE_CLIENT_ID=          # Google client ID for Tauri OAuth flow
VITE_GITHUB_CLIENT_ID_MOBILE=   # GitHub client ID for Tauri OAuth flow
AUTH_GITHUB_ID_MOBILE=           # GitHub OAuth for mobile/Tauri (Convex dashboard)
AUTH_GITHUB_SECRET_MOBILE=       # GitHub OAuth secret for mobile/Tauri (Convex dashboard)
AUTH_REDIRECT_URI_WEB=           # Web redirect URI for Tauri auth flow
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| husky v4 (package.json hooks) | husky v9 (`.husky/` directory scripts) | 2023 | Config is now shell scripts in `.husky/`, not JSON in package.json |
| `npx husky install` | `bunx husky init` | 2024 | `init` auto-creates `.husky/` and `prepare` script |
| `setup-bun@v1` | `oven-sh/setup-bun@v2` | 2024 | v2 supports `bun-version`, caching, and latest bun features |
| `actions/checkout@v3` | `actions/checkout@v4` | 2023 | Node 20 runtime (v3 uses Node 16 which is EOL) |
| npm lockfile + bun | bun lockfile only | bun 1.0+ | `bun.lock` is text-based (was binary `bun.lockb` before bun 1.2) |

**Deprecated/outdated:**
- `npx husky install` / `npx husky add` -- deprecated in husky v9. Use `bunx husky init` and edit `.husky/pre-commit` directly.
- `package-lock.json` alongside `bun.lock` -- dual lockfile causes confusion. Project uses bun exclusively.

## Inventory of Changes Needed

### Files to CREATE
| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI pipeline |
| `.husky/pre-commit` | Pre-commit hook |
| `.env.example` | Environment variable documentation |

### Files to MODIFY
| File | Change | Requirement |
|------|--------|-------------|
| `package.json` | Split `lint` script, add `typecheck`, `prepare`, `lint-staged` config | QUAL-01, QUAL-02 |
| `convex/matching/compute.ts` | Fix growth area aggregation (lines 110-113) | BUG-01 |
| `convex/profiles.ts` | `Date.UTC()` in `convertDateString` (line 348) | BUG-02 |
| `src/routes/profile/index.tsx` | Wrap navigate in useEffect (line 73) | BUG-03 |
| `src/routes/profile/edit.tsx` | Wrap navigate in useEffect (line 53) | BUG-03 |
| `src/routes/profile/attendance.tsx` | Wrap navigate in useEffect (line 44) | BUG-03 |
| `src/routes/admin/route.tsx` | Wrap navigate in useEffect (line 64) | BUG-03 |
| `src/routes/settings/route.tsx` | Wrap navigate in useEffect (line 62) | BUG-03 |
| `convex/engagement/queries.ts` | Check override expiration in 3 query handlers | BUG-04 |
| `src/components/admin/opportunity-form.tsx` | Replace `alert()` with `toast.error()` (line 126) | QUAL-07 |
| `src/components/profile/wizard/ProfileWizard.tsx` | Remove `_STEP_LABELS` and void statement (lines 44-53) | QUAL-06 |
| `convex/profiles.ts` | IANA timezone validation (line 256) | QUAL-09 |

### Files to DELETE
| File | Reason | Requirement |
|------|--------|-------------|
| `src/routes/test-upload.tsx` | Test route, marked TODO for removal | QUAL-05 |
| `package-lock.json` | Dual lockfile, bun.lock is source of truth | QUAL-03 |

### Files for Error Handling Standardization (QUAL-08)
All Convex files with `console.log`/`console.error` need structured logging:
- `convex/aggregation/sync.ts` (6 instances)
- `convex/aggregation/aisafety.ts` (4 instances)
- `convex/aggregation/eightyK.ts` (3 instances)
- `convex/aggregation/syncMutations.ts` (2 instances)
- `convex/emails/batchActions.ts` (16 instances)
- `convex/engagement/compute.ts` (8 instances)
- `convex/enrichment/extraction.ts` (1 instance)
- `convex/events/sync.ts` (8 instances)
- `convex/events/lumaClient.ts` (1 instance)
- `convex/extraction/pdf.ts` (1 instance)
- `convex/extraction/text.ts` (1 instance)
- `convex/matching/compute.ts` (3 instances)
- `convex/notifications/realtime.ts` (1 instance)

**Total: ~55 console.log/error instances across 13 files.**

## Open Questions

1. **Convex Mutation Serialization and First-Member Race Condition**
   - What we know: Convex mutations are transactional. The membership.ts `joinOrg` function reads existing members and inserts in the same mutation.
   - What's unclear: Whether two concurrent `joinOrg` mutations for the same org would be serialized by Convex's OCC (Optimistic Concurrency Control). Convex docs say mutations are serializable, which should prevent the race condition.
   - Recommendation: Verify with a quick test or Convex docs. If Convex serializes conflicting transactions, no fix needed. If not, add a unique constraint or use the org document itself as a coordination point. **Confidence: MEDIUM.**

2. **Pre-commit Hook Bypass Prevention**
   - What we know: CONTEXT.md says "Pre-commit hooks NOT bypassable -- no --no-verify escape hatch."
   - What's unclear: Husky does not natively prevent `--no-verify`. Git always allows this flag. The only true enforcement is CI (which the user also wants).
   - Recommendation: CI is the real enforcement. The pre-commit hook catches issues early; CI blocks merge. Document that `--no-verify` is discouraged but CI is the hard gate. There is no way to prevent `git commit --no-verify` at the git level.

3. **TypeScript Typecheck in Pre-commit Performance**
   - What we know: Running full `tsc --noEmit` takes ~10-15s. CONTEXT.md accepts this.
   - What's unclear: Whether this will be annoying enough that developers bypass with `--no-verify`.
   - Recommendation: Accept the tradeoff per CONTEXT.md decision. CI is the backstop.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: package.json, eslint.config.mjs, tsconfig.json, all affected source files
- Context7: `/websites/typicode_github_io_husky` -- husky v9 setup, bun integration, pre-commit configuration
- Context7: `/websites/sonner_emilkowal_ski` -- toast.error with duration: Infinity, action buttons, promise toasts
- Bun official CI docs: https://bun.com/docs/guides/runtime/cicd

### Secondary (MEDIUM confidence)
- Exa code search: GitHub Actions CI patterns for bun projects (multiple verified examples)
- Exa code search: lint-staged configuration patterns (consistent across sources)
- React documentation: useEffect for side effects during render

### Tertiary (LOW confidence)
- Convex mutation serialization behavior (needs verification from Convex docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - husky/lint-staged/sonner are well-documented and already partially in use
- Architecture: HIGH - CI patterns are standardized; bug fixes are clearly identified with line numbers
- Pitfalls: HIGH for bugs (verified in codebase), MEDIUM for Convex race condition

**Research date:** 2026-02-02
**Valid until:** 2026-03-04 (stable tools, no fast-moving dependencies)
