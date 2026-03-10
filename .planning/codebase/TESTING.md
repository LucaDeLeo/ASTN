# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Runner:**

- None detected. No test runner (Jest, Vitest, etc.) is configured. No `jest.config.*` or `vitest.config.*` exists.
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files exist in `src/` or `convex/`.

**Assertion Library:**

- None — no testing library is installed as a dependency or devDependency in `package.json`.

**Run Commands:**

```bash
# No test commands defined in package.json scripts
bun run lint          # Linting (ESLint, max-warnings 0)
bun run typecheck     # TypeScript type checking (tsc --noEmit)
```

## Test File Organization

**Location:**

- No test files exist in this codebase.

**Naming:**

- No established pattern (no tests exist).

**Structure:**

- No established pattern.

## Quality Enforcement (Substitute for Tests)

The codebase enforces quality via static analysis rather than runtime tests:

**TypeScript (strict mode):**

- `strict: true` — catches many classes of runtime errors at compile time
- `noUnusedLocals`, `noUnusedParameters` — enforces clean code
- `noFallthroughCasesInSwitch` — prevents switch statement bugs
- `verbatimModuleSyntax` — enforces explicit type imports
- Runs as pre-commit gate: `bun run typecheck`

**ESLint:**

- `@tanstack/eslint-config` + `@convex-dev/eslint-plugin`
- Zero tolerance: `--max-warnings 0`
- Auto-fixed and Prettier-formatted on every commit via `lint-staged`

**Convex Schema Validators:**

- Every query/mutation/action requires `args:` and `returns:` validators
- Runtime validation on all server function inputs/outputs acts as a contract layer

**Pre-commit Hook (Husky):**

```bash
# .husky/pre-commit runs:
bun run typecheck
bunx lint-staged
```

## Test Types

**Unit Tests:**

- Not present.

**Integration Tests:**

- Not present.

**E2E Tests:**

- Not present. No Playwright, Cypress, or similar framework installed.

## Logic Suitable for Unit Testing

Pure utility functions in `src/lib/` and `convex/lib/` would be natural unit test candidates if a framework were added:

- `src/lib/matchScoring.ts` — `computeGlobalFitScore`, `computeUrgencyScore`, `computeCombinedScore`, `sortMatches`
- `src/lib/formatDeadline.ts` — `formatDeadline`, `formatPostedAt`, `getDeadlineUrgency`
- `src/lib/formatLocation.ts` — `formatLocation`
- `convex/lib/bookingValidation.ts` — `validateBookingTime`, `getTodayInTimezone`
- `convex/lib/formFields.ts` — `validateResponses`, `getRequiredFields`, `labelToKey`
- `convex/profiles.ts` — `computeProfileCompleteness` (exported pure function)

## Adding Tests (If Introduced)

**Recommended framework:** Vitest (compatible with the existing Vite/Bun stack)

**Install:**

```bash
bun add -d vitest @vitest/ui
```

**Add to `package.json` scripts:**

```json
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage"
```

**Suggested config file:** `vitest.config.ts` at project root

**Natural starting points:**

1. Unit tests for `src/lib/matchScoring.ts` (pure functions, no dependencies)
2. Unit tests for `convex/lib/bookingValidation.ts` (pure validation logic)
3. Unit tests for `convex/lib/formFields.ts` (pure utility functions)

---

_Testing analysis: 2026-03-10_
