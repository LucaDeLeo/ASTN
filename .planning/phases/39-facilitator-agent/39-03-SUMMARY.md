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
