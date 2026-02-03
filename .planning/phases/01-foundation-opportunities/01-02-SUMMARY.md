---
phase: 01-foundation-opportunities
plan: 02
subsystem: database, admin
tags: [convex, tanstack-router, shadcn, crud, opportunities]

# Dependency graph
requires:
  - phase: 01-01
    provides: TanStack Start + Convex + shadcn foundation
provides:
  - Opportunity data model with full schema
  - Convex queries for listing/searching opportunities
  - Admin mutations for CRUD operations
  - Admin layout at /admin with navigation
  - Opportunity list view at /admin/opportunities
  - Opportunity form for create/edit
affects: [01-03, 01-04, aggregation, public-browsing]

# Tech tracking
tech-stack:
  added:
    [date-fns, shadcn/label, shadcn/textarea, shadcn/select, shadcn/checkbox]
  patterns:
    [
      convex-tanstack-query-mutations,
      admin-layout-pattern,
      reusable-form-pattern,
    ]

key-files:
  created:
    - convex/opportunities.ts
    - convex/admin.ts
    - src/routes/admin/route.tsx
    - src/routes/admin/index.tsx
    - src/routes/admin/opportunities/index.tsx
    - src/routes/admin/opportunities/new.tsx
    - src/routes/admin/opportunities/$id/edit.tsx
    - src/components/admin/opportunity-form.tsx
  modified:
    - convex/schema.ts

key-decisions:
  - 'Used separate convex files for public queries (opportunities.ts) vs admin mutations (admin.ts)'
  - 'Form uses useState for local state + TanStack Query mutations for Convex'
  - 'Refactored Convex query chains to avoid TypeScript reassignment issues'

patterns-established:
  - 'Admin layout: /admin route.tsx with Outlet for nested routes'
  - 'Convex mutation pattern: useConvexMutation then useMutation wrapper'
  - 'OpportunityForm reused for both create and edit with mode prop'

# Metrics
duration: 7min
completed: 2026-01-17
---

# Phase 1 Plan 2: Opportunity Model + Admin CRUD Summary

**Convex opportunity schema with search indexes, admin CRUD mutations, and TanStack Router admin UI at /admin/opportunities**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-17T22:22:09Z
- **Completed:** 2026-01-17T22:28:46Z
- **Tasks:** 4
- **Files modified:** 13

## Accomplishments

- Opportunity table defined with sourceId, title, organization, location, roleType, status fields
- Five indexes created: by_source_id, by_organization, by_status, by_role_type, by_location
- Search index on title field with filters for status, roleType, isRemote
- Admin layout with navigation at /admin
- Full CRUD for opportunities: list, create, edit, archive, delete
- Reusable OpportunityForm component for create/edit workflows

## Task Commits

Each task was committed atomically:

1. **Task 1: Define opportunity schema and indexes** - `3fda5c3` (feat)
2. **Task 2: Create opportunity queries and admin mutations** - `f37f886` (feat)
3. **Task 3: Build admin layout and opportunity list page** - `d2e7c1b` (feat)
4. **Task 4: Build opportunity form and create/edit pages** - `964e17e` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added opportunities table with all indexes
- `convex/opportunities.ts` - Public queries: list, get, search, listAll
- `convex/admin.ts` - Admin mutations: createOpportunity, updateOpportunity, deleteOpportunity, archiveOpportunity
- `src/routes/admin/route.tsx` - Admin layout with header and navigation
- `src/routes/admin/index.tsx` - Admin dashboard with opportunities card
- `src/routes/admin/opportunities/index.tsx` - Opportunity list with archive/delete actions
- `src/routes/admin/opportunities/new.tsx` - New opportunity page
- `src/routes/admin/opportunities/$id/edit.tsx` - Edit opportunity page with data loading
- `src/components/admin/opportunity-form.tsx` - Reusable form for create/edit
- `src/components/ui/label.tsx` - shadcn Label component
- `src/components/ui/textarea.tsx` - shadcn Textarea component
- `src/components/ui/select.tsx` - shadcn Select component
- `src/components/ui/checkbox.tsx` - shadcn Checkbox component

## Decisions Made

- Used separate Convex files for public queries vs admin mutations for clarity
- Refactored query chaining in opportunities.ts to avoid TypeScript issues with query reassignment
- OpportunityForm uses useState for local form state, TanStack Query mutations for Convex calls
- isPending state derived from mutation hooks rather than separate useState

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Convex query TypeScript errors**

- **Found during:** Task 2 (Create opportunity queries)
- **Issue:** Reassigning `let q = ctx.db.query()` then `q = q.withIndex()` caused TypeScript type mismatch
- **Fix:** Refactored to use separate return statements for each branch instead of reassignment
- **Files modified:** convex/opportunities.ts
- **Verification:** `bun convex dev --once` succeeds without errors
- **Committed in:** f37f886 (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed path alias from @ to ~**

- **Found during:** Task 3 (Build admin layout)
- **Issue:** Plan used `@/components/ui/` but tsconfig uses `~/` alias
- **Fix:** Changed all imports to use `~/` prefix
- **Files modified:** src/routes/admin/route.tsx, src/routes/admin/index.tsx, src/routes/admin/opportunities/index.tsx
- **Verification:** TypeScript check passes for component imports
- **Committed in:** d2e7c1b (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for code to compile. No scope creep.

## Issues Encountered

None - execution proceeded smoothly after auto-fixes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Opportunity schema ready for aggregation (01-03)
- Admin can manually add test opportunities
- lastVerified field available for freshness tracking (OPPS-06)
- Search index ready for public browsing (01-04)

---

_Phase: 01-foundation-opportunities_
_Completed: 2026-01-17_
