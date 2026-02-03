# Stack Research: v1.5 Co-working & Org Onboarding

**Project:** ASTN v1.5 - Org Onboarding & Co-working Space Management
**Researched:** 2026-02-03
**Confidence:** HIGH (one new dependency, rest is existing stack extension)

## Summary

v1.5 requires exactly **one new npm dependency**: `react-day-picker` (v9.13.0) for the booking calendar UI, which is the standard library behind shadcn/ui's Calendar and DatePicker components. Everything else -- booking logic, approval workflows, guest access, custom forms, utilization stats, ASTN admin role -- is handled by extending existing Convex schema and reusing established patterns from v1.0-v1.4. The codebase already has date-fns v4, timezone handling, email notifications, approval workflows (programs), and admin permission infrastructure that map directly to v1.5 requirements.

## New Dependencies Needed

### 1. react-day-picker (Calendar UI)

| Field | Value |
|-------|-------|
| **Package** | `react-day-picker` |
| **Version** | `^9.13.0` (latest stable, published 2025-12-18) |
| **Purpose** | Date selection calendar for booking interface and admin bookings view |
| **Integration point** | shadcn/ui Calendar + DatePicker components |
| **Confidence** | HIGH -- verified via npm registry |

**Why needed:** The booking system requires a calendar date picker for selecting visit dates. shadcn/ui's Calendar component is built on react-day-picker. No calendar component currently exists in the project's UI library.

**Why this library:**
- De facto standard for React calendar UI (shadcn/ui's official recommendation)
- Dependencies are `date-fns ^4.1.0` and `@date-fns/tz ^1.4.1` -- both already satisfied by the project's existing `date-fns ^4.1.0` and `date-fns-tz ^3.2.0` installations
- Compatible with React 19 (supports React 16.8+)
- Lightweight (no heavy calendar framework)
- Highly customizable for styling with Tailwind

**Installation:**
```bash
bun add react-day-picker
```

Then add shadcn/ui Calendar and DatePicker components:
```bash
# These are shadcn/ui component files added to src/components/ui/
# Calendar component wraps react-day-picker with shadcn styling
# DatePicker composes Popover + Calendar (both Radix-based, Popover already installed)
```

**What gets unlocked:**
- `<Calendar />` component for inline date display (admin bookings view)
- `<DatePicker />` for date selection in booking flow
- Date range selection for admin utilization reports
- Consistent styling with existing shadcn/ui components

### No Other New Dependencies

Every other v1.5 capability maps to existing stack:

| v1.5 Capability | Existing Solution | Already Proven In |
|------------------|-------------------|-------------------|
| Org application workflow | Convex mutations + status field | `programParticipation.status` (pending/enrolled/etc.) |
| ASTN admin approval | Auth helper + role check | `requireAnyOrgAdmin()` in `convex/lib/auth.ts` |
| Custom visit application forms | JSON schema in Convex + dynamic React rendering | Profile wizard steps (dynamic field rendering) |
| Flexible hour booking ("10am-3pm") | `date-fns` format/parse + Convex number fields | Event time handling throughout `convex/events/` |
| Soft capacity warnings | Convex query counting + frontend conditional | `maxParticipants` pattern in `programs` table |
| Guest quick account | `@convex-dev/auth` Password provider | Existing auth flow in `convex/auth.ts` |
| Guest visit application | Same approval pattern as programs | `programParticipation` pending/approved flow |
| Profile pre-fill from visit data | Convex mutation reading guest data | Profile extraction review pattern |
| Consent system | Boolean field on booking record | `attendance.showOnProfile` / `showToOtherOrgs` pattern |
| Email notifications | `@convex-dev/resend` | Match alerts, event digests, reminders |
| Admin bookings calendar view | react-day-picker (NEW) + Convex queries | -- |
| Utilization stats | Convex aggregation queries + stat cards | `orgs/stats.ts` enhanced stats pattern |
| Timezone handling | `date-fns-tz` | Event scheduling, notification batching |

## Existing Stack Reuse

### Authentication & Authorization (No Changes)

The existing auth infrastructure handles all v1.5 auth needs:

- **Guest accounts:** `@convex-dev/auth` Password provider already supports quick signup. Guest accounts are just regular accounts with a `guest` flag or no profile yet.
- **ASTN platform admin:** Extend `requireAnyOrgAdmin()` to a new `requirePlatformAdmin()` helper. This is a ~10 line function in `convex/lib/auth.ts` that checks a `platformAdmins` table or a field on the user record. No library changes needed.
- **Org admin for space management:** Existing `requireOrgAdmin()` pattern in `convex/orgs/admin.ts` handles org-level permissions perfectly.

### Notification Infrastructure (Extend, Don't Replace)

The notification system already supports:
- In-app notifications via `notifications` table (extend type union)
- Email via `@convex-dev/resend` (add booking confirmation templates)
- Cron-based batching (add daily booking summary if needed)
- User preferences (extend `notificationPreferences` schema)

New notification types to add to the existing union:
```
'booking_confirmed' | 'booking_cancelled' | 'visit_application_received' |
'visit_application_approved' | 'visit_application_rejected' |
'org_application_received' | 'org_application_approved' | 'org_application_rejected'
```

### Form Patterns (Extend, Don't Abstract)

The codebase uses direct React state management for forms (useState per field), not react-hook-form or formik. This pattern is consistent across:
- `CreateProgramDialog` (7 form fields with useState)
- `opportunity-form.tsx` (10+ fields with useState)
- Profile wizard steps (multiple fields per step)
- Org admin settings (2 fields with useState)

**For custom visit application forms:** Model the form schema as a JSON array stored in the `coworkingSpaces` table. Render dynamically with a simple field-type switch. This is ~50 lines of rendering code, not a library dependency.

```typescript
// Schema shape for custom form fields
formFields: v.array(v.object({
  id: v.string(),
  label: v.string(),
  type: v.union(v.literal('text'), v.literal('textarea'), v.literal('select'), v.literal('checkbox')),
  required: v.boolean(),
  options: v.optional(v.array(v.string())), // For select type
  placeholder: v.optional(v.string()),
}))
```

### Real-Time & Scheduling (Core Convex)

- **Real-time booking updates:** Convex subscriptions (built-in). When someone books, the calendar view updates instantly for all viewers.
- **Booking conflict detection:** Convex query at mutation time. Transactional consistency guaranteed by Convex mutations.
- **Scheduled reminders:** `ctx.scheduler.runAt()` pattern (already used for event reminders in `convex/notifications/scheduler.ts`)

### Date & Time Handling (Already Installed)

- `date-fns ^4.1.0` -- format, parse, isSameDay, startOfDay, etc.
- `date-fns-tz ^3.2.0` -- timezone conversion for operating hours display
- All booking times stored as Unix timestamps (number) per existing convention
- Operating hours stored as `{ dayOfWeek: number, openTime: string, closeTime: string }` -- pure data, no library needed

## Do NOT Add

### Libraries Considered and Rejected

| Library | Why Considered | Why Rejected | Use Instead |
|---------|---------------|--------------|-------------|
| **FullCalendar** | Rich calendar UI for admin bookings view | 150KB+ bundle, overkill for single-day booking list. Admin needs a date picker + booking list, not a full calendar app. | react-day-picker Calendar + Convex query for selected date's bookings |
| **react-big-calendar** | Alternative calendar component | Same overkill problem. Heavy, complex API, moment.js dependency in older versions. | react-day-picker + custom booking list |
| **react-hook-form** | Form management for multi-step booking flow | Entire codebase uses useState pattern. Introducing a new form paradigm creates inconsistency. Booking form is 3-5 fields, not complex enough to justify. | Continue useState pattern |
| **@tanstack/react-form** | Modern form library, same ecosystem | Same inconsistency argument. Would need to migrate existing forms or maintain two patterns. | Continue useState pattern |
| **zod (for form validation)** | Already in deps, could validate booking form | Zod is used server-side only (schema validation). Client-side form validation is done inline. Keep consistent. | Inline validation + server-side Convex arg validators |
| **uuid** | Generate booking IDs | Convex generates `_id` automatically. `crypto.randomUUID()` used where manual IDs needed (already in codebase). | `crypto.randomUUID()` or Convex auto-ID |
| **recharts / chart.js** | Utilization stats charts | No charting library currently installed. Stat cards (numbers + badges) are the established pattern in `OrgStats`. Charts are a nice-to-have, not table stakes for 50-100 user pilot. | Stat cards with numbers, percentages, and color-coded badges |
| **rrule** | Recurring bookings | v1.5 explicitly scopes to "one-off daily bookings only (no recurring)". Can add later if needed. | N/A -- not in scope |
| **@dnd-kit** | Drag-to-book time slots | Over-engineered for one-off daily bookings. Time range is selected via dropdowns or simple inputs, not dragging. | Two time-select dropdowns (start/end) |
| **QR code library** | Guest check-in via QR | Not in v1.5 scope. Guest flow is application-based, not walk-in QR scan. | N/A |

### Patterns to Avoid

| Anti-Pattern | Why Tempting | Why Wrong | Do This Instead |
|-------------|-------------|-----------|-----------------|
| Separate auth for guests | "Guests are different from members" | Creates two auth systems, doubles complexity. Guests are just users without full profiles. | Same auth, differentiate by profile completeness / role |
| Client-side booking conflict detection | "Check availability before submitting" | Race conditions. Two users see same availability, both click book. | Optimistic UI + server-side validation in Convex mutation (transactional) |
| Polling for booking updates | "Check every 30s if new bookings appeared" | Defeats Convex's real-time subscriptions, wastes resources | Convex `useQuery` subscription auto-updates |
| Complex state machine library | "Booking and application workflows have many states" | XState/similar adds learning curve. States are simple linear progressions. | Union type on status field + conditional logic |
| Embedding a third-party booking widget | "Calendly/Cal.com embed" | Loses control over UX, can't integrate with profile/consent system, external dependency | Native booking built on Convex |

## Integration Points

### New Schema Tables (Extend schema.ts)

```
organizations (EXTEND)
  + applicationStatus: 'active' | 'pending_approval' | 'rejected'
  + homepage: optional homepage content fields
  + appliedAt, approvedAt, rejectedAt timestamps

coworkingSpaces (NEW)
  - orgId -> organizations
  - name, description
  - capacity (soft limit)
  - operatingHours (array of day/open/close)
  - timezone
  - customFormFields (JSON schema for visit application)
  - status: 'active' | 'inactive'

spaceBookings (NEW)
  - spaceId -> coworkingSpaces
  - userId -> users
  - date (number, start of day timestamp)
  - startTime, endTime (strings like "10:00", "15:00")
  - status: 'confirmed' | 'cancelled'
  - consentToVisibility (boolean)
  - createdAt

visitApplications (NEW)
  - spaceId -> coworkingSpaces
  - userId -> users (guest or member)
  - requestedDate (number)
  - requestedStartTime, requestedEndTime (strings)
  - formResponses (object matching custom form schema)
  - status: 'pending' | 'approved' | 'rejected'
  - reviewedBy -> orgMemberships
  - reviewedAt

orgApplications (NEW)
  - orgName, description, city, country, coordinates
  - applicantUserId -> users
  - status: 'pending' | 'approved' | 'rejected'
  - reviewedBy (ASTN admin userId)
  - reviewedAt
  - rejectionReason

platformAdmins (NEW)
  - userId -> users
  - grantedAt
  - grantedBy (bootstrap: manual)
```

### New Route Structure

```
src/routes/
  admin/
    orgs/              # ASTN admin: org application review
      index.tsx        # List pending/approved/rejected org applications
      $id.tsx          # Review individual application
  org/$slug/
    admin/
      space/           # Org admin: co-working space management
        index.tsx      # Space settings, operating hours, form builder
        bookings.tsx   # Calendar view of bookings
      applications/    # Visit application review queue
        index.tsx
    space/             # Member-facing
      index.tsx        # Book a visit (calendar + time picker)
      $bookingId.tsx   # Booking detail/confirmation
  visit/               # Guest-facing (lightweight)
    $spaceSlug.tsx     # Guest visit application form
  apply/               # Org application
    index.tsx          # "Apply to join ASTN as an org" form
```

### Auth Extension

```typescript
// convex/lib/auth.ts -- add:
export async function requirePlatformAdmin(ctx: QueryCtx | MutationCtx): Promise<string> {
  const userId = await requireAuth(ctx)
  const admin = await ctx.db
    .query('platformAdmins')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()
  if (!admin) throw new Error('Platform admin access required')
  return userId
}
```

### Notification Extension

Extend the existing `notifications.type` union in schema.ts and add corresponding `createNotification` calls in booking/application mutations. Follow the exact pattern in `convex/notifications/mutations.ts`.

### Email Templates

Add booking confirmation, visit application status, and org application status email templates following the pattern in `convex/emails/`. Use `@react-email/components` (already installed) for template rendering.

## Environment Variables

**No new environment variables required.**

All v1.5 features use existing infrastructure:
- `ANTHROPIC_API_KEY` -- not needed for v1.5 (no LLM features in booking/onboarding)
- `RESEND_API_KEY` -- already set, reused for booking/application emails
- `VITE_CONVEX_URL` -- already set

## Installation

```bash
# Single new dependency
bun add react-day-picker

# Then generate shadcn/ui Calendar component
# (manually create src/components/ui/calendar.tsx wrapping react-day-picker)
```

Total bundle size addition: ~45KB (react-day-picker, before tree-shaking). date-fns is shared with existing installation.

## Cost Implications

### No Additional LLM Costs

v1.5 features are CRUD + workflow, no LLM calls needed:
- Booking is date/time selection, not AI-powered
- Application approval is manual admin review
- Custom forms are admin-configured, not AI-generated
- Utilization stats are computed from booking data

### Minimal Additional Email Costs

New email types: booking confirmations, application status updates.
- Estimated: ~200 additional emails/month for pilot (50-100 users)
- Well within Resend free tier (3,000/month)

### No Infrastructure Cost Changes

All new data stored in existing Convex deployment. No additional services.

## Summary Table

| Category | What | Status |
|----------|------|--------|
| New npm dependency | `react-day-picker ^9.13.0` | **REQUIRED** -- calendar UI |
| New Convex tables | 5 tables (spaces, bookings, visit apps, org apps, platform admins) | Schema extension |
| New auth helper | `requirePlatformAdmin()` | ~10 lines in existing auth.ts |
| New notification types | 7 new type literals | Schema union extension |
| New email templates | 4-5 templates | Follow existing @react-email pattern |
| New routes | ~10 new route files | Follow existing TanStack file-based routing |
| New shadcn/ui components | Calendar, DatePicker | Built from react-day-picker + existing Popover |
| New env variables | None | -- |
| New external services | None | -- |
| LLM usage | None | -- |

**Key principle carried from v1.2:** The existing stack is production-proven for ASTN. v1.5 adds features by extending existing patterns, not introducing new tools. The single exception (react-day-picker) is the minimal addition needed for calendar UI that no amount of existing stack can replicate.

## Sources

| Source | Confidence | Used For |
|--------|------------|----------|
| ASTN codebase `package.json` | HIGH | Existing dependency inventory |
| ASTN codebase `convex/schema.ts` | HIGH | Schema patterns and conventions |
| ASTN codebase `convex/lib/auth.ts` | HIGH | Auth helper patterns |
| ASTN codebase `convex/orgs/admin.ts` | HIGH | Org admin permission pattern |
| ASTN codebase `convex/notifications/mutations.ts` | HIGH | Notification patterns |
| ASTN codebase `convex/programs.ts` | HIGH | Approval workflow pattern |
| ASTN codebase form components | HIGH | Form implementation patterns |
| shadcn/ui Calendar docs (ui.shadcn.com) | HIGH | Calendar component dependencies |
| shadcn/ui DatePicker docs (ui.shadcn.com) | HIGH | DatePicker composition pattern |
| react-day-picker npm registry | HIGH | Version 9.13.0, deps verification |
| daypicker.dev | HIGH | React 19 compatibility, date-fns dep |
| STACK-v1.2-crm-events.md | HIGH | Prior research patterns and decisions |
