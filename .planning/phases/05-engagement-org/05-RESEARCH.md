# Phase 5: Engagement + Org - Research

**Researched:** 2026-01-18
**Domain:** Email notifications, org admin dashboards, role-based access
**Confidence:** HIGH

## Summary

Phase 5 requires two capabilities: (1) email notifications for user retention with match alerts and weekly digests, and (2) an organization admin dashboard for BAISH visibility into members. The research validates that Convex has official integrations for transactional email (via @convex-dev/resend), React Email provides the standard for building branded HTML email templates with Tailwind support, and Convex's scheduling primitives support daily/weekly batch processing.

The primary challenge is timezone-aware email delivery (8-9 AM user local time per CONTEXT.md). Convex crons run in UTC, so the solution requires: (1) storing user timezone in profile, (2) running a daily cron that queries users by timezone offset, and (3) scheduling individual emails via `ctx.scheduler.runAt()`.

**Primary recommendation:** Use @convex-dev/resend component with React Email templates; implement timezone-aware batching via Convex scheduler; model org membership with roles in schema.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                 | Version | Purpose                       | Why Standard                                                   |
| ----------------------- | ------- | ----------------------------- | -------------------------------------------------------------- |
| @convex-dev/resend      | latest  | Email delivery via Resend     | Official Convex component with queueing, idempotency, webhooks |
| resend                  | ^4.0    | Resend SDK (for manual sends) | Required for React Email rendering in Node actions             |
| @react-email/components | ^0.0.31 | Email template components     | De-facto standard for React-based email templates              |
| @react-email/render     | ^1.0.1  | Render React to HTML          | Required to convert React Email components to HTML strings     |

### Supporting

| Library               | Version | Purpose                | When to Use                                      |
| --------------------- | ------- | ---------------------- | ------------------------------------------------ |
| @react-email/tailwind | ^1.0.1  | Tailwind CSS in emails | HTML email styling with familiar syntax          |
| date-fns-tz           | ^3.2.0  | Timezone utilities     | Converting UTC to user local time for scheduling |

### Alternatives Considered

| Instead of  | Could Use | Tradeoff                                                            |
| ----------- | --------- | ------------------------------------------------------------------- |
| Resend      | SendGrid  | SendGrid has more features but Resend has official Convex component |
| React Email | MJML      | MJML is more email-compatible but React Email has better DX         |

**Installation:**

```bash
npm install @convex-dev/resend resend @react-email/components @react-email/render @react-email/tailwind date-fns-tz
```

## Architecture Patterns

### Recommended Project Structure

```
convex/
├── emails/                    # Email-related functions
│   ├── templates.tsx          # React Email templates (Node action)
│   ├── send.ts                # Email sending actions
│   ├── notifications.ts       # Notification preference queries/mutations
│   └── crons.ts               # Scheduled email jobs
├── orgs/                      # Organization features
│   ├── membership.ts          # Join/leave/invite logic
│   ├── admin.ts               # Admin-only operations
│   ├── directory.ts           # Member directory queries
│   └── stats.ts               # Aggregate statistics
└── schema.ts                  # Extended with notificationPreferences, orgMemberships
```

### Pattern 1: Timezone-Aware Daily Email Batch

**What:** Run UTC cron, query users by timezone bucket, schedule emails at their local 8 AM
**When to use:** Any user-local-time email delivery
**Example:**

```typescript
// Source: Convex docs + timezone scheduling patterns
// convex/emails/crons.ts
import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Run hourly to catch each timezone's 8 AM
crons.hourly(
  'send-match-alerts',
  { minuteUTC: 0 },
  internal.emails.send.processMatchAlertBatch,
)

// Sunday evening digest (run at multiple UTC hours for timezone coverage)
crons.weekly(
  'send-weekly-digest',
  { dayOfWeek: 'sunday', hourUTC: 17, minuteUTC: 0 },
  internal.emails.send.processWeeklyDigestBatch,
)

export default crons
```

### Pattern 2: React Email Template in Node Action

**What:** Define email templates as React components, render in "use node" action
**When to use:** Any branded HTML email
**Example:**

```typescript
// Source: React Email docs + Convex Resend component
// convex/emails/templates.tsx
"use node";

import { internalAction } from "../_generated/server";
import { render } from "@react-email/render";
import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Img, Preview, Tailwind
} from "@react-email/components";
import { Resend } from "resend";

// Template component
interface MatchAlertProps {
  userName: string;
  matches: Array<{ title: string; org: string; tier: string; explanation: string }>;
}

const MatchAlertEmail = ({ userName, matches }: MatchAlertProps) => (
  <Html>
    <Head />
    <Preview>New matches found for you on ASTN</Preview>
    <Tailwind>
      <Body className="bg-gray-100 font-sans">
        <Container className="bg-white mx-auto p-8 rounded-lg">
          <Img src="https://astn.ai/logo.png" width={120} alt="ASTN" />
          <Text className="text-xl font-semibold">Hi {userName},</Text>
          <Text>We found {matches.length} new great-fit opportunities for you:</Text>
          {matches.map((match, i) => (
            <Section key={i} className="border-l-4 border-coral-500 pl-4 my-4">
              <Text className="font-bold">{match.title}</Text>
              <Text className="text-gray-600">{match.org}</Text>
              <Text>{match.explanation}</Text>
            </Section>
          ))}
          <Button
            href="https://astn.ai/matches"
            className="bg-coral-500 text-white px-6 py-3 rounded"
          >
            View All Matches
          </Button>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export const renderMatchAlert = internalAction({
  args: { userName: v.string(), matches: v.array(v.object({...})) },
  handler: async (ctx, args) => {
    const html = await render(<MatchAlertEmail {...args} />);
    return html;
  },
});
```

### Pattern 3: Org Membership with Roles

**What:** Schema design for org membership with admin roles and invite links
**When to use:** Multi-tenant org features
**Example:**

```typescript
// Source: Convex multi-tenant patterns
// Schema additions
orgMemberships: defineTable({
  userId: v.string(),
  orgId: v.id("organizations"),
  role: v.union(v.literal("admin"), v.literal("member")),
  directoryVisibility: v.union(
    v.literal("visible"),
    v.literal("hidden")
  ),
  joinedAt: v.number(),
  invitedBy: v.optional(v.id("orgMemberships")),
})
  .index("by_user", ["userId"])
  .index("by_org", ["orgId"])
  .index("by_org_role", ["orgId", "role"]),

orgInviteLinks: defineTable({
  orgId: v.id("organizations"),
  token: v.string(), // Unique invite token
  createdBy: v.id("orgMemberships"),
  createdAt: v.number(),
  expiresAt: v.optional(v.number()), // Optional expiration
})
  .index("by_token", ["token"])
  .index("by_org", ["orgId"]),
```

### Anti-Patterns to Avoid

- **Immediate email on match:** Don't send emails synchronously when matches compute. Batch daily per CONTEXT.md.
- **Storing rendered HTML:** Don't persist rendered email HTML. Re-render at send time with fresh data.
- **Single timezone cron:** Don't run one cron at fixed UTC time. Run hourly to cover all user timezones.
- **Admin-only membership tables:** Don't create separate tables for admin view vs member view. Use role field and visibility controls.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem             | Don't Build               | Use Instead                            | Why                                                     |
| ------------------- | ------------------------- | -------------------------------------- | ------------------------------------------------------- |
| Email delivery      | Custom SMTP integration   | @convex-dev/resend                     | Handles queueing, retries, idempotency, webhooks        |
| Email templates     | String interpolation HTML | React Email                            | Cross-client compatibility, Tailwind support, type-safe |
| Email tracking      | Custom delivery status    | Resend webhooks                        | Bounce/delivery/open tracking built-in                  |
| CSV export          | Manual string building    | Built-in JSON + client-side conversion | Convex returns JSON, convert to CSV in browser          |
| Timezone conversion | Manual UTC offset math    | date-fns-tz                            | Edge cases like DST handled correctly                   |

**Key insight:** Email delivery has many edge cases (bounces, spam complaints, rate limits, retries). Resend component handles all of these. Don't try to build reliable email infrastructure from scratch.

## Common Pitfalls

### Pitfall 1: Sending Emails from Mutations

**What goes wrong:** Mutations are deterministic and cannot make external HTTP calls
**Why it happens:** Developer tries to call Resend API directly from a mutation
**How to avoid:** Use internalAction for Node.js code, then call from mutation via scheduler
**Warning signs:** TypeScript error about fetch not available, or runtime error about non-deterministic operation

### Pitfall 2: Timezone Edge Cases

**What goes wrong:** Users get emails at wrong time, especially around DST changes
**Why it happens:** Using simple UTC offset instead of proper timezone identifier (e.g., "America/New_York")
**How to avoid:** Store IANA timezone identifier in profile, use date-fns-tz to compute local time
**Warning signs:** Complaints about email timing twice per year (spring/fall)

### Pitfall 3: React Email Import in Non-Node Context

**What goes wrong:** Build fails or runtime error when importing React Email in regular Convex function
**Why it happens:** React Email requires Node.js environment, Convex mutations/queries run in custom runtime
**How to avoid:** Only import React Email in files with `"use node"` directive
**Warning signs:** "Cannot find module" or "document is not defined" errors

### Pitfall 4: Invite Link Security

**What goes wrong:** Invite links can be brute-forced or reused after member removal
**Why it happens:** Using predictable tokens or not checking membership state
**How to avoid:** Use crypto.randomUUID() for tokens, verify org membership before showing member features
**Warning signs:** Unauthorized users appearing in org, invite links working after intended expiration

### Pitfall 5: Email Content Exceeds Provider Limits

**What goes wrong:** Emails fail to send when including too many matches
**Why it happens:** Including full match details for 50+ opportunities in one email
**How to avoid:** Limit to top 5-10 matches in alert emails, link to full list in app
**Warning signs:** Resend API errors about content size, emails landing in spam

## Code Examples

Verified patterns from official sources:

### Convex Resend Component Setup

```typescript
// Source: https://www.convex.dev/components/resend
// convex/convex.config.ts
import { defineApp } from 'convex/server'
import resend from '@convex-dev/resend/convex.config.js'

const app = defineApp()
app.use(resend)

export default app
```

### Send Email via Component

```typescript
// Source: Convex Resend component docs
// convex/emails/send.ts
import { components } from './_generated/api'
import { Resend } from '@convex-dev/resend'
import { internalMutation } from './_generated/server'

export const resend = new Resend(components.resend, {
  // Production: set testMode: false
})

export const sendMatchAlert = internalMutation({
  args: { to: v.string(), subject: v.string(), html: v.string() },
  handler: async (ctx, { to, subject, html }) => {
    await resend.sendEmail(ctx, {
      from: 'ASTN <notifications@astn.ai>',
      to,
      subject,
      html,
    })
  },
})
```

### Notification Preferences Schema

```typescript
// Source: Common SaaS pattern
// Schema addition to profiles table
notificationPreferences: v.optional(
  v.object({
    matchAlerts: v.object({
      enabled: v.boolean(),
      // Only great tier per CONTEXT.md
    }),
    weeklyDigest: v.object({
      enabled: v.boolean(),
    }),
    timezone: v.string(), // IANA timezone, e.g., "America/New_York"
  })
),
```

### Query Users for Timezone-Based Batch

```typescript
// Source: Timezone scheduling patterns
// convex/emails/send.ts
export const getUsersForTimezoneBatch = internalQuery({
  args: { targetLocalHour: v.number() },
  handler: async (ctx, { targetLocalHour }) => {
    // Get all profiles with notification preferences enabled
    const profiles = await ctx.db
      .query('profiles')
      .filter((q) =>
        q.eq(q.field('notificationPreferences.matchAlerts.enabled'), true),
      )
      .collect()

    const now = new Date()
    const currentUTCHour = now.getUTCHours()

    // Filter to users whose local time matches target
    return profiles.filter((profile) => {
      const tz = profile.notificationPreferences?.timezone || 'UTC'
      // Use date-fns-tz to compute user's current local hour
      // Return true if their local hour matches targetLocalHour
      const userLocalHour = getLocalHour(now, tz)
      return userLocalHour === targetLocalHour
    })
  },
})
```

### Org Admin Check Pattern

```typescript
// Source: Convex RBAC patterns
// convex/orgs/admin.ts
async function requireOrgAdmin(ctx: QueryCtx, orgId: Id<'organizations'>) {
  const userId = await auth.getUserId(ctx)
  if (!userId) throw new Error('Not authenticated')

  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('orgId'), orgId))
    .first()

  if (!membership || membership.role !== 'admin') {
    throw new Error('Must be org admin')
  }

  return membership
}
```

## State of the Art

| Old Approach          | Current Approach          | When Changed | Impact                                     |
| --------------------- | ------------------------- | ------------ | ------------------------------------------ |
| MJML templates        | React Email               | 2023         | Type-safe, Tailwind support, better DX     |
| SendGrid/Mailgun      | Resend                    | 2023         | Developer-first API, better deliverability |
| Manual email tracking | Webhook-based status      | 2024         | Real-time delivery status, bounce handling |
| Simple UTC cron       | Timezone-aware scheduling | Standard     | User-local-time delivery support           |

**Deprecated/outdated:**

- **String template HTML:** Use React Email components instead for cross-client compatibility
- **Synchronous email sending:** Use queued/batched approach for reliability

## Open Questions

Things that couldn't be fully resolved:

1. **Default timezone for users who don't set one**
   - What we know: Should default to something reasonable
   - What's unclear: Whether to use browser detection or explicit prompt during onboarding
   - Recommendation: Prompt during notification preferences setup (required per CONTEXT.md), default to UTC if skipped

2. **Resend free tier limits for pilot**
   - What we know: Resend has a free tier with 100 emails/day, 3,000/month
   - What's unclear: Whether pilot scale (50-100 users) will exceed this
   - Recommendation: Monitor usage, upgrade if needed. At worst: 100 users x 2 emails/day = 200/day would require paid tier

3. **Export format for org admin**
   - What we know: CSV or JSON per CONTEXT.md (admin choice)
   - What's unclear: Exact field mapping, handling of array fields (education, skills)
   - Recommendation: Flatten arrays to comma-separated strings for CSV, keep structured for JSON

## Sources

### Primary (HIGH confidence)

- Convex Resend Component: https://www.convex.dev/components/resend - Installation, API, webhooks, tracking
- Convex Cron Jobs: https://docs.convex.dev/scheduling/cron-jobs - Daily, weekly, hourly scheduling
- Convex Scheduler: https://docs.convex.dev/scheduling/scheduled-functions - ctx.scheduler.runAt() for precise timing
- React Email: https://react.email - Components list, Tailwind support, rendering

### Secondary (MEDIUM confidence)

- Timezone scheduling patterns: Upstash blog, node-schedule docs - User local time email delivery
- Multi-tenant RBAC: Kinde + Convex tutorial, Convex teams docs - Role-based org access

### Tertiary (LOW confidence)

- Email deliverability best practices: Various blog posts - Subject line, content guidelines

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Official Convex component, well-documented
- Architecture: HIGH - Patterns verified in Convex docs and examples
- Pitfalls: HIGH - Based on Convex runtime constraints and React Email requirements
- Timezone handling: MEDIUM - Pattern is sound but implementation details vary

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable domain, established patterns)
