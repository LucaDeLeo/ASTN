# Phase 16: CRM Dashboard & Programs - Research

**Researched:** 2026-01-19
**Domain:** Admin CRM dashboard, member directory, community stats, and custom program management
**Confidence:** HIGH

## Summary

Phase 16 implements a comprehensive CRM dashboard for org admins, building directly on Phase 15's engagement scoring system. The phase has two primary domains: (1) enhanced member directory with filtering, privacy-controlled profile views, and community stats; (2) custom program management for tracking reading groups, fellowships, and other org-specific activities.

The codebase already has established patterns for every component needed. The existing `getAllMembersWithProfiles` query, `OrgStats` component, engagement scoring system, and member table UI in `admin/members.tsx` provide direct foundations to extend. This phase is primarily composition and enhancement of existing patterns.

**Primary recommendation:** Extend existing admin member views with comprehensive filtering, add a `programs` and `programParticipation` schema for tracking member participation, and enhance stats with engagement-focused metrics leveraging the Phase 15 memberEngagement data.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)

| Library         | Version | Purpose                     | Why Standard                          |
| --------------- | ------- | --------------------------- | ------------------------------------- |
| Convex          | Current | Database queries, mutations | Existing backend infrastructure       |
| TanStack Router | Current | File-based routing          | Existing routing for admin pages      |
| shadcn/ui       | Current | UI components               | Table, card, badge, dialog components |
| lucide-react    | Current | Icons                       | Filter, search, download icons        |
| date-fns        | Current | Date formatting             | Time range filtering, relative dates  |

### Supporting (Already in Project)

| Library | Version | Purpose             | When to Use                          |
| ------- | ------- | ------------------- | ------------------------------------ |
| sonner  | Current | Toast notifications | Export success, action confirmations |
| react   | 19      | State management    | Filter state, pagination             |

### Alternatives Considered

| Instead of            | Could Use             | Tradeoff                                                                             |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| Client-side filtering | Server-side filtering | Client-side fine for <500 members typical of AI safety orgs; avoids query complexity |
| Cursor pagination     | Offset pagination     | Offset simpler for admin tables; cursor needed only for infinite scroll              |
| Data table library    | Custom table          | Custom table already exists in members.tsx; data table overkill for this scope       |

**Installation:**

```bash
# No new dependencies - using existing stack per prior decisions
```

## Architecture Patterns

### Recommended Schema Extension for Programs

```typescript
// New table: programs
programs: defineTable({
  orgId: v.id('organizations'),

  // Identity
  name: v.string(),
  slug: v.string(), // URL-safe identifier within org
  description: v.optional(v.string()),

  // Program type (template-based, extensible)
  type: v.union(
    v.literal('reading_group'),
    v.literal('fellowship'),
    v.literal('mentorship'),
    v.literal('cohort'),
    v.literal('workshop_series'),
    v.literal('custom'),
  ),

  // Dates
  startDate: v.optional(v.number()), // Unix timestamp
  endDate: v.optional(v.number()),
  status: v.union(
    v.literal('planning'),
    v.literal('active'),
    v.literal('completed'),
    v.literal('archived'),
  ),

  // Enrollment configuration
  enrollmentMethod: v.union(
    v.literal('admin_only'), // Only admins can add members
    v.literal('self_enroll'), // Members can join freely
    v.literal('approval_required'), // Members request, admin approves
  ),
  maxParticipants: v.optional(v.number()),

  // Completion criteria (optional)
  completionCriteria: v.optional(
    v.object({
      type: v.union(
        v.literal('attendance_count'),
        v.literal('attendance_percentage'),
        v.literal('manual'),
      ),
      requiredCount: v.optional(v.number()), // For attendance_count
      requiredPercentage: v.optional(v.number()), // For attendance_percentage
    }),
  ),

  // Linked events (for auto-attendance counting)
  linkedEventIds: v.optional(v.array(v.id('events'))),

  // Metadata
  createdBy: v.id('orgMemberships'),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_org', ['orgId'])
  .index('by_org_status', ['orgId', 'status'])
  .index('by_org_slug', ['orgId', 'slug'])

// New table: programParticipation
programParticipation: defineTable({
  programId: v.id('programs'),
  userId: v.string(),
  orgId: v.id('organizations'), // Denormalized for queries

  // Enrollment status
  status: v.union(
    v.literal('pending'), // Requested, awaiting approval
    v.literal('enrolled'), // Active participant
    v.literal('completed'), // Finished program (graduated)
    v.literal('withdrawn'), // Left program
    v.literal('removed'), // Removed by admin
  ),

  // Tracking
  enrolledAt: v.number(),
  completedAt: v.optional(v.number()),

  // Manual attendance tracking (for non-event activities)
  manualAttendanceCount: v.optional(v.number()),
  attendanceNotes: v.optional(v.string()),

  // Admin notes
  adminNotes: v.optional(v.string()),

  // Enrollment request (if approval_required)
  requestedAt: v.optional(v.number()),
  approvedBy: v.optional(v.id('orgMemberships')),
  approvedAt: v.optional(v.number()),
})
  .index('by_program', ['programId'])
  .index('by_user', ['userId'])
  .index('by_org', ['orgId'])
  .index('by_program_status', ['programId', 'status'])
  .index('by_user_org', ['userId', 'orgId'])
```

### Pattern 1: Comprehensive Member Filtering

**What:** Multi-filter member directory with URL state preservation
**When to use:** Admin member directory with engagement, career stage, skills, location filters
**Example:**

```typescript
// Filter state type (for URL params and state management)
interface MemberFilters {
  search?: string
  engagementLevels?: EngagementLevel[]
  careerStages?: string[] // From profile careerGoals/seeking
  skills?: string[]
  locations?: string[]
  joinedAfter?: number
  joinedBefore?: number
  programIds?: Id<'programs'>[]
  directoryVisibility?: 'visible' | 'hidden' | 'all'
}

// Apply filters on client (for <500 members typical of AI safety orgs)
function filterMembers(
  members: MemberWithProfile[],
  engagementMap: Map<string, EngagementData>,
  filters: MemberFilters,
): MemberWithProfile[] {
  return members.filter((member) => {
    // Search filter (name, email)
    if (filters.search) {
      const query = filters.search.toLowerCase()
      const name = member.profile?.name?.toLowerCase() ?? ''
      const email = member.email?.toLowerCase() ?? ''
      if (!name.includes(query) && !email.includes(query)) return false
    }

    // Engagement filter
    if (filters.engagementLevels?.length) {
      const engagement = engagementMap.get(member.membership.userId)
      const level = engagement?.level ?? 'new'
      if (!filters.engagementLevels.includes(level)) return false
    }

    // Skills filter (any match)
    if (filters.skills?.length) {
      const memberSkills = member.profile?.skills ?? []
      if (!filters.skills.some((s) => memberSkills.includes(s))) return false
    }

    // Location filter
    if (filters.locations?.length) {
      const location = member.profile?.location ?? ''
      if (!filters.locations.some((l) => location.includes(l))) return false
    }

    // Date range filter
    if (
      filters.joinedAfter &&
      member.membership.joinedAt < filters.joinedAfter
    ) {
      return false
    }
    if (
      filters.joinedBefore &&
      member.membership.joinedAt > filters.joinedBefore
    ) {
      return false
    }

    return true
  })
}
```

### Pattern 2: Privacy-Controlled Profile View

**What:** Admin profile view respecting member privacy settings
**When to use:** Full-page member profile view for admins
**Example:**

```typescript
// Query to get member profile for admin view
// CONTEXT.md decision: "Respect all member privacy settings - admins see what member made visible to org"
export const getMemberProfileForAdmin = query({
  args: {
    orgId: v.id('organizations'),
    userId: v.string(),
  },
  handler: async (ctx, { orgId, userId }) => {
    await requireOrgAdmin(ctx, orgId)

    // Get profile
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) return null

    // Get membership
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), orgId))
      .first()

    if (!membership) return null

    // Check if org is hidden for this member
    const hiddenOrgs = profile.privacySettings?.hiddenFromOrgs ?? []
    if (hiddenOrgs.includes(orgId.toString())) {
      return { restricted: true }
    }

    // Apply section visibility (respect member's choices)
    const visibility = profile.privacySettings?.sectionVisibility ?? {}
    const defaultVis = profile.privacySettings?.defaultVisibility ?? 'private'

    // Helper to check if section is visible to org admin
    const isVisible = (section: string): boolean => {
      const sectionVis =
        visibility[section as keyof typeof visibility] ?? defaultVis
      // "public" or "connections" visible to org admin (org membership = connection)
      return sectionVis !== 'private'
    }

    return {
      restricted: false,
      profile: {
        name: profile.name, // Always visible (needed for identification)
        headline: isVisible('basicInfo') ? profile.headline : null,
        location: isVisible('basicInfo') ? profile.location : null,
        education: isVisible('education') ? profile.education : null,
        workHistory: isVisible('workHistory') ? profile.workHistory : null,
        skills: isVisible('skills') ? profile.skills : null,
        careerGoals: isVisible('careerGoals') ? profile.careerGoals : null,
      },
      membership: {
        joinedAt: membership.joinedAt,
        role: membership.role,
        directoryVisibility: membership.directoryVisibility,
      },
    }
  },
})
```

### Pattern 3: Enhanced Stats with Engagement Metrics

**What:** Community stats combining engagement levels, career distribution, and event metrics
**When to use:** Admin dashboard overview
**Example:**

```typescript
// CONTEXT.md: Both engagement-focused AND career-focused metrics
export const getEnhancedOrgStats = query({
  args: {
    orgId: v.id('organizations'),
    timeRange: v.optional(
      v.union(
        v.literal('7d'),
        v.literal('30d'),
        v.literal('90d'),
        v.literal('all'),
      ),
    ),
  },
  handler: async (ctx, { orgId, timeRange = '30d' }) => {
    await requireOrgAdmin(ctx, orgId)

    const now = Date.now()
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      all: now, // From epoch
    }
    const since = now - ranges[timeRange]

    // Get memberships
    const memberships = await ctx.db
      .query('orgMemberships')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .collect()

    // Get engagement data
    const engagementRecords = await ctx.db
      .query('memberEngagement')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .collect()

    // Engagement distribution
    const engagementDistribution = {
      highly_engaged: 0,
      moderate: 0,
      at_risk: 0,
      new: 0,
      inactive: 0,
      pending: 0, // No engagement record yet
    }

    const engagementMap = new Map(engagementRecords.map((e) => [e.userId, e]))
    for (const m of memberships) {
      const eng = engagementMap.get(m.userId)
      if (eng) {
        const level = eng.override?.level ?? eng.level
        engagementDistribution[level]++
      } else {
        engagementDistribution.pending++
      }
    }

    // Career stage distribution (from profiles)
    const careerDistribution: Record<string, number> = {}
    for (const m of memberships) {
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', m.userId))
        .first()

      const stage = profile?.seeking ?? 'Unknown'
      careerDistribution[stage] = (careerDistribution[stage] ?? 0) + 1
    }

    // Event attendance metrics (in time range)
    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .filter((q) => q.gte(q.field('createdAt'), since))
      .collect()

    const attendedCount = attendance.filter(
      (a) => a.status === 'attended' || a.status === 'partial',
    ).length

    return {
      memberCount: memberships.length,
      engagementDistribution,
      careerDistribution,
      eventMetrics: {
        totalResponses: attendance.length,
        attendedCount,
        attendanceRate:
          attendance.length > 0
            ? Math.round((attendedCount / attendance.length) * 100)
            : 0,
      },
      timeRange,
    }
  },
})
```

### Pattern 4: Program Completion Auto-Calculation

**What:** Automatically mark program participants as completed based on criteria
**When to use:** When program has attendance_count or attendance_percentage completion criteria
**Example:**

```typescript
// Internal mutation called when attendance is recorded
export const checkProgramCompletion = internalMutation({
  args: {
    userId: v.string(),
    eventId: v.id('events'),
    orgId: v.id('organizations'),
  },
  handler: async (ctx, { userId, eventId, orgId }) => {
    // Find programs linked to this event
    const programs = await ctx.db
      .query('programs')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect()

    const linkedPrograms = programs.filter((p) =>
      p.linkedEventIds?.includes(eventId),
    )

    for (const program of linkedPrograms) {
      // Get user's participation
      const participation = await ctx.db
        .query('programParticipation')
        .withIndex('by_program', (q) => q.eq('programId', program._id))
        .filter((q) => q.eq(q.field('userId'), userId))
        .first()

      if (!participation || participation.status !== 'enrolled') continue
      if (!program.completionCriteria) continue

      // Count attendance for linked events
      let attendedCount = 0
      for (const linkedEventId of program.linkedEventIds ?? []) {
        const att = await ctx.db
          .query('attendance')
          .withIndex('by_user_event', (q) =>
            q.eq('userId', userId).eq('eventId', linkedEventId),
          )
          .first()

        if (att?.status === 'attended' || att?.status === 'partial') {
          attendedCount++
        }
      }

      // Add manual attendance
      attendedCount += participation.manualAttendanceCount ?? 0

      // Check completion criteria
      const criteria = program.completionCriteria
      let completed = false

      if (criteria.type === 'attendance_count') {
        completed = attendedCount >= (criteria.requiredCount ?? 0)
      } else if (criteria.type === 'attendance_percentage') {
        const totalEvents = program.linkedEventIds?.length ?? 0
        if (totalEvents > 0) {
          const percentage = (attendedCount / totalEvents) * 100
          completed = percentage >= (criteria.requiredPercentage ?? 100)
        }
      }

      if (completed && participation.status === 'enrolled') {
        await ctx.db.patch(participation._id, {
          status: 'completed',
          completedAt: Date.now(),
        })
      }
    }
  },
})
```

### Anti-Patterns to Avoid

- **Server-side pagination for <500 members:** Overkill complexity. Client-side filtering/pagination works fine for typical AI safety org sizes.
- **Complex role-based field visibility:** Keep it simple - admins see what member has made visible. Don't build permission matrices.
- **Real-time program completion calculation:** Check completion on attendance events, not every page load.
- **Duplicating engagement logic:** Use existing memberEngagement data, don't recompute.
- **Building custom charting:** Use simple progress bars like OrgStats. No need for chart libraries.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem              | Don't Build             | Use Instead                         | Why                                             |
| -------------------- | ----------------------- | ----------------------------------- | ----------------------------------------------- |
| Member table UI      | Custom table            | Extend existing admin/members.tsx   | Already has engagement badges, actions dropdown |
| Admin access control | Custom auth             | `requireOrgAdmin` helper            | Used throughout orgs/\*.ts                      |
| CSV export           | Custom formatter        | Extend ExportButton.tsx             | Already handles escaping, download              |
| Date filtering       | Manual date math        | date-fns isAfter, isBefore, subDays | Handles timezones, edge cases                   |
| Toast notifications  | Custom alerts           | sonner toast                        | Already integrated                              |
| Filter state         | Custom state management | React useState + URL params         | Standard pattern in codebase                    |

**Key insight:** Phase 16 is primarily UI work extending existing patterns. The backend queries mostly exist (getAllMembersWithProfiles, getOrgEngagementForAdmin, getOrgStats) and need enhancement rather than rewriting.

## Common Pitfalls

### Pitfall 1: Over-Engineering Filters

**What goes wrong:** Building complex filter UI with dozens of options, overwhelming admins
**Why it happens:** Trying to anticipate every filtering need
**How to avoid:** Start with core filters (search, engagement level, skills). Add others based on admin feedback. Most AI safety orgs have <100 members - simple search often sufficient.
**Warning signs:** Filter panel takes up half the screen, more than 8 filter options

### Pitfall 2: Forgetting Privacy Settings

**What goes wrong:** Admin sees all profile data regardless of member privacy choices
**Why it happens:** Assuming "admin" means "see everything"
**How to avoid:** CONTEXT.md is explicit: "Respect all member privacy settings." Check `privacySettings.sectionVisibility` for each field.
**Warning signs:** No privacy checks in profile view query

### Pitfall 3: Program Schema Over-Complexity

**What goes wrong:** Building highly configurable program system with custom fields, nested structures
**Why it happens:** Anticipating every possible program type
**How to avoid:** Use type enum for common program types. completionCriteria covers main patterns. Custom fields can be deferred.
**Warning signs:** Program schema has more than 15 fields, nested optional objects

### Pitfall 4: Forgetting Time Range on Stats

**What goes wrong:** Stats always show all-time data, no trend visibility
**Why it happens:** Not implementing time range filtering
**How to avoid:** CONTEXT.md specifies "flexible time range filtering: 7/30/90 days, custom, all time". Include from the start.
**Warning signs:** Stats queries have no date parameters

### Pitfall 5: Not Linking Programs to Events

**What goes wrong:** Manual attendance tracking required for all program activities
**Why it happens:** Not connecting program schema to existing events
**How to avoid:** Programs have `linkedEventIds` array. When attendance is recorded for linked event, auto-increment program attendance.
**Warning signs:** Program attendance always requires manual entry even for events

## Code Examples

Verified patterns from existing codebase:

### Dense Row Display for Member Directory

```typescript
// Source: Pattern from src/routes/org/$slug/admin/members.tsx
// CONTEXT.md: "Dense row display: name, avatar, engagement badge, career stage, skills tags, last activity date"
function MemberRow({ member, engagement }: MemberRowProps) {
  return (
    <tr className="hover:bg-slate-50">
      {/* Name + headline */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar would go here */}
          <div>
            <div className="font-medium text-slate-900">
              {member.profile?.name || "No name"}
            </div>
            {member.profile?.headline && (
              <div className="text-sm text-slate-500 truncate max-w-[200px]">
                {member.profile.headline}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Engagement badge */}
      <td className="px-4 py-3">
        {engagement ? (
          <EngagementBadge
            level={engagement.level}
            hasOverride={engagement.hasOverride}
            adminExplanation={engagement.adminExplanation}
          />
        ) : (
          <PendingEngagementBadge />
        )}
      </td>

      {/* Career stage */}
      <td className="px-4 py-3 text-sm text-slate-600">
        {member.profile?.seeking || "Not specified"}
      </td>

      {/* Skills tags */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {member.profile?.skills?.slice(0, 3).map(skill => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {(member.profile?.skills?.length ?? 0) > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{member.profile!.skills!.length - 3}
            </Badge>
          )}
        </div>
      </td>

      {/* Last activity */}
      <td className="px-4 py-3 text-sm text-slate-500">
        {formatRelativeDate(member.lastActivityAt)}
      </td>
    </tr>
  );
}
```

### Filter Panel Component

```typescript
// Source: Follows Input/Select patterns from existing UI components
function MemberFilters({
  filters,
  onFiltersChange,
  availableSkills,
}: {
  filters: MemberFilters;
  onFiltersChange: (filters: MemberFilters) => void;
  availableSkills: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Search by name or email..."
          value={filters.search ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Engagement filter */}
      <Select
        value={filters.engagementLevels?.[0] ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            engagementLevels: value === "all" ? [] : [value as EngagementLevel],
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Engagement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="highly_engaged">Active</SelectItem>
          <SelectItem value="moderate">Moderate</SelectItem>
          <SelectItem value="at_risk">At Risk</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {Object.values(filters).some(Boolean) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({})}
        >
          <X className="size-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
```

### Program Card Component

```typescript
// Source: Follows Card pattern from existing components
function ProgramCard({ program, participantCount }: {
  program: Doc<"programs">;
  participantCount: number;
}) {
  const statusColors = {
    planning: "bg-slate-100 text-slate-700",
    active: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
    archived: "bg-slate-50 text-slate-500",
  };

  const typeLabels = {
    reading_group: "Reading Group",
    fellowship: "Fellowship",
    mentorship: "Mentorship",
    cohort: "Cohort",
    workshop_series: "Workshop Series",
    custom: "Custom",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{program.name}</CardTitle>
            <p className="text-sm text-slate-500">{typeLabels[program.type]}</p>
          </div>
          <Badge className={statusColors[program.status]}>
            {program.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {program.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
            {program.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-slate-500">
            <Users className="size-4" />
            {participantCount} participants
          </div>
          {program.completionCriteria && (
            <div className="text-slate-500">
              {program.completionCriteria.type === "attendance_count"
                ? `${program.completionCriteria.requiredCount} sessions required`
                : `${program.completionCriteria.requiredPercentage}% attendance required`
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## State of the Art

| Old Approach               | Current Approach                    | When Changed       | Impact                          |
| -------------------------- | ----------------------------------- | ------------------ | ------------------------------- |
| Spreadsheet CRMs           | Database-driven with real-time sync | 2020+              | Auto-updates, no manual sync    |
| Manual engagement tracking | LLM-classified engagement levels    | Phase 15 (2026-01) | Nuanced, explainable scoring    |
| All-or-nothing privacy     | Section-level visibility controls   | Existing in schema | Members control what admins see |

**Deprecated/outdated:**

- Manual member score entry: Use computed engagement scores
- Per-event attendance spreadsheets: Use programParticipation with linked events
- Global member directories: Per-org directories with privacy controls

## Open Questions

Things that couldn't be fully resolved:

1. **Career stage taxonomy**
   - What we know: Profile has `seeking` field with free text
   - What's unclear: Should we standardize career stages for filtering?
   - Recommendation: Start with free-text filtering, consider taxonomy later if patterns emerge

2. **Program dashboard location**
   - What we know: Programs are org-specific
   - What's unclear: Separate /admin/programs route or tabs within /admin?
   - Recommendation: Separate route for programs (/admin/programs) - keeps admin dashboard clean

3. **Bulk actions scope**
   - What we know: CONTEXT.md mentions "bulk actions: export, send group message"
   - What's unclear: Group message implementation details (in-app? email?)
   - Recommendation: Implement export first, defer messaging to future phase

## Sources

### Primary (HIGH confidence)

- `/convex/schema.ts` - Existing table patterns, privacy settings structure
- `/convex/orgs/admin.ts` - getAllMembersWithProfiles, requireOrgAdmin
- `/convex/engagement/queries.ts` - Engagement data queries
- `/convex/orgs/stats.ts` - Stats aggregation pattern
- `/src/routes/org/$slug/admin/members.tsx` - Member table, engagement integration
- `/src/components/org/OrgStats.tsx` - Stats visualization pattern
- `/src/components/org/ExportButton.tsx` - CSV export pattern
- `/src/components/engagement/EngagementBadge.tsx` - Badge display
- `/.planning/phases/16-crm-dashboard-programs/16-CONTEXT.md` - User decisions

### Secondary (MEDIUM confidence)

- Phase 15 research and implementation - Engagement patterns to extend
- Existing privacy settings in profiles schema - Section visibility model

### Tertiary (LOW confidence)

- None - all patterns verified against codebase

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - No new dependencies, using existing tools
- Architecture: HIGH - Extending established patterns from Phase 15 and existing admin
- Pitfalls: HIGH - Based on CONTEXT.md decisions and existing patterns
- Schema design: HIGH - Follows existing conventions in schema.ts

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain)

---

_Phase: 16-crm-dashboard-programs_
_Research completed: 2026-01-19_
