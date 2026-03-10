# Project Research Summary

**Project:** ASTN v2.0 — Course Program Platform
**Domain:** Cohort-based educational platform with embedded AI, live session runner, and facilitator intelligence tools
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

ASTN v2.0 transforms the existing talent network platform into a full course program environment. The core design insight is a **unified prompt primitive** — one data model and one component that handles pre-work exercises, in-session activities, polls, and feedback identically. Everything else in the feature set (AI learning partner, facilitator agent, session runner) consumes and builds on top of this primitive. The existing ASTN codebase already has all the infrastructure needed: `@convex-dev/agent` for AI tool-use, `@convex-dev/persistent-text-streaming` for chat, Convex reactive subscriptions for real-time state, and file storage for media. Only one new dependency is required (`@convex-dev/presence` for session participant tracking).

The recommended build order follows a strict dependency chain. Phase 1 establishes the prompt system (the foundation). Phase 2 adds the AI learning partner sidebar (the biggest experiential differentiator from BlueDot). Phase 3 adds the facilitator agent (makes Phase 1+2 data actionable). Phase 4 adds the session runner (reuses all prior components in a live context). Module enhancements (audio, essential flags, continue-here) are independent and can slot in at any point. This order is not arbitrary — each phase provides the data and infrastructure the next phase depends on.

The key risks are data model decisions that cannot be changed without migration once a course is running. Three are critical: (1) sidebar conversation messages must use a separate table, not an embedded array, to avoid the 1 MiB Convex document limit; (2) write-then-reveal visibility state must live on the prompt itself, not on individual responses, to avoid a TOCTOU race condition; (3) the facilitator agent must use `@convex-dev/agent` inside Convex infrastructure, not extend the existing external Bun process. All three are straightforward to implement correctly — the risk is only if shortcuts are taken.

## Key Findings

### Recommended Stack

The existing stack covers every v2.0 capability without package upgrades. The codebase already ships two AI chat sidebar implementations (`AgentChat`, `AdminAgentChat`), a streaming enrichment chat, file upload and storage infrastructure, markdown rendering, a profile agent with tool-use and propose-and-approve, and resizable panel layouts. v2.0 is predominantly new Convex tables, new Convex functions, and new React components built on these existing primitives — not a technology problem.

One new dependency is required for presence tracking during live sessions. All custom UI components (audio player, session timer, pairing algorithm) are 30-50 lines of plain React/TypeScript each and should not be replaced with third-party libraries.

**Core technologies:**

- `@convex-dev/agent` (0.6.0-alpha.1, already installed): Two new Agent instances — `learningPartnerAgent` (read-only tools) and `facilitatorAgent` (read + propose tools). Same pattern as existing `profileAgent`.
- `@convex-dev/persistent-text-streaming` (0.3.0, already installed): Participant AI sidebar streaming. Same `startChat` mutation + HTTP action + `useStream` hook pattern as enrichment chat.
- `convex` (1.32.0, already installed): 6 new tables, 2 table modifications, ~20 new functions. Reactive subscriptions drive all real-time session state.
- `@convex-dev/presence` (^0.3.0, **NEW — install with `bun add @convex-dev/presence`**): Heartbeat-based connected-user tracking for live sessions. Required for absence-aware pairing and the facilitator's "who's connected" display.
- Claude Sonnet 4.6 via `@ai-sdk/anthropic` (already installed): Used for both AI agents. Estimated ~$1-3 total per weekly session for a 10-person cohort.

See `/Users/luca/dev/ASTN/.planning/research/STACK-v2.0-course-program.md` for full dependency table, implementation sketches, and model cost analysis.

### Expected Features

**Must have (table stakes):**

- Prompt/exercise creation (text + choice fields) — the foundation primitive everything else builds on
- Prompt response collection with save-and-resume — without this there is no interactivity
- Facilitator visibility into all responses — addresses BlueDot's core failure (submissions going into a void)
- Write-then-reveal mode — prevents groupthink in exercises; pedagogically critical
- Phase sequencing with timer display — any session runner needs ordered activities with timing
- Essential vs. optional material flags — trivial schema change, high UX value for busy participants
- Continue-here marker — pure frontend computation from existing `materialProgress` data

**Should have (differentiators):**

- AI sidebar (participant learning partner) — biggest experiential gap vs. BlueDot; context-aware Socratic tutor embedded in the course platform with full curriculum context
- AI feedback on prompt submissions — transforms "write and forget" to "write and learn"; triggered automatically on submission
- Facilitator agent with tool-use + propose-and-approve — synthesizes all program data; no course platform does this
- Complementary pairing from exercise choices — automates BAISH "Sharing is Caring" pattern from exercise response data
- Response spotlight/highlighting — social recognition; simple mutation with high social value
- Ad-hoc prompts during live sessions — facilitator creates polls on the fly; Convex reactivity makes this elegant
- Audio material type — MP3 uploads inline with other materials; extends existing file storage

**Defer to v2+:**

- Discussion threads on modules (WhatsApp covers this for 10-person in-person cohort)
- Push/email notifications (manual WhatsApp reminders sufficient for pilot)
- Cross-cohort analytics (needs 3+ program runs to be meaningful)
- Advanced history-aware pairing, peer review, gamification, video integration, session template library
- Auto-approve for agent actions (must build trust through propose-and-approve first)

See `/Users/luca/dev/ASTN/.planning/research/FEATURES-v2.0-course-platform.md` for full feature landscape, competitive analysis table, and dependency graph.

### Architecture Approach

All new features integrate through Convex's reactive subscription model. The architecture has three actor-permission tiers: participants write their own responses and sidebar messages; facilitators read everything and write directly; the facilitator agent reads the same data as facilitators and writes only to `agentProposals` (never directly to participant-visible tables). Context parity between the facilitator UI and the agent is enforced by sharing the same `internalQuery` functions for both views.

**Major components:**

1. `convex/coursePrompts.ts` — Unified prompt CRUD, response submission, reveal, highlight; foundation all other components read from
2. `convex/courseSidebar.ts` + `streaming.ts` — Participant AI sidebar; mirrors enrichment chat pattern with module-scoped context and Socratic system prompt
3. `convex/facilitatorAgent/` — Agent with ~10 read/write tools; mirrors profile agent structure; write tools always create `agentProposals`
4. `convex/sessionRunner.ts` — Live session lifecycle (start, advance phase, reveal, extend timer, pairs, complete); all state in `sessionLiveState` table
5. Frontend components (`PromptCard`, `AISidebar`, `FacilitatorAgent`, `ProposalCard`, `SessionRunner`, `SessionParticipant`) — each has a direct existing pattern to follow

**Key patterns:**

- Prompt as universal primitive (one table, not separate tables per interaction type)
- Visibility as server-controlled state (query filters by role; never client-side filtering)
- Timer as derived state (client computes countdown from server-stored `phaseStartedAt` timestamp)
- Agent always proposes via `agentProposals`, never writes directly to participant-visible data

See `/Users/luca/dev/ASTN/.planning/research/ARCHITECTURE-v2.0-course-platform.md` for full schema specification, component boundaries, data flow diagrams, and anti-patterns.

### Critical Pitfalls

1. **sidebarConversations messages array hits Convex 1 MiB document limit** — Use a separate `sidebarMessages` table (one document per message), not an embedded `messages: v.array(...)` field. Must be decided at table creation time in Phase 2; not retrofittable without migration.

2. **Write-then-reveal TOCTOU race condition** — A participant who submits after the facilitator triggers reveal will have a `private` response that never gets revealed. Fix: store `revealedAt` on the prompt itself, not on responses; query checks prompt reveal state. Must be implemented correctly in Phase 1.

3. **Timer drift between server and client clocks** — `Date.now()` can differ by seconds between Convex server and participant browsers. Fix: compute a `serverTimeOffset` on connection and apply it to all timer displays. Must be built into Phase 4 timer from the start.

4. **Facilitator agent proposals go stale during live sessions** — Proposals accumulate faster than a live facilitator can review them. Fix: auto-dismiss proposals on `advancePhase`; use ephemeral display (agent chat stream) for time-sensitive suggestions (pairs, observations). Design in Phase 3, enforce in Phase 4.

5. **Concurrent AI streams exhaust Convex action concurrency** — 10+ simultaneous sidebar requests during a live session. Fix: rate-limit per session via `@convex-dev/rate-limiter`; make submission feedback async via `ctx.scheduler.runAfter`; prioritize facilitator agent queue. Address in Phase 2, load-test in Phase 4.

**Integration-specific pitfalls:**

- Missing `requireProgramParticipant` auth helper — create in `convex/lib/auth.ts` before any participant-facing endpoint
- `convex/programs.ts` is already 1000+ lines — new features must go in `convex/course/` directory
- Facilitator agent must use `@convex-dev/agent` component, not extend the external Bun process
- New HTTP streaming endpoints need CORS headers — extract into shared `convex/lib/cors.ts`

See `/Users/luca/dev/ASTN/.planning/research/PITFALLS-v2.0-course-platform.md` for all 15 pitfalls with detection tests and phase-specific warnings table.

## Implications for Roadmap

Based on the dependency graph and pitfall analysis, the build order is unambiguous.

### Phase 1: Unified Prompt System

**Rationale:** The foundation everything else depends on. AI sidebar gives feedback on prompt responses. Facilitator agent queries prompt responses. Session runner uses prompts as phase activities. None can be built without this.

**Delivers:** `prompts` + `promptResponses` tables; `PromptCard` component; write-then-reveal mechanism; facilitator response view; response spotlight; module integration for pre-work exercises. A complete interactive exercise system before any AI is added.

**Addresses:** Prompt creation, response collection, facilitator visibility, write-then-reveal, response spotlight, essential/optional material flags, continue-here marker.

**Avoids:** Write-then-reveal TOCTOU race (store `revealedAt` on prompt), response type safety (typed validator, not `v.any()`), highlight-before-reveal leak (gate highlight display on prompt reveal state).

**Research flag:** No research needed. Well-defined schema, clear CRUD patterns, existing form patterns in codebase.

### Phase 2: AI Sidebar (Participant Learning Partner)

**Rationale:** The biggest experiential differentiator from BlueDot. Transforms platform from content tracker to learning environment. Needs Phase 1 because the sidebar context includes the participant's prompt responses for the module.

**Delivers:** `sidebarMessages` table (separate, not embedded array); `courseSidebar.ts` + streaming endpoint; `AISidebar.tsx` with Socratic system prompt; proactive AI feedback triggered on prompt submission; Spanish language directive; rate limiting for concurrent sessions.

**Addresses:** AI sidebar differentiator, AI feedback on submissions.

**Uses:** `@convex-dev/persistent-text-streaming` (mirrors enrichment chat pattern), `@convex-dev/rate-limiter` with new session-scoped keys, Claude Sonnet 4.6.

**Avoids:** sidebarMessages 1 MiB limit (separate table), context token overflow (cap at ~8K tokens, 10-message sliding window), concurrent stream saturation (rate limit), Spanish language drift (explicit directive in every system prompt).

**Research flag:** No research needed. Enrichment chat (`convex/enrichment/streaming.ts`) is the direct reference implementation. New work is context construction and system prompt quality — implementation tasks.

### Phase 3: Facilitator Agent

**Rationale:** Phases 1 and 2 generate rich data (exercise responses, sidebar conversations). Phase 3 makes that data actionable. Agent synthesizes responses, surfaces patterns, drafts comments. Needs Phase 1+2 data to have something meaningful to query.

**Delivers:** `agentProposals` + `facilitatorComments` tables; `convex/facilitatorAgent/` with agent, tools, actions; `FacilitatorAgent.tsx` sidebar; `ProposalCard.tsx` approve/edit/dismiss UI; propose-and-approve workflow operational.

**Addresses:** Facilitator agent differentiator, propose-and-approve, agent real-time session observations (partial; full live observations complete in Phase 4).

**Uses:** `@convex-dev/agent` component inside Convex (not external Bun process), shared `internalQuery` functions for context parity with facilitator UI.

**Avoids:** External Bun process scaling failure (use Convex-native agent), proposal staleness (add `phaseIndex` to proposals, design ephemeral display for time-sensitive suggestions), prompt injection via participant responses (XML delimiters + content sanitization in tool handlers).

**Research flag:** Needs design decision before implementation — contextual proposal card UX (how proposals appear inline next to the responses they reference) has no reference in the codebase. One design spike needed during planning.

### Phase 4: Session Runner

**Rationale:** Sessions reuse the same prompts, responses, and agent. The new work is live state management and facilitator controls. Depends on all prior phases: Phase 1 (prompts), Phase 2 (participants use sidebar during sessions), Phase 3 (agent provides live observations).

**Delivers:** `sessionLiveState` table; `phases` array on `programSessions` (optional field, backward-compatible); `convex/sessionRunner.ts`; `SessionRunner.tsx` facilitator controls; `SessionParticipant.tsx` participant live view; `PhaseEditor.tsx`; pairing algorithm (complementary + random + manual); presence integration; server-authoritative timer.

**Addresses:** Phase sequencing, timer, real-time session state, complementary pairing, ad-hoc prompts (as overlay, not new phase), facilitator notes per phase, full agent live session observations.

**Uses:** `@convex-dev/presence` (new install), Convex reactive subscriptions.

**Avoids:** Timer drift (server-time offset in timer hook), schema conflicts with existing sessions (optional fields + `sessionMode` flag), pairing failures with absences (use presence data, trio fallback), subscription avalanche (aggregate server-side into combined queries), ad-hoc prompt index conflicts (overlay mechanism).

**Research flag:** Needs attention during planning — subscription query architecture for the live session view. The facilitator view can accumulate 30+ subscriptions across responses, proposals, presence, and agent. Aggregating these server-side requires deliberate query design against this schema. Convex patterns exist but need application.

### Module Enhancements (Independent)

**Rationale:** Small, orthogonal additions to existing module rendering. No dependencies on Phases 1-4. Can be built at any point — recommended as polish after Phase 4 or in parallel during any phase.

**Delivers:** `isEssential` + `audio` material type + `storageId` on material items; audio player component (custom, ~40 lines); time-to-session indicator (computed); continue-here marker (computed from existing `materialProgress`).

**Addresses:** Essential/optional flags, audio material type, time-to-session indicator, continue-here marker.

**Research flag:** No research needed.

### Phase Ordering Rationale

- Phases 1-4 follow a strict dependency graph — Phase N consumes data and infrastructure from Phase N-1. This is not a choice but a technical constraint.
- The AI features (Phases 2 and 3) are ordered participant-first, facilitator-second. This means the platform is useful to participants before it is useful to facilitators as an intelligence tool — which builds the participant data the agent then has something to analyze.
- Phase 4 (session runner) last is correct because it is the most technically complex (real-time state, presence, concurrent client sync) and reuses everything prior.
- Module enhancements are orthogonal and can be scheduled anywhere; bundling as polish phase is pragmatic.

### Research Flags

Phases needing design spikes during planning:

- **Phase 3:** Contextual proposal card UX — no reference implementation in codebase for inline contextual proposal cards
- **Phase 4:** Session view subscription architecture — aggregating 30+ potential Convex subscriptions into efficient server-side combined queries

Phases with standard patterns (no research-phase needed):

- **Phase 1:** Well-defined CRUD, existing form patterns, clear visibility flag patterns
- **Phase 2:** Enrichment chat is the direct reference implementation
- **Module Enhancements:** Schema extension + small components, no novel patterns

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                         |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Verified against official Convex docs (Context7), npm, and direct codebase analysis. One new dep confirmed at version 0.3.0.                                  |
| Features     | HIGH       | Table stakes verified against BlueDot, Pear Deck, Mentimeter, SessionLab. AI differentiators validated by Khanmigo and Permit.io evidence.                    |
| Architecture | HIGH       | All patterns verified by reading existing codebase implementations. Schema fully specified. Component boundaries map directly to existing codebase structure. |
| Pitfalls     | HIGH       | Critical pitfalls derived from official Convex limits docs and direct codebase analysis. Race conditions are provably real from the proposed data model.      |

**Overall confidence:** HIGH

### Gaps to Address

- **Socratic system prompt quality for AI safety content:** The model is validated (Khanmigo), but specific prompts for AI safety concepts (not math tutoring) need empirical tuning during Phase 2. Budget 1-2 days for prompt experimentation before shipping the sidebar.
- **Agent context token budget:** The 8K token cap for sidebar context is a reasonable starting estimate, but the right balance between context richness and cost is empirical. Monitor token usage during Phase 2 development with actual module content.
- **Proposal card UX:** Technically specified but the interaction for surfacing contextual proposals inline needs a design decision before Phase 3 frontend work begins.
- **Concurrent AI call load test:** The 10-participant simultaneous request scenario is analyzed but not validated. Run a load test at end of Phase 2 before building Phase 4 session runner that will trigger simultaneous requests at scale.

## Sources

### Primary (HIGH confidence)

- Convex official documentation (Context7): reactive queries, actions, scheduling, file storage, agent component, presence component, schema limits
- `@convex-dev/presence` npm confirmed v0.3.0: https://www.npmjs.com/package/@convex-dev/presence
- Convex Agent GitHub: https://github.com/get-convex/agent
- Convex production limits: https://docs.convex.dev/production/state/limits
- Existing ASTN codebase (direct analysis): `convex/agent/`, `convex/enrichment/`, `convex/programs.ts`, `convex/schema.ts`, `src/components/profile/agent/`, `src/components/admin-agent/`

### Secondary (MEDIUM confidence)

- Khanmigo AI tutoring model: https://www.khanmigo.ai/learners
- SessionLab session runner features: https://www.sessionlab.com/features/time-tracker/
- Human-in-the-loop propose-approve pattern: https://www.permit.io/blog/human-in-the-loop-for-ai-agents-best-practices-frameworks-use-cases-and-demo
- Pear Deck instructor-paced mode: https://www.peardeck.com/
- Disco.co AI cohort platform: https://www.disco.co/
- BlueDot Impact course structure: https://bluedot.org/courses
- OWASP LLM01 prompt injection: https://genai.owasp.org/llmrisk/llm01-prompt-injection/

### Tertiary (LOW confidence)

- Socra.ai structured knowledge artifacts: https://hisocra.com/ (single source, not independently verified)
- SocratiQ adaptive learning framework: https://arxiv.org/html/2502.00341v1 (academic paper, not a shipped product)

---

_Research completed: 2026-03-10_
_Ready for roadmap: yes_
