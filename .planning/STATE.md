# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** v1.5 Org Onboarding & Co-working -- Phase 33 in progress

## Current Position

Phase: 33 of 34 (Guest Access + Visit Applications)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-03 -- Completed 33-01-PLAN.md (Guest Backend Schema + Mutations)

Progress: [████████████░░░░░░░░] 62% (33-01 complete)

## Milestone History

- v1.0 MVP - 6 phases, 21 plans - shipped 2026-01-18
- v1.1 Profile Input Speedup - 4 phases, 13 plans - shipped 2026-01-19
- v1.2 Org CRM & Events - 6 phases, 20 plans - shipped 2026-01-19
- v1.3 Visual Overhaul - 4 phases (17-20), 13 plans - shipped 2026-01-20
- v2.0 Mobile + Tauri (partial) - Phases 21-23, 26 complete (16 plans). Phase 25 deferred.
- v1.4 Hardening - 3 phases (27-29), 9 plans - shipped 2026-02-02

**Total:** 29 phases, 96 plans across 5 shipped milestones + partial v2.0

## Accumulated Decisions

| Decision                                                       | Phase | Rationale                                              |
| -------------------------------------------------------------- | ----- | ------------------------------------------------------ |
| Platform admin is separate `platformAdmins` table              | 30-01 | Clean separation from org-level admin role             |
| Slug generation with db uniqueness in `convex/lib/slug.ts`     | 30-01 | Reusable utility, appends -2, -3 for collisions        |
| Case-insensitive normalized org name for duplicate detection   | 30-01 | Checks both organizations and orgApplications tables   |
| Pre-fill applicant name from profile, email from auth identity | 30-02 | Profile has no email field; auth identity does         |
| Desktop table + mobile card list for admin review queue        | 30-02 | Responsive pattern matching existing member list       |
| Rejection reason minimum 10 characters                         | 30-02 | Ensures meaningful feedback to applicants              |
| Soft capacity warnings without blocking                        | 32-01 | Allows admin flexibility for overbooking if needed     |
| Consent required for booking                                   | 32-01 | consentToProfileSharing must be true to create booking |
| Profile subset for attendees: name, headline, skills only      | 32-01 | Minimal PII exposure for attendee visibility           |
| react-day-picker v9 with custom DayButton                      | 32-02 | Availability indicators via green/yellow/red dots      |
| Inline guest profile creation in mutations                     | 33-01 | Convex runMutation cannot call internal mutations      |
| Guest profiles preserved after member conversion               | 33-01 | Audit trail for visit history                          |
| requireSpaceAdmin helper for space-level admin checks          | 33-01 | Consistent auth pattern for space operations           |

## Performance Metrics

**Velocity:**

- Total plans completed: 97
- Total execution time: ~21.0 hours (across all milestones)

## Pending Todos

- [ ] Buy domain (astn.ai or similar) and set up email sending via Resend
- [ ] Configure 80K Hours Algolia credentials
- [ ] Obtain aisafety.com Airtable credentials from their team
- [ ] Configure Lu.ma API key for orgs needing event sync
- [ ] Seed platformAdmins table for first platform admin user

## Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-03
Stopped at: Completed 33-01-PLAN.md (Guest Backend Schema + Mutations)
Resume file: None
Next action: Execute 33-02-PLAN.md (Guest UI)

---

_State initialized: 2026-01-17_
_Last updated: 2026-02-03 -- 33-01 complete_
