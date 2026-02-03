---
phase: 30-phase-30
plan: 01
subsystem: database, auth, api
tags: [convex, platform-admin, org-applications, schema, slug, notifications]

# Dependency graph
requires:
  - phase: none
    provides: first plan in v1.5 milestone
provides:
  - platformAdmins table and auth helpers
  - orgApplications table with full status machine
  - Org application CRUD mutations and queries
  - Slug generation utility
  - Extended notification types for org application decisions
affects:
  - 30-02 (frontend routes for application form, review queue, status page)
  - 31 (org admin pages that reference org applications)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Platform admin role: separate platformAdmins table with requirePlatformAdmin/isPlatformAdmin helpers"
    - "Application status machine: pending -> approved | rejected | withdrawn"
    - "Approval side-effects: atomic org + membership + notification creation in single mutation"

key-files:
  created:
    - convex/orgApplications.ts
    - convex/lib/slug.ts
    - convex/lib/seedPlatformAdmin.ts
  modified:
    - convex/schema.ts
    - convex/lib/auth.ts
    - convex/notifications/mutations.ts
    - src/components/notifications/NotificationList.tsx

key-decisions:
  - "Platform admin is a separate table, not overloading orgMemberships admin role"
  - "Slug helper uses db uniqueness check with -2, -3 suffix collision resolution"
  - "Duplicate application check uses case-insensitive normalized org name against both organizations and orgApplications tables"

patterns-established:
  - "requirePlatformAdmin pattern: query platformAdmins table by userId index"
  - "generateSlug pattern: normalize name + db uniqueness loop in convex/lib/slug.ts"

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 30 Plan 01: Schema + Auth + Org Applications Backend Summary

**Platform admin role model with orgApplications CRUD, slug generation, and notification integration for org onboarding flow**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T03:47:28Z
- **Completed:** 2026-02-03T03:51:07Z
- **Tasks:** 6/6
- **Files modified:** 7

## Accomplishments
- Platform admin identity model: `platformAdmins` table + `requirePlatformAdmin`/`isPlatformAdmin` helpers
- Complete org application lifecycle: submit with duplicate detection, approve (atomically creates org + membership + notification), reject with reason, withdraw
- Slug generation utility with db-level uniqueness checking
- Notification system extended with two new types without breaking existing rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Add new tables and extend notifications schema** - `8e1ae9b` (feat)
2. **Task 2: Add requirePlatformAdmin auth helper** - `91231a3` (feat)
3. **Task 3: Create org applications Convex module** - `1df6b3c` (feat)
4. **Task 4: Create seed platform admin mutation** - `cdd47bf` (feat)
5. **Task 5: Update notification creation types** - `bfa9b35` (feat)
6. **Task 6: Slug generation helper** - included in `1df6b3c` (created as Task 3 dependency)
7. **Bug fix: NotificationList rendering** - `ab77bef` (fix)

## Files Created/Modified
- `convex/schema.ts` - Added platformAdmins and orgApplications tables, extended notifications union
- `convex/lib/auth.ts` - Added requirePlatformAdmin and isPlatformAdmin helpers
- `convex/orgApplications.ts` - Full CRUD module: submit, approve, reject, withdraw, listAll, getMyApplications, getApplication, checkPlatformAdmin
- `convex/lib/slug.ts` - URL-safe slug generation with db uniqueness checking
- `convex/lib/seedPlatformAdmin.ts` - Internal mutation to bootstrap first platform admin by email
- `convex/notifications/mutations.ts` - Extended createNotification type union and args
- `src/components/notifications/NotificationList.tsx` - Added new notification type icons and type definitions

## Decisions Made
- Platform admin uses a dedicated `platformAdmins` table (not org membership overload) for clean separation of platform-level vs org-level admin privileges
- Slug generation lives in `convex/lib/slug.ts` as a reusable utility with db-level uniqueness checking (appends -2, -3, etc.)
- Duplicate application detection uses case-insensitive normalized org name matching against both `organizations` and `orgApplications` tables (pending/approved only)
- Seed platform admin is an internal mutation (run from Convex dashboard), consistent with existing `bootstrapOrgAdmin` pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created slug helper early (Task 6 content in Task 3)**
- **Found during:** Task 3 (org applications module)
- **Issue:** The `approve` mutation requires `generateSlug` from `convex/lib/slug.ts`, which was planned as Task 6
- **Fix:** Created the slug helper file during Task 3 and committed together
- **Files modified:** convex/lib/slug.ts
- **Verification:** Slug helper works correctly in approve mutation
- **Committed in:** 1df6b3c (Task 3 commit)

**2. [Rule 1 - Bug] Fixed NotificationList crash on new notification types**
- **Found during:** Post-Task 5 verification
- **Issue:** `NotificationList.tsx` had hardcoded type union and typeIcons map that didn't include `org_application_approved`/`org_application_rejected`, which would cause undefined Icon crash at runtime
- **Fix:** Added new types to interface, imported Building2 and XCircle icons, typed typeIcons as Record for compile-time safety
- **Files modified:** src/components/notifications/NotificationList.tsx
- **Verification:** All notification types now have corresponding icons and type definitions
- **Committed in:** ab77bef

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
**Platform admin seeding required.** After deploying, run from the Convex dashboard:
```
lib/seedPlatformAdmin:seedPlatformAdmin({ email: "your-admin@example.com" })
```
This bootstraps the first platform admin who can then review org applications.

## Next Phase Readiness
- All backend infrastructure ready for 30-02 (frontend routes)
- Schema, mutations, queries, and auth helpers are complete
- Frontend will need: application form page, application status page, admin review queue
- No blockers

---
*Phase: 30-phase-30*
*Completed: 2026-02-03*
