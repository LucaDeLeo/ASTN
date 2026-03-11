---
id: M001
provides:
  - Unified prompt system (create, respond, reveal, spotlight)
  - AI learning sidebar with Socratic feedback and module context
  - Facilitator agent with propose-and-approve workflow
  - Live session runner with phases, timers, pairing, presence
  - Module enhancements (essential/optional, audio, time-to-session, continue-here)
key_decisions:
  - Denormalized moduleId/sessionId on prompts for fast index-based queries
  - Three reveal modes (immediate, write_then_reveal, facilitator_only) as first-class prompt property
  - Per-module thread isolation for learning sidebar (one thread per user per module)
  - Proactive AI feedback triggered on prompt submit with auto-thread creation
  - Facilitator agent uses Claude Sonnet 4.6 via local Bun process on port 3003 (separate from admin agent on 3002)
  - Public createProposalFromAgent (not internal) because ConvexClient can only call public APIs
  - Separated hot session state (sessionLiveState) from stable definitions (sessionPhases)
  - One-live-session-per-program invariant enforced at mutation level
  - Fisher-Yates shuffle for random pairing, cross-choice interleaving for complementary pairing
  - Material url made optional to support audio-only materials with storageId
  - Essential/optional distinction defaults to essential (isEssential: undefined = essential)
  - Teal accent for learning sidebar vs coral for profile agent (visual differentiation)
patterns_established:
  - convex/course/_helpers.ts shared auth helpers (requireOrgAdmin, checkProgramAccess, requireProgramAccess)
  - Self-contained UI components that fetch their own data (ModulePrompts, ParticipantLiveView, AdminModulePrompts)
  - Agent tools split into read tools (facilitator.ts) and proposal/write tools (facilitatorProposals.ts)
  - AISidebarProvider context pattern for sidebar state + thread management
  - Session runner route as sibling to program index ($programId/index.tsx + session-runner.tsx)
  - Presence heartbeat pattern (10s interval with focus/blur status updates)
observability_surfaces:
  - Facilitator can view all participant sidebar conversations from admin page
  - PresenceIndicator shows real-time submitted/typing/idle counts during live sessions
  - ProposalCard surfaces agent proposals inline below prompt responses
  - PromptResponseViewer shows response counts, status badges, spotlight state
  - TimeToSessionIndicator shows remaining pre-work time for participants
requirement_outcomes:
  - id: PROMPT-01
    from_status: active
    to_status: validated
    proof: 'PromptForm supports markdown body + dynamic fields (text, choice, multiple_choice) with validation. Commit dda4e6b.'
  - id: PROMPT-02
    from_status: active
    to_status: validated
    proof: 'coursePrompts.attachedTo union supports module and session_phase. ModulePrompts and session phase prompt wiring both implemented. Commits a16fa24, 0badf24.'
  - id: PROMPT-03
    from_status: active
    to_status: validated
    proof: 'PromptRenderer with PromptFieldText, PromptFieldChoice, PromptFieldMultiChoice. Commit dda4e6b.'
  - id: PROMPT-04
    from_status: active
    to_status: validated
    proof: 'saveResponse mutation with draft/submitted status flow. PromptRenderer initializes from existing response. Commit dda4e6b.'
  - id: PROMPT-05
    from_status: active
    to_status: validated
    proof: 'revealMode field on coursePrompts with immediate/facilitator_only/write_then_reveal. PromptForm includes reveal mode select. Commit a16fa24.'
  - id: PROMPT-06
    from_status: active
    to_status: validated
    proof: 'triggerReveal mutation + PromptRevealControl with AlertDialog confirmation. Commits a16fa24, dda4e6b.'
  - id: PROMPT-07
    from_status: active
    to_status: validated
    proof: 'PromptResponseViewer shows all responses with field values, status badges, timestamps. Commit dda4e6b.'
  - id: PROMPT-08
    from_status: active
    to_status: validated
    proof: 'toggleSpotlight mutation + SpotlightBadge (amber with sparkle icon) + spotlight toggle in PromptResponseViewer. Commit dda4e6b.'
  - id: PROMPT-09
    from_status: active
    to_status: validated
    proof: 'PromptRenderer accepts promptId + mode props, renders identically regardless of attachment. Used in both ModulePrompts and ParticipantLiveView. Commits dda4e6b, 42de110.'
  - id: AGENT-01
    from_status: active
    to_status: validated
    proof: 'createFacilitatorAgent() factory in agent/agent.ts, local Bun process via agent/cli.ts --program flag. Commit 91e5879.'
  - id: AGENT-02
    from_status: active
    to_status: validated
    proof: 'WebSocket server on port 3003 in agent/server.ts, use-facilitator-agent.ts hook with token auth. Commits 91e5879, 2265b43.'
  - id: AGENT-03
    from_status: active
    to_status: validated
    proof: '6 read tools in agent/tools/facilitator.ts: get_participant_progress, get_prompt_responses, get_response_counts, get_attendance_summary, get_sidebar_conversations, get_participant_profile. Commit 91e5879.'
  - id: AGENT-04
    from_status: active
    to_status: validated
    proof: '4 proposal tools in agent/tools/facilitatorProposals.ts: draft_comment, draft_message, suggest_pairs, flag_pattern. ProposalCard with approve/edit+approve/dismiss. Commits 91e5879, 2265b43.'
  - id: AGENT-05
    from_status: active
    to_status: validated
    proof: 'ResponseProposals rendered below each response in PromptResponseViewer. ProposalCard with amber border and AI Draft badge. Commit 2265b43.'
  - id: AGENT-06
    from_status: active
    to_status: validated
    proof: 'approveProposal, editAndApproveProposal, dismissProposal mutations. ProposalCard wires all three actions. Commits 7dff056, 2265b43.'
  - id: AGENT-07
    from_status: active
    to_status: validated
    proof: 'get_prompt_responses and flag_pattern tools enable synthesis. System prompt instructs pattern/misconception surfacing. Commit 91e5879.'
  - id: AGENT-08
    from_status: active
    to_status: validated
    proof: 'get_response_counts + get_prompt_responses tools available during live sessions. Agent can query real-time data. Commit 91e5879.'
  - id: AGENT-09
    from_status: active
    to_status: validated
    proof: 'facilitatorAgentChats table with by_userId_and_programId index. getMessages/saveMessages/clearMessages functions. Commit 7dff056.'
  - id: SESS-01
    from_status: active
    to_status: validated
    proof: 'sessionPhases table with title, durationMinutes, facilitatorNotes, promptIds, pairingStrategy. createPhase/updatePhase/reorderPhases/deletePhase mutations. Commit 0badf24.'
  - id: SESS-02
    from_status: active
    to_status: validated
    proof: 'startSession mutation creates sessionLiveState, advancePhase moves through phases sequentially. SessionRunner UI. Commits ab8dad8, ed8eaed.'
  - id: SESS-03
    from_status: active
    to_status: validated
    proof: "LiveTimer component with countdown, red pulse <60s, 'Time's up' at 0. Renders in both SessionRunner (facilitator) and ParticipantLiveView (participant). Commits ed8eaed, 42de110."
  - id: SESS-04
    from_status: active
    to_status: validated
    proof: 'extendPhase (+1/+5 min), skipPhase, advancePhase mutations. SessionRunner control buttons. Commits ab8dad8, ed8eaed.'
  - id: SESS-05
    from_status: active
    to_status: validated
    proof: 'ParticipantLiveView shows current phase title, LiveTimer, and PromptRenderer for active prompts via real-time Convex queries. Commit 42de110.'
  - id: SESS-06
    from_status: active
    to_status: validated
    proof: 'PresenceIndicator shows submitted/typing/idle counts with badges. sessionPresence table with heartbeat updates. Commits 0badf24, ed8eaed.'
  - id: SESS-07
    from_status: active
    to_status: validated
    proof: "generatePairs mutation with 'random' (Fisher-Yates) and 'complementary' (cross-choice) strategies. setManualPairs for manual. Commit ab8dad8."
  - id: SESS-08
    from_status: active
    to_status: validated
    proof: 'Trio creation for odd participant count (last 3 grouped). Pairs from present participants only (presence-filtered). Commit ab8dad8.'
  - id: SESS-09
    from_status: active
    to_status: validated
    proof: 'createAdHocPrompt mutation creates coursePrompt attached to current phase and adds to activePromptIds. AdHocPromptDialog UI. Commits ab8dad8, ed8eaed.'
  - id: SESS-10
    from_status: active
    to_status: validated
    proof: 'sessionPhaseResults table records actualDurationMs per phase. sessionPairAssignments preserved. coursePromptResponses per phase. Commits 0badf24, ab8dad8.'
  - id: MOD-01
    from_status: active
    to_status: validated
    proof: "isEssential field on materials. Essential/Optional toggle in ModuleFormDialog. MaterialChecklist shows '(optional)' label, progress counts only essential. Commits 7eda1ac, 333f37f."
  - id: MOD-02
    from_status: active
    to_status: validated
    proof: 'Audio type in material schema, storageId field, file upload in ModuleFormDialog, <audio controls> in MaterialChecklist, blob cleanup on delete. Commits 7eda1ac, 333f37f.'
  - id: MOD-03
    from_status: active
    to_status: validated
    proof: "TimeToSessionIndicator component with daysUntilSession helper. Shows 'Session X · In Y days · ~Zh Wm pre-work remaining'. Commit 333f37f."
  - id: MOD-04
    from_status: active
    to_status: validated
    proof: "continueHere logic in useMemo iterating modules by orderIndex. Blue left border + 'Continue here' badge on first incomplete material/exercise. Commit 333f37f."
duration: '5 slices across phases 37-41 (15 plans total)'
verification_result: passed
completed_at: 2026-03-11
---

# M001: v2.0 Course Program Platform

**Built a complete course platform with unified prompts, AI learning partner, facilitator agent, live session runner, and module enhancements — delivering all five target features across 5 slices and 15 implementation plans.**

## What Happened

The milestone built ASTN's course program platform in five sequential slices, each extending the previous.

**S01 (Interactive Prompts)** laid the foundation with `coursePrompts` and `coursePromptResponses` tables supporting markdown bodies, dynamic fields (text, choice, multiple_choice), three visibility modes, and spotlight highlighting. The participant UI renders draft/submit flows with field-type-specific inputs, while the facilitator UI provides prompt creation, response viewing, and reveal controls. Integration wired prompts into both the participant program page and admin curriculum cards.

**S02 (Learning Sidebar)** added an always-available AI learning partner using `@convex-dev/agent` with Claude Sonnet 4.6. The `courseSidebarThreads` table maps per-user per-module conversations. The agent's system prompt includes module materials, participant progress, exercise responses, and next session date — enforcing Socratic method (pushback, not answers). Proactive feedback auto-triggers when participants submit prompts with `aiFeedback` enabled, creating threads on-the-fly if needed. The facilitator gets a read-only conversation browser on the admin page.

**S03 (Facilitator Agent)** brought an AI copilot running as a local Bun process on port 3003 (separate from the admin agent on 3002). The agent has 6 read tools (progress, responses, attendance, conversations, profiles, response counts) and 4 proposal tools (draft comments, draft messages, suggest pairs, flag patterns). Proposals flow through a propose-and-approve workflow: agent creates proposals, they appear as amber-bordered cards below prompt responses, and the facilitator can approve, edit+approve, or dismiss. Approved comment proposals auto-create `facilitatorComments` entries.

**S04 (Live Sessions)** introduced the session runner with 5 new tables separating stable definitions (`sessionPhases`) from hot state (`sessionLiveState`, `sessionPresence`). The facilitator dashboard provides a two-column layout with timer controls, presence indicators, ad-hoc prompt creation, and pair generation (random via Fisher-Yates, complementary via cross-choice interleaving, or manual). Participants see a real-time banner with current phase, countdown timer, prompts, and pair assignments, with 10-second heartbeat presence tracking.

**S05 (Participant Experience)** evolved the material schema to support essential/optional flags, audio file storage with inline playback, time-to-session indicators, and continue-here markers. The facilitator toggles essential/optional per material and uploads audio via Convex storage. Participants see progress counting only essential materials, a blue callout showing days until next session with remaining pre-work time, and a blue-bordered marker on their first incomplete item.

## Cross-Slice Verification

**Criterion 1: Facilitator can create interactive prompts and participants can respond, with visibility controls and facilitator oversight**

- ✅ Verified: `PromptForm` creates prompts with markdown + dynamic fields. `PromptRenderer` handles participant responses. Three reveal modes implemented. `PromptResponseViewer` provides facilitator oversight with spotlight. Evidence: 19 components in `src/components/course/`, 13 backend files in `convex/course/`.

**Criterion 2: Participants have an always-available AI learning partner with Socratic feedback and module context**

- ✅ Verified: `AISidebar` renders on program page with per-module threads. `buildLearningSystemPrompt()` injects materials, progress, responses, session dates. Socratic instructions enforced in system prompt. Proactive feedback on prompt submission with auto-thread creation. Evidence: `sidebarAgent.ts`, `AISidebarProvider.tsx`, sidebar queries.

**Criterion 3: Facilitator has an AI copilot with propose-and-approve workflow for comments, messages, and pair assignments**

- ✅ Verified: `createFacilitatorAgent()` factory with 10 tools. `agentProposals` table with proposed→approved/edited/dismissed workflow. `ProposalCard` UI with three actions. Approval of comment proposals auto-creates `facilitatorComments`. Evidence: `agent/tools/facilitator.ts`, `agent/tools/facilitatorProposals.ts`, `ProposalCard.tsx`.

**Criterion 4: Live sessions run with phases, timers, pairing, and real-time participant views**

- ✅ Verified: `sessionPhases` + `sessionLiveState` tables. 7 runner mutations (start, advance, extend, skip, end, ad-hoc, presence). `LiveTimer` with countdown and red pulse. Three pairing strategies with trio handling. `ParticipantLiveView` with heartbeat. Evidence: `sessionRunner.ts`, `sessionPairing.ts`, 9 components in `src/components/session/`.

**Criterion 5: Module materials support essential/optional flags, audio upload, time-to-session indicators, and continue-here markers**

- ✅ Verified: `isEssential` field on materials with toggle UI. `storageId` + audio type with upload/playback. `TimeToSessionIndicator` with day count + remaining pre-work. Continue-here logic finding first incomplete essential material. Evidence: schema evolution in `convex/schema.ts`, `MaterialChecklist.tsx`, `$programSlug.tsx`.

## Requirement Changes

All 31 active requirements (PROMPT-01 through PROMPT-09, AGENT-01 through AGENT-09, SESS-01 through SESS-10, MOD-01 through MOD-04) transitioned from `active` to `validated`. The 8 SIDE requirements were already validated before this milestone completion step. See `requirement_outcomes` in frontmatter for per-requirement proof with commit references.

## Forward Intelligence

### What the next milestone should know

- The prompt system is the universal primitive — exercises, session activities, polls, and feedback all use `coursePrompts`. Any new interaction pattern should extend this table, not create a new one.
- The facilitator agent runs as a separate local process (port 3003). It requires `--program=<programId>` at startup and validates program ownership before accepting connections. A future hosted version would need to replace this local process model.
- Session presence uses a 30-second heartbeat window for filtering — at BAISH scale (~50 participants) this is fine, but would need server-side filtering for larger cohorts.

### What's fragile

- **Proactive feedback thread auto-creation** — if `getOrCreateThread` fails silently, feedback is lost with no retry mechanism. Matters because this is the primary touchpoint for AI learning value.
- **One-live-session-per-program invariant** — enforced at mutation level only, no index constraint. Race conditions theoretically possible under extreme concurrent startSession calls.
- **Facilitator agent ConvexClient using public APIs** — `createProposalFromAgent` is public (not internal) because ConvexClient can only call public APIs. This means the endpoint is technically callable from the frontend, though it requires auth.
- **Presence heartbeat 10s interval** — generates frequent writes. At scale beyond ~100 concurrent participants, this could create hot write contention on `sessionPresence` table.

### Authoritative diagnostics

- `convex/course/_helpers.ts` — check here first for auth issues on any course endpoint; all program access control flows through `requireProgramAccess`/`checkProgramAccess`
- `convex/course/sidebarAgent.ts` `buildLearningSystemPrompt()` — this is the single source of truth for what context the learning AI sees
- `agent/tools/facilitator.ts` + `facilitatorProposals.ts` — complete tool inventory for the facilitator agent; check here for capability questions

### What assumptions changed

- **Originally assumed session prompts would be wired in S01** — actually deferred to S04 when sessionPhases table was created, which was the right call since prompt attachment needed the phaseId
- **Originally planned `as v.internal()` for proposal creation** — changed to public API because ConvexClient can only call public functions; not a security issue since it requires auth
- **Audio materials assumed to always have URLs** — made url optional to support upload-only audio materials with storageId

## Files Created/Modified

### Backend (convex/course/)

- `convex/course/_helpers.ts` — shared auth helpers (requireOrgAdmin, checkProgramAccess, requireProgramAccess)
- `convex/course/prompts.ts` — prompt CRUD with create, update, remove, get, getByModule, getBySession, triggerReveal
- `convex/course/responses.ts` — response save/submit with proactive feedback trigger
- `convex/course/sidebar.ts` — thread management, message sending, context building
- `convex/course/sidebarAgent.ts` — learning partner agent definition with Socratic system prompt
- `convex/course/sidebarQueries.ts` — message listing, participant thread queries
- `convex/course/proposals.ts` — proposal CRUD with approve/edit/dismiss workflow
- `convex/course/facilitatorComments.ts` — facilitator comment management
- `convex/course/facilitatorQueries.ts` — admin-scoped progress/aggregation queries
- `convex/course/sessionSetup.ts` — phase CRUD mutations
- `convex/course/sessionRunner.ts` — session lifecycle mutations (start, advance, extend, skip, end)
- `convex/course/sessionPairing.ts` — random, complementary, and manual pairing algorithms
- `convex/course/sessionQueries.ts` — session read queries
- `convex/facilitatorAgentChat.ts` — per-user per-program chat persistence
- `convex/schema.ts` — 8 new tables (coursePrompts, coursePromptResponses, courseSidebarThreads, agentProposals, facilitatorComments, facilitatorAgentChats, sessionPhases + 4 more session tables)

### Agent

- `agent/tools/facilitator.ts` — 6 read tools for program data access
- `agent/tools/facilitatorProposals.ts` — 4 proposal tools for draft workflow
- `agent/agent.ts` — createFacilitatorAgent() factory with program-scoped system prompt
- `agent/cli.ts` — --program flag for facilitator mode
- `agent/server.ts` — port 3003 facilitator mode with program validation

### Frontend Components

- `src/components/course/` — 19 components (prompts, sidebar, conversations, proposals, comments)
- `src/components/session/` — 9 components (setup, runner, timer, presence, pairs, participant views)
- `src/components/facilitator-agent/` — 4 components (provider, sidebar, chat, wrapper)

### Routes

- `src/routes/org/$slug/admin/programs/$programId/index.tsx` — admin program page with all integrations
- `src/routes/org/$slug/admin/programs/$programId/session-runner.tsx` — dedicated session runner route
- `src/routes/org/$slug/program/$programSlug.tsx` — participant page with sidebar, live view, continue-here
