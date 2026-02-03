# Phase 21: Responsive Foundation - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

All routes display correctly on mobile viewports with proper touch targets, form usability, and adapted layouts. This phase establishes the responsive foundation — navigation patterns (bottom tabs, hamburger) and touch interactions (pull-to-refresh, swipe gestures) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Layout Adaptation

- Sidebars become bottom sheets on mobile (slide-up drawer)
- Multi-column layouts stack to single column on mobile
- Profile sections all visible with scroll (not accordion/tabs)

### Data Table Handling

- Opportunity tables become cards on mobile
- Admin CRM tables (member lists, attendees) become compact lists (avatar + name + key stat)
- Filters: show active filters as chips, "Filter" button opens full filter sheet

### Form Patterns

- Multi-section forms use inline editing (no fullscreen modals)
- Long forms (work history, education) use multi-step wizard with progress indicator
- Section headings are sticky when scrolling through fields
- Date pickers and selects use native mobile inputs

### Breakpoint Strategy

- Mobile-first approach (base styles for mobile, add complexity with md:, lg:)
- Use Tailwind defaults (sm/md/lg/xl) progressively as needed
- Minimum viewport: 375px
- Tablets (768-1024px) get desktop patterns (multi-column)

### Claude's Discretion

- Card information density for opportunity/match cards on mobile
- What info to show prominently on mobile opportunity cards (role + org, deadline, tier)
- Skeleton loading state design
- Exact spacing and typography adjustments

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 21-responsive-foundation_
_Context gathered: 2026-01-21_
