# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-17)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** Phase 3 - Profiles

## Current Position

Phase: 2 of 5 complete, ready for Phase 3
Plan: 0 of 4 in Phase 3 (not started)
Status: Phase 2 verified, Phase 3 ready
Last activity: 2026-01-17 - Phase 2 verified (4/4 success criteria)

Progress: [████████░░░░░░░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 8 min
- Total execution time: 0.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-opportunities | 4 | 30 min | 8 min |
| 02-authentication | 2 | 20 min | 10 min |

**Recent Trend:**
- Last 5 plans: 5 min, 12 min, 12 min, 8 min
- Trend: Consistent

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: AI safety skills taxonomy needs to be defined before Phase 3
- [01-03]: 80K Hours Algolia credentials need to be extracted from page source
- [01-03]: aisafety.com Airtable credentials need to be obtained from their team

## Session Continuity

Last session: 2026-01-17
Stopped at: Completed 02-02-PLAN.md (login UI & auth header) - Phase 2 complete
Resume file: None

---
*State initialized: 2026-01-17*
*Last updated: 2026-01-17*
