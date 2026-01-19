# Phase 15: Engagement Scoring - Research

**Researched:** 2026-01-19
**Domain:** Member engagement classification with LLM explanations
**Confidence:** HIGH

## Summary

Engagement scoring for Phase 15 involves classifying member engagement levels (Highly Engaged / Moderate / At Risk / New / Inactive) using LLM reasoning, with org admin override capability. This phase builds on Phase 14's attendance data as the primary engagement signal.

The codebase already has established patterns for LLM-based classification via tool_use (matching/compute.ts), cron-based batch processing (crons.ts), and admin views with member data (org admin dashboard). The implementation follows these existing patterns closely.

**Primary recommendation:** Use a dedicated `memberEngagement` table for per-org engagement scores, computed via daily cron using Claude Haiku with forced tool_use, storing both admin-facing and user-facing explanations.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | Current | Claude API calls | Already used in matching, enrichment |
| Convex | Current | Database, crons, mutations | Existing backend infrastructure |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | Current | Date calculations | Time window computations (90 days, 180 days) |
| lucide-react | Current | Icons | Engagement level indicators in UI |
| shadcn/ui | Current | UI components | Override dialogs, badges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| LLM scoring | Threshold-only scoring | LLM captures nuance like "attended but hasn't been back", threshold-only misses context |
| Per-org scores | Global scores | Per-org needed - user can be highly engaged in one org, inactive in another |
| Daily cron | On-demand computation | Daily cron cheaper (fewer LLM calls), scores don't need real-time freshness |

**Installation:**
```bash
# No new dependencies - using existing stack
```

## Architecture Patterns

### Recommended Schema Extension
```typescript
// New table: memberEngagement
memberEngagement: defineTable({
  userId: v.string(),
  orgId: v.id("organizations"),

  // Computed engagement level
  level: v.union(
    v.literal("highly_engaged"),
    v.literal("moderate"),
    v.literal("at_risk"),
    v.literal("new"),
    v.literal("inactive")
  ),

  // Explanations from LLM
  adminExplanation: v.string(),  // Detailed with signals
  userExplanation: v.string(),   // Friendly messaging

  // Input signals (stored for audit/debugging)
  signals: v.object({
    eventsAttended90d: v.number(),
    lastAttendedAt: v.optional(v.number()),
    rsvpCount90d: v.number(),
    profileUpdatedAt: v.optional(v.number()),
    joinedAt: v.number(),
  }),

  // Override
  override: v.optional(v.object({
    level: v.string(),
    notes: v.string(),
    overriddenBy: v.id("orgMemberships"),
    overriddenAt: v.number(),
    expiresAt: v.optional(v.number()),
  })),

  // Metadata
  computedAt: v.number(),
  modelVersion: v.string(),
})
.index("by_user_org", ["userId", "orgId"])
.index("by_org", ["orgId"])
.index("by_org_level", ["orgId", "level"])

// New table: engagementOverrideHistory (audit trail)
engagementOverrideHistory: defineTable({
  engagementId: v.id("memberEngagement"),
  userId: v.string(),
  orgId: v.id("organizations"),

  previousLevel: v.string(),
  newLevel: v.string(),
  notes: v.string(),

  action: v.union(v.literal("override"), v.literal("clear")),
  performedBy: v.id("orgMemberships"),
  performedAt: v.number(),
})
.index("by_engagement", ["engagementId"])
.index("by_org", ["orgId"])
```

### Pattern 1: LLM Classification with Tool Use
**What:** Force structured output via tool_choice for consistent engagement classification
**When to use:** When calling Claude to classify engagement level and generate explanations
**Example:**
```typescript
// Source: Existing pattern from convex/matching/compute.ts
const engagementTool: Anthropic.Tool = {
  name: "classify_engagement",
  description: "Classify member engagement level with explanations",
  input_schema: {
    type: "object",
    properties: {
      level: {
        type: "string",
        enum: ["highly_engaged", "moderate", "at_risk", "new", "inactive"],
      },
      adminExplanation: {
        type: "string",
        description: "Detailed explanation with input signals for admins",
      },
      userExplanation: {
        type: "string",
        description: "Friendly, encouraging explanation for users",
      },
    },
    required: ["level", "adminExplanation", "userExplanation"],
  },
};

// Force tool use for structured output
const response = await anthropic.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 500,
  tools: [engagementTool],
  tool_choice: { type: "tool", name: "classify_engagement" },
  system: ENGAGEMENT_SYSTEM_PROMPT,
  messages: [{ role: "user", content: memberContext }],
});
```

### Pattern 2: Batch Cron Processing
**What:** Daily cron job that processes all members needing score updates
**When to use:** For cost-effective batch processing instead of real-time scoring
**Example:**
```typescript
// Source: Pattern from convex/crons.ts
// Run daily at 4 AM UTC (after event sync at 7 AM, before match alerts)
crons.daily(
  "compute-engagement-scores",
  { hourUTC: 4, minuteUTC: 0 },
  internal.engagement.compute.runEngagementBatch
);

// In compute.ts - process all org members
export const runEngagementBatch = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all orgs
    const orgs = await ctx.runQuery(internal.engagement.queries.getActiveOrgs);

    for (const org of orgs) {
      await ctx.runAction(internal.engagement.compute.computeOrgEngagement, {
        orgId: org._id,
      });
    }
  },
});
```

### Pattern 3: Override with History
**What:** Admin override that preserves audit trail
**When to use:** When admin manually adjusts engagement level
**Example:**
```typescript
// Mutation pattern for override with history
export const overrideEngagement = mutation({
  args: {
    engagementId: v.id("memberEngagement"),
    newLevel: v.string(),
    notes: v.string(), // Required per CONTEXT.md
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const adminMembership = await requireOrgAdmin(ctx, /* orgId */);
    const existing = await ctx.db.get(args.engagementId);

    // Save to history before update
    await ctx.db.insert("engagementOverrideHistory", {
      engagementId: args.engagementId,
      userId: existing.userId,
      orgId: existing.orgId,
      previousLevel: existing.override?.level ?? existing.level,
      newLevel: args.newLevel,
      notes: args.notes,
      action: "override",
      performedBy: adminMembership._id,
      performedAt: Date.now(),
    });

    // Update engagement with override
    await ctx.db.patch(args.engagementId, {
      override: {
        level: args.newLevel,
        notes: args.notes,
        overriddenBy: adminMembership._id,
        overriddenAt: Date.now(),
        expiresAt: args.expiresAt,
      },
    });
  },
});
```

### Anti-Patterns to Avoid
- **Global engagement scores:** User engagement is inherently per-org. A user can be highly engaged in BAISH but inactive in another org. Always scope to orgId.
- **Real-time LLM scoring:** Expensive and unnecessary. Daily batch is sufficient for engagement tracking.
- **Storing only computed level:** Store input signals for debugging and audit. When admins ask "why is this person marked At Risk?", signals should be visible.
- **Exposing "At Risk" to users:** Per CONTEXT.md, use softer language like "Reconnecting" for user-facing display.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Member data aggregation | Custom attendance counting | Query attendance table with existing indexes | `by_user` and `by_org` indexes already exist |
| Time window calculations | Manual date math | date-fns `subDays`, `isAfter` | Handles edge cases, already in project |
| Admin access control | Custom auth checks | Existing `requireOrgAdmin` pattern | Used in orgs/admin.ts, orgs/stats.ts |
| Structured LLM output | JSON parsing from text | Anthropic tool_use with forced tool_choice | Guaranteed structure, no parsing errors |

**Key insight:** The codebase has established patterns for every component needed. This phase is primarily composition of existing patterns rather than new infrastructure.

## Common Pitfalls

### Pitfall 1: Overcomplicating Signal Weighting
**What goes wrong:** Building complex weighted scoring algorithms with configurable weights
**Why it happens:** Traditional CRM systems use numeric scoring with weighted inputs
**How to avoid:** Use LLM to interpret signals naturally. Thresholds (3+ events = highly engaged) guide the LLM but don't require manual weight tuning.
**Warning signs:** Schema has `weights` config table, code has complex scoring formulas

### Pitfall 2: Not Handling New Members Correctly
**What goes wrong:** New member marked "Inactive" because they haven't attended events yet
**Why it happens:** Only looking at attendance count without considering join date
**How to avoid:** "New" level explicitly checks `joinedAt < 60 days ago`. New members get grace period before being scored on engagement.
**Warning signs:** New members showing as "At Risk" or "Inactive" immediately

### Pitfall 3: Override Expiration Not Handled
**What goes wrong:** Manual override persists forever, even when member behavior changes
**Why it happens:** Forgetting to check and clear expired overrides during score computation
**How to avoid:** Cron job checks `expiresAt` and clears expired overrides before computing. Or always re-compute when override expires.
**Warning signs:** Member overridden to "Highly Engaged" 6 months ago still shows that level despite no activity

### Pitfall 4: Missing Org Context in LLM Prompt
**What goes wrong:** LLM doesn't know what org it's scoring for, gives generic explanations
**Why it happens:** Only passing member data, not org context
**How to avoid:** Include org name and context in prompt. "You are scoring engagement for BAISH (Buenos Aires AI Safety Hub), a local community..."
**Warning signs:** Explanations say "this community" instead of specific org name

### Pitfall 5: Rate Limiting LLM Calls
**What goes wrong:** Batch processing fails due to too many rapid Claude API calls
**Why it happens:** Not adding delays between calls for large orgs
**How to avoid:** Use sequential processing with small delays (100-200ms) between member classifications, or batch multiple members per LLM call.
**Warning signs:** 429 errors during cron execution

## Code Examples

Verified patterns from existing codebase:

### Gathering Attendance Data for Engagement
```typescript
// Source: Pattern from convex/attendance/queries.ts
async function getEngagementSignals(
  ctx: QueryCtx,
  userId: string,
  orgId: Id<"organizations">
): Promise<EngagementSignals> {
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  // Get attendance for this org
  const attendance = await ctx.db
    .query("attendance")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("orgId"), orgId))
    .collect();

  // Filter to attended status in last 90 days
  const attended90d = attendance.filter(
    (a) =>
      (a.status === "attended" || a.status === "partial") &&
      (a.respondedAt ?? a.createdAt) >= ninetyDaysAgo
  );

  // Get last attendance
  const lastAttendance = attendance
    .filter((a) => a.status === "attended" || a.status === "partial")
    .sort((a, b) => (b.respondedAt ?? b.createdAt) - (a.respondedAt ?? a.createdAt))[0];

  // Get membership for join date
  const membership = await ctx.db
    .query("orgMemberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("orgId"), orgId))
    .first();

  // Get profile for update date
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  return {
    eventsAttended90d: attended90d.length,
    lastAttendedAt: lastAttendance?.respondedAt ?? lastAttendance?.createdAt,
    rsvpCount90d: 0, // Can add eventViews as RSVP proxy
    profileUpdatedAt: profile?.updatedAt,
    joinedAt: membership?.joinedAt ?? now,
  };
}
```

### Building LLM Context String
```typescript
// Source: Pattern from convex/matching/prompts.ts buildProfileContext
function buildEngagementContext(
  orgName: string,
  memberName: string,
  signals: EngagementSignals,
  thresholds: EngagementThresholds
): string {
  const sections: string[] = [];

  sections.push(`## Engagement Classification for ${orgName}\n`);
  sections.push(`### Member: ${memberName}\n`);

  sections.push("### Activity Signals");
  sections.push(`- Events attended (last 90 days): ${signals.eventsAttended90d}`);

  if (signals.lastAttendedAt) {
    const lastAttendedDate = new Date(signals.lastAttendedAt).toLocaleDateString();
    sections.push(`- Last attended: ${lastAttendedDate}`);
  } else {
    sections.push("- Last attended: Never");
  }

  const daysSinceJoined = Math.floor(
    (Date.now() - signals.joinedAt) / (24 * 60 * 60 * 1000)
  );
  sections.push(`- Days since joined: ${daysSinceJoined}`);

  sections.push("\n### Thresholds (guidelines, use judgment)");
  sections.push(`- Highly Engaged: ${thresholds.highlyEngaged}+ events in 90 days`);
  sections.push(`- Moderate: ${thresholds.moderateLow}-${thresholds.moderateHigh} events in 90 days`);
  sections.push(`- At Risk: Was active, no events in 90+ days`);
  sections.push(`- New: Joined within ${thresholds.newMemberDays} days`);
  sections.push(`- Inactive: No activity in ${thresholds.inactiveDays}+ days`);

  return sections.join("\n");
}
```

### Admin Override UI Pattern
```typescript
// Source: Pattern from src/routes/org/$slug/admin/members.tsx MemberRow
// Override dialog would extend the existing dropdown pattern
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="size-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => setOverrideDialogOpen(true)}>
      <Activity className="size-4 mr-2" />
      Override Engagement
    </DropdownMenuItem>
    {member.engagement?.override && (
      <DropdownMenuItem onClick={handleClearOverride}>
        <RotateCcw className="size-4 mr-2" />
        Clear Override
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Weighted numeric scores | LLM-interpreted signals | 2024+ with GPT-4/Claude | More nuanced classification, natural explanations |
| Manual threshold tuning | LLM with threshold guidance | 2024+ | Thresholds are hints not hard rules |
| Single engagement level | Per-org engagement | Standard practice | Users in multiple communities need separate scores |

**Deprecated/outdated:**
- Numeric engagement scores visible to users: Creates anxiety, gamification concerns
- Global engagement percentile rankings: Privacy and comparison concerns

## Open Questions

Things that couldn't be fully resolved:

1. **Batch size per LLM call**
   - What we know: Can pass multiple members to one LLM call for efficiency
   - What's unclear: Optimal batch size (5? 10? 15?) for cost vs accuracy tradeoff
   - Recommendation: Start with 10 members per call, measure and adjust

2. **Override expiration UI**
   - What we know: Override can have optional expiration
   - What's unclear: Should UI default to 90-day expiration or no expiration?
   - Recommendation: Default to no expiration, show warning if override is older than 90 days

3. **Profile updates as signal**
   - What we know: Profile updates indicate engagement
   - What's unclear: How to weight minor edits vs major profile completion
   - Recommendation: Track only "significant" updates (new work history, skills) as signal

## Sources

### Primary (HIGH confidence)
- `/convex/matching/compute.ts` - LLM tool_use pattern
- `/convex/matching/prompts.ts` - Context building, tool definition
- `/convex/crons.ts` - Batch processing patterns
- `/convex/attendance/queries.ts` - Attendance data access
- `/convex/orgs/admin.ts` - Admin access control, member queries
- `/convex/orgs/stats.ts` - Member aggregation patterns
- `/convex/schema.ts` - Existing table patterns

### Secondary (MEDIUM confidence)
- https://blog.imis.com/member-engagement-scoring - Engagement scoring best practices (2025)
- https://higherlogic.com/blog/member-engagement-scoring-associations - Association engagement patterns

### Tertiary (LOW confidence)
- General LLM classification research - Patterns for explainable classification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies
- Architecture: HIGH - Following established patterns from matching, attendance
- Pitfalls: HIGH - Based on codebase patterns and domain knowledge

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain, no expected API changes)

---

*Phase: 15-engagement-scoring*
*Research completed: 2026-01-19*
