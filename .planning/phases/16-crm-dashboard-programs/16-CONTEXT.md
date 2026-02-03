# Phase 16: CRM Dashboard & Programs - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin interface for org managers to view their community, track member engagement, and manage org-specific programs. Includes filterable member directory, member profile views, community stats dashboard, CSV export, and program tracking (reading groups, fellowships, etc.).

</domain>

<decisions>
## Implementation Decisions

### Member Directory

- Comprehensive filtering: engagement level, career stage, skills, location, join date, program participation
- Dense row display: name, avatar, engagement badge, career stage, skills tags, last activity date
- Paginated table with 25-50 members per page, page controls at bottom
- Bulk actions supported: select multiple members to export or send group message
- Search by name in addition to filters

### Member Profiles

- Respect all member privacy settings — admins see exactly what member has made visible to their org
- Full history view: engagement timeline, all attendance records, program participation, override history
- Admin can add private notes and custom tags (visible only to org admins)
- Full page navigation from directory (not modal or slide-over)

### Community Stats

- Both engagement-focused AND career-focused metrics
- Engagement: level distribution, trends over time, at-risk alerts
- Career: stage breakdown, skills distribution, role types
- Event metrics: attendance rates, most popular events, attendance trends
- Flexible time range filtering: last 7/30/90 days, custom date range, all time

### Program Management

- Flexible with templates: reading groups, fellowships, mentorship, cohorts — plus custom types
- Participation tracking: link events for auto-counting, plus manual entry for non-event activities
- Completion with criteria: define requirements (e.g. attend 5/6 sessions), auto-mark graduates
- Enrollment: configurable per program — admin-only, self-enrollment, or both with approval workflow

### Claude's Discretion

- Stats visualization approach (charts vs cards vs mix)
- Exact filter UI components and layout
- Program template defaults
- CSV export column ordering

</decisions>

<specifics>
## Specific Ideas

- Enrollment method should be configurable per program (some programs admin adds people, some people can request to join)
- Graduation/completion should auto-calculate based on defined criteria when possible

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 16-crm-dashboard-programs_
_Context gathered: 2026-01-19_
