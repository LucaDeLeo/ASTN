# Roadmap: AI Safety Talent Network (ASTN)

## Overview

This roadmap delivers the ASTN pilot for BAISH (50-100 profiles). We start with opportunity aggregation to prevent cold start, then build user-facing features in dependency order: auth, profiles, matching, and finally engagement/org features. Each phase delivers a coherent, verifiable capability that unlocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation + Opportunities** - Project scaffolding and opportunity pipeline (cold start prevention)
- [ ] **Phase 2: Authentication** - User accounts with OAuth and email/password
- [ ] **Phase 3: Profiles** - Profile creation with form and LLM enrichment
- [ ] **Phase 4: Matching** - Smart matching with explanations and recommendations
- [ ] **Phase 5: Engagement + Org** - Notifications and org dashboard

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
- [ ] 02-01-PLAN.md — Auth infrastructure (ConvexAuthProvider, OAuth credentials, password validation)
- [ ] 02-02-PLAN.md — Login page and auth-aware header

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
**Plans**: TBD

Plans:
- [ ] 03-01: Profile data model and form-based creation
- [ ] 03-02: Skills taxonomy and selection UI
- [ ] 03-03: LLM profile enrichment conversation
- [ ] 03-04: Privacy controls and completeness tracking

### Phase 4: Matching
**Goal**: Users receive smart matches with explanations and actionable recommendations
**Depends on**: Phase 3 (profiles exist), Phase 1 (opportunities exist)
**Requirements**: MATCH-01, MATCH-02, MATCH-03, MATCH-04
**Success Criteria** (what must be TRUE):
  1. User receives matched opportunities based on their profile
  2. Each match includes explanation of why the opportunity fits the user
  3. Each match shows LLM-estimated acceptance probability (labeled experimental)
  4. User receives personalized "what to do next" recommendations to improve fit
**Plans**: TBD

Plans:
- [ ] 04-01: Match engine with programmatic context construction
- [ ] 04-02: Match explanations and acceptance probability
- [ ] 04-03: Personalized recommendations ("what to do next")

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
**Plans**: TBD

Plans:
- [ ] 05-01: Email notification system (Resend + React Email)
- [ ] 05-02: Notification preferences and digest scheduling
- [ ] 05-03: Org data model and membership
- [ ] 05-04: Org dashboard (member list, profiles, stats)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation + Opportunities | 4/4 | Complete | 2026-01-17 |
| 2. Authentication | 0/2 | Planned | - |
| 3. Profiles | 0/4 | Not started | - |
| 4. Matching | 0/3 | Not started | - |
| 5. Engagement + Org | 0/4 | Not started | - |

---
*Roadmap created: 2026-01-17*
*Depth: standard (5 phases)*
*Coverage: 26/26 v1 requirements mapped*
