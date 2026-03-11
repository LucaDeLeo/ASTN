# T03: 39-facilitator-agent 03

**Slice:** S03 — **Milestone:** M001

## Description

Build the facilitator agent UI: WebSocket hook, chat sidebar, proposal cards inside PromptResponseViewer, facilitator comment display for participants, and conditional sidebar swap on program admin pages.

Purpose: Completes the facilitator agent user experience. Facilitators see the agent sidebar on program pages, receive proposals in context (inside the response viewer), and participants see approved comments on their responses.

Output: Full facilitator agent UI with proposal review workflow, integrated into the existing admin program page.

## Must-Haves

- [ ] 'Program admin page conditionally shows facilitator sidebar instead of general admin sidebar'
- [ ] 'Proposal cards render inside PromptResponseViewer with approve/edit+approve/dismiss actions'
- [ ] 'Facilitator comments display below participant responses after approval'
- [ ] 'Facilitator agent chat connects to port 3003 with program-scoped WebSocket'
- [ ] 'Chat history loads from per-program persistence on mount'

## Files

- `src/hooks/use-facilitator-agent.ts`
- `src/components/facilitator-agent/FacilitatorAgentProvider.tsx`
- `src/components/facilitator-agent/FacilitatorAgentSidebar.tsx`
- `src/components/facilitator-agent/FacilitatorAgentChat.tsx`
- `src/components/course/ProposalCard.tsx`
- `src/components/course/PromptResponseViewer.tsx`
- `src/components/course/FacilitatorCommentDisplay.tsx`
- `src/routes/org/$slug/admin/programs/$programId.tsx`
