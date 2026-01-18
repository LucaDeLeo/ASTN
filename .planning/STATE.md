# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-17)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** Phase 5 - Engagement + Org

## Current Position

Phase: 5 of 5 (Engagement + Org)
Plan: 3 of 6 in Phase 5 complete (05-01, 05-04, 05-05)
Status: In progress
Last activity: 2026-01-18 - Completed 05-05-PLAN.md (org directory + join flow)

Progress: [█████████████████░░░] 85%

## Performance Metrics

**Velocity:**
- Total plans completed: 15
- Average duration: 7 min
- Total execution time: 1.73 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-opportunities | 4 | 30 min | 8 min |
| 02-authentication | 2 | 20 min | 10 min |
| 03-profiles | 4 | 22 min | 6 min |
| 04-matching | 2 | 8 min | 4 min |
| 05-engagement-org | 3 | 21 min | 7 min |

**Recent Trend:**
- Last 5 plans: 3 min, 5 min, 4 min, 12 min, 5 min
- Trend: Fast execution

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Cold start prevention - build opportunity pipeline before user features
- [Roadmap]: Programmatic context construction for LLM matching (no vector search)
- [Stack]: Convex + TanStack Start + Claude Sonnet 4.5/Haiku 4.5
- [01-01]: Used @auth/core@0.39 for @convex-dev/auth compatibility
- [01-01]: Deferred OAuth credential setup to Phase 2
- [01-01]: Used OKLCH color format for coral accent
- [01-02]: Separate Convex files for public queries vs admin mutations
- [01-02]: OpportunityForm uses useState + TanStack Query mutations pattern
- [01-03]: Use internalAction for adapter functions to enable calling from sync orchestrator
- [01-03]: Separate Node.js actions from mutations (Convex requires mutations in non-Node runtime)
- [01-03]: Fuzzy match threshold 0.85 for titles, 0.8 for organizations
- [01-04]: URL-synced filters via TanStack Router search params for shareable links
- [01-04]: Shared PublicHeader component instead of pathless layout route
- [01-04]: Staggered animation delay of 50ms per card
- [02-01]: Password validation: 8+ chars, lowercase, uppercase, number
- [02-01]: OAuth providers: Google + GitHub
- [02-02]: Combined sign-in/sign-up on single page with tabs
- [02-02]: OAuth buttons first, then separator, then email form
- [02-02]: AuthHeader replaces PublicHeader on all public routes
- [03-01]: Auto-save debounce 500ms for text fields, immediate for arrays
- [03-01]: 7 wizard steps: basic, education, work, goals, skills, enrichment, privacy
- [03-01]: Section completeness requires name AND location for basicInfo
- [03-01]: Unlock threshold of 4 sections for smart matching
- [03-02]: Lazy taxonomy seeding via ensureTaxonomySeeded action
- [03-02]: Soft limit of 10 skills with amber warning, not hard cap
- [03-02]: Custom skills allowed via Enter on unmatched input
- [03-03]: Claude Haiku 4.5 for conversation and extraction (fast, cost-effective)
- [03-03]: Separate Node.js file for actions, regular file for queries/mutations
- [03-03]: shouldExtract triggered by LLM signaling phrases (summarize, update profile)
- [03-03]: Extraction uses forced tool_choice for reliable structured output
- [03-04]: Default visibility defaults to 'connections' (balanced privacy)
- [03-04]: Section visibility inherits from default unless overridden
- [03-04]: 18 AI safety organizations seeded on first access
- [03-04]: Complete Profile button with success animation replaces standard navigation
- [04-01]: Tier labels (great/good/exploring) instead of percentages per CONTEXT.md
- [04-01]: isNew boolean tracks first-time matches for prioritization
- [04-01]: modelVersion field tracks which LLM version generated matches
- [04-01]: Internal queries/mutations in convex/matching/ for domain separation
- [04-02]: Use internalAction for compute to avoid TypeScript circular reference
- [04-02]: Batch 15 opportunities per LLM call, cap 50 per profile for pilot
- [04-02]: Explicit type annotations in action handlers for TypeScript inference
- [05-04]: First user to join org becomes admin (per CONTEXT.md)
- [05-04]: Last admin cannot leave or demote self without promoting another
- [05-04]: Invite tokens are UUIDs with optional expiration
- [05-04]: requireOrgAdmin helper pattern for admin-only operations
- [05-01]: CORAL accent #FF6B4A for email branding
- [05-01]: Top 5 matches in alert emails, link to full list
- [05-01]: notificationPreferences.timezone stores IANA identifier
- [05-01]: Resend testMode for local development
- [05-05]: Directory shows only members with directoryVisibility="visible"
- [05-05]: Visibility prompt required before joining (not defaulted)
- [05-05]: Admin badge shown in member cards for admin role

### Pending Todos

None yet.

### Blockers/Concerns

- [01-03]: 80K Hours Algolia credentials need to be extracted from page source
- [01-03]: aisafety.com Airtable credentials need to be obtained from their team

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 05-05-PLAN.md (org directory + join flow)
Resume file: None

---
*State initialized: 2026-01-17*
*Last updated: 2026-01-18*
