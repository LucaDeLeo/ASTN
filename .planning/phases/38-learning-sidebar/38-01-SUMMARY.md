# Plan 38-01 Summary: Schema + Agent Backend

**Status:** Complete
**Duration:** ~15 min

## What was built

1. **`courseSidebarThreads` table** in `convex/schema.ts` — maps (userId, moduleId) to `@convex-dev/agent` thread ID with 3 indexes: `by_userId_and_moduleId`, `by_programId`, `by_programId_and_userId`

2. **`aiFeedback` field** added to `coursePrompts` table — `v.optional(v.boolean())`, defaults to true in application logic

3. **`convex/course/sidebarAgent.ts`** — Learning agent definition (`learning-partner`) using Claude Sonnet 4.6 with:
   - `streamResponse` internal action for regular chat messages
   - `streamFeedback` internal action for proactive feedback on prompt submissions
   - `buildLearningSystemPrompt()` helper that constructs Socratic system prompt with module materials, progress, prompt responses, and next session date

4. **`convex/course/sidebar.ts`** — Thread management with:
   - `getOrCreateThread` mutation (creates thread on first open, reuses existing)
   - `sendMessage` mutation (saves message, schedules streaming response)
   - `abortGeneration` mutation (stops active streams)
   - `buildModuleContext` internal query (materials + progress + responses + sessions)
   - `getPromptWithResponse` internal query (for proactive feedback context)

5. **`convex/course/sidebarQueries.ts`** — Query layer:
   - `listMessages` query (for `useUIMessages` hook)
   - `getParticipantThreads` query (facilitator: all threads for a program)
   - `getParticipantThreadsByUser` query (facilitator: per-participant drill-down)

## Deviations

- Added `getPromptWithResponse` internal query (not in original plan) to provide richer context for proactive feedback — includes prompt title, body, and user's response text
- System prompt includes language-matching instruction ("Respond in the same language the participant uses") for BAISH's Spanish-speaking participants

## Requirements covered

- SIDE-02: Module context in system prompt
- SIDE-03: Socratic method enforced in instructions
- SIDE-05: Study prioritization guidance in prompt
- SIDE-06: Per-module thread persistence via `courseSidebarThreads`
- SIDE-08: Uses `@convex-dev/agent` with ASTN API keys
