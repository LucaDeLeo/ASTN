# Phase 29: Performance, Accessibility & Polish - Research

**Researched:** 2026-02-02
**Domain:** Convex query optimization, ARIA/keyboard accessibility, visual consistency
**Confidence:** HIGH

## Summary

This phase hardens the existing codebase across three axes: database query efficiency, keyboard/screen-reader accessibility, and visual consistency. No new features are added -- every change improves what already exists.

**Performance:** The codebase has clear N+1 query patterns in `convex/programs.ts` (per-program participant counts via `Promise.all` of index queries), `convex/attendance/queries.ts` (per-record `ctx.db.get` for events and orgs), and `convex/emails/send.ts` (per-profile `ctx.db.query("users")` filter lookups). The matching compute action (`convex/matching/compute.ts`) makes sequential Anthropic API calls per 15-opportunity batch inside a single action with no rate limiting. Convex actions have a 10-minute hard timeout, so chained `ctx.scheduler.runAfter` is the correct approach for rate-limited batch processing.

**Accessibility:** Zero `aria-describedby` attributes exist in any form component. Zero `aria-live` regions exist anywhere. The password form (`src/components/auth/password-form.tsx`) shows a static hint "8+ characters, mixed case, and a number" but performs no inline validation -- errors only surface on server rejection. The `OrgCard` component is a `<Card>` with a `<Button asChild><Link>` inside, which is already keyboard-navigable via the link. The `OrgSelector` search results use bare `<button>` elements that are keyboard-accessible but lack ARIA labels. The `DocumentUpload` component uses `react-dropzone` which provides keyboard support but drag states are color-only.

**Visual:** 8 routes currently use `GradientBg`; 19 route files do not (though some use layout routes). The `settings/route.tsx` layout uses `bg-slate-50`, the `admin/route.tsx` uses `dotGridStyle`, the `attendance` page uses `bg-slate-50`, and all `org/$slug/*` pages use various backgrounds. There are 38 occurrences of `font-bold` on headings across 18 `.tsx` files, and 34 occurrences of `font-display` across 12 files. The pattern is clear: pages touched during the v1.3 visual overhaul use `font-display`, while older/org-admin pages still use `font-bold`.

**Primary recommendation:** Use the two-pass batch pattern (collect IDs, `Promise.all` `ctx.db.get`, build Map) for all N+1 fixes. Use chained scheduled actions for rate-limited matching. Apply `aria-describedby` to all form fields via the pattern of generating stable IDs. Wrap `GradientBg` at the layout-route level where possible.

## Standard Stack

### Core

| Library     | Version                      | Purpose                      | Why Standard                                                                 |
| ----------- | ---------------------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| Convex      | Current (project dependency) | Database queries, scheduler  | Already in use; `ctx.db.get` is the O(1) lookup for batched patterns         |
| React 19    | Current                      | UI rendering, form state     | Already in use; `useId()` provides stable ARIA IDs                           |
| Tailwind v4 | Current                      | Styling (font-display class) | Already in use; `font-display` maps to Space Grotesk via CSS custom property |

### Supporting

| Library        | Version | Purpose                       | When to Use                                                 |
| -------------- | ------- | ----------------------------- | ----------------------------------------------------------- |
| react-dropzone | Current | File drag-and-drop            | Already in use in DocumentUpload; provides keyboard support |
| shadcn/ui      | Current | Focus styles, form primitives | Already in use; provides consistent focus-visible ring      |

### Alternatives Considered

| Instead of               | Could Use                    | Tradeoff                                                                                               |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Manual chained scheduler | @convex-dev/workpool         | Workpool adds external dependency; chained `runAfter` is simpler for this use case and already decided |
| Custom focus styles      | Default shadcn focus-visible | Decision locked: use shadcn defaults                                                                   |

**Installation:** No new dependencies needed. All tools are already in the project.

## Architecture Patterns

### Pattern 1: Two-Pass N+1 Resolution (Convex Queries)

**What:** Replace per-item `ctx.db.get`/`ctx.db.query` inside `Promise.all(items.map(...))` with: collect all IDs first, batch-fetch with `Promise.all(ids.map(id => ctx.db.get(table, id)))`, build a `Map<string, Doc>` for O(1) lookup.
**When to use:** Any query that enriches a list of items with related data (events+orgs, programs+participants, profiles+users).
**Confidence:** HIGH -- this is standard Convex best practice. `ctx.db.get()` by ID is a single-document read, and `Promise.all` of N gets is the recommended batching approach.

```typescript
// Source: Convex docs best practice + codebase pattern in events/queries.ts (getDashboardEvents)
// BEFORE (N+1):
const enriched = await Promise.all(
  records.map(async (record) => {
    const event = await ctx.db.get('events', record.eventId)
    const org = await ctx.db.get('organizations', record.orgId)
    return { ...record, event, org }
  }),
)

// AFTER (two-pass):
// Pass 1: Collect unique IDs
const eventIds = [...new Set(records.map((r) => r.eventId))]
const orgIds = [...new Set(records.map((r) => r.orgId))]

// Pass 2: Batch fetch
const [events, orgs] = await Promise.all([
  Promise.all(eventIds.map((id) => ctx.db.get('events', id))),
  Promise.all(orgIds.map((id) => ctx.db.get('organizations', id))),
])

// Build Maps
const eventMap = new Map(eventIds.map((id, i) => [id, events[i]]))
const orgMap = new Map(orgIds.map((id, i) => [id, orgs[i]]))

// O(1) lookups
const enriched = records
  .map((record) => ({
    ...record,
    event: eventMap.get(record.eventId),
    org: orgMap.get(record.orgId),
  }))
  .filter((r) => r.event !== null)
```

### Pattern 2: User Lookup N+1 Fix (emails/send.ts)

**What:** The email batch queries iterate all profiles and do per-profile `ctx.db.query("users").filter(q => q.eq(q.field("_id"), profile.userId)).first()`. Since `profile.userId` is actually a user ID string, and the `users` table comes from `@convex-dev/auth`, the fix is to use `ctx.db.get("users", profile.userId as Id<"users">)` directly (ID-based O(1) lookup) or batch all user IDs and fetch with `Promise.all`.
**When to use:** Any place that looks up a user by `userId` string stored in profiles.
**Confidence:** HIGH -- the schema stores `userId: v.string()` but values are valid Convex IDs (auth stores them as `_id`). Cast to `Id<"users">` is safe per CONTEXT.md decision.

```typescript
// BEFORE (N+1 with full table scan filter):
for (const profile of profiles) {
  const user = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("_id"), profile.userId))
    .first();
  // ...
}

// AFTER (batch with direct ID lookup):
// Pass 1: Filter profiles that need user lookup
const eligibleProfiles = profiles.filter(p => /* business logic */);

// Pass 2: Batch fetch users by ID
const userIds = eligibleProfiles.map(p => p.userId as Id<"users">);
const users = await Promise.all(userIds.map(id => ctx.db.get("users", id)));
const userMap = new Map(
  userIds.map((id, i) => [id, users[i]])
);

// Pass 3: Build result with O(1) lookups
for (const profile of eligibleProfiles) {
  const user = userMap.get(profile.userId as Id<"users">);
  if (user?.email) {
    usersToNotify.push({ /* ... */ });
  }
}
```

### Pattern 3: Chained Scheduled Actions for Rate-Limited Matching

**What:** Instead of calling the Anthropic API in a loop within a single action (which risks the 10-minute timeout), each batch processes a chunk, saves progress via mutation, and schedules the next batch with exponential backoff delay.
**When to use:** When processing multiple LLM calls that could hit rate limits or exceed 10-minute action timeout.
**Confidence:** HIGH -- Convex docs confirm 10-minute action timeout. `ctx.scheduler.runAfter` from within a mutation is the documented pattern.

```typescript
// Pattern: Chained scheduled actions for rate-limited batch processing
// Source: Convex docs (scheduler) + CONTEXT.md decision

// Entry point - mutation that kicks off the chain
export const startMatchingRun = internalMutation({
  args: {
    profileId: v.id('profiles'),
    batchIndex: v.number(),
    totalBatches: v.number(),
  },
  handler: async (ctx, args) => {
    // Schedule the action for this batch
    await ctx.scheduler.runAfter(
      0,
      internal.matching.compute.processMatchBatch,
      {
        profileId: args.profileId,
        batchIndex: args.batchIndex,
        totalBatches: args.totalBatches,
      },
    )
  },
})

// Each batch: process, save, schedule next
export const processMatchBatch = internalAction({
  args: {
    profileId: v.id('profiles'),
    batchIndex: v.number(),
    totalBatches: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Process this batch (call Anthropic API)
      const results = await callAnthropicForBatch(
        ctx,
        args.profileId,
        args.batchIndex,
      )

      // Save results via mutation
      await ctx.runMutation(internal.matching.mutations.saveBatchResults, {
        profileId: args.profileId,
        batchIndex: args.batchIndex,
        results,
      })

      // Schedule next batch if more remain
      if (args.batchIndex + 1 < args.totalBatches) {
        const delay = 1000 // Base delay between batches (rate limiting)
        await ctx.scheduler.runAfter(
          delay,
          internal.matching.compute.processMatchBatch,
          {
            profileId: args.profileId,
            batchIndex: args.batchIndex + 1,
            totalBatches: args.totalBatches,
          },
        )
      }
    } catch (error) {
      // On rate limit error: retry with exponential backoff
      if (isRateLimitError(error)) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 60000)
        await ctx.scheduler.runAfter(
          backoffDelay,
          internal.matching.compute.processMatchBatch,
          {
            ...args,
            // Pass retry count for backoff calculation
          },
        )
      }
    }
  },
})
```

### Pattern 4: aria-describedby for Form Fields

**What:** Every form field that can have a validation error gets an `aria-describedby` attribute pointing to its error message element. Use React 19 `useId()` to generate stable, unique IDs.
**When to use:** All form fields app-wide (CONTEXT.md decision: every field, not just flagged ones).
**Confidence:** HIGH -- this is WAI-ARIA 1.2 standard practice.

```tsx
// Pattern: aria-describedby with useId()
function FormField({ name, label, error }: Props) {
  const id = useId()
  const inputId = `${id}-input`
  const errorId = `${id}-error`
  const descId = `${id}-desc`

  return (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <Input
        id={inputId}
        name={name}
        aria-describedby={error ? errorId : descId}
        aria-invalid={!!error}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && helpText && (
        <p id={descId} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      )}
    </div>
  )
}
```

### Pattern 5: Inline Password Validation Checklist

**What:** Show a visual checklist of password rules that updates in real-time as the user types. Each rule shows a check or X indicator. The rules must mirror the server-side validation in `convex/auth.ts`.
**When to use:** The sign-up flow in `src/components/auth/password-form.tsx`.
**Confidence:** HIGH -- standard UX pattern, rules already defined in `convex/auth.ts`.

```tsx
// Password rules (must match convex/auth.ts)
const PASSWORD_RULES = [
  {
    key: 'length',
    label: 'At least 8 characters',
    test: (p: string) => p.length >= 8,
  },
  {
    key: 'lower',
    label: 'A lowercase letter',
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    key: 'upper',
    label: 'An uppercase letter',
    test: (p: string) => /[A-Z]/.test(p),
  },
  { key: 'number', label: 'A number', test: (p: string) => /\d/.test(p) },
]

function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="space-y-1 text-sm" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const passes = rule.test(password)
        return (
          <li key={rule.key} className="flex items-center gap-2">
            {passes ? (
              <Check className="size-4 text-green-600" aria-hidden="true" />
            ) : (
              <X className="size-4 text-slate-400" aria-hidden="true" />
            )}
            <span
              className={passes ? 'text-green-700' : 'text-muted-foreground'}
            >
              {rule.label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
```

### Pattern 6: GradientBg at Layout Route Level

**What:** Instead of wrapping every page individually, apply GradientBg in the layout route (`route.tsx`) files. This covers all child routes automatically.
**When to use:** For route groups that share the same background treatment (settings, org admin, etc.).
**Confidence:** HIGH -- the codebase already does this pattern (profile pages use GradientBg in individual pages, but settings/route.tsx wraps Outlet).

**Current state of GradientBg coverage:**

- **HAS GradientBg:** `/` (index), `/profile`, `/profile/edit`, `/orgs`, `/matches`, `/matches/$id`, `/opportunities`, `/opportunities/$id` (8 routes)
- **MISSING GradientBg:** `/settings` (layout uses `bg-slate-50`), `/profile/attendance` (uses `bg-slate-50`), `/login`, all `/org/$slug/*` pages (use various), all `/admin/*` pages (use `dotGridStyle`)
- **Decision note:** CONTEXT.md says GradientBg on every page. The `settings/route.tsx` and `profile/attendance.tsx` are the clearest candidates. Admin and org pages use dot-grid styling which is a different intentional treatment -- planner should decide if GradientBg replaces or complements it.

### Anti-Patterns to Avoid

- **Filtering by `_id` via `.query().filter()`:** Never do `ctx.db.query("users").filter(q => q.eq(q.field("_id"), userId)).first()` -- this is a full table scan. Use `ctx.db.get("users", userId as Id<"users">)` which is O(1).
- **Long-running action loops:** Never loop through all batches in a single Convex action -- the 10-minute timeout will kill it. Use chained scheduled actions instead.
- **Color-only state indication:** Drag states in DocumentUpload use color changes only. WCAG requires non-color indicators (icons, text, patterns) alongside color.

## Don't Hand-Roll

| Problem                     | Don't Build                        | Use Instead                               | Why                                                                          |
| --------------------------- | ---------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| Unique form field IDs       | `Math.random()` or manual counters | React 19 `useId()`                        | SSR-safe, stable across renders, no collisions                               |
| Focus management            | Custom focus trap code             | shadcn/ui defaults + native browser focus | shadcn already handles focus-visible ring; don't override                    |
| Rate limiting               | setTimeout loops in actions        | `ctx.scheduler.runAfter` chained pattern  | Convex scheduler is persistent, survives crashes, has at-most-once semantics |
| Screen reader announcements | Custom div injection               | `role="alert"` on error messages          | Browser + screen reader handle `role="alert"` natively                       |
| Batch ID deduplication      | Manual tracking arrays             | `new Set()` + `Map()`                     | Built-in JavaScript primitives, no library needed                            |

**Key insight:** All N+1 fixes use the same mechanical pattern (collect IDs, batch fetch, build Map). This is not creative work -- it's a systematic refactor.

## Common Pitfalls

### Pitfall 1: Convex `ctx.db.get` with String IDs

**What goes wrong:** The schema defines `userId: v.string()` but the actual values are valid Convex document IDs from the auth table. Using `ctx.db.get("users", profile.userId)` without casting causes a TypeScript error.
**Why it happens:** `@convex-dev/auth` stores user IDs as strings in profile tables for flexibility, but they are actually `Id<"users">` values.
**How to avoid:** Cast explicitly: `ctx.db.get("users", profile.userId as Id<"users">)`. This is safe because auth-generated user IDs are always valid document IDs.
**Warning signs:** TypeScript error "Argument of type 'string' is not assignable to parameter of type 'Id<"users">'".

### Pitfall 2: Rate Limit Retry State in Chained Actions

**What goes wrong:** When retrying after a rate limit error, the retry count and backoff state are lost because each scheduled action is a fresh invocation.
**Why it happens:** Convex scheduled actions don't have persistent state between invocations. Each invocation gets fresh args.
**How to avoid:** Pass retry count as an argument to the scheduled action. Alternatively, store batch progress in the database via a mutation between batches.
**Warning signs:** Infinite retry loops or immediate re-failures after rate limit.

### Pitfall 3: aria-describedby on Empty Error State

**What goes wrong:** Setting `aria-describedby="error-id"` when the error element doesn't exist in the DOM causes screen readers to silently ignore it or announce garbage.
**Why it happens:** The error message element is conditionally rendered but the `aria-describedby` attribute is always set.
**How to avoid:** Conditionally set `aria-describedby` only when the referenced element is rendered: `aria-describedby={error ? errorId : helpText ? descId : undefined}`.
**Warning signs:** Screen reader announces nothing for error fields.

### Pitfall 4: GradientBg Double-Wrapping with Layout Routes

**What goes wrong:** Adding GradientBg to both the layout route (e.g., `settings/route.tsx`) and the page (e.g., `settings/index.tsx`) creates a double min-h-screen wrapper with nested gradient backgrounds.
**Why it happens:** Route-level and page-level patterns coexist in the codebase.
**How to avoid:** Apply GradientBg at only ONE level -- either the layout route (preferred for consistency) or the page, never both. Check the parent route before adding.
**Warning signs:** Double scrollbar, unexpected background stacking.

### Pitfall 5: font-display on Non-Heading Elements

**What goes wrong:** Applying `font-display` class to stat numbers, badge text, or other non-heading text creates visual inconsistency.
**Why it happens:** Overzealous find-and-replace of `font-bold` to `font-display`.
**How to avoid:** Only convert `<h1>`, `<h2>`, `<h3>` elements that serve as page or section headings. Leave stat numbers (`text-3xl font-bold`) and inline bold text alone. CONTEXT.md gives Claude discretion here -- be selective.
**Warning signs:** Body text that suddenly looks like headings.

### Pitfall 6: Programs N+1 -- Counting Participants via Index Query

**What goes wrong:** The current `getOrgPrograms` query does `ctx.db.query("programParticipation").withIndex("by_program_status", ...).collect()` per program to count enrolled participants. This is technically an N+1 but uses an index, so it's efficient.
**Why it happens:** Convex doesn't have aggregate/count queries. You must fetch and count.
**How to avoid:** Two options: (1) Keep the current per-program indexed query if the program count is small (< 20), since each is an efficient index scan. (2) If programs grow, denormalize a `participantCount` field on the program document. For pilot scale (50-100 profiles), option 1 is fine.
**Warning signs:** Slow dashboard load when org has 50+ programs.

## Code Examples

### N+1 Fix: attendance/queries.ts - getMyAttendanceHistory

```typescript
// Source: Codebase analysis of convex/attendance/queries.ts lines 9-52
// Current: Per-record ctx.db.get for events and orgs (2N reads for N records)
// Fix: Batch all unique eventIds and orgIds, fetch once, build Maps

handler: async (ctx, { limit = 50 }) => {
  const userId = await getAuthUserId(ctx)
  if (!userId) return []

  const attendance = await ctx.db
    .query('attendance')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .order('desc')
    .take(limit)

  // Batch fetch: collect unique IDs
  const eventIds = [...new Set(attendance.map((r) => r.eventId))]
  const orgIds = [...new Set(attendance.map((r) => r.orgId))]

  const [events, orgs] = await Promise.all([
    Promise.all(eventIds.map((id) => ctx.db.get('events', id))),
    Promise.all(orgIds.map((id) => ctx.db.get('organizations', id))),
  ])

  const eventMap = new Map(eventIds.map((id, i) => [id, events[i]]))
  const orgMap = new Map(orgIds.map((id, i) => [id, orgs[i]]))

  return attendance
    .map((record) => {
      const event = eventMap.get(record.eventId)
      if (!event) return null
      const org = orgMap.get(record.orgId)
      return {
        ...record,
        event: {
          title: event.title,
          startAt: event.startAt,
          location: event.location,
          isVirtual: event.isVirtual,
        },
        org: org ? { name: org.name, logoUrl: org.logoUrl } : null,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
}
```

### N+1 Fix: emails/send.ts - getUsersForMatchAlertBatch

```typescript
// Source: Codebase analysis of convex/emails/send.ts lines 62-113
// Current: Per-profile ctx.db.query("users").filter().first() (full table scan per profile)
// Fix: Filter eligible profiles first, then batch fetch users by ID

handler: async (ctx, { targetLocalHour }) => {
  const profiles = await ctx.db.query('profiles').collect()
  const now = new Date()

  // Pass 1: Filter eligible profiles (have alerts enabled + correct timezone hour)
  const eligible = profiles.filter((profile) => {
    if (!profile.notificationPreferences?.matchAlerts.enabled) return false
    const timezone = profile.notificationPreferences.timezone || 'UTC'
    const userLocalTime = toZonedTime(now, timezone)
    return userLocalTime.getHours() === targetLocalHour
  })

  // Pass 2: Batch fetch users
  const users = await Promise.all(
    eligible.map((p) => ctx.db.get('users', p.userId as Id<'users'>)),
  )

  // Pass 3: Build result
  return eligible
    .map((profile, i) => {
      const user = users[i]
      if (!user?.email) return null
      return {
        userId: profile.userId,
        email: user.email,
        timezone: profile.notificationPreferences!.timezone || 'UTC',
        profileId: profile._id,
        userName: profile.name || 'there',
      }
    })
    .filter((u): u is NonNullable<typeof u> => u !== null)
}
```

### Performance Logging Pattern

```typescript
// Source: convex/lib/logging.ts + CONTEXT.md decision
// Log read counts and action duration alongside N+1 fixes

import { log } from '../lib/logging';

// In queries: log read count
handler: async (ctx, args) => {
  const records = await ctx.db.query("attendance")...;
  const uniqueEventIds = [...new Set(records.map(r => r.eventId))];
  const uniqueOrgIds = [...new Set(records.map(r => r.orgId))];

  log('info', 'getMyAttendanceHistory reads', {
    recordCount: records.length,
    batchedEventReads: uniqueEventIds.length,
    batchedOrgReads: uniqueOrgIds.length,
    // Compare: old approach would be records.length * 2 reads
  });
  // ... rest of handler
};

// In actions: log wall-clock time
handler: async (ctx, args) => {
  const startTime = Date.now();
  // ... process batch
  const duration = Date.now() - startTime;
  log('info', 'processMatchBatch duration', {
    batchIndex: args.batchIndex,
    durationMs: duration,
    profileId: args.profileId,
  });
};
```

## State of the Art

| Old Approach                       | Current Approach                  | When Changed                  | Impact                                                          |
| ---------------------------------- | --------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| Sequential `ctx.db.get` per item   | Batch `Promise.all` with ID dedup | Standard Convex best practice | Reduces reads from 2N to N (unique IDs), enables better caching |
| `ctx.db.query().filter(eq(_id))`   | `ctx.db.get(table, id)`           | Always available              | O(1) vs full table scan                                         |
| Single long action for all batches | Chained scheduled actions         | Convex 10-min timeout limit   | Guaranteed completion, rate limit resilience                    |
| Color-only drag state              | Color + icon/text indicator       | WCAG 2.1 (1.4.1 Use of Color) | Required for accessibility compliance                           |

**Deprecated/outdated:**

- None relevant. Convex API is stable for all patterns used here.

## Open Questions

1. **GradientBg on admin and org-admin pages**
   - What we know: Admin pages use `dotGridStyle` (dot-grid background), org-admin pages also use `dotGridStyle`. These are intentional admin-specific treatments.
   - What's unclear: CONTEXT.md says "every page" for GradientBg, but does that mean replacing the admin dot-grid treatment? Or only user-facing pages?
   - Recommendation: Apply GradientBg to user-facing pages (settings, attendance, login, org public pages). Keep dot-grid for admin pages as an intentional differentiation. Planner should flag this for implementer discretion.

2. **Events query pagination scope**
   - What we know: `getDashboardEvents` already uses `.take(50)`. The CONTEXT.md mentions "Load more" for events.
   - What's unclear: Which events query specifically needs pagination? The dashboard query is already limited. The org events page uses a Lu.ma embed, not a Convex query.
   - Recommendation: Pagination likely applies to `getDashboardEvents` if the 50-event cap becomes insufficient. For pilot, this may be a no-op. Planner should scope it as a small task.

3. **Scope of form aria-describedby**
   - What we know: 27 files contain form inputs (`<Input>`, `<Textarea>`, `<Select>`, `<form>`). CONTEXT.md says "every form field app-wide."
   - What's unclear: Does "every" include read-only displays and filters (e.g., `OrgFilters`, `MemberFilters`, `opportunity-filters`) or only data-entry forms?
   - Recommendation: Prioritize data-entry forms (profile wizard steps, settings forms, auth forms, program creation, admin forms). Filters with no validation errors can be deferred. The planner should enumerate the files.

## Sources

### Primary (HIGH confidence)

- Context7 `/llmstxt/convex_dev_llms_txt` -- Convex scheduler.runAfter, action timeout limits, batch query best practices, ctx.db.get by ID
- Codebase analysis -- Direct reading of all files referenced in requirements (programs.ts, attendance/queries.ts, emails/send.ts, matching/compute.ts, auth.ts, password-form.tsx, OrgCard.tsx, GradientBg.tsx, app.css)

### Secondary (MEDIUM confidence)

- WAI-ARIA 1.2 authoring practices for aria-describedby, role="alert", aria-live -- standard web accessibility patterns (well-known, stable spec)
- WCAG 2.1 Success Criterion 1.4.1 Use of Color -- non-color indicators for state changes

### Tertiary (LOW confidence)

- None. All findings are based on direct codebase analysis and Convex documentation.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries already in use, no new dependencies
- Architecture (N+1 patterns): HIGH -- verified against codebase, Convex docs confirm `ctx.db.get` is O(1)
- Architecture (rate limiting): HIGH -- Convex docs confirm 10-min timeout, scheduler API verified
- Architecture (accessibility): HIGH -- WAI-ARIA is a stable spec, patterns are well-established
- Pitfalls: HIGH -- all derived from direct codebase observation

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (stable domain, no fast-moving dependencies)
