# Architecture Research: v1.5 Co-working & Org Onboarding

**Domain:** Co-working space management + org onboarding for AI Safety Talent Network
**Researched:** 2026-02-03
**Overall confidence:** HIGH (existing codebase thoroughly analyzed, patterns well-established)

## Summary

The v1.5 features integrate into an already-mature Convex + TanStack architecture with established patterns for orgs, memberships, attendance, programs, and admin dashboards. The core challenge is adding two new domains -- org application/approval and co-working space booking -- while reusing existing auth, org membership, and notification infrastructure. The guest access flow is the most architecturally novel piece: it requires a lightweight user account that can later be "promoted" to a full ASTN profile. Everything else follows patterns already proven in the codebase (status-based workflows from `programParticipation`, org-scoped admin from `orgs/admin.ts`, notifications from `notifications/`).

## Existing Architecture Inventory

Before designing new tables, here is what already exists and can be reused.

### Tables That Will Be Leveraged (Not Modified Schema)

| Table | How It's Used in v1.5 |
|-------|----------------------|
| `organizations` | Orgs that apply get created here after approval |
| `orgMemberships` | Members who book co-working get verified through this |
| `profiles` | Consent model: booking exposes profile to co-attendees |
| `notifications` | Booking confirmations, approval notifications |
| `attendance` | Conceptual analog for the booking pattern |

### Patterns Already Established

| Pattern | Where It Exists | Reuse in v1.5 |
|---------|----------------|---------------|
| `requireOrgAdmin()` helper | `convex/orgs/admin.ts`, `convex/programs.ts` | Org admin approving bookings, configuring spaces |
| Status-based workflows | `programParticipation.status` (pending/enrolled/completed/withdrawn/removed) | Org applications, visit applications |
| Invite token validation | `orgInviteLinks` + `validateInviteToken` | Similar pattern for guest visit links |
| Time-range stats queries | `orgs/stats.ts` getEnhancedOrgStats | Utilization stats for co-working |
| Notification creation | `notifications/mutations.ts` createNotification | Booking/approval notifications |
| Auth with `@convex-dev/auth` | GitHub, Google, Password providers | Guests create real accounts (same providers) |

## New Convex Tables

### 1. `orgApplications` -- Org onboarding applications

Tracks an organization's application to join ASTN. An org representative fills out the application, ASTN platform admins review and approve/reject.

```typescript
orgApplications: defineTable({
  // Applicant info
  applicantUserId: v.string(), // The user who submitted
  applicantEmail: v.string(),
  applicantName: v.string(),

  // Organization info
  orgName: v.string(),
  orgDescription: v.string(),
  orgCity: v.optional(v.string()),
  orgCountry: v.optional(v.string()),
  orgWebsite: v.optional(v.string()),
  isGlobal: v.optional(v.boolean()),

  // Application details
  missionAlignment: v.string(), // How org aligns with AI safety
  memberEstimate: v.optional(v.number()), // Expected member count
  additionalNotes: v.optional(v.string()),

  // Status workflow
  status: v.union(
    v.literal('pending'),
    v.literal('approved'),
    v.literal('rejected'),
    v.literal('withdrawn'),
  ),

  // Review
  reviewedBy: v.optional(v.string()), // ASTN admin userId
  reviewedAt: v.optional(v.number()),
  reviewNotes: v.optional(v.string()),
  rejectionReason: v.optional(v.string()),

  // If approved, link to created org
  createdOrgId: v.optional(v.id('organizations')),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_status', ['status'])
  .index('by_applicant', ['applicantUserId'])
```

**Key design decisions:**
- Application stores all org info (not a reference to organizations table) because the org does not exist yet.
- On approval, a mutation creates the org in `organizations`, creates an `orgMembership` with role `admin` for the applicant, and stores `createdOrgId` back on the application.
- "ASTN admin" is any user who is admin of any org (reuses `requireAnyOrgAdmin` from `convex/lib/auth.ts`) OR a new `platformAdmin` flag. Recommend: add a simple `isPlatformAdmin` boolean to the users table or a separate `platformAdmins` table, since ASTN-level approval is different from org-level admin.

### 2. `coworkingSpaces` -- Space definitions per org

Each org can define one or more co-working spaces with capacity and hours.

```typescript
coworkingSpaces: defineTable({
  orgId: v.id('organizations'),

  // Identity
  name: v.string(), // e.g., "Main Office", "Meeting Room A"
  description: v.optional(v.string()),

  // Capacity
  capacity: v.number(), // Desk/seat count
  softCapacityWarning: v.optional(v.number()), // Warn at this number (e.g., 80% of capacity)

  // Operating hours (stored as minutes from midnight for timezone flexibility)
  operatingHours: v.object({
    monday: v.optional(v.object({ open: v.number(), close: v.number() })),
    tuesday: v.optional(v.object({ open: v.number(), close: v.number() })),
    wednesday: v.optional(v.object({ open: v.number(), close: v.number() })),
    thursday: v.optional(v.object({ open: v.number(), close: v.number() })),
    friday: v.optional(v.object({ open: v.number(), close: v.number() })),
    saturday: v.optional(v.object({ open: v.number(), close: v.number() })),
    sunday: v.optional(v.object({ open: v.number(), close: v.number() })),
  }),
  timezone: v.string(), // IANA timezone for the space

  // Visit application configuration
  visitApplicationFields: v.optional(
    v.array(
      v.object({
        id: v.string(),        // Unique field identifier
        label: v.string(),     // Display label
        type: v.union(
          v.literal('text'),
          v.literal('textarea'),
          v.literal('select'),
          v.literal('checkbox'),
        ),
        required: v.boolean(),
        options: v.optional(v.array(v.string())), // For select type
        placeholder: v.optional(v.string()),
      }),
    ),
  ),

  // Guest access settings
  guestAccessEnabled: v.boolean(), // Whether non-members can apply to visit
  requireApprovalForMembers: v.boolean(), // If false, members book instantly
  requireApprovalForGuests: v.boolean(), // Usually true

  // Status
  status: v.union(v.literal('active'), v.literal('inactive')),

  // Metadata
  createdBy: v.id('orgMemberships'),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_org', ['orgId'])
  .index('by_org_status', ['orgId', 'status'])
```

**Key design decisions:**
- Operating hours per day-of-week allows different hours on different days (common for co-working).
- Minutes from midnight (0-1440) avoids timezone ambiguity in storage. Display layer converts using the space's timezone.
- `visitApplicationFields` is a flexible schema for org-configurable forms. This mirrors the pattern used in programs (`enrollmentMethod`) but is more flexible because orgs may want different questions (e.g., "What project will you work on?", "Do you need a monitor?").
- `softCapacityWarning` is separate from `capacity` -- capacity is the hard number, warning triggers at a lower threshold.
- `requireApprovalForMembers` defaults to false (members book directly), `requireApprovalForGuests` defaults to true.

### 3. `spaceBookings` -- Individual booking records

One-off daily bookings with flexible time ranges.

```typescript
spaceBookings: defineTable({
  spaceId: v.id('coworkingSpaces'),
  orgId: v.id('organizations'), // Denormalized for queries
  userId: v.string(), // The person who booked (member or guest)

  // Booking details
  date: v.string(), // ISO date string "2026-02-15" (no time component)
  startTime: v.number(), // Minutes from midnight (e.g., 600 = 10:00 AM)
  endTime: v.number(), // Minutes from midnight (e.g., 900 = 3:00 PM)

  // Type
  bookingType: v.union(v.literal('member'), v.literal('guest')),

  // Status workflow
  status: v.union(
    v.literal('pending_approval'), // Guests (and members if org requires it)
    v.literal('confirmed'),        // Approved or auto-confirmed
    v.literal('cancelled'),        // User or admin cancelled
    v.literal('rejected'),         // Admin rejected
    v.literal('checked_in'),       // Physically arrived (future enhancement)
  ),

  // Visit application responses (for guest bookings, or if org requires for members)
  applicationResponses: v.optional(
    v.array(
      v.object({
        fieldId: v.string(),
        value: v.string(),
      }),
    ),
  ),

  // Approval tracking
  approvedBy: v.optional(v.string()), // Admin userId
  approvedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),

  // Consent
  consentToProfileSharing: v.boolean(), // "I agree attendees that day can see my profile"

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_space_date', ['spaceId', 'date'])
  .index('by_user', ['userId'])
  .index('by_org_date', ['orgId', 'date'])
  .index('by_org_status', ['orgId', 'status'])
  .index('by_space_status', ['spaceId', 'status'])
```

**Key design decisions:**
- `date` as ISO string rather than timestamp simplifies day-level queries. "Who's booked for 2026-02-15?" is `by_space_date` index with date equality.
- `startTime`/`endTime` as minutes from midnight allows "10am-3pm" flexible booking without timezone math in queries. The space's timezone from `coworkingSpaces` interprets these.
- `applicationResponses` stores dynamic form answers as key-value pairs matching `visitApplicationFields` from the space config.
- `consentToProfileSharing` is required (not optional) -- the booking form must include the consent checkbox.
- `checked_in` status exists for future enhancement but is not in the v1.5 MVP scope.
- Denormalized `orgId` avoids joins when querying "all bookings for this org on this date."

### 4. `guestProfiles` -- Lightweight guest info

Stores information collected during guest visit applications. This data pre-fills an ASTN profile if the guest later creates a full account.

```typescript
guestProfiles: defineTable({
  userId: v.string(), // Links to auth user (created via Password or OAuth)

  // Basic info collected during visit application
  name: v.string(),
  email: v.string(),
  organization: v.optional(v.string()), // Where they currently work/study
  role: v.optional(v.string()), // Their current role
  linkedinUrl: v.optional(v.string()),

  // Flags
  hasFullProfile: v.boolean(), // Whether they've upgraded to a full ASTN profile
  convertedAt: v.optional(v.number()), // When they upgraded

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_email', ['email'])
```

**Key design decisions:**
- Separate from `profiles` table because guests have minimal info (no skills, education, work history, enrichment, etc.).
- `hasFullProfile` flag tracks conversion. When a guest creates a full ASTN profile, the conversion mutation copies `name`, `email`, `organization`, and `role` into the profile fields and sets `hasFullProfile = true`.
- `by_email` index enables finding existing guest profiles when someone signs up with the same email.

### 5. `platformAdmins` -- ASTN platform-level admin list

Small table tracking who can approve org applications (distinct from per-org admin).

```typescript
platformAdmins: defineTable({
  userId: v.string(),
  grantedBy: v.optional(v.string()), // Who made them a platform admin
  grantedAt: v.number(),
})
  .index('by_user', ['userId'])
```

**Why a separate table:** The existing `requireAnyOrgAdmin` checks if a user is admin of ANY org. But org application approval should be limited to ASTN platform administrators, not any org admin. A BAISH admin should not automatically be able to approve new orgs joining the network. This table is intentionally small and simple.

## Modified Tables

### `organizations` -- Add self-configuration fields

```typescript
// ADD these fields to the existing organizations table:
{
  // Self-configuration (set by org admins after approval)
  contactEmail: v.optional(v.string()),
  website: v.optional(v.string()),
  socialLinks: v.optional(
    v.object({
      twitter: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      github: v.optional(v.string()),
    }),
  ),

  // Co-working space settings
  hasCoworkingSpace: v.optional(v.boolean()), // Quick flag for filtering
}
```

**What stays the same:** All existing fields (name, slug, description, city, country, coordinates, isGlobal, memberCount, lumaCalendarUrl, lumaApiKey, eventsLastSynced) remain untouched.

### `notifications` -- Extend type union

```typescript
// ADD new notification types to the existing union:
type: v.union(
  // Existing
  v.literal('event_new'),
  v.literal('event_reminder'),
  v.literal('event_updated'),
  v.literal('attendance_prompt'),
  // NEW
  v.literal('org_application_submitted'),  // To platform admins
  v.literal('org_application_approved'),   // To applicant
  v.literal('org_application_rejected'),   // To applicant
  v.literal('booking_confirmed'),          // To booker
  v.literal('booking_pending_approval'),   // To org admins
  v.literal('booking_approved'),           // To booker
  v.literal('booking_rejected'),           // To booker
  v.literal('guest_visit_application'),    // To org admins
),
```

Also add optional fields for booking references:

```typescript
// ADD to notifications table:
bookingId: v.optional(v.id('spaceBookings')),
applicationId: v.optional(v.id('orgApplications')),
```

## New Routes

### Public / Auth Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/apply` | Org application form | Yes (any authenticated user) |
| `/apply/status` | View your application status | Yes |

### Org-Scoped Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/org/$slug/space` | View co-working space info and book | Yes (member) |
| `/org/$slug/space/book` | Booking form for a specific date | Yes (member) |
| `/org/$slug/space/my-bookings` | View your upcoming/past bookings | Yes (member) |
| `/org/$slug/visit` | Guest visit landing page | No (public) |
| `/org/$slug/visit/apply` | Guest visit application form | Yes (guest account) |

### Org Admin Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/org/$slug/admin/space` | Manage co-working space config | Org admin |
| `/org/$slug/admin/space/bookings` | View/manage all bookings | Org admin |
| `/org/$slug/admin/space/bookings/$date` | Daily bookings calendar view | Org admin |
| `/org/$slug/admin/space/stats` | Utilization stats | Org admin |

### Platform Admin Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/admin/applications` | Review org applications | Platform admin |
| `/admin/applications/$id` | Individual application review | Platform admin |

**Total: 11 new routes** (5 org-scoped member, 4 org admin, 2 platform admin)

### Route nesting rationale

- Space routes go under `/org/$slug/space` (not `/org/$slug/coworking`) because "space" is shorter and avoids the hyphenated path.
- Guest visit goes under `/org/$slug/visit` -- a distinct path from member space access because the auth flow differs.
- Platform admin routes go under `/admin/` (global) not `/org/$slug/admin/` because they span all orgs.

## Key Data Flows

### 1. Org Application Flow

```
User visits /apply
  |
  v
Fills out application form (org name, description, mission alignment)
  |
  v
convex mutation: applications.submit
  - Creates orgApplications record with status: 'pending'
  - Sends notification to all platformAdmins
  |
  v
Platform admin visits /admin/applications
  - Sees pending applications
  - Reviews details
  |
  v
convex mutation: applications.approve
  - Updates application status to 'approved'
  - Creates organization in 'organizations' table (with slug auto-generated)
  - Creates orgMembership for applicant as admin
  - Sends 'org_application_approved' notification to applicant
  - Returns new org slug for redirect

OR

convex mutation: applications.reject
  - Updates application status to 'rejected'
  - Stores rejectionReason
  - Sends 'org_application_rejected' notification to applicant
```

**Integration points:** Uses existing `organizations` table and `orgMemberships` table for the approved org. The applicant immediately becomes an org admin and can configure their org via existing `/org/$slug/admin/settings`.

### 2. Org Self-Configuration Flow (Post-Approval)

```
Applicant receives approval notification
  |
  v
Redirected to /org/$slug/admin/settings
  |
  v
Configures: description, location, logo, contact info, social links
  |
  v
Optionally enables co-working space:
  /org/$slug/admin/space
  |
  v
Defines space: name, capacity, operating hours, timezone
  |
  v
Configures visit application fields (custom questions)
  |
  v
Enables guest access toggle
```

**Integration points:** Extends existing `/org/$slug/admin/settings` route. Space configuration is a new admin sub-route.

### 3. Member Booking Flow

```
Member visits /org/$slug/space
  |
  v
Sees space info: capacity, today's bookings count, operating hours
  |
  v
Selects a date (default: today or next business day)
  |
  v
Sees who's already booked (profiles of those who consented)
  |
  v
Picks time range: start time + end time (within operating hours)
  - Slider or time picker, snapped to 30-min increments
  |
  v
Consent checkbox: "I agree that other attendees can see my profile"
  |
  v
convex mutation: spaces.createMemberBooking
  - Checks operating hours (reject if outside)
  - Checks capacity for that date (count confirmed + pending bookings)
  - If at or above softCapacityWarning: returns warning, user confirms
  - If above capacity: still allows (soft cap!) but shows stronger warning
  - If requireApprovalForMembers is false: status = 'confirmed'
  - If requireApprovalForMembers is true: status = 'pending_approval'
  - Sends notification to booking creator (confirmed or pending)
  |
  v
Booking appears in /org/$slug/space/my-bookings
```

**Soft capacity logic:** The system never blocks a booking based on capacity. It shows warnings at threshold:
- Below `softCapacityWarning`: No warning, book freely
- At/above `softCapacityWarning` but below `capacity`: Yellow warning "Getting busy"
- At/above `capacity`: Orange warning "At capacity -- space may be tight"

This is intentional. Physical co-working spaces rarely have hard limits -- people can share, use couches, etc.

### 4. Guest Access Flow

```
Guest discovers org (word of mouth, website link)
  |
  v
Visits /org/$slug/visit (public page)
  - Sees org description, space info, "Apply to Visit" button
  |
  v
Guest clicks "Apply to Visit"
  - If not authenticated: redirect to quick sign-up
  - Quick sign-up: name + email + password (or Google/GitHub)
  - This creates a standard @convex-dev/auth user account
  |
  v
Guest fills visit application: /org/$slug/visit/apply
  - Date selection
  - Time range (start/end)
  - Custom application fields (defined by org)
  - Name, email, organization (saved to guestProfiles)
  - Consent checkbox
  |
  v
convex mutation: spaces.createGuestBooking
  - Creates/updates guestProfiles record
  - Creates spaceBooking with bookingType: 'guest', status: 'pending_approval'
  - Sends 'guest_visit_application' notification to org admins
  |
  v
Org admin sees pending guest applications in /org/$slug/admin/space/bookings
  |
  v
convex mutation: spaces.approveBooking
  - Updates status to 'confirmed'
  - Sends 'booking_approved' notification to guest
  - Guest sees confirmation

OR

convex mutation: spaces.rejectBooking
  - Updates status to 'rejected'
  - Stores rejectionReason
  - Sends 'booking_rejected' notification to guest
```

**Guest account strategy -- use real accounts, NOT Anonymous auth:**

Do NOT use the `@convex-dev/auth` Anonymous provider for guest users. Instead, require guests to create a real account (email + password, or OAuth). Rationale:
1. The Anonymous provider creates sessions that are hard to reconnect if the user returns or closes the browser.
2. We need the guest's email for notifications (booking confirmation, approval status).
3. A real account allows the guest to check their booking status, see approval, etc.
4. The conversion to full ASTN profile is a matter of filling out more fields, not account migration.
5. The sign-up form is short: just name, email, password. This is 30 seconds of friction for persistent identity.

The `guestProfiles` table tracks the minimal info collected during the visit application. If this user later navigates to `/profile` and creates a full ASTN profile, a conversion check fires: "We found info from your visit application -- want to pre-fill?" This copies name, email, organization, and role into the profiles table.

### 5. Admin Approval & Dashboard Flow

```
Org admin visits /org/$slug/admin/space/bookings
  |
  v
Sees calendar view: bookings by date
  - Color coded: confirmed (green), pending (yellow), cancelled (gray)
  - Filter: by date range, by status, by booking type (member/guest)
  |
  v
For pending bookings:
  - View application details (responses to custom fields)
  - View guest profile (for guest bookings)
  - Approve / Reject with optional notes
  |
  v
/org/$slug/admin/space/stats
  - Utilization rate by day of week
  - Peak hours heatmap
  - Guest vs. member ratio
  - Bookings over time trend
  - Average booking duration
```

**Integration with existing admin dashboard:** The existing `/org/$slug/admin/` dashboard (which shows members, programs, events, settings) gets a new "Space" quick action button alongside the existing ones (View Members, Programs, Export Data, Settings). The space management is a sibling section, not a replacement.

### 6. Consent & Profile Visibility Flow

```
When viewing /org/$slug/space for a specific date:
  |
  v
Query: spaceBookings where date = X AND status = 'confirmed' AND consentToProfileSharing = true
  |
  v
For each booking:
  - If bookingType = 'member': fetch from profiles table
    - Show: name, headline, skills (same fields as org directory)
  - If bookingType = 'guest': fetch from guestProfiles
    - Show: name, organization, role (limited info)
  |
  v
"See who's there on [date]" section on the booking page
  - Encourages attendance ("3 people you might want to meet")
  - Only shows to authenticated users who are members or approved guests
```

## Integration Points with Existing System

### Auth System (`convex/auth.ts`)

- **No changes needed** for member booking (uses existing auth).
- Guest sign-up uses the same Password/Google/GitHub providers already configured.
- The `requireAuth` helper from `convex/lib/auth.ts` works for both members and guests since both are authenticated users.
- New helper needed: `requirePlatformAdmin` for org application approval.

### Organization System (`convex/organizations.ts`, `convex/orgs/`)

- Org application approval calls existing `ctx.db.insert('organizations', {...})` pattern.
- New org creation reuses the same field structure as `seedOrganizations`.
- Existing `orgMemberships` handles the applicant becoming admin.
- Existing `getOrgBySlug` query works for space pages without modification.

### Notification System (`convex/notifications/`)

- Extends the existing `createNotification` internal mutation with new notification types.
- Existing `markAsRead`, `markAllAsRead` work with new notification types.
- Existing notification bell UI in the header automatically shows new notification types (just need to add rendering logic for new types).

### Membership System (`convex/orgs/membership.ts`)

- Member booking checks membership via existing `getMembership` query.
- Guest bookings do NOT create org memberships (guests are not members).
- The `requireOrgAdmin` pattern from `convex/orgs/admin.ts` handles all admin-gated space management operations.

### Attendance System (`convex/attendance/`)

- Conceptually similar to bookings but architecturally separate.
- Attendance is post-event confirmation; bookings are pre-visit reservation.
- No direct code sharing, but the patterns (userId + eventId composite index, status workflow) are the same.
- In the future, bookings could auto-create attendance records when check-in is implemented.

### Stats System (`convex/orgs/stats.ts`)

- New utilization queries follow the same pattern as `getEnhancedOrgStats`.
- Space stats are a separate query file (e.g., `convex/spaces/stats.ts`) but follow the same time-range filtering and admin-gating patterns.

## Convex File Organization

New files to create:

```
convex/
  applications/
    mutations.ts     # submit, approve, reject, withdraw
    queries.ts       # list, getById, getByApplicant
  spaces/
    mutations.ts     # createSpace, updateSpace, createBooking, approveBooking, etc.
    queries.ts       # getSpaceByOrg, getBookingsForDate, getMyBookings
    stats.ts         # getUtilizationStats
  guests/
    mutations.ts     # createGuestProfile, convertToFullProfile
    queries.ts       # getGuestProfile, getGuestBookings
  platformAdmin/
    queries.ts       # isPlatformAdmin, getPendingApplications
    mutations.ts     # grantPlatformAdmin (internal only)
```

This follows the existing convention where domain areas get their own subdirectory (`convex/attendance/`, `convex/engagement/`, `convex/enrichment/`, etc.).

## Anti-Patterns to Avoid

### 1. Overloading the `attendance` table for bookings

**Temptation:** Bookings are "like attendance" -- reuse the same table.
**Why bad:** Attendance is post-event, bookings are pre-visit. The status workflows, queries, and access patterns are completely different. Merging them creates confusing conditionals everywhere.
**Instead:** Separate `spaceBookings` table with purpose-built indexes.

### 2. Anonymous auth for guest users

**Temptation:** Use `@convex-dev/auth` Anonymous provider for zero-friction guest access.
**Why bad:** Anonymous sessions are ephemeral. If the user closes their browser, the session is gone. They cannot check booking status, receive notifications, or convert to a full account later. The "pre-fill ASTN profile" requirement is impossible without a persistent identity.
**Instead:** Require minimal sign-up (email + password, or OAuth). The friction is minimal (one extra step) but the benefits are enormous (persistent identity, notifications, profile conversion).

### 3. Storing operating hours as timestamps

**Temptation:** Store opening/closing times as Unix timestamps.
**Why bad:** Operating hours are recurring (every Monday 9am-6pm). Timestamps are point-in-time. You end up with timezone bugs when DST changes.
**Instead:** Minutes from midnight (0-1440) + IANA timezone on the space. The display layer handles conversion.

### 4. Hard capacity enforcement in mutations

**Temptation:** Throw an error when capacity is reached.
**Why bad:** The product requirement is explicitly soft capacity. Blocking bookings defeats the purpose. Real co-working spaces are flexible.
**Instead:** Return a capacity warning from the mutation (not an error). The UI displays the warning and lets the user proceed.

### 5. Platform admin = any org admin

**Temptation:** Reuse `requireAnyOrgAdmin` for platform-level operations.
**Why bad:** Any BAISH admin could approve new orgs joining ASTN. This is a privilege escalation. Org admin is scoped to managing that org, not the platform.
**Instead:** Separate `platformAdmins` table with explicit grants.

## Suggested Build Order

Build in this order to maximize working-software-at-each-step and minimize blocked dependencies.

### Phase 1: Platform Admin + Org Application (Foundation)

**Build first because:** Everything else depends on orgs existing. The application flow is the entry point for new orgs.

1. `platformAdmins` table + `requirePlatformAdmin` helper
2. `orgApplications` table + mutations (submit, approve, reject)
3. `/apply` route (application form)
4. `/admin/applications` route (review queue)
5. Approval mutation: create org + create admin membership
6. Notification integration for application status changes
7. `/apply/status` route (applicant can check status)

**Depends on:** Nothing new. Uses existing auth, organizations, orgMemberships.
**Enables:** New orgs can join ASTN.

### Phase 2: Org Self-Configuration + Space Definition

**Build second because:** Orgs need to configure themselves and define spaces before anyone can book.

1. Extend `organizations` table with self-config fields
2. Update `/org/$slug/admin/settings` to include new config fields
3. `coworkingSpaces` table + mutations (create, update)
4. `/org/$slug/admin/space` route (space configuration)
5. Visit application field builder (custom form designer)
6. `hasCoworkingSpace` flag for org directory filtering

**Depends on:** Phase 1 (orgs must exist to configure).
**Enables:** Orgs can define their co-working spaces.

### Phase 3: Member Booking

**Build third because:** Members are the primary users, and their flow is simpler (no approval typically needed).

1. `spaceBookings` table + member booking mutations
2. `/org/$slug/space` route (space overview + date picker)
3. `/org/$slug/space/book` route (booking form with time picker, consent)
4. Soft capacity warning logic
5. `/org/$slug/space/my-bookings` route
6. "Who's there" attendee list with profile consent
7. Booking confirmation notifications
8. Add "Space" button to org admin dashboard quick actions

**Depends on:** Phase 2 (spaces must be defined).
**Enables:** Members can book co-working visits.

### Phase 4: Guest Access

**Build fourth because:** Guest flow is more complex (account creation + application + approval) and builds on the booking infrastructure from Phase 3.

1. `guestProfiles` table + mutations
2. `/org/$slug/visit` public landing page
3. Guest sign-up flow (redirect to login with return URL)
4. `/org/$slug/visit/apply` route (visit application form)
5. Guest booking mutations (creates guestProfile + spaceBooking)
6. Guest notification flow (application submitted, approved, rejected)
7. Guest-to-profile conversion logic (pre-fill on profile creation)

**Depends on:** Phase 3 (booking infrastructure).
**Enables:** Non-members can apply to visit co-working spaces.

### Phase 5: Admin Dashboard for Bookings

**Build fifth because:** Admins need to manage the bookings created in Phases 3-4.

1. `/org/$slug/admin/space/bookings` route (calendar view)
2. `/org/$slug/admin/space/bookings/$date` route (daily detail)
3. Booking approval/rejection for pending guest applications
4. `/org/$slug/admin/space/stats` route (utilization stats)
5. Integration with existing admin dashboard stats

**Depends on:** Phases 3-4 (bookings must exist to manage).
**Enables:** Full admin control over space usage.

### Phase ordering rationale

1. **Platform admin first** because org application approval is the entry gate for everything.
2. **Space definition before booking** because you cannot book a space that does not exist.
3. **Member booking before guest** because members are simpler (authenticated, known, potentially auto-approved) and the booking infrastructure is shared.
4. **Guest access last of the core features** because it is the most complex flow and builds on all prior work.
5. **Admin dashboard last** because admins can manage through the notification + approval flow even before the full dashboard exists.

## Scalability Considerations

| Concern | At 5 orgs (pilot) | At 50 orgs | At 500 orgs |
|---------|-------------------|------------|-------------|
| Bookings per day | ~10-50 total | ~100-500 total | Thousands; need pagination |
| Space queries | Direct index lookup | Direct index lookup | Same; indexes scale linearly |
| Capacity checks | Count query per booking | Same | Consider denormalized counter |
| Platform admin queue | 0-1 apps/week | 1-5 apps/week | May need batch operations |
| Guest profiles | Handful | Hundreds | Thousands; conversion tracking becomes valuable |

At pilot scale (5 orgs, 50-100 users each), all queries are well within Convex's performance characteristics. The `by_space_date` index on `spaceBookings` is the key query pattern and will remain fast at any reasonable scale.

## Confidence: HIGH

**Rationale:** This architecture research is based on thorough analysis of 650+ lines of existing schema, 2000+ lines of existing Convex functions, and established patterns in the codebase. The new tables follow proven patterns (status workflows from `programParticipation`, admin gating from `orgs/admin.ts`, notification integration from `notifications/`). The guest access strategy is the only area with MEDIUM confidence -- the decision to require real accounts over Anonymous auth is well-reasoned but should be validated against the actual guest experience during implementation. If friction is too high, a "magic link" email-based auth flow could be added later without schema changes.

## Sources

- Existing codebase analysis: `convex/schema.ts` (657 lines), `convex/orgs/admin.ts`, `convex/orgs/membership.ts`, `convex/programs.ts`, `convex/attendance/mutations.ts`, `convex/notifications/mutations.ts`, `convex/orgs/stats.ts`, `convex/orgs/discovery.ts`, `convex/orgs/directory.ts`, `convex/lib/auth.ts`, `convex/auth.ts`
- Existing route analysis: 27 routes in `src/routes/`
- Project context: `.planning/PROJECT.md`, `.planning/MILESTONES.md`
- Convex auth patterns: `@convex-dev/auth` v0.0.90 with Password, GitHub, Google providers (from `package.json` and `convex/auth.ts`)
- Operating hours design: Standard co-working management patterns (minutes-from-midnight is the common approach for recurring schedules)
