# T01: 39-facilitator-agent 01

**Slice:** S03 — **Milestone:** M001

## Description

Create the backend schema and Convex functions for the facilitator agent's propose-and-approve workflow: agentProposals + facilitatorComments tables, proposal CRUD mutations, comment creation on approval, and admin-scoped progress/aggregation queries.

Purpose: Establishes the data layer that the agent tools (Plan 02) write to and the proposal UI (Plan 03) reads from. Separates data concerns from agent tool wiring.

Output: Two new schema tables, proposal lifecycle mutations, facilitator comment visibility, and progress aggregation queries for agent consumption.

## Must-Haves

- [ ] 'agentProposals table exists with programId, type, targetId, targetType, content, status, approvedBy, approvedAt, editedContent, createdAt fields'
- [ ] 'facilitatorComments table exists with promptResponseId, programId, authorId, content, fromAgent, createdAt fields'
- [ ] 'Proposals can be created, approved, edited+approved, and dismissed via mutations'
- [ ] 'Approving a comment proposal creates a facilitatorComments record visible to participant'
- [ ] 'Facilitator queries return participant progress aggregates and response counts per prompt'

## Files

- `convex/schema.ts`
- `convex/course/proposals.ts`
- `convex/course/facilitatorComments.ts`
- `convex/course/facilitatorQueries.ts`
