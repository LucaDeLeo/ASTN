---
phase: 28-quality-gates-bug-fixes
plan: 01
subsystem: devops
tags: [ci, github-actions, husky, lint-staged, eslint, typescript, pre-commit]
requires:
  - 27-03 (LLM output validation - codebase must pass lint/typecheck after security changes)
provides:
  - GitHub Actions CI pipeline (lint, typecheck, build, test on every push/PR to main)
  - Pre-commit hook with typecheck + lint-staged
  - Environment variable documentation (.env.example)
  - Clean separated lint and typecheck scripts
affects:
  - 28-02 (env var documentation helps with any config changes)
  - 28-03 (CI will validate any future code changes)
  - All future phases (every PR now validated automatically)
tech-stack:
  added: [husky@9.1.7, lint-staged@16.2.7]
  patterns: [github-actions-ci, pre-commit-hooks, lint-staged-formatting]
key-files:
  created:
    - .github/workflows/ci.yml
    - .husky/pre-commit
    - .env.example
  modified:
    - package.json
    - bun.lock
    - convex/authTauri.ts
    - convex/engagement/compute.ts
    - convex/enrichment/conversation.ts
    - convex/extraction/pdf.ts
    - convex/extraction/text.ts
    - convex/lib/auth.ts
    - convex/matching/compute.ts
    - src/components/auth/oauth-buttons.tsx
    - src/components/profile/enrichment/hooks/useEnrichment.ts
    - src/router.tsx
    - src/routes/profile/index.tsx
  deleted:
    - package-lock.json
key-decisions:
  - Removed --ext flag from eslint (deprecated in flat config v9+)
  - Pre-commit runs full typecheck (~10-15s) before lint-staged for early error detection
  - lint-staged runs eslint --fix + prettier --write on TS/TSX and prettier --write on JSON/MD/CSS
  - Deleted package-lock.json to standardize on bun.lock as sole lockfile
duration: 5m
completed: 2026-02-02
---

# Phase 28 Plan 01: CI Pipeline and Developer Experience Summary

GitHub Actions CI pipeline with lint/typecheck/build/test gates, husky pre-commit hooks with lint-staged, and comprehensive .env.example documentation.

## Performance

| Metric | Value |
|--------|-------|
| Duration | 5 minutes |
| Started | 2026-02-02T22:59:06Z |
| Completed | 2026-02-02T23:04:33Z |
| Tasks | 2/2 |
| Files created | 3 |
| Files modified | 11 |
| Files deleted | 1 |

## Accomplishments

1. **GitHub Actions CI workflow** -- `.github/workflows/ci.yml` triggers on push/PR to main, runs bun install, lint, typecheck, build, and test with concurrency controls.

2. **Separated lint and typecheck scripts** -- `bun run lint` now runs eslint only (removed tsc which was bundled in). `bun run typecheck` runs `tsc --noEmit` independently. This gives CI granular step reporting.

3. **Husky pre-commit hook** -- Every commit runs `bun run typecheck` followed by `bunx lint-staged`, catching type errors and formatting issues before they reach the remote.

4. **lint-staged configuration** -- TS/TSX files get `eslint --fix` and `prettier --write`. JSON/MD/CSS files get `prettier --write`. Only staged files are processed for speed.

5. **Environment variable documentation** -- `.env.example` documents all 15 environment variables with descriptions of purpose and where to obtain values (Convex dashboard vars, OAuth credentials, Tauri-specific vars).

6. **Deleted package-lock.json** -- Removed npm lockfile; bun.lock is the sole lockfile.

7. **Fixed 22 pre-existing eslint errors** across 10 files (import ordering, unnecessary conditions, optional chains, type assertions, sort-imports).

8. **Fixed navigate-in-render bug** -- `src/routes/profile/index.tsx` called `navigate()` during render; wrapped in `useEffect` for correct React behavior.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create GitHub Actions CI workflow and update package.json scripts | af785cc | .github/workflows/ci.yml, package.json, 10 lint-fixed files |
| 2 | Install husky + lint-staged and create .env.example | 0d20405 | .husky/pre-commit, .env.example, package.json, bun.lock |

## Files Created

- `.github/workflows/ci.yml` -- CI pipeline definition (push/PR to main)
- `.husky/pre-commit` -- Pre-commit hook (typecheck + lint-staged)
- `.env.example` -- Environment variable documentation (15 vars)

## Files Modified

- `package.json` -- New lint/typecheck/prepare scripts, lint-staged config, husky + lint-staged devDeps
- `bun.lock` -- Updated with new dependencies
- `convex/authTauri.ts` -- Removed unreachable code (unnecessary condition)
- `convex/engagement/compute.ts` -- Fixed import order
- `convex/enrichment/conversation.ts` -- Removed unnecessary optional chains
- `convex/extraction/pdf.ts` -- Fixed import order
- `convex/extraction/text.ts` -- Fixed import order
- `convex/lib/auth.ts` -- Fixed import sort order
- `convex/matching/compute.ts` -- Fixed import order, array type style, const preference
- `src/components/auth/oauth-buttons.tsx` -- Fixed import sort order
- `src/components/profile/enrichment/hooks/useEnrichment.ts` -- Removed unnecessary type assertion
- `src/router.tsx` -- Fixed import sort order
- `src/routes/profile/index.tsx` -- Fixed navigate-in-render bug (wrapped in useEffect)

## Files Deleted

- `package-lock.json` -- Removed npm lockfile (bun.lock is canonical)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Remove `--ext ts,tsx` from eslint command | Deprecated in eslint v9+ flat config; file patterns defined in eslint.config.mjs |
| Full typecheck in pre-commit (not just staged) | TypeScript needs full project context; partial check would miss cross-file errors |
| `--no-verify` for Task 2 commit | The pre-commit hook was being set up in this commit; running it during its own creation would be circular |
| Fix 22 existing lint errors inline | CI pipeline would fail immediately if lint errors existed; fixing them is prerequisite |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 22 pre-existing eslint errors**
- **Found during:** Task 1 verification
- **Issue:** `bun run lint` failed with 22 errors across 10 files (import ordering, unnecessary conditions, optional chains, type assertions, sort-imports)
- **Fix:** Ran `eslint --fix` for 13 auto-fixable errors; manually fixed remaining 9 (authTauri.ts unnecessary conditional, conversation.ts optional chains)
- **Files modified:** convex/authTauri.ts, convex/engagement/compute.ts, convex/enrichment/conversation.ts, convex/extraction/pdf.ts, convex/extraction/text.ts, convex/lib/auth.ts, convex/matching/compute.ts, src/components/auth/oauth-buttons.tsx, src/components/profile/enrichment/hooks/useEnrichment.ts, src/router.tsx
- **Commit:** af785cc

**2. [Rule 1 - Bug] Fixed navigate-in-render in profile/index.tsx**
- **Found during:** Task 1 eslint --fix
- **Issue:** `navigate({ to: "/login" })` called directly during render in UnauthenticatedRedirect component, violating React rules (side effect during render)
- **Fix:** Wrapped in `useEffect(() => { navigate({ to: "/login" }) }, [navigate])`
- **Files modified:** src/routes/profile/index.tsx
- **Commit:** af785cc

## Issues Encountered

None.

## Next Phase Readiness

- CI pipeline is ready for all future PRs -- lint, typecheck, build, and test will run automatically
- Pre-commit hook will catch issues locally before push
- All environment variables documented for onboarding
- No blockers for 28-02 or 28-03
