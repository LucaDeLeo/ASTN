# T03: 38-learning-sidebar 03

**Slice:** S02 — **Milestone:** M001

## Description

Build the facilitator's read-only view of participant sidebar conversations on the admin program page. Facilitators can browse participants, select one, see their per-module conversation threads, and read the full message history.

Purpose: Enables facilitators to understand how participants are engaging with the AI learning partner, identify struggling students, and see what questions they are asking -- without participants knowing they are being observed.

Output: Two React components (participant list + conversation viewer) and admin page integration.

## Must-Haves

- [ ] 'Facilitator can see a list of participants who have sidebar conversations'
- [ ] 'Facilitator can select a participant and see their module-scoped conversation threads'
- [ ] 'Facilitator can read individual conversation messages in read-only mode'
- [ ] 'Only org admins can access participant conversations'

## Files

- `src/components/course/FacilitatorConversations.tsx`
- `src/components/course/ConversationViewer.tsx`
- `src/routes/org/$slug/admin/programs/$programId.tsx`
