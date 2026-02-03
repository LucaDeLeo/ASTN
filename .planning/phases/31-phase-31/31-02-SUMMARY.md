# Plan 31-02 Summary: Frontend — Org Setup Wizard, Onboarding Checklist, Space Configuration

## Completed: 2026-02-03

## What Was Built

### Org Setup Page (`/org/$slug/admin/setup`)

**File:** `src/routes/org/$slug/admin/setup.tsx`

Four-section single-page form:

1. **Logo Upload** — Circular preview, file input with 5MB limit, upload via Convex storage
2. **Organization Details** — Description textarea, contact email, website URL inputs
3. **Social Links** — Dynamic list of platform/URL pairs with add/remove
4. **Invite Link & Bulk Invite** — Copy existing link or generate message for multiple emails

### Space Configuration Page (`/org/$slug/admin/space`)

**File:** `src/routes/org/$slug/admin/space.tsx`

- Create new space or edit existing
- Name, capacity, timezone fields
- Operating hours editor (7-day grid)
- Guest access toggle
- Custom visit fields editor (only visible when guest access enabled)
- Delete space with confirmation dialog

### Components Created

**OnboardingChecklist** (`src/components/org/OnboardingChecklist.tsx`)

- Progress bar with completion percentage
- Clickable incomplete items linking to setup/space pages
- Hides when all steps complete
- Shows success message when complete

**OperatingHoursEditor** (`src/components/org/OperatingHoursEditor.tsx`)

- 7-day grid (Monday-first display order)
- Open/Closed toggle per day
- Time selects for open/close (30-min increments, 6 AM - 12 AM)
- "Copy to weekdays" and "Copy to all" convenience buttons
- Default: Mon-Fri 9 AM - 6 PM, weekends closed

**TimezoneSelector** (`src/components/org/TimezoneSelector.tsx`)

- Searchable combobox using `Intl.supportedValuesOf('timeZone')`
- Shows UTC offset for each timezone
- Auto-detects browser timezone as default

**VisitFieldsEditor** (`src/components/org/VisitFieldsEditor.tsx`)

- Add/remove/reorder custom fields
- Field types: text, textarea, select, checkbox
- Placeholder and required toggle per field
- Options editor for select type

### UI Components Added

- `src/components/ui/command.tsx` — Combobox primitive from cmdk
- `src/components/ui/alert-dialog.tsx` — Confirmation dialog for delete actions

### Admin Dashboard Updates

**File:** `src/routes/org/$slug/admin/index.tsx`

- Added OnboardingChecklist at top of dashboard
- Added Setup and Co-working quick action buttons
- Expanded grid to 7 columns on large screens

## Dependencies Added

- `cmdk@1.1.1` — Command menu primitive for combobox
- `@radix-ui/react-alert-dialog@1.1.15` — Alert dialog primitive

## Patterns Used

- Three-query cascade: org → membership → admin data with `'skip'` sentinel
- Individual `useState` per field (matches existing codebase pattern)
- `useEffect` to populate form from query data
- Toast notifications via sonner for success/error
- Loader2 spinner in submit buttons
- Breadcrumb navigation with Link components

## Bug Fixes

- Fixed apply/status.tsx route params typing (template literal → params object)

## Files Changed

- `src/routes/org/$slug/admin/setup.tsx` — New file
- `src/routes/org/$slug/admin/space.tsx` — New file
- `src/routes/org/$slug/admin/index.tsx` — Added checklist and nav buttons
- `src/routes/apply/status.tsx` — Fixed route typing
- `src/components/org/OnboardingChecklist.tsx` — New file
- `src/components/org/OperatingHoursEditor.tsx` — New file
- `src/components/org/TimezoneSelector.tsx` — New file
- `src/components/org/VisitFieldsEditor.tsx` — New file
- `src/components/ui/command.tsx` — New file
- `src/components/ui/alert-dialog.tsx` — New file
- `package.json` — Added cmdk, @radix-ui/react-alert-dialog
- `bun.lock` — Updated

## Commit

`c9f6f54` — feat(31-02): add org setup wizard, onboarding checklist, space config
