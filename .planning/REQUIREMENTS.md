# Requirements: v1.2 Org CRM & Events

**Goal:** Transform ASTN into a self-maintaining CRM for field-building orgs — members discover local hubs, attend events, and orgs get a live view of their community without chasing people to update spreadsheets.

**Milestone:** v1.2
**Created:** 2026-01-19
**Status:** Active

---

## v1 Requirements

### Org Discovery

- [ ] **ORG-01**: User can see geography-based org suggestions on their dashboard
- [ ] **ORG-02**: User can browse/search org directory with location filter
- [ ] **ORG-03**: User can join an org via shareable invite link

### Event Management

- [ ] **EVT-01**: Org admin can create events (title, description, date/time, location, capacity)
- [ ] **EVT-02**: Org has an event listing page showing upcoming and past events
- [ ] **EVT-03**: User can see events from their orgs on their dashboard
- [ ] **EVT-04**: User can RSVP to events (Going / Not Going)
- [ ] **EVT-05**: User can configure event notification frequency (all / digest / none)
- [ ] **EVT-06**: User can filter notifications by event type
- [ ] **EVT-07**: User can set reminder preferences (1 day before, 1 hour before, none)

### Attendance Tracking

- [ ] **ATT-01**: User receives post-event "Did you attend?" notification (within 2-4 hours)
- [ ] **ATT-02**: User can confirm attendance with one tap
- [ ] **ATT-03**: User can view their attendance history on their profile
- [ ] **ATT-04**: User can optionally provide feedback after attending (star rating + text)
- [ ] **ATT-05**: User can dismiss or defer attendance prompts

### Org CRM Dashboard

- [ ] **CRM-01**: Org admin can view filterable member directory
- [ ] **CRM-02**: Org admin can view member profiles (privacy-controlled)
- [ ] **CRM-03**: Org admin can see basic community stats (member count, career breakdown)
- [ ] **CRM-04**: Org admin can export member data as CSV
- [ ] **CRM-05**: Org admin can see per-member attendance records
- [ ] **CRM-06**: Org admin can see engagement history per member

### Engagement Scoring

- [ ] **ENG-01**: System computes engagement levels via LLM (Highly Engaged / Moderate / At Risk / New / Inactive)
- [ ] **ENG-02**: Org admin can override engagement level with notes
- [ ] **ENG-03**: Engagement scores include natural language explanations

### Custom Programs

- [ ] **PRG-01**: Org admin can define org-specific programs (reading groups, fellowships, etc.)
- [ ] **PRG-02**: Org admin can track member participation in programs
- [ ] **PRG-03**: Granular attendance tracking by program

---

## v2 Requirements (Deferred)

- [ ] Travel reminders when near a hub (requires mobile app / location access)
- [ ] "Wants to meet" networking feature (member-set tags for connecting)
- [ ] Recurring event automation (auto-create weekly reading groups)
- [ ] Multi-level role hierarchies (chapter admins, regional leads)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat/messaging | Creates spam burden, requires moderation, distracts from core value |
| Full event ticketing/payments | Luma/Eventbrite do this well; most AI safety events are free |
| Complex event check-in (QR, NFC) | Over-engineered for community events |
| Public member directory | Privacy concerns; use per-org visibility instead |
| Gamification (streaks, badges) | Feels manipulative in mission-driven context |
| Member-visible engagement scores | Creates anxiety; keep admin-only |
| Automated re-engagement campaigns | Spammy; orgs should engage personally |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| ORG-01 | TBD | Pending |
| ORG-02 | TBD | Pending |
| ORG-03 | TBD | Pending |
| EVT-01 | TBD | Pending |
| EVT-02 | TBD | Pending |
| EVT-03 | TBD | Pending |
| EVT-04 | TBD | Pending |
| EVT-05 | TBD | Pending |
| EVT-06 | TBD | Pending |
| EVT-07 | TBD | Pending |
| ATT-01 | TBD | Pending |
| ATT-02 | TBD | Pending |
| ATT-03 | TBD | Pending |
| ATT-04 | TBD | Pending |
| ATT-05 | TBD | Pending |
| CRM-01 | TBD | Pending |
| CRM-02 | TBD | Pending |
| CRM-03 | TBD | Pending |
| CRM-04 | TBD | Pending |
| CRM-05 | TBD | Pending |
| CRM-06 | TBD | Pending |
| ENG-01 | TBD | Pending |
| ENG-02 | TBD | Pending |
| ENG-03 | TBD | Pending |
| PRG-01 | TBD | Pending |
| PRG-02 | TBD | Pending |
| PRG-03 | TBD | Pending |

---

*23 requirements | 6 categories | v1.2 Org CRM & Events*
