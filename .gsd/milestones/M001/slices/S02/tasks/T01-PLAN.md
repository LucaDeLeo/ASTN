# T01: 38-learning-sidebar 01

**Slice:** S02 — **Milestone:** M001

## Description

Create the learning agent backend: schema table for per-module thread mapping, agent definition with Socratic system prompt, thread management mutations, message queries, and dynamic context builder.

Purpose: Establishes all backend infrastructure that the sidebar UI and facilitator view will consume. This is the foundation -- agent definition, thread management, context-aware streaming, and Socratic instruction enforcement.

Output: `courseSidebarThreads` table, `learningAgent` agent instance, thread CRUD mutations, message listing query, and dynamic system prompt builder with module/progress/response context.

## Must-Haves

- [ ] 'Learning agent definition exists and uses @convex-dev/agent with Anthropic model'
- [ ] 'Thread can be created and scoped to a specific user+module pair'
- [ ] 'Messages can be sent and streamed back via the learning agent'
- [ ] 'System prompt is built dynamically with module materials, progress, and exercise responses'
- [ ] 'AI instructions enforce Socratic method (no direct answers to exercises)'

## Files

- `convex/schema.ts`
- `convex/course/sidebarAgent.ts`
- `convex/course/sidebar.ts`
- `convex/course/sidebarQueries.ts`
- `convex/course/prompts.ts`
