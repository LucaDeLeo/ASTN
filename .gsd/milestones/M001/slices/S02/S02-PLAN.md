# S02: Learning Sidebar

**Goal:** Create the learning agent backend: schema table for per-module thread mapping, agent definition with Socratic system prompt, thread management mutations, message queries, and dynamic context builder.
**Demo:** Create the learning agent backend: schema table for per-module thread mapping, agent definition with Socratic system prompt, thread management mutations, message queries, and dynamic context builder.

## Must-Haves

## Tasks

- [x] **T01: 38-learning-sidebar 01**
  - Create the learning agent backend: schema table for per-module thread mapping, agent definition with Socratic system prompt, thread management mutations, message queries, and dynamic context builder.

Purpose: Establishes all backend infrastructure that the sidebar UI and facilitator view will consume. This is the foundation -- agent definition, thread management, context-aware streaming, and Socratic instruction enforcement.

Output: `courseSidebarThreads` table, `learningAgent` agent instance, thread CRUD mutations, message listing query, and dynamic system prompt builder with module/progress/response context.

- [x] **T02: 38-learning-sidebar 02**
  - Build the participant-facing AI sidebar UI and wire proactive feedback. Participants get a right-side chat panel on the program page with streaming messages, module-scoped conversations, and automatic AI feedback on prompt submissions.

Purpose: This is the user-facing feature -- the sidebar that participants interact with daily. It also wires the proactive feedback trigger so the AI automatically comments on exercise submissions.

Output: Four React components (provider, sidebar, chat, toggle), program page integration, and the proactive feedback trigger in the response mutation.

- [x] **T03: 38-learning-sidebar 03**
  - Build the facilitator's read-only view of participant sidebar conversations on the admin program page. Facilitators can browse participants, select one, see their per-module conversation threads, and read the full message history.

Purpose: Enables facilitators to understand how participants are engaging with the AI learning partner, identify struggling students, and see what questions they are asking -- without participants knowing they are being observed.

Output: Two React components (participant list + conversation viewer) and admin page integration.

## Files Likely Touched

- `convex/schema.ts`
- `convex/course/sidebarAgent.ts`
- `convex/course/sidebar.ts`
- `convex/course/sidebarQueries.ts`
- `convex/course/prompts.ts`
- `src/components/course/AISidebarProvider.tsx`
- `src/components/course/AISidebar.tsx`
- `src/components/course/AISidebarChat.tsx`
- `src/components/course/AISidebarToggle.tsx`
- `src/routes/org/$slug/program/$programSlug.tsx`
- `convex/course/responses.ts`
- `src/components/course/FacilitatorConversations.tsx`
- `src/components/course/ConversationViewer.tsx`
- `src/routes/org/$slug/admin/programs/$programId.tsx`
