# Roadmap: ASTN

## Milestones

- ✅ **v1.0 Core Matching** - Phases 1-7 (shipped 2025-12-27)
- ✅ **v1.1 Profile Input Speedup** - Phases 8-10 (shipped 2026-01-19)
- 🚧 **v1.2 Org CRM & Events** - Phases 11-16 (in progress)

## Phases

<details>
<summary>✅ v1.0 Core Matching (Phases 1-7) - SHIPPED 2025-12-27</summary>

### Phase 1: Foundation
**Goal**: Project scaffolding with auth and basic routing
**Plans**: 4 plans

Plans:
- [x] 01-01: Project setup
- [x] 01-02: Auth system
- [x] 01-03: Basic routing
- [x] 01-04: Database schema

### Phase 2: Profile Core
**Goal**: Users can create and edit profiles
**Plans**: 3 plans

Plans:
- [x] 02-01: Profile schema and API
- [x] 02-02: Profile form UI
- [x] 02-03: Profile completeness tracking

### Phase 3: Opportunity Aggregation
**Goal**: System aggregates opportunities from external sources
**Plans**: 3 plans

Plans:
- [x] 03-01: 80K Hours adapter
- [x] 03-02: aisafety.com adapter
- [x] 03-03: Cron-based sync

### Phase 4: Matching Engine
**Goal**: System matches profiles to opportunities with explanations
**Plans**: 3 plans

Plans:
- [x] 04-01: Matching algorithm
- [x] 04-02: Match explanations
- [x] 04-03: Match tiers

### Phase 5: Recommendations
**Goal**: Users receive personalized recommendations
**Plans**: 2 plans

Plans:
- [x] 05-01: Recommendation engine
- [x] 05-02: Recommendation UI

### Phase 6: Org Dashboard
**Goal**: Org admins can view their members
**Plans**: 2 plans

Plans:
- [x] 06-01: Org dashboard UI
- [x] 06-02: Member export

### Phase 7: Email Digests
**Goal**: Users receive match digests via email
**Plans**: 2 plans

Plans:
- [x] 07-01: Email templates
- [x] 07-02: Digest scheduling

</details>

<details>
<summary>✅ v1.1 Profile Input Speedup (Phases 8-10) - SHIPPED 2026-01-19</summary>

### Phase 8: Document Extraction
**Goal**: Users can upload documents for profile extraction
**Plans**: 3 plans

Plans:
- [x] 08-01: PDF/document upload
- [x] 08-02: LLM extraction pipeline
- [x] 08-03: Extracted data review UI

### Phase 9: Text Paste Input
**Goal**: Users can paste text for profile extraction
**Plans**: 2 plans

Plans:
- [x] 09-01: Text paste UI
- [x] 09-02: Context-aware extraction

### Phase 10: Entry Point Wizard
**Goal**: Users choose their preferred profile creation method
**Plans**: 3 plans

Plans:
- [x] 10-01: Wizard UI
- [x] 10-02: Method routing
- [x] 10-03: Chat-first option

</details>

### 🚧 v1.2 Org CRM & Events (In Progress)

**Milestone Goal:** Transform ASTN into a self-maintaining CRM for field-building orgs — members discover local hubs, attend events, and orgs get a live view of their community.

#### Phase 11: Org Discovery ✓
**Goal**: Users can discover and join relevant organizations
**Depends on**: Phase 10 (existing org infrastructure)
**Requirements**: ORG-01, ORG-02, ORG-03
**Success Criteria** (what must be TRUE):
  1. User sees geography-based org suggestions on their dashboard
  2. User can browse and search orgs with location filtering
  3. User can join an org via shareable invite link
  4. Location-based suggestions respect user privacy preferences
**Plans**: 3 plans
**Completed**: 2026-01-19

Plans:
- [x] 11-01-PLAN.md — Schema foundation + discovery backend
- [x] 11-02-PLAN.md — Dashboard suggestions + settings UI
- [x] 11-03-PLAN.md — Browse page with map

#### Phase 12: Event Management ✓
**Goal**: Orgs can connect lu.ma calendars and users can view events on dashboard
**Depends on**: Phase 11
**Requirements**: EVT-02, EVT-03 (EVT-01 via lu.ma, EVT-04 via lu.ma link-out)
**Success Criteria** (what must be TRUE):
  1. Org admin can configure lu.ma calendar integration
  2. Org has a public event listing page showing lu.ma embed
  3. User can see events from their orgs on their dashboard
  4. User can RSVP to events via lu.ma link-out
**Plans**: 3 plans
**Completed**: 2026-01-19

Plans:
- [x] 12-01-PLAN.md — Schema + lu.ma sync backend
- [x] 12-02-PLAN.md — Org events page + admin settings
- [x] 12-03-PLAN.md — Dashboard events section

#### Phase 13: Event Notifications ✓
**Goal**: Users receive configurable event notifications and reminders
**Depends on**: Phase 12
**Requirements**: EVT-05, EVT-06, EVT-07
**Success Criteria** (what must be TRUE):
  1. User can configure event notification frequency (all / digest / none)
  2. User can mute specific orgs from event notifications
  3. User can set reminder preferences (1 day before, 1 hour before, none)
  4. System sends notifications according to user preferences
  5. Notifications batch properly to avoid fatigue
**Plans**: 3 plans
**Completed**: 2026-01-19

Plans:
- [x] 13-01-PLAN.md — Schema + event notification preferences UI
- [x] 13-02-PLAN.md — Event digest emails + real-time notifications
- [x] 13-03-PLAN.md — In-app notification center + event reminders

#### Phase 14: Attendance Tracking ✓
**Goal**: Users confirm event attendance and provide feedback
**Depends on**: Phase 13
**Requirements**: ATT-01, ATT-02, ATT-03, ATT-04, ATT-05
**Success Criteria** (what must be TRUE):
  1. User receives post-event "Did you attend?" notification within 2-4 hours
  2. User can confirm attendance with one tap
  3. User can view their attendance history on their profile
  4. User can optionally provide feedback after attending (star rating + text)
  5. User can dismiss or defer attendance prompts
**Plans**: 3 plans
**Completed**: 2026-01-19

Plans:
- [x] 14-01-PLAN.md — Schema + backend + post-event scheduler
- [x] 14-02-PLAN.md — UI components + notification integration
- [x] 14-03-PLAN.md — Attendance history + privacy settings

#### Phase 15: Engagement Scoring
**Goal**: System computes explainable engagement levels with admin override
**Depends on**: Phase 14 (needs attendance data)
**Requirements**: ENG-01, ENG-02, ENG-03
**Success Criteria** (what must be TRUE):
  1. System computes engagement levels via LLM (Highly Engaged / Moderate / At Risk / New / Inactive)
  2. Engagement scores include natural language explanations showing input signals
  3. Org admin can override engagement level with notes
  4. Override history is preserved for audit
**Plans**: TBD

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD

#### Phase 16: CRM Dashboard & Programs
**Goal**: Org admins have full CRM visibility with program tracking
**Depends on**: Phase 15
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, PRG-01, PRG-02, PRG-03
**Success Criteria** (what must be TRUE):
  1. Org admin can view filterable member directory
  2. Org admin can view member profiles (privacy-controlled)
  3. Org admin can see basic community stats (member count, career breakdown)
  4. Org admin can export member data as CSV
  5. Org admin can see per-member attendance records and engagement history
  6. Org admin can define org-specific programs (reading groups, fellowships, etc.)
  7. Org admin can track member participation in programs
  8. Attendance can be tracked granularly by program
**Plans**: TBD

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD
- [ ] 16-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13 → 14 → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-7 | v1.0 | 19/19 | Complete | 2025-12-27 |
| 8-10 | v1.1 | 8/8 | Complete | 2026-01-19 |
| 11. Org Discovery | v1.2 | 3/3 | Complete | 2026-01-19 |
| 12. Event Management | v1.2 | 3/3 | Complete | 2026-01-19 |
| 13. Event Notifications | v1.2 | 3/3 | Complete | 2026-01-19 |
| 14. Attendance Tracking | v1.2 | 3/3 | Complete | 2026-01-19 |
| 15. Engagement Scoring | v1.2 | 0/2 | Not started | - |
| 16. CRM Dashboard & Programs | v1.2 | 0/3 | Not started | - |
