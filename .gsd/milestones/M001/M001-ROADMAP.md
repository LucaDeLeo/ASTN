# M001: v2.0 Course Program Platform

**Vision:** Build a course/program platform with unified prompts, AI learning partner, facilitator agent, and live session runner — meaningfully better than BlueDot Impact for BAISH's Technical AI Safety course.

## Success Criteria

- Facilitator can create interactive prompts and participants can respond, with visibility controls and facilitator oversight
- Participants have an always-available AI learning partner with Socratic feedback and module context
- Facilitator has an AI copilot with propose-and-approve workflow for comments, messages, and pair assignments
- Live sessions run with phases, timers, pairing, and real-time participant views
- Module materials support essential/optional flags, audio upload, time-to-session indicators, and continue-here markers

## Slices

- [x] **S01: Interactive Prompts** `risk:medium` `depends:[]`
  > After this: Create the Convex schema tables and backend functions for the unified prompt system.
- [x] **S02: Learning Sidebar** `risk:medium` `depends:[S01]`
  > After this: Create the learning agent backend: schema table for per-module thread mapping, agent definition with Socratic system prompt, thread management mutations, message queries, and dynamic context builder.
- [x] **S03: Facilitator Agent** `risk:medium` `depends:[S02]`
  > After this: Create the backend schema and Convex functions for the facilitator agent's propose-and-approve workflow: agentProposals + facilitatorComments tables, proposal CRUD mutations, comment creation on approval, and admin-scoped progress/aggregation queries.
- [x] **S04: Live Sessions** `risk:medium` `depends:[S03]`
  > After this: Create the schema foundation for the session runner and session phase CRUD backend.
- [x] **S05: Participant Experience** `risk:medium` `depends:[S04]`
  > After this: Evolve the material schema and backend queries to support essential/optional flags, audio file storage, audio URL resolution, storage blob cleanup, and prompt completion data for continue-here markers.
