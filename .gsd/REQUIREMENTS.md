# Requirements

## Active

(No active requirements — all transitioned to Validated with M001 completion.)

## Validated

### PROMPT-01 — Facilitator can create prompts with markdown text and multiple fields (text, choice, multiple_choice)

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01 — PromptForm with dynamic fields. Commit dda4e6b.

### PROMPT-02 — Facilitator can attach prompts to modules (pre-work) or session phases (in-session)

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01+S04 — coursePrompts.attachedTo union supports module and session_phase. Commits a16fa24, 0badf24.

### PROMPT-03 — Participant can respond to prompts with text inputs and choice selections

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01 — PromptRenderer with field-type-specific inputs. Commit dda4e6b.

### PROMPT-04 — Participant can save partial responses and resume later

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01 — saveResponse with draft/submitted status. Commit dda4e6b.

### PROMPT-05 — Facilitator can configure reveal mode per prompt (immediate, facilitator_only, write_then_reveal)

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01 — revealMode field with three modes. Commit a16fa24.

### PROMPT-06 — Facilitator can trigger reveal on write_then_reveal prompts to show all responses

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01 — triggerReveal mutation + PromptRevealControl. Commits a16fa24, dda4e6b.

### PROMPT-07 — Facilitator can view all participant responses for any prompt

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01 — PromptResponseViewer with response list. Commit dda4e6b.

### PROMPT-08 — Facilitator can spotlight/highlight exceptional responses visible to entire cohort

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01 — toggleSpotlight mutation + SpotlightBadge. Commit dda4e6b.

### PROMPT-09 — Same prompt component renders identically whether attached to a module or a session phase

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S01+S04 — PromptRenderer used in both ModulePrompts and ParticipantLiveView. Commits dda4e6b, 42de110.

### AGENT-01 — Facilitator agent runs as local Bun process using Claude Agent SDK (same pattern as admin agent)

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — createFacilitatorAgent() factory, agent/cli.ts --program flag. Commit 91e5879.

### AGENT-02 — Facilitator connects via WebSocket bridge with token auth and Clerk JWT forwarding

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — WebSocket server port 3003, use-facilitator-agent.ts hook. Commits 91e5879, 2265b43.

### AGENT-03 — Agent has read tools: query participant progress, responses, attendance, sidebar conversations, profiles

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — 6 read tools in agent/tools/facilitator.ts. Commit 91e5879.

### AGENT-04 — Agent has write tools using confirmable pattern: draft comments on responses, draft messages to participants, suggest pair assignments

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — 4 proposal tools in agent/tools/facilitatorProposals.ts. Commit 91e5879.

### AGENT-05 — Agent proposals appear as contextual draft cards (proposed comment below the response it's about)

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — ProposalCard below responses in PromptResponseViewer. Commit 2265b43.

### AGENT-06 — Facilitator can approve, edit+approve, or dismiss each proposal

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — Three mutations + ProposalCard actions. Commits 7dff056, 2265b43.

### AGENT-07 — Agent can synthesize exercise responses and surface patterns/misconceptions for session prep

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — get_prompt_responses + flag_pattern tools with synthesis instructions. Commit 91e5879.

### AGENT-08 — Agent provides real-time observations during live sessions (response counts, recurring themes, discussion-worthy responses)

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — get_response_counts + get_prompt_responses tools available during live sessions. Commit 91e5879.

### AGENT-09 — Chat history persists per-facilitator per-program in Convex

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S03 — facilitatorAgentChats table with userId+programId keying. Commit 7dff056.

### SESS-01 — Facilitator can define session as ordered list of phases

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — sessionPhases table + CRUD mutations. Commit 0badf24.

### SESS-02 — Facilitator can start a live session, advancing through phases sequentially

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — startSession + advancePhase mutations. Commits ab8dad8, ed8eaed.

### SESS-03 — Timer displays remaining time for current phase on both facilitator and participant views

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — LiveTimer in SessionRunner and ParticipantLiveView. Commits ed8eaed, 42de110.

### SESS-04 — Facilitator can extend timer, skip phase, or advance to next phase

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — extendPhase, skipPhase, advancePhase mutations + UI controls. Commits ab8dad8, ed8eaed.

### SESS-05 — Participants see current phase title, timer, and prompt in real-time

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — ParticipantLiveView with real-time Convex queries. Commit 42de110.

### SESS-06 — Facilitator can see who's submitted, who's typing, who hasn't started during a prompt phase

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — PresenceIndicator with submitted/typing/idle badges. Commits 0badf24, ed8eaed.

### SESS-07 — Pairing system supports complementary, random, and manual strategies

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — generatePairs with random/complementary + setManualPairs. Commit ab8dad8.

### SESS-08 — Pairing handles odd numbers and absences

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — Trio for odd count, presence-filtered pairing. Commit ab8dad8.

### SESS-09 — Facilitator can create ad-hoc prompts during a live session

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — createAdHocPrompt mutation + AdHocPromptDialog. Commits ab8dad8, ed8eaed.

### SESS-10 — Session data is preserved

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S04 — sessionPhaseResults, sessionPairAssignments, coursePromptResponses per phase. Commits 0badf24, ab8dad8.

### MOD-01 — Facilitator can mark materials as essential or optional, with visual distinction

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S05 — isEssential field + toggle UI + "(optional)" label. Commits 7eda1ac, 333f37f.

### MOD-02 — Facilitator can upload audio materials (MP3) via Convex file storage with inline playback

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S05 — Audio type, storageId, upload flow, <audio controls>. Commits 7eda1ac, 333f37f.

### MOD-03 — Participant sees time-to-session indicator

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S05 — TimeToSessionIndicator with day count + remaining pre-work. Commit 333f37f.

### MOD-04 — Participant sees continue-here marker highlighting first incomplete material/exercise

- Status: validated
- Class: core-capability
- Source: inferred
- Validated by: M001/S05 — continueHere useMemo + blue border + badge. Commit 333f37f.

### SIDE-01 — Participant can chat with an AI learning partner from the program page

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Participant can chat with an AI learning partner from the program page

### SIDE-02 — AI sidebar has context of current module materials, participant's progress, and their exercise responses

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

AI sidebar has context of current module materials, participant's progress, and their exercise responses

### SIDE-03 — AI uses Socratic method (pushback, not answers) when participants ask about exercises

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

AI uses Socratic method (pushback, not answers) when participants ask about exercises

### SIDE-04 — AI proactively offers feedback in sidebar when participant submits a prompt with aiFeedback enabled

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

AI proactively offers feedback in sidebar when participant submits a prompt with aiFeedback enabled

### SIDE-05 — AI can recommend study priorities when participant asks ("I only have 30 minutes")

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

AI can recommend study priorities when participant asks ("I only have 30 minutes")

### SIDE-06 — Conversation history persists per-participant per-module

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Conversation history persists per-participant per-module

### SIDE-07 — Facilitator can view participant sidebar conversations from admin page

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Facilitator can view participant sidebar conversations from admin page

### SIDE-08 — Sidebar runs via @convex-dev/agent with ASTN API keys (no participant setup required)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Sidebar runs via @convex-dev/agent with ASTN API keys (no participant setup required)

## Deferred

## Out of Scope
