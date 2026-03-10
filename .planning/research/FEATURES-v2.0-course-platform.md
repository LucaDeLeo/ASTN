# Feature Landscape: v2.0 Course Program Platform

**Domain:** Cohort-based educational platform with AI integration
**Researched:** 2026-03-10
**Existing infrastructure:** Program CRUD, modules, materials, sessions, RSVP, attendance, material progress, enrichment chat, `@convex-dev/agent` with tool-use, Convex real-time subscriptions

---

## Table Stakes

Features users (participants and facilitators) expect from any course platform. Missing = product feels incomplete compared to BlueDot's existing tracker.

| Feature                                                                    | Why Expected                                                                                                                                                                                   | Complexity | Dependencies                                                       | Notes                                                                                                                                                                           |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prompt/exercise creation (text + choice fields)**                        | BlueDot already has MC + freeform exercises. Parity requirement.                                                                                                                               | Low        | New `prompts` table                                                | One component serving exercises, polls, feedback. The unified primitive is the foundation everything else builds on.                                                            |
| **Prompt response collection**                                             | Every course platform collects answers. Without this, no interactivity at all.                                                                                                                 | Low        | `promptResponses` table, `prompts`                                 | Nearpod, Pear Deck, BlueDot, Mentimeter all do this. Must support save-and-resume (partial responses).                                                                          |
| **Facilitator visibility into responses**                                  | BlueDot's #1 failure -- submissions go into a void. Facilitators MUST see what participants wrote.                                                                                             | Low-Med    | Prompt responses + admin queries                                   | Pear Deck Teacher Dashboard, Mentimeter presenter view -- all show response aggregates. This is what makes the platform useful to facilitators.                                 |
| **Response reveal modes (immediate, facilitator-only, write-then-reveal)** | Pear Deck instructor-paced mode, Nearpod lock/reveal, Mentimeter hide-until-ready are all standard. The "write first, then see others" is a core pedagogical pattern (Think-Write-Pair-Share). | Med        | Visibility state on `promptResponses`, facilitator reveal mutation | `write_then_reveal` is the critical mode for in-session use. Without it, groupthink contaminates responses. Must be a per-prompt config, not global.                            |
| **Timer display during sessions**                                          | SessionLab Time Tracker, Mentimeter countdown, every workshop tool has timers. Participants and facilitators expect to see remaining time.                                                     | Low        | `sessionLiveState` table                                           | Both facilitator view (with controls) and participant view (read-only countdown). Convex real-time makes this trivial -- one field in `sessionLiveState` reacts to all clients. |
| **Phase sequencing (ordered list of activities)**                          | SessionLab's core model is ordered activity blocks with durations. Any session runner needs this. BAISH's Google Docs already structure sessions as sequential phases.                         | Med        | `phases` array on `programSessions`, `sessionLiveState`            | Keep it simple: ordered list, advance forward, optional skip. No branching/conditional phases (anti-feature).                                                                   |
| **Essential vs. optional material flags**                                  | BlueDot doesn't distinguish -- everything appears equally important. Busy participants need prioritization. Every serious LMS (Canvas, Moodle) has "required" markers.                         | Low        | Add `isEssential` boolean to material items                        | Minimal schema change. High UX value.                                                                                                                                           |
| **Continue-here marker**                                                   | Netflix-style "continue watching." Duolingo, Khan Academy, every content platform highlights where to resume.                                                                                  | Low        | Computed from `materialProgress` + `promptResponses`               | Pure frontend logic -- find first incomplete item in the module. No backend changes needed.                                                                                     |
| **Time-to-session indicator**                                              | "Session 3 is in 4 days -- 2h 15m of pre-work remaining" creates urgency. Standard in course platforms with deadlines.                                                                         | Low        | Computed from `programSessions.date` + remaining material time     | Frontend computation from existing data. No new tables.                                                                                                                         |

---

## Differentiators

Features that set the platform apart from BlueDot and general-purpose tools. Not expected, but create the "meaningfully better" experience.

### Tier 1: High-Impact Differentiators

| Feature                                         | Value Proposition                                                                                                                                                                                                                                                                                                                                                                                 | Complexity | Dependencies                                                                                                     | Notes                                                                                                                                                                                                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI sidebar (participant learning partner)**   | The single biggest experiential gap vs. BlueDot. No course platform in the AI safety space has a context-aware Socratic tutor that knows the curriculum, the participant's progress, and their responses. Khanmigo proved the model works (free since 2025). Socra.ai and SocratiQ demonstrate market validation. But none are embedded in a cohort course platform with full curriculum context. | High       | `sidebarConversations` table, Claude API integration, module context construction                                | Reuse existing `EnrichmentChat` UI pattern and `@convex-dev/agent` infrastructure. Key differentiator: the AI knows the specific module materials, not just general knowledge. System prompt must enforce Socratic behavior (no direct answers). Per-module conversation history. |
| **AI feedback on prompt submissions**           | When a participant submits an exercise, the AI proactively offers feedback in the sidebar. BlueDot: zero feedback. This transforms exercises from "write and forget" to "write and learn."                                                                                                                                                                                                        | Med        | AI sidebar + prompt submission hooks                                                                             | Triggered automatically on submission when `aiFeedback: true`. The AI sees: prompt text, participant's response, module materials. Feedback is conversational, not rubric-based.                                                                                                  |
| **Facilitator agent with tool-use**             | An AI copilot that can query all program data -- progress, responses, attendance, sidebar conversations -- and propose actions. No course platform does this. SessionLab has AI for session design, not for live facilitation intelligence.                                                                                                                                                       | High       | `agentProposals` + `facilitatorComments` tables, Claude tool-use with Convex query tools, propose-and-approve UI | Leverages existing `@convex-dev/agent` pattern (already used for career advisor). Read tools need no approval; write tools always propose first. The human-in-the-loop pattern is now well-established (LangGraph, Permit.io, Temporal all standardized it in 2025-2026).         |
| **Propose-and-approve workflow**                | The agent NEVER writes directly to participant-visible data. It drafts, facilitator approves. This builds trust and prevents AI errors from reaching participants.                                                                                                                                                                                                                                | Med        | `agentProposals` table, inline draft card UI                                                                     | Critical design decision. Draft cards appear contextually (proposed comment appears below the response it's about, not in a separate queue). Approve/edit/dismiss controls.                                                                                                       |
| **Complementary pairing from exercise choices** | Pair participants who chose different techniques/topics for richer peer teaching. BAISH's "Sharing is Caring" activity depends on this. No course platform automates pairing from exercise response data.                                                                                                                                                                                         | Med        | `promptResponses` data + pairing algorithm + `sessionLiveState.activePairs`                                      | Algorithm: read choice field from specified prompt, group by choice, pair across groups. Handle odd numbers (one trio). Handle absences (pair from present participants only).                                                                                                    |
| **Unified prompt as single primitive**          | One component for exercises, session activities, polls, feedback. Same data model, same rendering, same AI feedback. This eliminates the exercise/session split that plagues platforms that bolt on live features later.                                                                                                                                                                          | Med        | `prompts` table design with flexible field types                                                                 | The design doc already nails this. Key insight: the component renders identically whether it's pre-work or in-session. The only difference is `revealMode` and whether it's attached to a module or a session phase.                                                              |

### Tier 2: Notable Differentiators

| Feature                                  | Value Proposition                                                                                                                                                   | Complexity   | Dependencies                                                             | Notes                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Response spotlight/highlighting**      | Facilitator marks exceptional responses visible to the whole cohort. Creates positive incentive for thoughtful writing. Builds shared knowledge base.               | Low          | `highlighted` boolean on `promptResponses`                               | Simple mutation + UI treatment. High social value -- participants see their work recognized. No AI involvement needed.                                                |
| **Ad-hoc prompts during live sessions**  | Facilitator creates a new poll/question on the fly. Phase inserted into the running session, appears for all participants immediately.                              | Med          | Phase insertion into `sessionLiveState`, prompt creation UI (simplified) | Convex reactivity makes this elegant -- insert phase + prompt, all subscribed clients see it instantly. Keep the creation UI minimal (text + optional choice fields). |
| **Agent real-time session observations** | During a live session, the agent proactively surfaces insights: "6 of 8 responded. 3 mentioned Constitutional AI. Lucas wrote something worth discussing."          | High         | Facilitator agent + session response streaming + proactive trigger       | Hardest part: knowing WHEN to surface insights without being noisy. Trigger on: all responses in, or phase timer ending. Don't interrupt mid-phase.                   |
| **Facilitator-only notes per phase**     | Hidden notes visible only on the facilitator view. BAISH currently uses hidden sections in Google Docs.                                                             | Low          | `facilitatorNotes` field on phase objects                                | Already in the design doc. Markdown rendered, only in facilitator view.                                                                                               |
| **Audio material type**                  | Facilitators upload MP3s (pre-recorded overviews, discussions). Plays inline with other materials.                                                                  | Low          | Add "audio" to material type validator, Convex file storage upload       | No generation pipeline. Facilitator records externally, uploads. Simple audio player component.                                                                       |
| **Meta-pedagogical AI exercises**        | Exercises designed around the AI sidebar itself: "Ask the AI to summarize this paper. What did it get wrong?" In AI safety courses, the AI IS part of the learning. | Low (design) | AI sidebar must exist first                                              | Not a code feature -- it's an exercise design pattern. Document it as a facilitator guide. The platform enables it; facilitators create the prompts.                  |

---

## Anti-Features

Features to explicitly NOT build for v2.0.

| Anti-Feature                                                     | Why Avoid                                                                                                                                                   | What to Do Instead                                                                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Branching/conditional phase logic**                            | Adds massive complexity for a 10-person pilot. No facilitator wants to program if/else trees for activities.                                                | Linear phase sequencing with manual skip. Facilitator decides in the moment.                                    |
| **Automated grading/rubrics**                                    | Rubric-based grading contradicts the Socratic learning partner model. It turns the AI into a judge, not a tutor. Also scope-creeps into full LMS territory. | AI feedback is conversational ("Here's what I noticed..."), never a score or grade.                             |
| **Discussion threads on modules**                                | For 10 in-person participants who have WhatsApp, threaded discussions add noise without value. Build when scaling to remote/larger cohorts.                 | WhatsApp for async discussion. Session runner for sync discussion.                                              |
| **Push/email notifications**                                     | For the pilot, the facilitator (or agent) sends reminders via WhatsApp manually. Notification infrastructure is expensive for 10 users.                     | Manual reminders via WhatsApp. Agent can draft reminder text for facilitator.                                   |
| **Cross-cohort analytics**                                       | Requires multiple cohorts' data to be meaningful. Build after 3+ program runs.                                                                              | Per-cohort data is sufficient for the pilot.                                                                    |
| **Session template library**                                     | Over-engineering for one course. Session duplication is sufficient.                                                                                         | Copy session + customize prompts.                                                                               |
| **Advanced pairing (history-aware, skill-based, drag-and-drop)** | Complementary + random covers BAISH needs. History-aware pairing adds complexity for a 6-session course where everyone knows each other.                    | Three strategies: complementary (from exercise choices), random, manual (facilitator assigns).                  |
| **Auto-approve for agent actions**                               | Trust in the agent must be built through propose-and-approve first. Premature auto-approve risks AI errors reaching participants.                           | Propose-and-approve everything. Revisit auto-approve for low-risk actions (session notes) after pilot feedback. |
| **Peer review system**                                           | Adds complexity, requires careful UX to avoid negativity, and is unnecessary for 10-person cohorts where verbal feedback is more natural.                   | Group discussion and pair activities serve the peer learning function.                                          |
| **Video/screen sharing integration**                             | Building a video layer is enormous scope. BAISH meets in person. Remote cohorts can use external video tools.                                               | External video (Zoom/Meet) if needed. The platform handles everything else.                                     |
| **Gamification (points, badges, leaderboards)**                  | Extrinsic motivation conflicts with intrinsic learning goals in AI safety education. Can feel patronizing for graduate-level participants.                  | Spotlight/highlighting for social recognition. Completion tracking for personal motivation.                     |

---

## Feature Dependencies

```
Essential/Optional Materials --------+
Continue-Here Marker ----------------+ (independent, can ship anytime)
Time-to-Session Indicator -----------+
Audio Material Type -----------------+

Prompts Table (foundation)
  |
  +-- Prompt Response Collection
  |     |
  |     +-- Response Reveal Modes (write-then-reveal)
  |     |
  |     +-- Response Spotlight/Highlighting
  |     |
  |     +-- AI Feedback on Submissions ---- requires AI Sidebar
  |
  +-- Facilitator Visibility into Responses
  |     |
  |     +-- Facilitator Agent (reads responses) ---- requires Agent Infrastructure
  |           |
  |           +-- Propose-and-Approve Workflow
  |           |
  |           +-- Agent Real-Time Session Observations ---- requires Session Runner
  |
  +-- Session Phase with Prompt
        |
        +-- Phase Sequencing + Timer
        |     |
        |     +-- Session Live State (the real-time backbone)
        |
        +-- Complementary Pairing (reads prompt choices)
        |
        +-- Ad-Hoc Prompts (creates prompt + phase on the fly)

AI Sidebar (independent, uses prompt + module data)
  |
  +-- Facilitator can view sidebar conversations
        |
        +-- Agent can query sidebar conversations
```

---

## MVP Recommendation

**Prioritize in this order:**

1. **Unified Prompt System** -- text + choice fields, response collection, reveal modes, spotlight. This is the foundation primitive. Without it, nothing else works. Complexity: Medium. Value: unlocks all subsequent features.

2. **AI Sidebar (Participant Learning Partner)** -- Chat companion with module context, Socratic behavior, proactive feedback on submissions. This is the single biggest experiential differentiator from BlueDot. Reuses existing `EnrichmentChat` UI and `@convex-dev/agent` infrastructure. Complexity: High. Value: transforms platform from content tracker to learning environment.

3. **Facilitator Agent** -- AI copilot with read tools (query progress, responses, sidebar convos) and write tools (draft comments, messages, pairs) via propose-and-approve. Makes data from phases 1-2 actionable. Complexity: High. Value: eliminates facilitator blindness, the core BlueDot weakness.

4. **Session Runner** -- Phase sequencing, timers, write-then-reveal in action, pairing, real-time "who's connected." Uses the same prompts, same response UI, same agent. The new pieces are live state management and facilitator controls. Complexity: High. Value: replaces Google Docs for in-session activities.

5. **Module Enhancements** -- Essential/optional flags, audio type, time-to-session, continue-here. Small independent additions. Complexity: Low. Value: polish and participant UX.

**Defer:** Discussion threads, notifications, cross-cohort analytics, session templates, advanced pairing, auto-approve, peer review, video integration, gamification.

---

## Competitive Landscape Context

### What Exists Today

| Platform                | Exercises                       | AI Tutor                    | Facilitator AI                        | Live Sessions              | Pairing                         |
| ----------------------- | ------------------------------- | --------------------------- | ------------------------------------- | -------------------------- | ------------------------------- |
| **BlueDot Impact**      | MC + freeform, no feedback      | None                        | None                                  | Google Docs (disconnected) | Manual in Google Docs           |
| **Khanmigo**            | Integrated with Khan curriculum | Socratic tutor (GPT-4)      | Teacher tools (lesson planning)       | None (self-paced focus)    | None                            |
| **Disco.co**            | Assignments + quizzes           | AI course design copilot    | Automated workflows                   | Live video events          | Breakout rooms                  |
| **Mentimeter**          | Polls, quizzes, word clouds     | None                        | None                                  | Real-time polling + reveal | None                            |
| **SessionLab**          | None (planning tool)            | AI session design           | None                                  | Timer + phase tracking     | None                            |
| **Pear Deck / Nearpod** | MC, open-ended, drawing         | None                        | Teacher dashboard                     | Instructor-paced slides    | None                            |
| **Socra.ai**            | Structured knowledge artifacts  | Socratic dialogue tutor     | None                                  | None                       | None                            |
| **ASTN v2.0 (target)**  | Unified prompt (all types)      | Socratic + curriculum-aware | Agent with tool-use + propose-approve | Full session runner        | Complementary + random + manual |

### Where ASTN v2.0 Stands Out

No existing platform combines:

1. A unified prompt primitive that works identically for pre-work and live sessions
2. An AI learning partner embedded in the course platform with full curriculum context
3. A facilitator AI agent with tool-use access to all program data and a propose-and-approve workflow
4. A live session runner with real-time phase sequencing, write-then-reveal, and automated pairing

The closest competitor (Disco.co) has AI for course design/operations but not for participant learning or live facilitation intelligence. Khanmigo has the AI tutor but no cohort/session features. SessionLab has session planning but no participant-facing features. BlueDot has the curriculum structure but no AI and no session tooling.

The competitive advantage is integration -- everything in one system where data flows everywhere -- not any single feature in isolation.

---

## Complexity Assessment

| Feature Area          | Estimated Complexity | Risk Level  | Rationale                                                                                                                                                                                                                                                                                                               |
| --------------------- | -------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unified Prompt System | **Medium**           | Low         | Well-defined schema, straightforward CRUD, existing patterns for form fields. The "reveal" mechanism needs careful Convex subscription design but is fundamentally a visibility flag toggle.                                                                                                                            |
| AI Sidebar            | **High**             | Medium      | Chat UI exists (`EnrichmentChat`), agent infra exists (`@convex-dev/agent`). New work: module context construction, Socratic system prompt tuning, per-module conversation management. Risk: prompt quality determines value.                                                                                           |
| Facilitator Agent     | **High**             | Medium      | Agent infra exists. New work: tool definitions for all program queries, propose-and-approve UI pattern (draft cards), contextual placement of proposals. Risk: proposal placement UX is novel -- no reference implementation to copy.                                                                                   |
| Session Runner        | **High**             | Medium-High | Real-time state management is the hardest technical challenge. Convex presence patterns help, but coordinating phase transitions, timer sync, pairing, and response streaming across 10+ concurrent clients needs careful design. Risk: timer drift, race conditions on phase advance, absence handling during pairing. |
| Module Enhancements   | **Low**              | Low         | Schema additions, computed displays. No new patterns needed.                                                                                                                                                                                                                                                            |

---

## Sources

**HIGH confidence (official docs, Context7):**

- Convex real-time subscriptions: https://docs.convex.dev/realtime
- Convex presence component: https://www.convex.dev/components/presence
- Claude tool use implementation: https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use
- Anthropic advanced tool use: https://www.anthropic.com/engineering/advanced-tool-use

**MEDIUM confidence (verified across multiple sources):**

- Khanmigo architecture (GPT-4 + curriculum context + Socratic method): https://www.khanmigo.ai/learners
- SessionLab Time Tracker (auto/manual timer, co-facilitator sync): https://www.sessionlab.com/features/time-tracker/
- Human-in-the-loop propose-approve pattern standardization: https://www.permit.io/blog/human-in-the-loop-for-ai-agents-best-practices-frameworks-use-cases-and-demo
- Pear Deck instructor-paced mode with anonymous response projection: https://www.peardeck.com/
- Disco.co AI cohort features: https://www.disco.co/
- BlueDot Impact course platform and open curriculum: https://bluedot.org/courses

**LOW confidence (single source, needs validation):**

- Socra.ai structured knowledge artifacts from Socratic dialogue: https://hisocra.com/
- SocratiQ adaptive learning pathway framework: https://arxiv.org/html/2502.00341v1
