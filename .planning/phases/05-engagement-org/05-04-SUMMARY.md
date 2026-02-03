---
phase: 05-engagement-org
plan: 04
subsystem: database, api
tags: [convex, organizations, membership, roles, invites]

# Dependency graph
requires:
  - phase: 03-profiles
    provides: User profile structure and auth patterns
provides:
  - Org membership schema with roles (admin/member)
  - Directory visibility controls per member
  - Invite link system with expiration
  - Member CRUD operations
  - Admin-only operations with authorization
affects: [05-05, 05-06, org-dashboard, member-directory]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - requireOrgAdmin helper for authorization checks
    - First-member-becomes-admin pattern for org creation

key-files:
  created:
    - convex/orgs/membership.ts
    - convex/orgs/admin.ts
  modified:
    - convex/schema.ts

key-decisions:
  - 'First user to join org becomes admin (per CONTEXT.md)'
  - 'Last admin cannot leave or demote self without promoting another'
  - 'Invite tokens are UUIDs with optional expiration'
  - 'Directory visibility is member-controlled (visible/hidden)'

patterns-established:
  - 'requireOrgAdmin helper for admin-only operations'
  - 'Org membership queries filter by userId index then orgId'

# Metrics
duration: 4min
completed: 2026-01-18
---

# Phase 5 Plan 4: Org Membership Data Model Summary

**Convex schema tables for org memberships with roles, directory visibility, and invite links plus membership/admin functions**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-18T06:11:34Z
- **Completed:** 2026-01-18T06:15:33Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Schema extended with orgMemberships and orgInviteLinks tables
- Membership functions for join/leave/visibility control
- Admin functions for member management and invite links
- First-member-becomes-admin pattern implemented
- Last-admin protection on leave and demote operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend schema with membership and invite tables** - `7760423` (feat)
2. **Task 2: Create membership functions** - `1660516` (feat)
3. **Task 3: Create admin functions** - `fda1734` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added orgMemberships and orgInviteLinks tables with indexes
- `convex/orgs/membership.ts` - Join/leave org, directory visibility, user memberships
- `convex/orgs/admin.ts` - Remove/promote/demote members, invite link management

## Decisions Made

- First user to join an org becomes admin (per CONTEXT.md)
- Last admin cannot leave org or demote self without promoting another member first
- Invite tokens are crypto.randomUUID() with optional day-based expiration
- Directory visibility is "visible" or "hidden" (member-controlled)
- Admin functions use requireOrgAdmin helper for consistent authorization

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema and functions ready for:
  - Plan 05: Org admin dashboard UI
  - Plan 06: Member directory page
- Functions available via Convex API:
  - `orgs.membership.joinOrg`, `orgs.membership.leaveOrg`
  - `orgs.admin.createInviteLink`, `orgs.admin.removeMember`

---

_Phase: 05-engagement-org_
_Completed: 2026-01-18_
