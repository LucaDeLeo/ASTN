---
id: S02
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

# S02: Learning Sidebar

**# Plan 38-01 Summary: Schema + Agent Backend**

## What Happened

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

# Plan 38-02 Summary: Sidebar UI + Proactive Feedback

**Status:** Complete
**Duration:** ~20 min

## What was built

### Sidebar UI Components

1. **`AISidebarProvider.tsx`** — React context managing:
   - Module-scoped thread state (threadId per moduleId)
   - localStorage-persisted open/width state
   - Keyboard shortcut: `Cmd+Shift+.` (differentiated from profile sidebar's `Cmd+.`)
   - Thread creation on first open via `getOrCreateThread` mutation
   - Thread reset on module change

2. **`AISidebarChat.tsx`** — Chat interface with:
   - `useUIMessages` + `optimisticallySendMessage` for streaming messages
   - Markdown rendering via `renderMarkdown`
   - `useSmoothText` for streaming animation
   - Auto-scroll with user-scroll-up detection
   - Send/stop buttons, Enter to submit
   - Empty state with "AI Learning Partner" branding (teal accent)

3. **`AISidebarToggle.tsx`** — Toggle button with Bot icon, hidden when sidebar is open

4. **`AISidebar.tsx`** — Container panel:
   - Desktop: fixed RIGHT-side panel (mirrored from left-side profile sidebar)
   - Mobile: bottom Sheet
   - Resize handle on LEFT edge
   - Edge chevron tab (ChevronLeft/Right)
   - Backdrop overlay for narrow viewports

### Program Page Integration

- Wrapped page content with `<AISidebarProvider moduleId={effectiveModuleId}>`
- Added `AISidebar` and `AISidebarToggle` to the page
- Added `activeModuleId` state, defaulting to first available module
- Added `onModuleClick` prop to `SessionTimeline` and `UnlinkedModules` to set active module on interaction

### Proactive Feedback (SIDE-04)

- Modified `saveResponse` in `convex/course/responses.ts` to trigger AI feedback on submit
- When `submit === true` and `prompt.aiFeedback !== false` and prompt has a moduleId:
  - Finds existing sidebar thread, or auto-creates one
  - Saves a system message asking for feedback
  - Schedules `streamFeedback` action
- Thread auto-creation ensures feedback is always delivered, even if user hasn't opened the sidebar

### Profile Agent FAB Suppression

- `AgentFAB` now checks the pathname and hides on `/org/:slug/program/:programSlug` routes

## Deviations

- Used `effectiveModuleId` pattern (defaults to first available module) instead of requiring explicit module selection — simpler UX
- Used teal accent color for AI Learning Partner branding (vs coral for profile agent) to visually distinguish the two

## Requirements covered

- SIDE-01: Participant can chat from the program page
- SIDE-04: Proactive feedback on prompt submission (with thread auto-creation)

# Plan 38-03 Summary: Facilitator Conversation View

**Status:** Complete
**Duration:** ~10 min

## What was built

### Facilitator Conversation Components

1. **`FacilitatorConversations.tsx`** — Admin-facing conversation browser:
   - Fetches all participant threads via `getParticipantThreads` query
   - Groups threads by userId into a participant list (left panel)
   - Participant selection reveals per-module thread list (right panel)
   - Thread selection expands inline `ConversationViewer`
   - Empty state when no conversations exist
   - Card/Badge UI matching admin page styling

2. **`ConversationViewer.tsx`** — Read-only message display:
   - Uses `useUIMessages` with `stream: false` (read-only, no live streaming)
   - User messages right-aligned (primary bg), assistant messages left-aligned (muted bg)
   - Markdown rendering via `renderMarkdown`
   - Relative timestamps (`2d ago`, `3h ago`)
   - Scrollable container, max 96 height

### Admin Page Integration

- Added "AI Conversations" section to `$programId.tsx` admin page
- Only renders when program has modules (since threads are module-scoped)
- Placed below existing content sections

## Requirements covered

- SIDE-07: Facilitator can view participant sidebar conversations in read-only mode
