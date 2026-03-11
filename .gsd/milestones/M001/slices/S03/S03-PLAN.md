# S03: Facilitator Agent

**Goal:** Create the backend schema and Convex functions for the facilitator agent's propose-and-approve workflow: agentProposals + facilitatorComments tables, proposal CRUD mutations, comment creation on approval, and admin-scoped progress/aggregation queries.
**Demo:** Create the backend schema and Convex functions for the facilitator agent's propose-and-approve workflow: agentProposals + facilitatorComments tables, proposal CRUD mutations, comment creation on approval, and admin-scoped progress/aggregation queries.

## Must-Haves

## Tasks

- [x] **T01: 39-facilitator-agent 01**
  - Create the backend schema and Convex functions for the facilitator agent's propose-and-approve workflow: agentProposals + facilitatorComments tables, proposal CRUD mutations, comment creation on approval, and admin-scoped progress/aggregation queries.

Purpose: Establishes the data layer that the agent tools (Plan 02) write to and the proposal UI (Plan 03) reads from. Separates data concerns from agent tool wiring.

Output: Two new schema tables, proposal lifecycle mutations, facilitator comment visibility, and progress aggregation queries for agent consumption.

- [x] **T02: 39-facilitator-agent 02**
  - Create the facilitator agent tools and extend the local Bun agent process to support program-scoped mode. Read tools query all program data, proposal tools create agentProposals records, and the WebSocket server/CLI handle program-scoped connections with dedicated chat persistence.

Purpose: The facilitator agent reuses the existing admin agent architecture (WebSocket bridge, Claude Agent SDK, token auth) but adds program-scoped tools and system prompt. This plan creates the agent backend; Plan 03 creates the UI.

Output: Two tool modules (read + proposals), extended agent factory, updated CLI/server for --program mode, and chat persistence mutations.

- [x] **T03: 39-facilitator-agent 03**
  - Build the facilitator agent UI: WebSocket hook, chat sidebar, proposal cards inside PromptResponseViewer, facilitator comment display for participants, and conditional sidebar swap on program admin pages.

Purpose: Completes the facilitator agent user experience. Facilitators see the agent sidebar on program pages, receive proposals in context (inside the response viewer), and participants see approved comments on their responses.

Output: Full facilitator agent UI with proposal review workflow, integrated into the existing admin program page.

## Files Likely Touched

- `convex/schema.ts`
- `convex/course/proposals.ts`
- `convex/course/facilitatorComments.ts`
- `convex/course/facilitatorQueries.ts`
- `agent/tools/facilitator.ts`
- `agent/tools/facilitatorProposals.ts`
- `agent/agent.ts`
- `agent/cli.ts`
- `agent/server.ts`
- `shared/admin-agent/constants.ts`
- `shared/admin-agent/types.ts`
- `convex/facilitatorAgentChat.ts`
- `src/hooks/use-facilitator-agent.ts`
- `src/components/facilitator-agent/FacilitatorAgentProvider.tsx`
- `src/components/facilitator-agent/FacilitatorAgentSidebar.tsx`
- `src/components/facilitator-agent/FacilitatorAgentChat.tsx`
- `src/components/course/ProposalCard.tsx`
- `src/components/course/PromptResponseViewer.tsx`
- `src/components/course/FacilitatorCommentDisplay.tsx`
- `src/routes/org/$slug/admin/programs/$programId.tsx`
