# Plan 39-01 Summary: Schema + Backend

**Status:** Complete
**Commit:** `7dff056`

## What was built

- **agentProposals table**: Stores agent-generated proposals (comment, message, pairs, summary, flag, prompt) with status workflow (proposed → approved/edited/dismissed) and 3 indexes
- **facilitatorComments table**: Stores facilitator comments on prompt responses with author tracking and `fromAgent` flag, 3 indexes
- **facilitatorAgentChats table**: Per-user per-program chat persistence (same pattern as adminAgentChat), 1 index

## Functions created

- `convex/course/proposals.ts` — 7 functions: createProposal (internal), createProposalFromAgent (public+auth), approveProposal, editAndApproveProposal, dismissProposal, getProposalsByProgram, getProposalsByTarget
- `convex/course/facilitatorComments.ts` — 2 functions: getCommentsForResponse (participant+admin visible), addManualComment (admin only)
- `convex/course/facilitatorQueries.ts` — 3 admin-scoped queries: getParticipantProgress, getResponseCounts, getAttendanceSummary
- `convex/facilitatorAgentChat.ts` — 3 functions: getMessages, saveMessages, clearMessages (keyed by userId+programId)

## Key decisions

- Used explicit table IDs per project convention (`ctx.db.get('programs', id)`)
- createProposalFromAgent is public (not internal) because ConvexClient can only call public APIs
- Approval of comment proposals auto-creates facilitatorComments entries
