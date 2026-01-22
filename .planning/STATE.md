# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-20)

**Core value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh
**Current focus:** Phase 25 - Tauri Mobile + Native Features

## Current Position

Phase: 25 of 26 (Tauri Mobile + Native Features)
Plan: 1 of 6 complete
Status: In progress
Last activity: 2026-01-22 - Completed 25-01 (Tauri Project Initialization)

Progress: v1.0 + v1.1 + v1.2 + v1.3 complete (67 plans), v2.0 phases 21-23, 26 complete (16 plans) + 25-01
[#################...] 84%

## Milestone History

- v1.0 MVP - 6 phases, 21 plans - shipped 2026-01-18
- v1.1 Profile Input Speedup - 4 phases, 13 plans - shipped 2026-01-19
- v1.2 Org CRM & Events - 6 phases, 20 plans - shipped 2026-01-19
- v1.3 Visual Overhaul - 4 phases (17-20), 13 plans - shipped 2026-01-20

**Total:** 20 phases, 67 plans across 4 shipped milestones
**In progress:** v2.0 Mobile + Tauri - 5 phases (21-23, 25-26), 17/~22 plans complete

## Pending Todos

- [ ] Buy domain (astn.ai or similar) and set up email sending via Resend
- [ ] Remove test-upload.tsx route after development complete
- [ ] Configure 80K Hours Algolia credentials
- [ ] Obtain aisafety.com Airtable credentials from their team
- [ ] Configure Lu.ma API key for orgs needing event sync (requires Luma Plus subscription)
- [ ] Apply GradientBg to settings, attendance, org admin pages (v1.3 coverage gap)
- [ ] Update 35+ headings from font-bold to font-display (v1.3 coverage gap)

## Blockers/Concerns

- Notification frequency defaults need user testing
- Engagement level thresholds may need per-org tuning
- Tauri push notification plugin is community-maintained (needs early testing)
- TanStack Start routes need SPA-compatible variants for full Tauri integration (planned for 25-04)

## Decisions Made (v2.0)

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Navy/slate as primary color | Professional, serious tone for AI Safety domain | 26 |
| Coral as accent only | CTAs and highlights, not primary | 26 |
| Semantic tokens over hardcoded colors | Theme consistency across light/dark modes | 26 |
| Skip Tauri Desktop (Phase 24) | Focus is mobile only; desktop validation not needed | - |
| ai.astn.app bundle identifier | Matches domain convention, ready for App Store | 25-01 |
| astn:// deep link scheme | Simple scheme for OAuth callbacks | 25-01 |
| Separate SPA entry for Tauri | TanStack Start SSR incompatible with WebView | 25-01 |

## Roadmap Evolution

- Phase 26 added: UX Polish - Fix typography, color palette, empty states, and design consistency (based on .planning/review/ux-review.md)
- Phase 26 completed: All 4 plans executed successfully
- Phase 24 removed: Desktop Tauri not needed; going straight to mobile

## Session Continuity

Last session: 2026-01-22
Stopped at: Completed 25-01-PLAN.md (Tauri Project Initialization)
Resume file: None
Next action: Execute 25-02 (iOS Build Setup) or 25-03 (Android Build Setup)

---
*State initialized: 2026-01-17*
*Last updated: 2026-01-22 - Completed 25-01 (Tauri Project Initialization)*
