# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**

- React components: PascalCase for components that export a named component matching the filename (`OpportunityCard.tsx`, `ProfileSectionCard.tsx`)
- React components that are utility/layout: kebab-case when they are page-scoped or contain multiple exports (`opportunity-card.tsx`, `public-header.tsx`, `theme-provider.tsx`)
- Custom hooks: kebab-case prefixed with `use-` (`use-media-query.ts`, `use-haptic.ts`)
- Convex backend files: camelCase per domain (`opportunityApplications.ts`, `orgMemberships.ts`)
- Utility/lib files: camelCase (`formatDeadline.ts`, `matchScoring.ts`, `roleTypes.ts`)

**Functions:**

- React components: PascalCase (`function OpportunityCard(...)`, `function AttendanceHistoryPage()`)
- Hook functions: camelCase prefixed with `use` (`useMediaQuery`, `useIsMobile`, `useIsDesktop`)
- Utility/pure functions: camelCase (`computeGlobalFitScore`, `formatDeadline`, `getDeadlineUrgency`)
- Convex auth helpers: camelCase verbs (`getUserId`, `requireAuth`, `requirePlatformAdmin`, `isPlatformAdmin`)
- Factory functions: `createEmpty[Entity]` pattern (e.g., `createEmptyEntry()`)

**Variables:**

- camelCase throughout
- Boolean flags: verb prefix (`isEditing`, `isSaving`, `isComplete`, `isRemote`)
- Constants: SCREAMING_SNAKE_CASE (`ACTIVE_OPPORTUNITY_KEY`, `EXPERIENCE_LEVEL_LABELS`, `MODEL_QUALITY`, `FIELD_LIMITS`)

**Types / Interfaces:**

- Interfaces for component props: `[ComponentName]Props` suffix (`EducationStepProps`, `ProfileSectionCardProps`, `MemberDirectoryProps`)
- Types for domain objects: plain PascalCase (`Opportunity`, `Member`, `MatchSortOrder`)
- Prefer `interface` for component props, `type` for unions and domain shapes

**Convex-specific:**

- Exported Convex functions: camelCase verb describing action (`getMyMatches`, `listPaginated`, `markAsApplied`)
- Index names: include all indexed fields, `by_field1_and_field2` format (per `convex/CLAUDE.md`)

## Code Style

**Formatting:**

- Tool: Prettier 3.x
- No semicolons (`"semi": false`)
- Single quotes (`"singleQuote": true`)
- Trailing commas everywhere (`"trailingComma": "all"`)

**Linting:**

- Tool: ESLint with `@tanstack/eslint-config` + `@convex-dev/eslint-plugin`
- Zero warnings allowed (`--max-warnings 0`)
- TypeScript strict mode: `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- `verbatimModuleSyntax`: type imports must use `import type`

**Pre-commit hooks (via Husky + lint-staged):**

- On `*.{ts,tsx}`: ESLint fix + Prettier write
- On `*.{json,md,css}`: Prettier write
- Full `bun run typecheck` runs before commit

## Import Organization

**Order (by convention in examined files):**

1. External framework imports (React, TanStack Router, Convex)
2. Third-party libraries (lucide-react, sonner, date-fns)
3. Relative Convex generated imports (`../../convex/_generated/api`, `../../../convex/_generated/dataModel`)
4. Path-aliased internal imports (`~/components/...`, `~/lib/...`, `~/hooks/...`)

**Path Aliases:**

- `~/` maps to `src/` (configured in both `tsconfig.json` and Vite via `vite-tsconfig-paths`)
- Convex generated imports use relative paths (not aliased): `../../convex/_generated/api`
- Prefer `~/` alias for all `src/` imports; use relative paths only for convex-generated files

**Type imports:**

- Always use `import type { ... }` for type-only imports (required by `verbatimModuleSyntax`)

## Error Handling

**Frontend:**

- Async mutation handlers wrap in try/catch/finally pattern
- On success: `toast.success('...')` via `sonner`
- On error: `toast.error(error instanceof Error ? error.message : 'Fallback message')`
- `finally`: reset loading state boolean

```typescript
const handleSave = async () => {
  setIsSaving(true)
  try {
    await someAction({ ... })
    toast.success('Saved successfully')
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to save')
  } finally {
    setIsSaving(false)
  }
}
```

- Fire-and-forget mutations: `.catch(console.error)` or `.catch(() => {})` for silent failures
- Route-level errors: caught by TanStack Router `errorComponent` on `__root.tsx` → `ErrorDisplay` → Sentry capture

**Backend (Convex):**

- Auth failures: `throw new Error('Not authenticated')` or `throw new Error('Admin access required')` (plain `Error` for auth)
- Structured client errors: `ConvexError` from `convex/values` for user-facing structured data (e.g., rate limit payloads)
- Validation: `throw new Error('Descriptive message')` inline after guard checks
- Pattern: guard-clause style — check and throw early, then proceed

```typescript
if (!userId) throw new Error('Not authenticated')
if (!space) throw new Error('Space not found')
// ...proceed with logic
```

## Logging

**Backend:** `convex/lib/logging.ts` — structured JSON logging

```typescript
import { log } from '../lib/logging'
log('info', 'Profile extraction started', { userId, modelId })
log('error', 'Extraction failed', { userId, error: err.message })
```

**Frontend:** `console.error` for caught errors in fire-and-forget mutations only; no general frontend logging framework. Errors flow to Sentry via `ErrorDisplay` and `capture_exceptions: true` in PostHog.

## Comments

**When to Comment:**

- JSDoc-style `/** ... */` on exported pure functions, especially in `convex/lib/` (e.g., `convex/lib/auth.ts` documents every exported function)
- Inline `//` comments for non-obvious logic or to label JSX sections (`{/* Row 1: Badges */}`)
- Block comments explain architectural decisions or migration context (`// Legacy auth tables ... kept temporarily for user ID migration`)

**Pattern:**

```typescript
/**
 * Require the current user to be authenticated.
 * Throws "Not authenticated" if no valid session exists.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<string> {
```

## Function Design

**Size:** Functions stay focused; complex pages split into sub-components within the same file (page component → authenticated content component → leaf components)

**Parameters:** Props destructured at function signature, not inside body. Single props object for components using `interface Props` pattern.

**Return Values:**

- Components return JSX
- Hooks return primitives or small objects
- Convex queries: always include `returns:` validator (required by `convex/CLAUDE.md`)
- Use `returns: v.null()` when mutation returns nothing

## Module Design

**Exports:**

- Named exports only (no default exports for components or functions)
- Route files are the exception: `export const Route = createFileRoute(...)` is the named export convention from TanStack Router
- No `export default` observed in `src/` or `convex/`

**Barrel Files:**

- Used selectively for component groups that are imported together (e.g., `src/components/attendance/index.ts`, `src/components/notifications/index.ts`, `src/components/profile/upload/index.ts`)
- Not used for all directories — most imports go directly to source files

## Convex-Specific Rules (from `convex/CLAUDE.md`)

- Every function must have both `args:` and `returns:` validators
- Never use `.filter()` in queries — use `.withIndex()`
- Use `internalQuery`/`internalMutation`/`internalAction` for backend-only functions
- Add `"use node"` at top of any file that uses Node.js built-ins or external Node-only APIs
- Never use `ctx.db` inside actions — use `ctx.runQuery`/`ctx.runMutation`
- Use `v.int64()` for 64-bit integers, `v.record()` for dynamic-key objects

---

_Convention analysis: 2026-03-10_
