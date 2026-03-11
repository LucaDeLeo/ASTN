# Roadmap: ASTN

## Milestones

- ✅ **v1.0 MVP** — Phases 1-6 (shipped 2026-01-18)
- ✅ **v1.1 Profile Input Speedup** — Phases 7-10 (shipped 2026-01-19)
- ✅ **v1.2 Org CRM & Events** — Phases 11-16 (shipped 2026-01-19)
- ✅ **v1.3 Visual Overhaul** — Phases 17-20 (shipped 2026-01-20)
- ⏸️ **v2.0 Mobile + Tauri** — Phases 21-23, 26 complete; Phase 25 deferred
- ✅ **v1.4 Hardening** — Phases 27-29 (shipped 2026-02-02) — [details](milestones/v1.4-ROADMAP.md)
- ✅ **v1.5 Org Onboarding & Co-working** — Phases 30-34 (shipped 2026-02-03) — [details](milestones/v1.5-ROADMAP.md)
- ✅ **v1.6 Career Actions** — Phases 35-36 (shipped 2026-02-11) — [details](milestones/v1.6-ROADMAP.md)
- 🚧 **v2.0 Course Program Platform** — Phases 37-41 (in progress)

## Phases

**Phase Numbering:**

- Integer phases (37, 38, 39...): Planned milestone work
- Decimal phases (37.1, 37.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 37: Unified Prompt System** - One interactive primitive for exercises, activities, polls, and feedback across modules and sessions
- [ ] **Phase 38: AI Sidebar** - Participant learning partner with Socratic feedback, module context, and proactive AI responses
- [ ] **Phase 39: Facilitator Agent** - AI copilot with program data access and propose-and-approve workflow via local Bun process
- [ ] **Phase 40: Session Runner** - Live session management with phases, timers, pairing, and real-time participant views
- [ ] **Phase 41: Module Enhancements** - Essential/optional flags, audio materials, time-to-session, and continue-here markers

## Phase Details

### Phase 37: Unified Prompt System

**Goal**: Facilitators can create interactive prompts and participants can respond to them, with visibility controls and facilitator oversight -- establishing the foundation primitive that all other v2.0 features build on
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04, PROMPT-05, PROMPT-06, PROMPT-07, PROMPT-08, PROMPT-09
**Success Criteria** (what must be TRUE):

1. Facilitator can create a prompt with markdown body and multiple field types (text, choice, multiple_choice), attach it to a module or session phase, and see it render identically in both contexts
2. Participant can respond to a prompt with text and selections, save a partial response, navigate away, return later and resume where they left off
3. When a prompt is set to write_then_reveal, participants see only their own response until the facilitator triggers reveal -- at which point all responses become visible simultaneously
4. Facilitator can view all participant responses for any prompt and spotlight exceptional responses visible to the entire cohort
5. The prompt component is a single reusable primitive (one table, one component) that renders the same whether attached to a module or a session phase

**Plans:** 4 plans

Plans:

- [x] 37-01-PLAN.md -- Schema + backend: coursePrompts/coursePromptResponses tables, CRUD mutations, response save/visibility queries, reveal/spotlight
- [x] 37-02-PLAN.md -- Participant prompt UI: PromptRenderer, field subcomponents (text/choice/multi-choice), markdown body, draft save/submit flow
- [x] 37-03-PLAN.md -- Facilitator UI: prompt creation form with dynamic field builder, response viewer, reveal trigger, spotlight toggle
- [x] 37-04-PLAN.md -- Integration: wire into program page and admin page, end-to-end verification checkpoint

### Phase 38: AI Sidebar

**Goal**: Participants have an always-available AI learning partner that knows their module context, uses Socratic method, and proactively offers feedback on submissions
**Depends on**: Phase 37 (sidebar needs prompt response data for context)
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04, SIDE-05, SIDE-06, SIDE-07, SIDE-08
**Success Criteria** (what must be TRUE):

1. Participant can open the AI sidebar from the program page and have a conversation that demonstrates awareness of current module materials, their progress, and their exercise responses
2. When participant asks a question about an exercise, the AI responds with Socratic pushback (guiding questions, not direct answers) and when they submit a prompt with aiFeedback enabled, the AI proactively offers feedback in the sidebar without being asked
3. Participant can ask for study prioritization ("I only have 30 minutes") and receive a tailored recommendation based on their remaining materials and deadlines
4. Conversation history persists per-participant per-module across sessions, and facilitator can view any participant's sidebar conversations from the admin page
5. Sidebar runs via @convex-dev/agent with ASTN API keys -- participants never need to configure anything

**Plans**: TBD

### Phase 39: Facilitator Agent

**Goal**: Facilitator has an AI copilot that can read all program data (responses, conversations, attendance) and propose actions through a propose-and-approve workflow
**Depends on**: Phase 38 (agent needs sidebar conversation data and prompt response data to be meaningful)
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-07, AGENT-08, AGENT-09
**Success Criteria** (what must be TRUE):

1. Facilitator agent runs as a local Bun process using Claude Agent SDK and connects to Convex via WebSocket bridge with token auth and Clerk JWT forwarding (same architecture as existing admin agent)
2. Agent can query participant progress, responses, attendance, sidebar conversations, and profiles using read tools, and can synthesize exercise responses to surface patterns and misconceptions for session prep
3. Agent proposals (draft comments, draft messages, suggested pair assignments) appear as contextual draft cards positioned near the content they reference, and the facilitator can approve, edit+approve, or dismiss each one individually
4. Agent provides real-time observations during live sessions including response counts, recurring themes, and discussion-worthy responses
5. Chat history persists per-facilitator per-program in Convex

**Plans**: TBD

### Phase 40: Session Runner

**Goal**: Facilitator can run live sessions with ordered phases, timers, prompts, and pairing -- and participants see everything in real-time
**Depends on**: Phase 39 (session runner uses prompts from Phase 37, sidebar from Phase 38, and agent observations from Phase 39)
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06, SESS-07, SESS-08, SESS-09, SESS-10
**Success Criteria** (what must be TRUE):

1. Facilitator can define a session as an ordered list of phases (title, duration, optional notes, optional prompt, optional pair config), start the session live, and advance through phases sequentially with extend/skip/advance controls
2. Participants see the current phase title, a countdown timer, and the active prompt (if any) updating in real-time as the facilitator advances phases
3. During a prompt phase, the facilitator can see who has submitted, who is typing, and who has not started -- and can create ad-hoc prompts during a live session that appear for all participants immediately
4. Pairing system supports complementary (derived from exercise choices), random, and manual strategies, handles odd numbers by creating a trio, and handles absences by pairing only from present participants
5. All session data is preserved after completion: responses per phase, pair assignments, actual durations, and attendance auto-marked from participation

**Plans**: TBD

### Phase 41: Module Enhancements

**Goal**: Participants get better orientation within modules through essential/optional flags, audio materials, time awareness, and progress markers
**Depends on**: Nothing (independent of Phases 37-40, can execute in parallel or after)
**Requirements**: MOD-01, MOD-02, MOD-03, MOD-04
**Success Criteria** (what must be TRUE):

1. Materials are visually distinguished as essential or optional, and participants can immediately tell which content is required vs. supplementary
2. Facilitator can upload MP3 audio materials via Convex file storage, and participants can play them inline alongside other materials
3. Participant sees a time-to-session indicator showing days until next session and estimated pre-work remaining, plus a continue-here marker highlighting the first incomplete material or exercise

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 37 -> 38 -> 39 -> 40 -> 41
(Phase 41 is independent and can execute in parallel with any phase if needed)

| Phase                           | Milestone            | Plans Complete | Status      | Completed  |
| ------------------------------- | -------------------- | -------------- | ----------- | ---------- |
| 1-6. Foundation -> Polish       | v1.0                 | 21/21          | Complete    | 2026-01-18 |
| 7-10. Upload -> Wizard          | v1.1                 | 13/13          | Complete    | 2026-01-19 |
| 11-16. Discovery -> CRM         | v1.2                 | 20/20          | Complete    | 2026-01-19 |
| 17-20. Tokens -> Integration    | v1.3                 | 13/13          | Complete    | 2026-01-20 |
| 21-23, 26. Responsive -> UX     | v2.0 Mobile          | 16/16          | Complete    | --         |
| 27-29. Security -> Performance  | v1.4                 | 9/9            | Complete    | 2026-02-02 |
| 30-34. Onboarding -> Admin      | v1.5                 | 17/17          | Complete    | 2026-02-03 |
| 35-36. Generation -> Completion | v1.6                 | 5/5            | Complete    | 2026-02-11 |
| 37. Unified Prompt System       | v2.0 Course Platform | 4/4            | Complete    | 2026-03-10 |
| 38. AI Sidebar                  | v2.0 Course Platform | 0/?            | Not started | -          |
| 39. Facilitator Agent           | v2.0 Course Platform | 0/?            | Not started | -          |
| 40. Session Runner              | v2.0 Course Platform | 0/?            | Not started | -          |
| 41. Module Enhancements         | v2.0 Course Platform | 0/?            | Not started | -          |

**Total: 37 phases complete (118 plans), 4 phases planned for v2.0 Course Platform**

---

_Roadmap created: 2026-01-20_
_Last updated: 2026-03-10 -- v2.0 Course Program Platform roadmap created_
