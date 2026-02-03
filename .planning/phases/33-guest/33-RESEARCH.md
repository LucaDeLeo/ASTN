# Phase 33: Guest Access + Visit Applications - Research

**Researched:** 2026-02-03
**Domain:** Guest user authentication, visit application workflow, approval systems
**Confidence:** HIGH

## Summary

This phase implements guest visitor access for coworking spaces. Non-members create lightweight accounts, apply for day visits via customizable forms, and orgs approve/reject applications. The codebase already has strong patterns in place: `orgApplications` for approval workflow, `spaceBookings` for booking storage (with `bookingType: 'guest'` already defined), `@convex-dev/auth` Password provider for authentication, and `VisitFieldsEditor` for dynamic form configuration.

The CONTEXT.md decisions lock in the architecture: real Password accounts (not Anonymous), `guestProfiles` table for guest-specific data, `visitApplicationResponses` for custom field storage, and extension of `spaceBookings` with approval fields. The existing `notifications/mutations.ts` pattern with `ctx.scheduler.runAfter(0, ...)` handles async notification delivery.

**Primary recommendation:** Follow existing patterns exactly. The approval workflow mirrors `orgApplications.ts`, the booking flow extends `spaceBookings.ts`, and the public page pattern follows `/org/$slug/join.tsx`. No new libraries needed.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                | Version  | Purpose                                 | Why Standard                                |
| ---------------------- | -------- | --------------------------------------- | ------------------------------------------- |
| @convex-dev/auth       | ^0.0.90  | Authentication (Password provider)      | Already configured with email+password flow |
| convex                 | ^1.31.6  | Database, mutations, queries, scheduler | Existing backend infrastructure             |
| @tanstack/react-router | ^1.132.2 | File-based routing, public pages        | Existing routing setup                      |

### Supporting

| Library      | Version  | Purpose                     | When to Use                   |
| ------------ | -------- | --------------------------- | ----------------------------- |
| date-fns     | ^4.1.0   | Date formatting, comparison | Booking date handling         |
| sonner       | ^2.0.7   | Toast notifications         | User feedback on form actions |
| lucide-react | ^0.562.0 | Icons                       | UI consistency                |

### Alternatives Considered

| Instead of            | Could Use          | Tradeoff                                                            |
| --------------------- | ------------------ | ------------------------------------------------------------------- |
| Password accounts     | Anonymous provider | Anonymous loses identity on browser clear - rejected per CONTEXT.md |
| Separate guests table | Extend profiles    | Profiles trigger engagement scoring - guests should be isolated     |
| Custom form builder   | react-hook-form    | Overkill for 4 field types already implemented                      |

**Installation:**
No new packages required. All dependencies already installed.

## Architecture Patterns

### Recommended Project Structure

```
convex/
├── guestProfiles.ts        # Guest profile CRUD
├── guestBookings.ts        # Guest visit application mutations
├── spaceBookings.ts        # Extend with guest approval methods
└── lib/
    └── auth.ts             # Add requireGuestOrMember helper

src/routes/org/$slug/
├── visit.tsx               # Public guest visit application page (GUEST-07)
└── admin/
    └── guests.tsx          # Admin guest management page (GUEST-04, GUEST-09, GUEST-10)
```

### Pattern 1: Approval Workflow (from orgApplications.ts)

**What:** pending -> approved/rejected status with reviewer tracking
**When to use:** Any user-submitted application requiring admin review
**Example:**

```typescript
// Source: convex/orgApplications.ts lines 172-233
export const approveGuestVisit = mutation({
  args: {
    bookingId: v.id('spaceBookings'),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { bookingId, message }) => {
    const membership = await requireSpaceAdmin(ctx, spaceId)

    const booking = await ctx.db.get(bookingId)
    if (!booking || booking.status !== 'pending') {
      throw new Error('Booking not found or not pending')
    }

    await ctx.db.patch(bookingId, {
      status: 'confirmed',
      approvedBy: membership._id,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Schedule notification
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.mutations.createNotification,
      {
        userId: booking.userId,
        type: 'guest_visit_approved',
        spaceBookingId: bookingId,
        title: 'Your visit request was approved',
        body: message ?? 'Your visit has been approved.',
        actionUrl: `/org/${slug}/visit/status`,
      },
    )
  },
})
```

### Pattern 2: Public Page with Auth Gate (from /org/$slug/join.tsx)

**What:** Public page visible to all, form submission requires authentication
**When to use:** Any page guests access before signing up
**Example:**

```typescript
// Source: src/routes/org/$slug/join.tsx lines 72-96
<AuthLoading>
  <div className="flex items-center justify-center min-h-[60vh]">
    <Spinner />
  </div>
</AuthLoading>

<Unauthenticated>
  <SignInPrompt orgName={validation.orgName} />
</Unauthenticated>

<Authenticated>
  <VisitApplicationForm space={space} />
</Authenticated>
```

### Pattern 3: Dynamic Form Rendering (from VisitFieldsEditor.tsx)

**What:** Render form fields from schema-defined configuration
**When to use:** Admin-configured custom fields
**Example:**

```typescript
// Render custom visit fields dynamically
function renderField(field: VisitField, value: string, onChange: (v: string) => void) {
  switch (field.type) {
    case 'text':
      return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
    case 'textarea':
      return <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
    case 'select':
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'checkbox':
      return <Checkbox checked={value === 'true'} onCheckedChange={(c) => onChange(c ? 'true' : 'false')} />
  }
}
```

### Pattern 4: Batch Operations (transactional)

**What:** Process multiple items in a single mutation
**When to use:** Batch approve (GUEST-10)
**Example:**

```typescript
export const batchApproveGuestVisits = mutation({
  args: {
    bookingIds: v.array(v.id('spaceBookings')),
  },
  handler: async (ctx, { bookingIds }) => {
    const membership = await requireSpaceAdmin(ctx)

    const results = []
    for (const bookingId of bookingIds) {
      const booking = await ctx.db.get(bookingId)
      if (!booking || booking.status !== 'pending') {
        results.push({ bookingId, success: false, error: 'Not pending' })
        continue
      }

      await ctx.db.patch(bookingId, {
        status: 'confirmed',
        approvedBy: membership._id,
        approvedAt: Date.now(),
        updatedAt: Date.now(),
      })

      // Schedule individual notification per guest
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.mutations.createNotification,
        {
          userId: booking.userId,
          type: 'guest_visit_approved',
          // ... notification params
        },
      )

      results.push({ bookingId, success: true })
    }

    return results
  },
})
```

### Anti-Patterns to Avoid

- **Storing guest data in profiles table:** Triggers engagement scoring, matching, CRM features
- **Using Anonymous auth provider:** Identity lost on browser clear, can't receive notifications
- **Skipping guestProfiles table:** No way to track visit history or conversion
- **Returning error details in auth:** "Email already registered" reveals account existence

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                 | Don't Build                       | Use Instead                        | Why                                              |
| ----------------------- | --------------------------------- | ---------------------------------- | ------------------------------------------------ |
| Password authentication | Custom email/password logic       | @convex-dev/auth Password provider | Already configured, handles validation, sessions |
| Form field rendering    | Custom switch statement each time | VisitFieldsEditor pattern          | Already handles all 4 types with validation      |
| Notification delivery   | Inline notification insert        | ctx.scheduler.runAfter pattern     | Decouples from mutation, atomic guarantee        |
| Approval workflow       | Custom status machine             | orgApplications pattern            | Proven pattern with reviewer tracking            |
| Date formatting         | Manual string manipulation        | date-fns format()                  | Timezone-aware, locale-safe                      |

**Key insight:** Every feature in this phase has an existing pattern in the codebase. Copy patterns exactly rather than inventing new approaches.

## Common Pitfalls

### Pitfall 1: Guests Appearing in Engagement Scoring

**What goes wrong:** Guest data stored in profiles table triggers memberEngagement computation
**Why it happens:** Reusing profiles table seems simpler
**How to avoid:** Use separate `guestProfiles` table as decided in CONTEXT.md
**Warning signs:** Guests showing up in admin engagement dashboard

### Pitfall 2: Auth Errors Revealing Account Status

**What goes wrong:** Error messages like "Email already registered" reveal whether accounts exist
**Why it happens:** Detailed error messages for UX
**How to avoid:** Generic "Invalid email or password" per existing pattern in password-form.tsx
**Warning signs:** Security review flags during code review

### Pitfall 3: Missing Consent on Guest Bookings

**What goes wrong:** Guest appears in attendee list without consent
**Why it happens:** Forgot to add consent requirement for guests
**How to avoid:** Guest form must include `consentToProfileSharing` checkbox (same as member booking)
**Warning signs:** Guests visible without explicit opt-in

### Pitfall 4: Notification Type Not in Schema

**What goes wrong:** Runtime error when creating notification
**Why it happens:** New notification type not added to schema union
**How to avoid:** Add `guest_visit_approved`, `guest_visit_rejected`, `guest_visit_pending` to notifications.type union
**Warning signs:** TypeScript errors on notification insert

### Pitfall 5: Capacity Check Missing Pending Guests

**What goes wrong:** Over-capacity because pending guests not counted
**Why it happens:** Capacity query only counts 'confirmed' status
**How to avoid:** Decision to only count confirmed is correct - pending are speculative. But document clearly.
**Warning signs:** None - this is correct behavior per design

### Pitfall 6: Guest Profile Not Created on Signup

**What goes wrong:** User signs up but has no guestProfile, application fails
**Why it happens:** No post-signup hook creating guestProfile
**How to avoid:** Create guestProfile in the visit application mutation, not on signup
**Warning signs:** "Guest profile not found" errors

## Code Examples

Verified patterns from the codebase:

### Schema Extension for spaceBookings

```typescript
// Add to convex/schema.ts spaceBookings table
// Fields already exist: bookingType: 'member' | 'guest', status: 'pending' | 'rejected'
// Add these new fields:
approvedBy: v.optional(v.id('orgMemberships')),  // Who approved
approvedAt: v.optional(v.number()),              // When approved
rejectionReason: v.optional(v.string()),         // Why rejected (optional message)
```

### New guestProfiles Table

```typescript
// Source: CONTEXT.md Decision #10
guestProfiles: defineTable({
  userId: v.string(),                               // Required - links to auth user
  name: v.string(),                                 // Required - display name
  email: v.string(),                                // Required - for notifications

  // Optional fields
  phone: v.optional(v.string()),
  organization: v.optional(v.string()),
  title: v.optional(v.string()),

  // Visit tracking
  visitCount: v.number(),                           // Increment on confirmed visit
  firstVisitDate: v.optional(v.string()),           // ISO date of first visit
  lastVisitDate: v.optional(v.string()),            // ISO date of most recent visit

  // Conversion tracking (GUEST-08)
  becameMember: v.boolean(),                        // True when converts to full profile
  becameMemberAt: v.optional(v.number()),           // Timestamp of conversion
  convertedToProfileId: v.optional(v.id('profiles')), // Link to full profile

  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_email', ['email']),
```

### New visitApplicationResponses Table

```typescript
// Source: CONTEXT.md Decision #2
visitApplicationResponses: defineTable({
  spaceBookingId: v.id('spaceBookings'),  // Links to the booking
  fieldId: v.string(),                     // Matches coworkingSpaces.customVisitFields[].fieldId
  value: v.string(),                       // The submitted value
  createdAt: v.number(),
})
  .index('by_booking', ['spaceBookingId']),
```

### Notification Type Extension

```typescript
// Add to notifications table type union in schema.ts
type: v.union(
  v.literal('event_new'),
  v.literal('event_reminder'),
  v.literal('event_updated'),
  v.literal('attendance_prompt'),
  v.literal('org_application_approved'),
  v.literal('org_application_rejected'),
  v.literal('booking_confirmed'),
  // New guest notification types
  v.literal('guest_visit_approved'),
  v.literal('guest_visit_rejected'),
  v.literal('guest_visit_pending'),
),
```

### Auth Guard Helper

```typescript
// Source: convex/lib/auth.ts - add new helper
export async function requireGuestOrMember(
  ctx: QueryCtx | MutationCtx,
  spaceId: Id<'coworkingSpaces'>,
): Promise<{
  userId: string
  isGuest: boolean
  space: Doc<'coworkingSpaces'>
}> {
  const userId = await auth.getUserId(ctx)
  if (!userId) throw new Error('Not authenticated')

  const space = await ctx.db.get(spaceId)
  if (!space) throw new Error('Space not found')

  // Check if org member
  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('orgId'), space.orgId))
    .first()

  if (membership) {
    return { userId, isGuest: false, space }
  }

  // Check if guest
  const guestProfile = await ctx.db
    .query('guestProfiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()

  if (guestProfile) {
    return { userId, isGuest: true, space }
  }

  throw new Error('Not authorized - must be member or guest')
}
```

### Get Attendees with Guests

```typescript
// Source: Extend convex/spaceBookings.ts getBookingAttendees
// Modify to include guests with confirmed status

const bookings = await ctx.db
  .query('spaceBookings')
  .withIndex('by_space_date', (q) => q.eq('spaceId', spaceId).eq('date', date))
  .filter((q) =>
    q.and(
      q.eq(q.field('status'), 'confirmed'),
      q.eq(q.field('consentToProfileSharing'), true),
    ),
  )
  .collect()

const attendees = await Promise.all(
  bookings.map(async (booking) => {
    if (booking.bookingType === 'guest') {
      // Fetch from guestProfiles instead of profiles
      const guestProfile = await ctx.db
        .query('guestProfiles')
        .withIndex('by_user', (q) => q.eq('userId', booking.userId))
        .first()

      return {
        bookingId: booking._id,
        userId: booking.userId,
        isGuest: true,
        // ... other booking fields
        profile: guestProfile
          ? {
              name: guestProfile.name,
              headline: guestProfile.title ?? guestProfile.organization,
              skills: [], // Guests don't have skills
            }
          : null,
      }
    } else {
      // Existing member logic
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', booking.userId))
        .first()

      return {
        bookingId: booking._id,
        userId: booking.userId,
        isGuest: false,
        // ... existing return structure
      }
    }
  }),
)
```

## State of the Art

| Old Approach                  | Current Approach       | When Changed  | Impact                                    |
| ----------------------------- | ---------------------- | ------------- | ----------------------------------------- |
| Embedded auth forms           | @convex-dev/auth hooks | Already using | Use useAuthActions().signIn()             |
| Manual notification insert    | Scheduler pattern      | Phase 31      | Always use ctx.scheduler.runAfter(0, ...) |
| Individual approval mutations | Batch operations       | Best practice | Support batch for GUEST-10                |

**Deprecated/outdated:**

- Direct notification insert in mutations: Use scheduler for atomicity
- Anonymous provider for guests: Use Password provider for persistence

## Open Questions

Things that couldn't be fully resolved:

1. **Email verification for guests**
   - What we know: Existing org application flow doesn't require email verification
   - What's unclear: Should guests verify email before submitting visit application?
   - Recommendation: Follow existing pattern - no verification required, prioritize conversion

2. **Guest signup UI location**
   - What we know: CONTEXT.md suggests inline form on `/org/$slug/visit` page
   - What's unclear: Whether @convex-dev/auth supports inline signup without redirect
   - Recommendation: Use LoginCard component pattern with tabs, test during implementation

3. **Capacity warning for guests**
   - What we know: Members see capacity warnings on booking page
   - What's unclear: Should guests see capacity on public visit page?
   - Recommendation: Show capacity info (helps guests pick better dates) but allow application regardless

## Sources

### Primary (HIGH confidence)

- `/Users/luca/conductor/workspaces/ASTN/spokane/convex/orgApplications.ts` - Approval workflow pattern
- `/Users/luca/conductor/workspaces/ASTN/spokane/convex/spaceBookings.ts` - Booking mutations pattern
- `/Users/luca/conductor/workspaces/ASTN/spokane/convex/schema.ts` - Existing schema structure
- `/Users/luca/conductor/workspaces/ASTN/spokane/convex/notifications/mutations.ts` - Notification pattern
- `/Users/luca/conductor/workspaces/ASTN/spokane/src/routes/org/$slug/join.tsx` - Public page with auth gate
- `/Users/luca/conductor/workspaces/ASTN/spokane/src/components/auth/login-card.tsx` - Auth form pattern
- `/Users/luca/conductor/workspaces/ASTN/spokane/src/components/org/VisitFieldsEditor.tsx` - Dynamic form fields

### Secondary (MEDIUM confidence)

- Convex Auth Password provider docs (https://labs.convex.dev/auth/config/passwords) - Confirmed Password flow
- Convex Scheduled Functions docs (https://docs.convex.dev/scheduling/scheduled-functions) - Confirmed scheduler pattern

### Tertiary (LOW confidence)

- None - all findings verified against codebase

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Already installed and in use
- Architecture: HIGH - Direct patterns from existing codebase
- Pitfalls: HIGH - Based on schema constraints and code review

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - stable patterns)
