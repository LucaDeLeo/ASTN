---
id: S03
parent: M001
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration:
verification_result: passed
completed_at:
blocker_discovered: false
---

# S03: Facilitator Agent

**# Plan 39-01 Summary: Schema + Backend**

## What Happened

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

# Plan 39-02 Summary: Agent Tools + Program Scope

**Status:** Complete
**Commit:** `91e5879`

## What was built

- **agent/tools/facilitator.ts** — 6 read tools: get_participant_progress, get_prompt_responses, get_response_counts, get_attendance_summary, get_sidebar_conversations, get_participant_profile
- **agent/tools/facilitatorProposals.ts** — 4 proposal tools: draft_comment, draft_message, suggest_pairs, flag_pattern
- **agent/agent.ts** — `createFacilitatorAgent()` factory with program-scoped system prompt, claude-sonnet-4-6 default, MCP server pattern
- **agent/cli.ts** — `--program=<programId>` flag, sets FACILITATOR_PROGRAM_ID env, opens browser to program admin page
- **agent/server.ts** — Conditional mode: port 3003 for facilitator (vs 3002 admin), verifies program belongs to org, creates facilitator agent
- **shared/admin-agent/constants.ts** — Added FACILITATOR_AGENT_WS_PORT (3003)

## Key decisions

- Facilitator agent uses claude-sonnet-4-6 by default (cheaper for frequent program queries)
- Read tools format output as markdown for readability in chat
- Proposal tools call the public `createProposalFromAgent` mutation (ConvexClient limitation)
- Server validates program ownership before allowing connection
- Extracted `buildThinkingConfig()` and `buildPromptWithHistory()` as shared module-level helpers

# Plan 39-03 Summary: Proposal UI + Sidebar Swap

**Status:** Complete
**Commit:** `2265b43`

## What was built

- **src/hooks/use-facilitator-agent.ts** — WebSocket hook for port 3003 with program-scoped persistence, no confirmation handling
- **src/components/facilitator-agent/FacilitatorAgentProvider.tsx** — Context provider with sidebar state, programId, orgSlug
- **src/components/facilitator-agent/FacilitatorAgentSidebar.tsx** — Resizable right panel + mobile sheet, same pattern as admin sidebar
- **src/components/facilitator-agent/FacilitatorAgentChat.tsx** — Chat UI with streaming, model selector defaults to Sonnet, no confirmation cards
- **src/components/facilitator-agent/FacilitatorSidebarAwareWrapper.tsx** — Margin offset when sidebar is open
- **src/components/course/ProposalCard.tsx** — Amber-bordered card with AI Draft badge, approve/edit+approve/dismiss actions, clipboard copy for messages
- **src/components/course/FacilitatorCommentDisplay.tsx** — Teal left-bordered comments with author names and AI-assisted badge
- **src/components/course/PromptResponseViewer.tsx** — Integrated ResponseProposals, FacilitatorCommentDisplay, and ManualCommentForm below each response
- **src/routes/org/$slug/admin/programs/$programId.tsx** — Wrapped with FacilitatorAgentProvider, added FacilitatorAgentSidebar, closes admin sidebar on mount

## Key decisions

- Admin sidebar closes on mount when entering program page (facilitator sidebar takes over)
- PromptResponseViewer always shows proposals/comments since it's admin-only context
- Manual comment form uses inline textarea with Post/Cancel buttons
- Used `as any` cast for message persistence to avoid ContentPart type mismatch (facilitator never sends confirmation parts)
