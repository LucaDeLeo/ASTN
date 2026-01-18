# Roadmap: AI Safety Talent Network (ASTN)

## Overview

This roadmap delivers the ASTN pilot for BAISH (50-100 profiles). We start with opportunity aggregation to prevent cold start, then build user-facing features in dependency order: auth, profiles, matching, and finally engagement/org features. Each phase delivers a coherent, verifiable capability that unlocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation + Opportunities** - Project scaffolding and opportunity pipeline (cold start prevention)
- [x] **Phase 2: Authentication** - User accounts with OAuth and email/password
- [x] **Phase 3: Profiles** - Profile creation with form and LLM enrichment
- [ ] **Phase 4: Matching** - Smart matching with explanations and recommendations
- [x] **Phase 5: Engagement + Org** - Notifications and org dashboard
- [ ] **Phase 6: Polish + Tech Debt** - Navigation fixes and audit cleanup (GAP CLOSURE)

## Phase Details

### Phase 1: Foundation + Opportunities
**Goal**: Opportunities exist and are browsable before users arrive (cold start prevention)
**Depends on**: Nothing (first phase)
**Requirements**: OPPS-01, OPPS-02, OPPS-03, OPPS-04, OPPS-05, OPPS-06
**Success Criteria** (what must be TRUE):
  1. User can view opportunity listings with full details (title, org, description, requirements)
  2. User can search and filter opportunities by role type, location, and experience level
  3. System has imported opportunities from 80K Hours job board
  4. System has imported opportunities from aisafety.com
  5. Admin can manually add and edit opportunities
**Plans**: 4 plans in 3 waves

Plans:
- [x] 01-01-PLAN.md — Project setup (TanStack Start, Convex, Convex Auth, shadcn/ui)
- [x] 01-02-PLAN.md — Opportunity data model and admin CRUD
- [x] 01-03-PLAN.md — Opportunity aggregation (80K Hours + aisafety.com adapters)
- [x] 01-04-PLAN.md — Opportunity browsing UI (list, detail, search/filter)

### Phase 2: Authentication
**Goal**: Users can securely access their accounts
**Depends on**: Phase 1 (project infrastructure exists)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can sign up and log in with Google OAuth
  2. User can sign up and log in with GitHub OAuth
  3. User can sign up and log in with email/password
  4. User session persists across browser refresh and returns
**Plans**: 2 plans in 2 waves

Plans:
- [x] 02-01-PLAN.md — Auth infrastructure (ConvexAuthProvider, OAuth credentials, password validation)
- [x] 02-02-PLAN.md — Login page and auth-aware header

### Phase 3: Profiles
**Goal**: Users have rich profiles that capture their background, skills, and goals
**Depends on**: Phase 2 (users must be authenticated)
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06
**Success Criteria** (what must be TRUE):
  1. User can enter and edit basic info (name, location, education, work history)
  2. User can select skills from AI safety-specific taxonomy
  3. User can describe career goals, interests, and what they're seeking
  4. User can have LLM conversation to enrich profile with deeper context
  5. User can set privacy controls to hide profile from specific orgs
  6. User sees profile completeness progress with feature unlocks at thresholds
**Plans**: 4 plans in 2 waves

Plans:
- [x] 03-01-PLAN.md — Profile schema and wizard with basic form steps (Wave 1)
- [x] 03-02-PLAN.md — Skills taxonomy and selection UI (Wave 2)
- [x] 03-03-PLAN.md — LLM profile enrichment conversation (Wave 2)
- [x] 03-04-PLAN.md — Privacy controls and completeness tracking (Wave 2)

### Phase 4: Matching
**Goal**: Users receive smart matches with explanations and actionable recommendations
**Depends on**: Phase 3 (profiles exist), Phase 1 (opportunities exist)
**Requirements**: MATCH-01, MATCH-02, MATCH-03, MATCH-04
**Success Criteria** (what must be TRUE):
  1. User receives matched opportunities based on their profile
  2. Each match includes explanation of why the opportunity fits the user
  3. Each match shows LLM-estimated acceptance probability (labeled experimental)
  4. User receives personalized "what to do next" recommendations to improve fit
**Plans**: 3 plans in 3 waves

Plans:
- [x] 04-01-PLAN.md — Match data layer (schema, internal queries/mutations)
- [x] 04-02-PLAN.md — Match compute engine (prompts, LLM action, public queries)
- [ ] 04-03-PLAN.md — Matches UI (list page, detail page, components)

### Phase 5: Engagement + Org
**Goal**: Users stay engaged through notifications; BAISH has visibility into their members
**Depends on**: Phase 4 (matching), Phase 3 (profiles)
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, ORG-01, ORG-02, ORG-03
**Success Criteria** (what must be TRUE):
  1. User receives email when new high-fit matches appear
  2. User receives weekly personalized digest email
  3. User can configure notification preferences (frequency, channels)
  4. Org admin can view list of their organization's members
  5. Org admin can view member profiles (with member consent)
  6. Org admin can see aggregate stats for their org (member count, skills distribution)
**Plans**: 6 plans in 2 waves

Plans:
- [x] 05-01-PLAN.md — Email infrastructure + schema (Resend component, templates)
- [x] 05-02-PLAN.md — Notification scheduling (timezone-aware batch processing)
- [x] 05-03-PLAN.md — Notification preferences UI (/settings page)
- [x] 05-04-PLAN.md — Org membership data model (roles, invites)
- [x] 05-05-PLAN.md — Org directory + join flow (/org/:slug pages)
- [x] 05-06-PLAN.md — Org admin dashboard (stats, export)

### Phase 6: Polish + Tech Debt
**Goal**: Close audit gaps and clean up tech debt before pilot launch
**Depends on**: Phase 5 (all features complete)
**Requirements**: None (gap closure phase)
**Gap Closure**: Addresses v1-MILESTONE-AUDIT.md findings
**Success Criteria** (what must be TRUE):
  1. /matches link visible in AuthHeader navigation
  2. Admin routes have frontend auth wrapper (defense in depth)
  3. Phase 04 has VERIFICATION.md documenting completion
  4. Create Invite Link button works in org admin dashboard
  5. Unused profiles.getById query removed
**Plans**: 2 plans in 1 wave

Plans:
- [ ] 06-01-PLAN.md — Navigation and auth wrapper fixes (integration gaps)
- [ ] 06-02-PLAN.md — Tech debt cleanup (documentation, UI, dead code)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Opportunities | 4/4 | Complete | 2026-01-17 |
| 2. Authentication | 2/2 | Complete | 2026-01-17 |
| 3. Profiles | 4/4 | Complete | 2026-01-17 |
| 4. Matching | 2/3 | In Progress | - |
| 5. Engagement + Org | 6/6 | Complete | 2026-01-18 |
| 6. Polish + Tech Debt | 0/2 | Pending | - |

---
*Roadmap created: 2026-01-17*
*Depth: standard (6 phases)*
*Coverage: 26/26 v1 requirements mapped + gap closure*
