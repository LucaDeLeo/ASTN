# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** v2.0 Course Program Platform -- Phase 37: Unified Prompt System

## Current Position

Phase: 37 of 41 (Unified Prompt System)
Plan: -- (not yet planned)
Status: Ready to plan
Last activity: 2026-03-10 -- Roadmap created for v2.0 Course Program Platform

Progress: [░░░░░░░░░░] 0% (0/5 phases)

## Milestone History

- v1.0 MVP - 6 phases, 21 plans - shipped 2026-01-18
- v1.1 Profile Input Speedup - 4 phases, 13 plans - shipped 2026-01-19
- v1.2 Org CRM & Events - 6 phases, 20 plans - shipped 2026-01-19
- v1.3 Visual Overhaul - 4 phases (17-20), 13 plans - shipped 2026-01-20
- v2.0 Mobile + Tauri (partial) - Phases 21-23, 26 complete (16 plans). Phase 25 deferred.
- v1.4 Hardening - 3 phases (27-29), 9 plans - shipped 2026-02-02
- v1.5 Org Onboarding & Co-working - 5 phases (30-34), 17 plans - shipped 2026-02-03
- v1.6 Career Actions - 2 phases (35-36), 5 plans - shipped 2026-02-11

**Total:** 36 phases, 114 plans across 7 shipped milestones + partial v2.0

## Accumulated Context

### Decisions

- v2.0: Facilitator agent uses local Bun process + Claude Agent SDK + WebSocket bridge (same as existing admin agent), NOT @convex-dev/agent
- v2.0: Participant AI sidebar uses @convex-dev/agent inside Convex with ASTN API keys
- v2.0: Sidebar messages must use separate table (not embedded array) to avoid 1 MiB Convex document limit
- v2.0: Write-then-reveal state lives on prompt (revealedAt), not on individual responses (TOCTOU fix)
- v2.0: New course features go in convex/course/ directory (convex/programs.ts already 1000+ lines)

### Key Context

- COURSE-PROGRAM-PLAN.md is the detailed design document for v2.0
- Existing program tables: programs, programParticipation, programModules, programSessions, sessionRsvps, sessionAttendance, materialProgress
- BAISH pilot: ~10 participants, 6 weekly sessions in Spanish
- Research flags: Phase 39 needs contextual proposal card UX design spike; Phase 40 needs subscription architecture design

## Pending Todos

- [ ] Buy domain (astn.ai or similar) and set up email sending via Resend
- [ ] Configure 80K Hours Algolia credentials
- [ ] Obtain aisafety.com Airtable credentials from their team
- [ ] Configure Lu.ma API key for orgs needing event sync
- [ ] Seed platformAdmins table for first platform admin user

## Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-10
Stopped at: Roadmap created for v2.0 Course Program Platform
Resume file: None
Next action: /gsd:plan-phase 37

---

_State initialized: 2026-01-17_
_Last updated: 2026-03-10 -- v2.0 roadmap created, ready to plan Phase 37_
