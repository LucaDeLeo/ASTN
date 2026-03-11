# T02: 39-facilitator-agent 02

**Slice:** S03 — **Milestone:** M001

## Description

Create the facilitator agent tools and extend the local Bun agent process to support program-scoped mode. Read tools query all program data, proposal tools create agentProposals records, and the WebSocket server/CLI handle program-scoped connections with dedicated chat persistence.

Purpose: The facilitator agent reuses the existing admin agent architecture (WebSocket bridge, Claude Agent SDK, token auth) but adds program-scoped tools and system prompt. This plan creates the agent backend; Plan 03 creates the UI.

Output: Two tool modules (read + proposals), extended agent factory, updated CLI/server for --program mode, and chat persistence mutations.

## Must-Haves

- [ ] 'Facilitator agent runs as local Bun process with --program=<programId> flag'
- [ ] 'Agent has read tools: get_participant_progress, get_prompt_responses, get_response_counts, get_attendance_summary, get_sidebar_conversations, get_participant_profile'
- [ ] 'Agent has proposal tools: draft_comment, draft_message, suggest_pairs, flag_pattern'
- [ ] 'Chat history persists per-facilitator per-program in Convex'
- [ ] 'Agent system prompt includes program context and Socratic facilitator coaching role'

## Files

- `agent/tools/facilitator.ts`
- `agent/tools/facilitatorProposals.ts`
- `agent/agent.ts`
- `agent/cli.ts`
- `agent/server.ts`
- `shared/admin-agent/constants.ts`
- `shared/admin-agent/types.ts`
- `convex/facilitatorAgentChat.ts`
