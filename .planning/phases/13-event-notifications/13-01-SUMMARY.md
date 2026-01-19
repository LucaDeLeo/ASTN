---
phase: 13-event-notifications
plan: 01
subsystem: notifications
tags: [convex, schema, settings, notifications, events]

# Dependency graph
requires:
  - phase: 12-event-management
    provides: events table and lu.ma sync infrastructure
provides:
  - Event notification preferences on profiles
  - notifications table for in-app notification center
  - eventViews table for reminder audience tracking
  - scheduledReminders table for reminder cancellation
  - EventNotificationPrefsForm settings component
affects: [13-02-notification-delivery, 14-member-engagement]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Event notification preferences stored on profiles (not separate table)
    - Default values returned for unconfigured users (weekly, 1 day + 1 hour reminders)
    - Org muting via mutedOrgIds array

key-files:
  created:
    - src/components/settings/EventNotificationPrefsForm.tsx
  modified:
    - convex/schema.ts
    - convex/profiles.ts
    - src/routes/settings/index.tsx

key-decisions:
  - "Weekly digest as default frequency per CONTEXT.md"
  - "1 day + 1 hour before as default reminders per CONTEXT.md"
  - "Org muting stored as mutedOrgIds array (orgs with switch OFF)"

patterns-established:
  - "Event notification preferences follow existing notificationPreferences pattern on profiles"

# Metrics
duration: 4min
completed: 2026-01-19
---

# Phase 13 Plan 01: Event Notification Schema and Preferences UI Summary

**Schema foundation for event notifications with user-configurable frequency, reminders, and org muting preferences**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-19T19:05:02Z
- **Completed:** 2026-01-19T19:08:46Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added eventNotificationPreferences field to profiles table with frequency (all/daily/weekly/none), reminderTiming, and mutedOrgIds
- Created notifications, eventViews, and scheduledReminders tables for in-app notifications and reminder tracking
- Built EventNotificationPrefsForm component with frequency dropdown, reminder checkboxes, and per-org muting switches
- Integrated form into settings page below existing notification preferences

## Task Commits

Each task was committed atomically:

1. **Task 1: Add event notification schema** - `f3bd080` (feat)
2. **Task 2: Add event notification preferences mutation and UI** - `a92343d` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added eventNotificationPreferences to profiles, notifications/eventViews/scheduledReminders tables
- `convex/profiles.ts` - Added getEventNotificationPreferences query and updateEventNotificationPreferences mutation
- `src/components/settings/EventNotificationPrefsForm.tsx` - New component for event notification settings
- `src/routes/settings/index.tsx` - Import and render EventNotificationPrefsForm

## Decisions Made

1. **Weekly digest as default frequency** - Per CONTEXT.md, safe default that doesn't overwhelm users
2. **1 day + 1 hour before as default reminders** - Per CONTEXT.md, balanced reminder frequency
3. **Org muting via mutedOrgIds** - Switch ON = notifications enabled, switch OFF = org added to mutedOrgIds

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema infrastructure complete for event notifications
- Preferences UI functional and integrated
- Ready for Plan 02 to implement notification delivery (crons, digests, reminders)

---
*Phase: 13-event-notifications*
*Completed: 2026-01-19*
