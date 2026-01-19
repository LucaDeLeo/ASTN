# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** Phase 15 - Engagement Scoring (plan 1 of 3 complete)

## Current Position

Phase: 15 of 16 (Engagement Scoring)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-01-19 - Completed 15-01-PLAN.md (engagement scoring backend)

Progress: [█████████████████████████░░░░░] 76% (47/49 plans: v1.0 + v1.1 complete, v1.2 phases 11-14 complete, 15-01 complete)

## Milestone History

- v1.0 MVP - 6 phases, 21 plans - shipped 2026-01-18
- v1.1 Profile Input Speedup - 4 phases, 13 plans - shipped 2026-01-19
- v1.2 Org CRM & Events - 6 phases, ~14 plans (estimated) - in progress

## Performance Metrics

**Velocity:**
- Total plans completed: 47 (v1.0: 21 + v1.1: 13 + v1.2: 13)
- Average duration: ~10 min/plan
- v1.1 execution: 4 phases in ~2 days
- v1.2 execution: Phase 11 complete (3 plans, ~12 min), Phase 12 complete (3 plans, ~11 min), Phase 13 complete (3 plans, ~19 min), Phase 14 complete (3 plans, ~11 min), Phase 15 in progress (1 plan, ~6 min)

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
| 13-event-notifications | 3 | ~19min | ~6min |
| 14-attendance-tracking | 3 | ~11min | ~4min |
| 15-engagement-scoring | 1/3 | ~6min | ~6min |

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
- [12-02]: Lu.ma embed uses ?embed=true query param for clean iframe display
- [12-02]: Events button only shown when lumaCalendarUrl is configured
- [12-02]: Admin dashboard shows 4-column grid with Events status card
- [12-03]: Events grouped by org name on dashboard for clear organization
- [12-03]: Max 5 events shown per org with overflow indicator
- [12-03]: Date format: 'Fri, Jan 24 at 6:00 PM' using date-fns
- [13-01]: Weekly digest as default event notification frequency
- [13-01]: 1 day + 1 hour before as default reminders
- [13-01]: Org muting stored as mutedOrgIds array
- [13-02]: Daily digest targets 9 AM local time (offset from match alerts at 8 AM)
- [13-02]: Weekly event digest runs Sunday 22:30 UTC (30 min after opportunity digest)
- [13-02]: Rate limit of 5 notifications per hour per user for "all" frequency
- [13-03]: Intersection Observer at 50% visibility for event view tracking
- [13-03]: Scheduler-based reminders using ctx.scheduler.runAt for future notifications
- [13-03]: scheduledReminders table tracks function IDs for cancellation
- [14-01]: 10-minute cron with 10-20 minute detection window for ended events
- [14-01]: 2-prompt max limit for attendance prompts (no follow-ups after prompt 2)
- [14-01]: Default attendance privacy: showOnProfile=true, showToOtherOrgs=false
- [14-02]: Soft nudge skip requires two clicks (first shows warning, second confirms)
- [14-02]: AttendancePrompt renders inline in notification list (not click-to-navigate)
- [14-03]: Profile-level privacy defaults stored in privacySettings.attendancePrivacyDefaults
- [14-03]: Privacy updates can batch-update existing attendance records
- [15-01]: Claude Haiku for cost-effective engagement classification
- [15-01]: 100ms delay between member classifications for rate limiting
- [15-01]: Override expiration checked during batch computation
- [15-01]: User-facing text never shows "At Risk" - softer language used

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
Stopped at: Completed 15-01-PLAN.md (engagement scoring backend)
Resume file: None
Next action: `/gsd:execute-phase 15` (plan 15-02)

---
*State initialized: 2026-01-17*
*Last updated: 2026-01-19 - Completed 15-01-PLAN.md (engagement scoring backend with LLM classification and daily cron)*
