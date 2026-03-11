# Requirements: ASTN v2.0 Course Program Platform

**Defined:** 2026-03-10
**Core Value:** Build a course/program platform meaningfully better than BlueDot Impact -- one unified system with AI woven into every layer

## v1 Requirements

Requirements for v2.0 milestone. Each maps to roadmap phases.

### Unified Prompt System

- [ ] **PROMPT-01**: Facilitator can create prompts with markdown text and multiple fields (text, choice, multiple_choice)
- [ ] **PROMPT-02**: Facilitator can attach prompts to modules (pre-work) or session phases (in-session)
- [ ] **PROMPT-03**: Participant can respond to prompts with text inputs and choice selections
- [ ] **PROMPT-04**: Participant can save partial responses and resume later
- [ ] **PROMPT-05**: Facilitator can configure reveal mode per prompt (immediate, facilitator_only, write_then_reveal)
- [ ] **PROMPT-06**: Facilitator can trigger reveal on write_then_reveal prompts to show all responses
- [ ] **PROMPT-07**: Facilitator can view all participant responses for any prompt
- [ ] **PROMPT-08**: Facilitator can spotlight/highlight exceptional responses visible to entire cohort
- [ ] **PROMPT-09**: Same prompt component renders identically whether attached to a module or a session phase

### AI Sidebar (Participant Learning Partner)

- [x] **SIDE-01**: Participant can chat with an AI learning partner from the program page
- [x] **SIDE-02**: AI sidebar has context of current module materials, participant's progress, and their exercise responses
- [x] **SIDE-03**: AI uses Socratic method (pushback, not answers) when participants ask about exercises
- [x] **SIDE-04**: AI proactively offers feedback in sidebar when participant submits a prompt with aiFeedback enabled
- [x] **SIDE-05**: AI can recommend study priorities when participant asks ("I only have 30 minutes")
- [x] **SIDE-06**: Conversation history persists per-participant per-module
- [x] **SIDE-07**: Facilitator can view participant sidebar conversations from admin page
- [x] **SIDE-08**: Sidebar runs via @convex-dev/agent with ASTN API keys (no participant setup required)

### Facilitator Agent

- [ ] **AGENT-01**: Facilitator agent runs as local Bun process using Claude Agent SDK (same pattern as admin agent)
- [ ] **AGENT-02**: Facilitator connects via WebSocket bridge with token auth and Clerk JWT forwarding
- [ ] **AGENT-03**: Agent has read tools: query participant progress, responses, attendance, sidebar conversations, profiles
- [ ] **AGENT-04**: Agent has write tools using confirmable pattern: draft comments on responses, draft messages to participants, suggest pair assignments
- [ ] **AGENT-05**: Agent proposals appear as contextual draft cards (proposed comment below the response it's about)
- [ ] **AGENT-06**: Facilitator can approve, edit+approve, or dismiss each proposal
- [ ] **AGENT-07**: Agent can synthesize exercise responses and surface patterns/misconceptions for session prep
- [ ] **AGENT-08**: Agent provides real-time observations during live sessions (response counts, recurring themes, discussion-worthy responses)
- [ ] **AGENT-09**: Chat history persists per-facilitator per-program in Convex

### Session Runner

- [ ] **SESS-01**: Facilitator can define session as ordered list of phases (title, duration, optional facilitator notes, optional prompt, optional pair config)
- [ ] **SESS-02**: Facilitator can start a live session, advancing through phases sequentially
- [ ] **SESS-03**: Timer displays remaining time for current phase on both facilitator and participant views
- [ ] **SESS-04**: Facilitator can extend timer, skip phase, or advance to next phase
- [ ] **SESS-05**: Participants see current phase title, timer, and prompt (if phase has one) in real-time
- [ ] **SESS-06**: Facilitator can see who's submitted, who's typing, who hasn't started during a prompt phase
- [ ] **SESS-07**: Pairing system supports complementary (from exercise choices), random, and manual strategies
- [ ] **SESS-08**: Pairing handles odd numbers (creates trio) and absences (pairs from present participants)
- [ ] **SESS-09**: Facilitator can create ad-hoc prompts during a live session (new phase appears for all participants)
- [ ] **SESS-10**: Session data is preserved: responses per phase, pair assignments, actual durations, attendance (auto-marked from participation)

### Module Enhancements

- [ ] **MOD-01**: Facilitator can mark materials as essential or optional, with visual distinction
- [ ] **MOD-02**: Facilitator can upload audio materials (MP3) via Convex file storage with inline playback
- [ ] **MOD-03**: Participant sees time-to-session indicator ("Session 3 in 4 days -- 2h 15m pre-work remaining")
- [ ] **MOD-04**: Participant sees continue-here marker highlighting first incomplete material/exercise

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Async Collaboration

- **COLLAB-01**: Module-level discussion threads for async peer interaction
- **COLLAB-02**: Push/email notifications for session reminders and exercise deadlines

### Analytics & Scaling

- **SCALE-01**: Cross-cohort analytics comparing understanding across program runs
- **SCALE-02**: Session template library shareable across organizations

### Advanced Features

- **ADV-01**: History-aware pairing (avoid repeat pairings across sessions)
- **ADV-02**: Auto-approve for low-risk agent actions (session notes, pattern flags)
- **ADV-03**: Peer review system for exercise responses

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                                     | Reason                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Branching/conditional phase logic           | Massive complexity for 10-person pilot; facilitator decides in the moment |
| Automated grading/rubrics                   | Contradicts Socratic model; turns AI into judge not tutor                 |
| Video/screen sharing integration            | Enormous scope; BAISH meets in person                                     |
| Gamification (points, badges, leaderboards) | Extrinsic motivation conflicts with intrinsic learning goals in AI safety |
| Discussion threads                          | 10 in-person participants have WhatsApp; build for remote/larger cohorts  |
| Push/email notifications                    | Manual WhatsApp reminders sufficient for pilot                            |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| PROMPT-01   | Phase 37 | Pending |
| PROMPT-02   | Phase 37 | Pending |
| PROMPT-03   | Phase 37 | Pending |
| PROMPT-04   | Phase 37 | Pending |
| PROMPT-05   | Phase 37 | Pending |
| PROMPT-06   | Phase 37 | Pending |
| PROMPT-07   | Phase 37 | Pending |
| PROMPT-08   | Phase 37 | Pending |
| PROMPT-09   | Phase 37 | Pending |
| SIDE-01     | Phase 38 | Done    |
| SIDE-02     | Phase 38 | Done    |
| SIDE-03     | Phase 38 | Done    |
| SIDE-04     | Phase 38 | Done    |
| SIDE-05     | Phase 38 | Done    |
| SIDE-06     | Phase 38 | Done    |
| SIDE-07     | Phase 38 | Done    |
| SIDE-08     | Phase 38 | Done    |
| AGENT-01    | Phase 39 | Pending |
| AGENT-02    | Phase 39 | Pending |
| AGENT-03    | Phase 39 | Pending |
| AGENT-04    | Phase 39 | Pending |
| AGENT-05    | Phase 39 | Pending |
| AGENT-06    | Phase 39 | Pending |
| AGENT-07    | Phase 39 | Pending |
| AGENT-08    | Phase 39 | Pending |
| AGENT-09    | Phase 39 | Pending |
| SESS-01     | Phase 40 | Pending |
| SESS-02     | Phase 40 | Pending |
| SESS-03     | Phase 40 | Pending |
| SESS-04     | Phase 40 | Pending |
| SESS-05     | Phase 40 | Pending |
| SESS-06     | Phase 40 | Pending |
| SESS-07     | Phase 40 | Pending |
| SESS-08     | Phase 40 | Pending |
| SESS-09     | Phase 40 | Pending |
| SESS-10     | Phase 40 | Pending |
| MOD-01      | Phase 41 | Pending |
| MOD-02      | Phase 41 | Pending |
| MOD-03      | Phase 41 | Pending |
| MOD-04      | Phase 41 | Pending |

**Coverage:**

- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---

_Requirements defined: 2026-03-10_
_Last updated: 2026-03-10 -- All 40 requirements mapped to phases 37-41_
