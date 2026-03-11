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
