# T02: 38-learning-sidebar 02

**Slice:** S02 — **Milestone:** M001

## Description

Build the participant-facing AI sidebar UI and wire proactive feedback. Participants get a right-side chat panel on the program page with streaming messages, module-scoped conversations, and automatic AI feedback on prompt submissions.

Purpose: This is the user-facing feature -- the sidebar that participants interact with daily. It also wires the proactive feedback trigger so the AI automatically comments on exercise submissions.

Output: Four React components (provider, sidebar, chat, toggle), program page integration, and the proactive feedback trigger in the response mutation.

## Must-Haves

- [ ] 'Participant can open an AI sidebar from the program page and send/receive messages'
- [ ] 'Sidebar shows conversation history persisted per-module'
- [ ] 'When participant submits a prompt response with aiFeedback enabled, sidebar thread receives proactive feedback automatically (auto-creating the thread if needed)'
- [ ] 'Sidebar works on mobile (bottom sheet) and desktop (right-side panel)'

## Files

- `src/components/course/AISidebarProvider.tsx`
- `src/components/course/AISidebar.tsx`
- `src/components/course/AISidebarChat.tsx`
- `src/components/course/AISidebarToggle.tsx`
- `src/routes/org/$slug/program/$programSlug.tsx`
- `convex/course/responses.ts`
