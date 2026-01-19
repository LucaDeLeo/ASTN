# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** Phase 12 - Event Management

## Current Position

Phase: 12 of 16 (Event Management)
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-01-19 - Completed 12-03-PLAN.md (dashboard events)

Progress: [████████████████████░░░░░░░░░░] 62% (40/48 plans: v1.0 + v1.1 complete, v1.2 phase 11 + 12 complete)

## Milestone History

- v1.0 MVP - 6 phases, 21 plans - shipped 2026-01-18
- v1.1 Profile Input Speedup - 4 phases, 13 plans - shipped 2026-01-19
- v1.2 Org CRM & Events - 6 phases, ~14 plans (estimated) - in progress

## Performance Metrics

**Velocity:**
- Total plans completed: 40 (v1.0: 21 + v1.1: 13 + v1.2: 6)
- Average duration: ~10 min/plan
- v1.1 execution: 4 phases in ~2 days
- v1.2 execution: Phase 11 complete (3 plans, ~12 min), Phase 12 complete (3 plans, ~11 min)

**By Phase (v1.1):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 07-file-upload | 4 | ~72min | ~18min |
| 08-llm-extraction | 3 | ~33min | ~11min |
| 09-review-apply-ui | 3 | ~22min | ~7min |
| 10-wizard-integration | 3 | ~10min | ~3min |

**By Phase (v1.2):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 11-org-discovery | 3 | ~12min | ~4min |
| 12-event-management | 3 | ~11min | ~4min |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v1.2 Research]: Zero new npm dependencies - existing stack handles everything
- [v1.2 Research]: Sequential build order (org discovery -> events -> attendance -> engagement -> CRM)
- [v1.2 Research]: Notification fatigue is #1 threat - design with batching from day one
- [11-01]: Location discovery is opt-in (locationDiscoverable defaults to false)
- [11-01]: Simple city parsing from "City, Country" format; global orgs as fallback
- [11-02]: CSS scroll-snap for carousel (simpler, native feel)
- [11-02]: Immediate toggle feedback via toast for LocationPrivacyToggle
- [11-03]: Leaflet via CDN avoids npm dependency; types via @types/leaflet
- [11-03]: Map hidden on mobile for better UX on small screens
- [12-01]: Lu.ma API key is per-calendar, implicitly identifies which calendar to fetch
- [12-01]: Event sync window: 30 days past to 90 days future
- [12-01]: Rate limiting: 200ms between pages, 1s between orgs, 60s retry on 429
- [12-03]: Events grouped by org name on dashboard for clear organization
- [12-03]: Max 5 events shown per org with overflow indicator
- [12-03]: Date format: 'Fri, Jan 24 at 6:00 PM' using date-fns

### Pending Todos

- [ ] Buy domain (astn.ai or similar) and set up email sending via Resend
- [ ] Remove test-upload.tsx route after development complete
- [ ] Configure 80K Hours Algolia credentials
- [ ] Obtain aisafety.com Airtable credentials from their team
- [ ] Configure Lu.ma API key for orgs needing event sync (requires Luma Plus subscription)

### Blockers/Concerns

- [Research]: Notification frequency defaults need user testing
- [Research]: Engagement level thresholds may need per-org tuning
- [Resolved 11-01]: Privacy consent UX for location - implemented as opt-in toggle

## Session Continuity

Last session: 2026-01-19
Stopped at: Completed 12-03-PLAN.md
Resume file: None
Next action: Execute Phase 13 (attendance-tracking)

---
*State initialized: 2026-01-17*
*Last updated: 2026-01-19 - Completed 12-03-PLAN.md (dashboard events)*
