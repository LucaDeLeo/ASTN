# Pitfalls Research: v1.5 Co-working & Org Onboarding

**Project:** AI Safety Talent Network - Milestone v1.5
**Domain:** Co-working space booking, org onboarding/approval, guest access
**Researched:** 2026-02-03
**Confidence:** HIGH (based on deep codebase analysis + domain knowledge of booking systems and approval workflows)

---

## Summary

The three highest-risk areas for v1.5 are: (1) introducing a "guest user" concept into a system built entirely around authenticated full-profile users, which will ripple through auth, privacy, data visibility, and notification code; (2) building timezone-aware flexible hour booking ("10am-3pm") without a robust temporal model, which creates edge cases around capacity counting, operating hours validation, and date boundary handling; and (3) adding an ASTN platform-level admin role when the existing system only has org-level admins, requiring a new authorization layer that must not conflict with existing `requireOrgAdmin` patterns.

---

## Critical Pitfalls

Mistakes that will derail the milestone or cause rewrites.

---

### 1. Guest Users Pollute the Existing Identity Model

**What goes wrong:** The current system assumes every user has a full auth session via `@convex-dev/auth` (GitHub, Google, or Password), a `profiles` record with `userId` linking to the auth `users` table, and `orgMemberships` gating all org-scoped access. Guest users -- who need quick lightweight accounts for visit applications -- do not fit this model. If guests are shoehorned into the existing `users` table, they inherit full profile expectations, notification preferences, engagement scoring, and match computation. If they are stored separately, every query that touches users needs to branch on "is this a guest or a real user?"

**Warning signs:**
- Finding yourself adding `isGuest` boolean checks throughout existing queries
- Guest accounts triggering engagement score computation or match alerts
- Existing `requireAuth` helper treating guest tokens as fully authenticated
- Guest data appearing in CRM member lists and org dashboards
- Profile completeness prompts showing for guests who never intended to create a profile

**Prevention:**
1. **Decide the identity architecture first, before any feature code.** Two viable approaches:
   - **Approach A (recommended for this scale): Guest as a separate table.** Create a `guestUsers` table with minimal fields (name, email, phone). Visit applications reference `guestUserId` instead of `userId`. When a guest later creates a full account, a one-time migration copies data from `guestUsers` to `profiles` and re-links their visit history.
   - **Approach B: Guest as a user with a role flag.** Add `accountType: "full" | "guest"` to the auth `users` table. Every existing query that assumes a full user must be audited and guarded. This is more work than it sounds because the existing codebase has ~15+ files that call `auth.getUserId()` and assume the result maps to a full profile.
2. **Audit every call to `auth.getUserId(ctx)`.** There are at minimum: `profiles.ts` (7 endpoints), `orgs/membership.ts` (4 endpoints), `orgs/admin.ts` (6 endpoints), `notifications/mutations.ts` (3 endpoints), `attendance/` (multiple), `engagement/` (multiple), `programs.ts` (6 endpoints). Each needs to be evaluated for guest vs full user behavior.
3. **Design the guest-to-member conversion path up front.** The spec says "Guest info pre-fills ASTN profile if they later create one." This means visit application data (name, email, purpose, etc.) must be structured to map onto profile fields. Define this mapping before building either the guest form or the conversion flow.

**Phase:** MUST be resolved in the first phase (schema/architecture design) before any booking or guest features are built.

---

### 2. Flexible Hour Bookings Without a Temporal Model Create Capacity Chaos

**What goes wrong:** The spec says members book with flexible hours ("10am-3pm") and spaces have operating hours and capacity limits. Without a proper temporal model, capacity checks become nightmarishly complex. "Is there room at 2pm?" requires checking every booking whose time range overlaps 2pm. With 30 desks and a mix of "9am-5pm", "10am-3pm", "1pm-6pm" bookings, naive capacity checking is O(n) per query and prone to race conditions.

**Warning signs:**
- Capacity check queries scanning all bookings for a day and filtering in JavaScript
- Two users booking simultaneously and both getting the last desk
- Off-by-one errors at operating hours boundaries (is 6pm operating hours "until 6pm" or "through 6pm"?)
- Timezone confusion: user in UTC-3 books "10am" but the space is in UTC-3 too -- what gets stored?
- Soft capacity warnings that are inconsistent (shows warning at one time, not at another for the same actual occupancy)

**Prevention:**
1. **Store bookings as time ranges with explicit start/end, always in the space's local timezone.** Do NOT store UTC timestamps for booking times -- this is a community space, not a flight booking system. Store the date (YYYY-MM-DD), startHour (number 0-23), endHour (number 0-23), and the space's timezone. This avoids DST confusion entirely for daily bookings.
2. **For capacity checks, use hourly slots as the unit of measure.** A booking from 10am-3pm occupies slots [10, 11, 12, 13, 14]. Capacity at any given hour = total desks minus count of bookings whose slot range includes that hour. This is simple, fast, and correct.
3. **For soft capacity warnings, compute peak occupancy across the requested time range.** If any hour in "10am-3pm" is at or over capacity, show the warning. Do not just check start time.
4. **Handle race conditions with Convex's transactional mutations.** Convex mutations are serialized, so the capacity check + booking insert can be atomic. Do NOT check capacity in a query and then book in a separate mutation -- another user could book in between.
5. **Validate against operating hours in the same mutation.** If space operates 8am-8pm and user requests 7am-3pm, reject immediately with a clear error, not a silent truncation.

**Phase:** Must be designed in the booking schema phase. Getting the temporal model wrong means rewriting all booking logic later.

---

### 3. ASTN Platform Admin vs Org Admin Role Confusion

**What goes wrong:** The v1.5 spec requires two new admin concepts: (1) ASTN platform admins who approve org applications and manage platform-wide settings, and (2) org admins who configure their space's booking forms, approve guest visits, and manage their space. The existing codebase has only org-level admin (`requireOrgAdmin` and `requireAnyOrgAdmin`). If the platform admin role is implemented as "admin of a special org" or conflated with the existing `requireAnyOrgAdmin`, authorization logic becomes a tangled mess.

**Warning signs:**
- Using `requireAnyOrgAdmin` for platform-level actions (it checks if user is admin of ANY org, not that they are a platform admin)
- Platform admin endpoints accessible to any org admin
- Org admins unable to perform their space management duties because the system expects platform admin permissions
- Two separate "admin" UIs with overlapping and confusing permissions

**Prevention:**
1. **Create an explicit platform admin concept, separate from org admin.** Options:
   - **Add a `platformRole` field to the `users` table** (e.g., `"platform_admin" | "user"`). This is clean and separate from org roles.
   - **Create a `platformAdmins` table** that lists user IDs with platform-level permissions. Simplest and most auditable.
2. **Create a new `requirePlatformAdmin(ctx)` helper** in `convex/lib/auth.ts` alongside the existing `requireAuth` and `requireAnyOrgAdmin`. Never reuse `requireAnyOrgAdmin` for platform actions.
3. **Document the permission matrix clearly:**
   - Platform admin: approve/reject org applications, manage platform settings, view all orgs
   - Org admin: configure space (hours, capacity, forms), approve/reject guest visits, view bookings/attendance for their space
   - Member: book desks at spaces they have access to
   - Guest: submit visit applications, book if approved
4. **Separate the admin UIs.** Platform admin should be at `/admin/...` (the existing route pattern). Org admin space management should be at `/org/$slug/admin/space/...` alongside the existing org admin routes.

**Phase:** Must be resolved before building any org application or space management features. Retrofitting a permission model is expensive.

---

### 4. Org Application/Approval Workflow Without State Machine Discipline

**What goes wrong:** The org onboarding flow (apply -> ASTN reviews -> approved/rejected -> org self-configures) has multiple states and transitions. Without explicit state machine discipline, edge cases multiply: What if an org applies twice? What if a rejected org re-applies? What if a platform admin starts reviewing an application that another admin already approved? What if the org admin who applied loses access before configuration is complete?

**Warning signs:**
- Application status stored as a string with ad-hoc transition logic scattered across mutations
- No validation that state transitions are legal (e.g., jumping from "pending" to "configured" without passing through "approved")
- Race conditions where two platform admins approve/reject the same application simultaneously
- Orphaned applications that are neither approved nor rejected, sitting in limbo
- No audit trail of who approved/rejected and when

**Prevention:**
1. **Define the state machine explicitly:**
   ```
   DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> CONFIGURING -> ACTIVE
                                      -> REJECTED -> (can re-apply: SUBMITTED)
   ```
2. **Validate transitions in mutations.** Every state-changing mutation should check current state and throw if the transition is illegal. Example: `approveApplication` should only work if status is `UNDER_REVIEW`, not `DRAFT` or `REJECTED`.
3. **Store transition history.** For each state change, record: who, when, from_state, to_state, notes. This is cheap in Convex (just another table) and invaluable for debugging.
4. **Handle the "reviewer assignment" problem.** If multiple platform admins exist, consider a simple "assigned to" field to prevent conflicting reviews. Or accept last-write-wins at this scale (with audit trail).
5. **Design re-application flow.** Can a rejected org re-apply? If yes, create a new application record (preserving the rejection history) rather than mutating the old one.

**Phase:** Org application phase. The state machine design should be in the schema, not the UI.

---

## Significant Pitfalls

Mistakes that will cause rework, technical debt, or degraded user experience.

---

### 5. Custom Visit Application Forms Without a Form Schema Model

**What goes wrong:** The spec says orgs can configure custom visit application forms. If this is built as a hardcoded set of optional fields with toggles, it will be inflexible and require code changes for each new field type. If it is built as a fully dynamic form builder, it is massively over-engineered for the use case (10-30 desk spaces, not enterprise SaaS).

**Warning signs:**
- Org admins asking for field types that do not exist in the system
- Visit application data stored as untyped JSON blobs that are impossible to query or report on
- Form configuration UI that is more complex than the booking flow itself
- Different orgs needing different validation rules with no way to express them

**Prevention:**
1. **Use a "form template" approach: a predefined set of field types with org-configurable labels and required/optional flags.** Field types: text, textarea, select (with predefined options), date, email, phone, checkbox. This covers 95% of cases without building a form builder.
2. **Store the form schema as a JSON structure on the organization record:**
   ```typescript
   visitApplicationForm: v.optional(v.array(v.object({
     fieldId: v.string(),      // "purpose", "referral", etc.
     label: v.string(),        // "Purpose of visit"
     type: v.union(v.literal("text"), v.literal("textarea"), v.literal("select"), ...),
     required: v.boolean(),
     options: v.optional(v.array(v.string())),  // for select fields
   })))
   ```
3. **Store submitted application data as key-value pairs** referencing fieldIds, not as free-form JSON. This enables reporting and querying.
4. **Provide sensible defaults.** When an org enables the co-working space, pre-populate a default form (name, email, purpose of visit, expected date) that they can customize.

**Phase:** Space configuration phase, before building the guest application flow.

---

### 6. Consent Model for Booking = Profile Visibility Is Under-specified

**What goes wrong:** The spec says "booking means other attendees can see your profile." But the existing privacy system has granular section-level visibility (`defaultVisibility`, `sectionVisibility`, `hiddenFromOrgs`). If booking consent overrides these settings, users lose control of their privacy in a way they did not expect. If booking consent does NOT override these settings, other attendees see "private profile" placeholder cards, which defeats the purpose.

**Warning signs:**
- Users who set their profile to "private" are confused when attendees can see their info
- Users who set their profile to "connections only" are confused about what "connections" means in a booking context
- The privacy settings page has no mention of booking-related visibility
- Other attendees see inconsistent levels of profile data depending on individual privacy settings

**Prevention:**
1. **Define a "booking visibility" scope that is separate from general profile visibility.** When a user books a space for a given day, they consent to show a booking-specific subset of their profile (name, headline, skills) to other people booked on the same day at the same space. This is NOT the same as their general profile visibility.
2. **Make the consent explicit in the booking flow.** Show a clear notice: "By booking, you agree that your name and headline will be visible to others booked on the same day." Do not bury this in terms of service.
3. **Store booking visibility consent per booking**, not globally. A user might be fine with visibility at one space but not another.
4. **Define what "profile" means in booking context.** Recommendation: name + headline + skills only. Do NOT expose education, work history, career goals, or enrichment summary through booking visibility.
5. **Create a `bookingProfile` query that returns only the consented subset**, separate from the full profile queries used in CRM and matching.

**Phase:** Must be designed alongside the booking schema, before building the attendee list UI.

---

### 7. Soft Capacity Warnings That Users Ignore or Misunderstand

**What goes wrong:** The spec says capacity limits are "soft" (warning, not hard block). In practice, soft limits are either ignored by users (everyone books regardless of the warning) or interpreted as hard limits (users are confused when they can still book). The space ends up either always over capacity or users complain about confusing UX.

**Warning signs:**
- Spaces consistently at 120-150% of stated capacity
- Users booking and then not showing up because they assumed it would be too crowded
- Org admins asking "can we make the limit hard?"
- Users interpreting the soft warning differently ("should I not book?" vs "just letting me know")

**Prevention:**
1. **Make the warning copy crystal clear.** Not "This space is at capacity" but "This space expects to be full on this day. You can still book, but it may be crowded. [Book Anyway] [Choose Another Day]"
2. **Show actual projected occupancy numbers**, not just a warning threshold. "15 of 12 desks booked" is more informative than a yellow warning icon.
3. **Let orgs configure the threshold** for when warnings appear (e.g., at 80% capacity, at 100%, or never).
4. **Track over-capacity days** and actual attendance. If soft limits are routinely exceeded with no issues (people cancel, don't show up), the capacity number might just be wrong.
5. **Consider a simple "waitlist" for over-capacity days** -- "You're booked but 3 spots over capacity. We'll notify you if it clears up." This gives users more confidence.
6. **Always allow org admins to hard-override** -- reject or approve bookings manually regardless of capacity.

**Phase:** Booking UX phase, but the data model needs the capacity threshold configuration from the space setup phase.

---

### 8. Guest-to-Member Conversion Loses Visit History

**What goes wrong:** A guest submits a visit application, gets approved, visits the space, has a great experience, and then creates a full ASTN account. But their visit history, application data, and any relationships formed during the guest phase are lost or disconnected. The user has to re-enter information, and admins see them as a "new" member with no history.

**Warning signs:**
- Converted guests showing zero attendance history despite having visited
- Duplicate records: one guest record and one member record for the same person
- Admin confusion: "I approved this person last week, why do they show as new?"
- Guest data (name, email, purpose) not pre-filling the profile creation form

**Prevention:**
1. **Design the data linking strategy before building guest features.** The guest record needs a stable identifier (email is the most practical) that can be matched when the same person creates a full account.
2. **On account creation, check for existing guest records by email.** If found, prompt: "We found visit history from your previous visits. Would you like to link this to your new account?"
3. **Store guest visit data in a format that references can be re-pointed.** If guest visits have `guestUserId: v.id("guestUsers")`, add an optional `convertedUserId: v.optional(v.string())` field. After conversion, queries can find visits by either guest ID or converted user ID.
4. **Pre-fill profile fields from guest data.** The visit application likely captured name, email, maybe organization affiliation. Map these to profile fields automatically but let the user edit before saving.
5. **Test the conversion flow end-to-end** as a first-class user journey, not an afterthought. It is one of the most valuable funnels: guest -> member.

**Phase:** Must be designed in the guest identity architecture phase (same as Pitfall 1) and implemented alongside the guest application flow.

---

### 9. Operating Hours and Date Handling Across Timezones

**What goes wrong:** A co-working space in Buenos Aires (UTC-3) has operating hours 9am-7pm. The system stores times in UTC. An admin configures "9am-7pm" but the system stores "12:00-22:00 UTC." When daylight saving changes (Argentina does not currently observe DST, but other future spaces might), stored times shift by an hour. Users in different timezones see wrong hours.

**Warning signs:**
- Operating hours displayed incorrectly after DST transitions
- Users seeing "open until 10pm" when the space closes at 7pm local time
- Booking validation rejecting valid times because UTC conversion is off
- Admin configuring hours and seeing different hours displayed back

**Prevention:**
1. **Store operating hours as local times with a timezone identifier, not as UTC timestamps.** Schema: `operatingHours: { timezone: "America/Argentina/Buenos_Aires", open: 9, close: 19 }`. Convert to/from UTC only at display/validation time.
2. **Store booking dates as local dates (YYYY-MM-DD), not timestamps.** A booking for "February 5th, 10am-3pm at BAISH" should be stored as `date: "2026-02-05", startHour: 10, endHour: 15, spaceTimezone: "America/Argentina/Buenos_Aires"`. No UTC conversion needed for daily bookings.
3. **Display all times in the space's timezone**, not the user's timezone. Unlike events (which might be virtual and span timezones), a physical co-working space visit is inherently local.
4. **For the admin dashboard calendar view**, always render in the space's timezone.
5. **If you ever support spaces in multiple timezones**, display the timezone label explicitly: "9:00 AM - 3:00 PM (Buenos Aires time)".

**Phase:** Booking schema design phase. This is a data model decision, not a display decision.

---

## Minor Pitfalls

Mistakes that cause friction but are fixable without major rework.

---

### 10. Booking Calendar UX That Does Not Show Who Is Coming

**What goes wrong:** Users can book but cannot see who else is coming that day. The main value of a co-working space for a community like AI safety is serendipitous interaction. Without knowing who is coming, users cannot make informed booking decisions (e.g., "I want to go when Alice is there").

**Prevention:**
1. Show an attendee list (with booking-consented profile data) on the day view before booking.
2. Let users opt into "notify me when [person] books" for closer collaborators.
3. Consider showing a skills/interests tag cloud for each day to encourage diverse interaction.
4. Respect the consent model from Pitfall 6 -- only show data users consented to share.

**Phase:** Booking UX phase, after consent model is established.

---

### 11. Admin Dashboard Overload With Booking Data

**What goes wrong:** The existing org admin dashboard shows members, programs, events, engagement, and settings. Adding bookings (calendar, attendance, utilization, guest applications) to the same dashboard makes it overwhelming and slow (see v1.2 Pitfall 4 about CRM dashboard performance).

**Prevention:**
1. **Give space management its own tab/section** in the org admin dashboard, not mixed into the member list.
2. **Use date-scoped queries for booking data.** Never load "all bookings ever" -- always filter by date range (default: this week).
3. **Denormalize utilization stats** (daily counts) rather than computing from raw bookings on every dashboard load.
4. **Separate the guest application review queue** from the booking calendar. They are different admin tasks with different urgency.

**Phase:** Admin dashboard phase, after core booking logic works.

---

### 12. Visit Application Approval Flow Without Notifications

**What goes wrong:** A guest submits a visit application. The org admin does not check the dashboard for 3 days. The guest's requested visit date passes. Guest has a terrible experience. Org looks unresponsive.

**Prevention:**
1. **Notify org admins immediately** (in-app + email) when a new visit application is submitted.
2. **Show pending application count** as a badge on the org admin dashboard.
3. **Set a deadline for review.** If the visit is requested for tomorrow and the application was submitted today, flag it as urgent.
4. **Allow auto-approval rules** for orgs that do not want manual review (e.g., "auto-approve all applications from ASTN members").
5. **Send the guest a confirmation email** with expected response time: "Your application is being reviewed. You'll hear back within 24 hours."

**Phase:** Guest application phase, alongside the approval workflow.

---

### 13. Booking Cancellation Edge Cases

**What goes wrong:** User books for tomorrow, then cancels at 11pm. Another user saw the "full" warning and did not book. The spot goes unfilled. Or: user cancels after the day has started. Or: user no-shows and the booking remains active.

**Prevention:**
1. **Define cancellation policies per space:** how late can you cancel? Is there a no-show penalty?
2. **When someone cancels, notify users who attempted to book when it was at capacity** (if a waitlist exists).
3. **Auto-expire bookings** at end of day. Do not let stale bookings linger.
4. **Track no-shows** (admin marks attendance). No-show data feeds into the engagement system.
5. **Keep cancellation simple for MVP:** cancel any time before the booking date, no penalties. Add complexity later.

**Phase:** Booking logic phase.

---

## Integration-Specific Pitfalls

Pitfalls unique to adding these features to the existing ASTN system.

---

### I-1. Existing `orgMemberships` Table Overloaded With New Responsibilities

**What goes wrong:** The `orgMemberships` table currently tracks: user, org, role (admin/member), directory visibility, join date, invited by. v1.5 wants to add space access permissions, booking preferences, and possibly guest-related flags. The table becomes a dumping ground for unrelated concerns.

**Current state in codebase:** `orgMemberships` has indexes `by_user`, `by_org`, `by_org_role`. It is queried extensively in `orgs/membership.ts`, `orgs/admin.ts`, `orgs/directory.ts`, `programs.ts`, `engagement/`, and `attendance/`.

**Prevention:**
- **Do NOT add booking-related fields to `orgMemberships`.** Create separate `spaceBookings`, `spaceAccess`, and `visitApplications` tables.
- Keep `orgMemberships` focused on organizational membership. Space access is a separate concern (not all org members may have space access, and guests may have space access without org membership).
- Create a `spaceAccess` table that links users (or guests) to specific spaces with their access level and any restrictions.

---

### I-2. Existing Auth Helpers Do Not Support the New Permission Levels

**What goes wrong:** The current `convex/lib/auth.ts` has two helpers: `requireAuth` (is user logged in?) and `requireAnyOrgAdmin` (is user admin of any org?). v1.5 needs: `requirePlatformAdmin`, `requireOrgAdmin(orgId)` (exists in individual files but not as a shared helper), `requireSpaceAccess(spaceId)`, and `requireGuestOrAuth` (either a guest token or full auth).

**Current state in codebase:** The `requireOrgAdmin` helper is duplicated in `convex/programs.ts` and `convex/orgs/admin.ts` with slightly different implementations. There is no centralized permission system.

**Prevention:**
1. **Consolidate auth helpers into `convex/lib/auth.ts` before adding new ones.** Move the duplicated `requireOrgAdmin` to the shared module.
2. **Add new helpers in a single commit** before building features that use them:
   - `requirePlatformAdmin(ctx)` - checks platform admin table/field
   - `requireOrgAdmin(ctx, orgId)` - consolidated version of the duplicated helper
   - `requireSpaceAccess(ctx, spaceId)` - checks user has access to book the space
   - `requireGuestAuth(ctx)` - for guest-only endpoints (visit application status check)
3. **Test the helpers in isolation** before using them in feature code. Auth bugs are the most dangerous kind.

---

### I-3. Notification System Needs New Types Without Breaking Existing Preferences

**What goes wrong:** The existing notification system (`notifications` table) has types: `event_new`, `event_reminder`, `event_updated`, `attendance_prompt`. v1.5 needs: `booking_confirmed`, `booking_cancelled`, `visit_application_submitted` (for admins), `visit_application_approved/rejected` (for guests), `space_at_capacity` (for admins). Adding these without updating the notification preferences system means users cannot control booking-related notifications separately.

**Current state in codebase:** Notification preferences are stored on the profile (`eventNotificationPreferences` with frequency, reminder timing, muted orgs). There is no general notification preference system -- it is event-specific.

**Prevention:**
1. **Extend the notification type union** in the schema to include booking/visit types.
2. **Add booking notification preferences** to the profile, following the existing pattern but as a separate object (not mixed into event preferences).
3. **Default booking notifications to ON for admins** (they need to know about visit applications) and ON for users (they need booking confirmations).
4. **Ensure the existing `createNotification` internal mutation** can handle new types without breaking.
5. **Consider a general notification preferences model** that scales: `notificationPreferences: { [category]: { enabled, frequency } }` rather than adding a new preferences object for every feature.

---

### I-4. Convex Schema Migration for New Tables

**What goes wrong:** Adding ~5 new tables (spaces, bookings, visitApplications, guestUsers, orgApplications) to the Convex schema in one go can cause deployment issues if not planned. Convex requires schema changes to be backward compatible with running code.

**Current state in codebase:** The schema in `convex/schema.ts` is already large (657 lines, ~15 tables). Adding more tables is fine for Convex (no migration needed for new tables), but modifying existing tables (adding fields to `organizations`, `profiles`) requires careful staged deployment.

**Prevention:**
1. **Add new tables first** (pure additions, no risk): `spaces`, `spaceBookings`, `visitApplications`, `guestUsers`, `orgApplications`.
2. **Add new optional fields to existing tables** in a separate deployment: `organizations` gets space configuration fields (optional, so backward compatible). `profiles` gets booking preferences (optional).
3. **Never make a field required on an existing table** that has existing data. Always use `v.optional()` and handle the missing case in code.
4. **Test schema changes against the existing Convex deployment** before merging. Convex will reject incompatible schema changes at deploy time.

---

### I-5. The Existing Programs Approval Pattern Is Not Reusable As-Is

**What goes wrong:** The existing `programs.ts` has an `enrollmentMethod: "approval_required"` pattern with `programParticipation` status tracking (pending, enrolled, completed, withdrawn, removed). Developers might try to copy this pattern for visit application approval. But programs are org-internal (org members only), while visit applications are from external guests. The trust model is fundamentally different.

**Current state in codebase:** `programs.ts` enrollment checks `orgMemberships` to verify the user is an org member before enrollment. Guest visit applications cannot use this check because guests are not org members.

**Prevention:**
1. **Do not extend `programParticipation` for visit applications.** Create a dedicated `visitApplications` table with its own status machine.
2. **The approval workflow pattern can be reused** (state machine, admin review, audit trail) but the access control layer must be different (guest auth, not org membership).
3. **Similarly, org applications to ASTN are a third, separate approval flow** (org applies to platform, platform admin reviews). This is neither program enrollment nor visit application. Give it its own table and handlers.

---

## Phase-Specific Risk Summary

| Phase Topic | Likely Pitfall | Risk Level | Mitigation Priority |
|---|---|---|---|
| Schema & Identity Design | Guest user identity model (#1) | CRITICAL | Resolve before any feature code |
| Schema & Identity Design | Auth helper consolidation (#I-2) | HIGH | Do first to unblock all features |
| Schema & Identity Design | Schema migration planning (#I-4) | MEDIUM | Plan deployment order |
| ASTN Platform Admin | Role confusion with org admin (#3) | CRITICAL | Separate permission model |
| Org Application Flow | State machine discipline (#4) | HIGH | Explicit states and transitions |
| Space Configuration | Custom form schema model (#5) | MEDIUM | Template approach, not form builder |
| Space Configuration | Operating hours timezone (#9) | HIGH | Local times, not UTC |
| Booking System | Temporal model for capacity (#2) | CRITICAL | Hourly slots, transactional checks |
| Booking System | Soft capacity UX (#7) | MEDIUM | Clear copy, show numbers |
| Booking System | Cancellation edge cases (#13) | LOW | Simple policy for MVP |
| Booking System | Consent model (#6) | HIGH | Separate booking visibility scope |
| Guest Application | Visit approval notifications (#12) | MEDIUM | Notify admins immediately |
| Guest Application | Guest-to-member conversion (#8) | HIGH | Design linking strategy up front |
| Guest Application | Reusing programs pattern (#I-5) | MEDIUM | Separate table, separate flow |
| Admin Dashboard | Dashboard overload (#11) | MEDIUM | Separate tabs, date-scoped queries |
| Notifications | New types without preferences (#I-3) | MEDIUM | Extend preferences system |
| Attendee List | Who is coming UX (#10) | LOW | After consent model |
| All | orgMemberships overload (#I-1) | MEDIUM | Separate tables for new concerns |

---

## Convex-Specific Technical Warnings

### Transactional Capacity Checks

Convex mutations are ACID within a single mutation call. Use this for booking:

```typescript
// CORRECT: Check + insert in single mutation
export const createBooking = mutation({
  handler: async (ctx, args) => {
    const existingBookings = await ctx.db.query("spaceBookings")
      .withIndex("by_space_date", q => q.eq("spaceId", args.spaceId).eq("date", args.date))
      .collect();

    const peakOccupancy = computePeakOccupancy(existingBookings, args.startHour, args.endHour);
    const space = await ctx.db.get("spaces", args.spaceId);

    if (peakOccupancy >= space.capacity) {
      // Soft warning: still insert, but flag
      // return { warning: "Space is at capacity" }
    }

    await ctx.db.insert("spaceBookings", { ... });
  }
});

// WRONG: Check in query, book in separate mutation (race condition)
```

### Index Strategy for Bookings

Essential indexes for booking queries:

```typescript
spaceBookings: defineTable({ ... })
  .index("by_space_date", ["spaceId", "date"])           // capacity checks
  .index("by_user", ["userId"])                            // "my bookings"
  .index("by_space_date_range", ["spaceId", "date", "startHour"]) // calendar view
  .index("by_guest", ["guestUserId"])                      // guest booking history
```

### Real-Time vs Polling for Booking Data

| Feature | Real-Time? | Rationale |
|---|---|---|
| Available capacity for a specific day | Yes | Single query, low bandwidth, users need current info |
| Attendee list for a booked day | Yes | Small list, users want to see who joins |
| Admin booking calendar (week view) | No (poll/refresh) | Too many subscriptions for 7 days of data |
| Admin utilization stats | No (batch compute) | Aggregate view, not real-time critical |
| Guest application queue | Yes | Admins need to act quickly on applications |
| Booking confirmation for user | Yes | Single document subscription |

---

## Relationship to Previous Pitfalls

| Previous Pitfall | v1.5 Interaction |
|---|---|
| v1.2 #1: Notification fatigue | v1.5 adds MORE notification types (booking, visit applications). Must coordinate with existing notification budget. |
| v1.2 #4: CRM dashboard performance | Booking dashboard adds more data to admin views. Must follow same denormalization patterns. |
| v1.2 #5: Invite link security | Org onboarding flow is a new access vector. Application approval adds security that invite links lacked. |
| v1.2 #6: Location privacy | Booking inherently reveals physical presence at a location. Consent model (Pitfall 6) must be clear. |
| v1.0 #5: Privacy violations | Guest data collection creates new privacy surface. Consent for data retention and profile pre-fill is needed. |

---

## Confidence: HIGH

This analysis is based on:
- Deep reading of the existing codebase (schema, auth patterns, admin helpers, membership flow, programs, notifications)
- Direct identification of integration points that will be affected
- Domain knowledge of booking systems, approval workflows, and guest access patterns
- Understanding of Convex's transactional model and real-time subscription characteristics
- Cross-referencing with previously identified pitfalls from v1.0 and v1.2 research

The pitfalls are specific to this project's architecture and feature set, not generic booking system advice.

---

_Pitfalls research for: ASTN v1.5 - Co-working Space Booking & Org Onboarding_
_Researched: 2026-02-03_
