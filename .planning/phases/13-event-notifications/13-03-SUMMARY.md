---
phase: 13-event-notifications
plan: 03
subsystem: notifications
tags: [convex, notifications, scheduler, react, intersection-observer, popover]

# Dependency graph
requires:
  - phase: 13-01
    provides: notifications, eventViews, scheduledReminders tables and notification preference schema
provides:
  - In-app notification center with bell icon
  - getUnreadCount and getRecentNotifications queries
  - markAsRead and markAllAsRead mutations
  - recordEventView mutation for reminder audience tracking
  - Reminder scheduling system (scheduleRemindersForViewInternal, sendReminder)
  - NotificationBell and NotificationList components
affects: [14-member-engagement]

# Tech tracking
tech-stack:
  added:
    - '@radix-ui/react-popover'
  patterns:
    - Intersection Observer for view tracking in EventCard
    - Popover for notification dropdown
    - Scheduler-based reminder system with scheduledReminders table for cancellation

key-files:
  created:
    - convex/notifications/queries.ts
    - convex/notifications/mutations.ts
    - convex/notifications/scheduler.ts
    - src/components/notifications/NotificationBell.tsx
    - src/components/notifications/NotificationList.tsx
    - src/components/notifications/index.ts
    - src/components/ui/popover.tsx
  modified:
    - src/components/layout/auth-header.tsx
    - src/components/events/EventCard.tsx

key-decisions:
  - 'Intersection Observer for event view tracking (50% threshold before recording)'
  - 'Scheduler-based reminders using ctx.scheduler.runAt for future notifications'
  - 'scheduledReminders table tracks scheduled functions for cancellation capability'

patterns-established:
  - 'Notification bell pattern: query for unread count + recent notifications in popover'
  - 'Event view tracking via Intersection Observer for implicit interest signals'

# Metrics
duration: 8min
completed: 2026-01-19
---

# Phase 13 Plan 03: In-App Notification Center and Event Reminders Summary

**Notification bell with unread badge in navigation, event view tracking via Intersection Observer, and scheduler-based reminder system for upcoming events**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-19T19:11:05Z
- **Completed:** 2026-01-19T19:19:31Z
- **Tasks:** 4
- **Files modified:** 10

## Accomplishments

- Built notification queries (getUnreadCount, getRecentNotifications) with event/org enrichment
- Created notification mutations (markAsRead, markAllAsRead, recordEventView, createNotification)
- Implemented reminder scheduler (scheduleRemindersForViewInternal, sendReminder, cancelEventReminders)
- Added NotificationBell component with popover dropdown showing recent notifications
- Wired NotificationBell into auth-header navigation for authenticated users
- Added recordEventView tracking to EventCard using Intersection Observer

## Task Commits

Each task was committed atomically:

1. **Task 1: Create notification queries and mutations** - `24146fe` (feat)
2. **Task 2: Create notification bell component** - `1c80298` (feat)
3. **Task 3: Wire notification bell into navigation** - `71b5445` (feat)
4. **Task 4: Wire recordEventView from EventCard** - `fd84edb` (feat)

## Files Created/Modified

- `convex/notifications/queries.ts` - getUnreadCount and getRecentNotifications with event/org enrichment
- `convex/notifications/mutations.ts` - markAsRead, markAllAsRead, createNotification, recordEventView
- `convex/notifications/scheduler.ts` - scheduleRemindersForViewInternal, sendReminder, cancelEventReminders
- `src/components/notifications/NotificationBell.tsx` - Bell icon with unread badge and popover dropdown
- `src/components/notifications/NotificationList.tsx` - List of notifications with type icons and read/unread styling
- `src/components/notifications/index.ts` - Barrel exports
- `src/components/ui/popover.tsx` - Popover component using @radix-ui/react-popover
- `src/components/layout/auth-header.tsx` - Added NotificationBell to navigation
- `src/components/events/EventCard.tsx` - Added recordEventView call via Intersection Observer

## Decisions Made

1. **Intersection Observer for view tracking** - Used 50% visibility threshold to record event views when cards scroll into viewport
2. **Scheduler-based reminders** - Using ctx.scheduler.runAt to schedule future reminder notifications at user-configured times
3. **scheduledReminders table** - Tracks scheduled function IDs to enable reminder cancellation if events change

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @radix-ui/react-popover dependency**

- **Found during:** Task 2 (NotificationBell component)
- **Issue:** Popover component required for dropdown but not installed
- **Fix:** Installed @radix-ui/react-popover and created src/components/ui/popover.tsx
- **Files modified:** package.json, bun.lock, src/components/ui/popover.tsx
- **Committed in:** 1c80298

---

**Total deviations:** 1 auto-fixed (blocking - missing dependency)
**Impact on plan:** Necessary to complete notification bell dropdown. No scope creep.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- In-app notification center complete with bell icon and dropdown
- Event view tracking enables reminder audience targeting
- Reminder scheduling system ready to create notifications at configured times
- Phase 13 complete - notification schema, preferences UI, and in-app center all functional
- Ready for Phase 14: Member Engagement

---

_Phase: 13-event-notifications_
_Completed: 2026-01-19_
