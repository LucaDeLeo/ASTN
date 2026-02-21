# Plan: Always-Present Agent Sidebar (Cursor-style)

## Context

The agent chat currently lives at `/profile/agent` as a separate page. Users navigate away from it to browse matches, opportunities, etc. The goal is to make the agent a **persistent sidebar** visible on every authenticated page — like Cursor's AI assistant. The agent becomes the primary interface: users can paste LinkedIn URLs, drop CVs, or just chat, all from one input. The agent uses tools to update the profile in real-time. Users can also edit fields directly and the agent stays in sync (it reads fresh profile each turn — already works).

**Key decisions:**

- **Mobile**: FAB (floating action button) + bottom sheet. All 5 existing tabs stay.
- **Onboarding**: Replace the ProfileCreationWizard entirely. All profile building happens through the agent sidebar. New users land with the sidebar auto-opened.

This is a major UX shift but a **moderate code change** because:

- `AgentChat` component is fully reusable (props: `profileId`, `threadId`)
- All 7 agent tools, streaming, tool-call approve/undo work unchanged
- Backend needs only 3 small additions (passing validated `pageContext` through) + 1 `internalMutation` for bulk extraction
- The overlay approach means zero changes to existing route files
- Extraction hooks (`useExtraction`, `useFileUpload`) already exist at `src/components/profile/upload/hooks/` and are reusable for smart input

---

## Phase 1: Core Sidebar Shell ✅ DONE

**Goal**: Agent chat accessible from any authenticated page via a persistent right panel (desktop) / bottom sheet (mobile).

**Status**: Implemented and compiling cleanly. All files created/modified as planned.

### New files (created)

**`src/components/agent-sidebar/AgentSidebarProvider.tsx`** ✅ — React context

- State: `isOpen` (persisted to localStorage), `toggle()`, `open()`, `close()`
- Reads `profileId` and `agentThreadId` from `useQuery(api.profiles.getOrCreateProfile)`
- Lazy thread creation on first open (triggers only when `isOpen && !agentThreadId`)
- Guard against concurrent thread creation via `useRef(false)`
- Auto-open for new users (profile exists but no `agentThreadId`)

**`src/components/agent-sidebar/AgentSidebar.tsx`** ✅ — The sidebar shell

- **Desktop**: `fixed top-0 right-0 h-full w-[400px] z-40` with `translate-x` slide transition (300ms)
- **Mobile**: Uses existing `Sheet` component (`side="bottom"`, 85vh) with drag handle
- Renders `<AgentChat>` inside — no changes to AgentChat
- Close button overlaid on top-right (avoids double header with AgentChat's own header)
- Wrapped in `<Authenticated>`

**`src/components/agent-sidebar/SidebarAwareWrapper.tsx`** ✅ — Layout push wrapper (not in original plan)

- Applies `mr-[400px]` with `transition-[margin-right] duration-300` when sidebar open on desktop
- No-op on mobile

**`src/components/agent-sidebar/AgentFAB.tsx`** ✅ — Mobile floating action button

- `fixed bottom-20 right-4 z-30` (above BottomTabBar)
- Sparkles icon, `size-12` rounded-full
- Hidden when sidebar/sheet is open
- Wrapped in `<Authenticated>`

### Modified files

**`src/routes/__root.tsx`** ✅ — Injected at root level

```
<AgentSidebarProvider>
  <SidebarAwareWrapper>
    <Outlet />
  </SidebarAwareWrapper>
  <AgentSidebar />          ← Authenticated guard is inside the component
</AgentSidebarProvider>
```

**`src/components/layout/auth-header.tsx`** ✅ — Added toggle button

- `AgentToggleButton` component with Sparkles icon, placed before NotificationBell
- Uses `useAgentSidebar().toggle()`, aria-label reflects open/close state

**`src/components/layout/mobile-shell.tsx`** ✅ — Added FAB

- `<AgentFAB />` rendered between main content and BottomTabBar

### What stayed untouched in Phase 1

- All 29+ route files
- `AgentChat.tsx`, `LiveProfileView.tsx`
- All `convex/agent/` backend files

### Implementation notes

- `createProfile` mutation was removed from the provider — the sidebar only creates a thread for profiles that already exist. Profile creation still happens through existing flows.
- The `<Authenticated>` wrapper lives inside `AgentSidebar` and `AgentFAB` components themselves (not in `__root.tsx`), keeping the root clean.

---

## Phase 2: Page Context Awareness ✅ DONE

**Goal**: Agent knows what page the user is on and tailors responses accordingly.

**Status**: Implemented and compiling cleanly. All files created/modified as planned.

### New file (created)

**`src/hooks/use-agent-page-context.ts`** ✅

- Reads `useRouterState()` from TanStack Router
- Maps pathname to a validated literal (matching the backend union type). Returns the literal, not a human-readable string — the backend maps literals to descriptions in `prompts.ts`:
  - `/` → `"viewing_home"`
  - `/profile` → `"viewing_profile"`
  - `/profile/edit` → `"editing_profile"`
  - `/matches` → `"browsing_matches"`
  - `/matches/:id` → `"viewing_match"`
  - `/opportunities` → `"browsing_opportunities"`
  - `/opportunities/:id` → `"viewing_opportunity"`
- Returns `undefined` for unrecognized routes (backend skips context block when absent)

### Modified backend files (3 small changes)

**`convex/agent/threadOps.ts`** — `sendMessage` ✅

- Add optional arg using validated union (not free-form string — defense in depth against prompt injection):

```typescript
pageContext: v.optional(
  v.union(
    v.literal('viewing_home'),
    v.literal('viewing_profile'),
    v.literal('editing_profile'),
    v.literal('browsing_matches'),
    v.literal('viewing_match'),
    v.literal('browsing_opportunities'),
    v.literal('viewing_opportunity'),
  ),
)
```

- Pass it through to `streamResponse` scheduler call

**`convex/agent/actions.ts`** — `streamResponse` ✅

- Add same `pageContext` union arg (copy the validator, or extract a shared `pageContextValidator` in a constants file)
- Pass to `buildAgentSystemPrompt(profileContext, pageContext)`

**`convex/agent/prompts.ts`** — `buildAgentSystemPrompt` ✅

- Accept optional `pageContext?: string` parameter
- Map the literal values to human-readable descriptions inside the prompt builder (keeps LLM-facing text decoupled from the validated enum):

```typescript
const PAGE_CONTEXT_DESCRIPTIONS: Record<string, string> = {
  viewing_home:
    'Viewing the home dashboard with match highlights and career actions',
  viewing_profile: 'Viewing their profile (read-only)',
  editing_profile: 'Editing their profile',
  browsing_matches: 'Browsing opportunity matches',
  viewing_match: 'Viewing details for a specific match',
  browsing_opportunities: 'Browsing AI safety opportunities',
  viewing_opportunity: 'Viewing a specific opportunity',
}
```

- Append to system prompt when present:

```
<current_context>
The user is currently: ${PAGE_CONTEXT_DESCRIPTIONS[pageContext]}
Use this to make responses relevant. If they're on matches, help them understand fit.
If on opportunities, help assess whether to apply. If on their profile, suggest improvements.
</current_context>
```

### Frontend wiring ✅

- `AgentSidebar` calls `useAgentPageContext()` and passes it when sending messages
- `useAgentPageContext()` returns the validated literal (e.g. `"viewing_home"`), not the human-readable string — the backend maps to descriptions
- Added optional `pageContext` prop (typed as `PageContext`) to `AgentChat`, passed through in `handleSubmit` to `sendMessageMut`

### Implementation notes

- `PageContext` type is exported from the hook and reused in `AgentChat` props for end-to-end type safety (avoids `string` mismatch with the Convex union validator).
- The `pageContext` validator is duplicated in `threadOps.ts` and `actions.ts` (not extracted to a shared constant) — matches the plan's suggestion. Can be extracted later if more consumers appear.

---

## Phase 3: Smart Input ✅ DONE

**Goal**: Single input detects LinkedIn URLs, large text pastes, and file uploads — routes to existing extraction pipelines. This is what makes the wizard replacement possible.

**Status**: Implemented and compiling cleanly. All files created/modified as planned.

### How extraction → agent works

When data is extracted (from LinkedIn, CV, or pasted text), instead of showing a separate review UI, we:

1. Run extraction via existing hooks (`useExtraction` from `src/components/profile/upload/hooks/`)
2. Apply extracted data to the profile via a new `internalMutation` that bulk-updates profile fields
3. Send a summary message to the agent thread: "I just imported data from LinkedIn. Here's what was added: [name, 2 education entries, 3 work entries, 8 skills]"
   - **Note**: This is a synthetic message (not typed by the user). Pass a metadata flag `isSystemGenerated: true` so the UI can style it differently (e.g. muted text, no avatar). This prevents confusion about authorship in thread history.
   - Consider adding an optional `metadata` field to `sendMessage` args, or use a separate `addSystemMessage` mutation that inserts directly without triggering `streamResponse`. The latter avoids unnecessary agent responses if we just want to log the action.
4. The agent acknowledges and probes for gaps — no separate review step needed
5. User sees tool-call-style confirmations and can undo anything via the existing approve/undo UI

### New file

**`src/components/agent-sidebar/useSmartInput.ts`** — Hook wrapping detection + extraction

- Uses existing `useExtraction()` and `useFileUpload()` from `src/components/profile/upload/hooks/` internally
- Detection logic:
  - `linkedin.com/in/` in text → LinkedIn extraction
  - Text > 300 chars with 5+ lines → CV/resume paste (shows confirmation banner)
  - File attachment → PDF extraction
- Exposes: `{ detectInputType, handleLinkedIn, handleCVPaste, handleFileUpload, extractionState, fileInputRef }`
- Returns extraction state for inline progress display

### New backend mutation

**`convex/agent/mutations.ts`** — `applyExtractedDataFromSidebar` as **`internalMutation`**

- **Visibility**: Must be `internalMutation`, not public — called from extraction pipeline, never directly from client. If client needs to trigger it, route through a public mutation that does auth checks first.
- **Return validator**: `returns: v.array(v.id("agentToolCalls"))` — returns IDs of all created tool call records
- **Argument validation**: Use typed validators matching the schema, not loose `v.any()`:

```typescript
args: {
  profileId: v.id("profiles"),
  threadId: v.string(),
  extractedData: v.object({
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    headline: v.optional(v.string()),
    education: v.optional(v.array(v.object({
      institution: v.string(),
      degree: v.optional(v.string()),
      field: v.optional(v.string()),
      startYear: v.optional(v.number()),
      endYear: v.optional(v.number()),
    }))),
    workHistory: v.optional(v.array(v.object({
      organization: v.string(),
      title: v.string(),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      description: v.optional(v.string()),
    }))),
    skills: v.optional(v.array(v.string())),
  }),
}
```

- **Error handling**: Throw `ConvexError` on malformed data (e.g. skills not in taxonomy, empty required strings). Validate skills against `SKILLS_LIST` — same constraint the `setSkills` tool enforces.
- Applies to profile in bulk
- Creates `agentToolCalls` records for each field category updated (basic info, education, work, skills) — so user can undo individual pieces
- Reuses the same `applyToolChange` pattern already in the file
- **Transaction size note**: A full LinkedIn import could create ~15-20 tool call inserts + 1 profile patch. Well within Convex's 8192 doc limit, but worth being aware of.

### Modified file

**`src/components/profile/agent/AgentChat.tsx`** — Additions to input area

- Accept optional `onSmartInput` callback prop for detection interception
- Add paperclip/attachment button next to Send
- Add hidden file input for PDF upload
- Add inline extraction progress indicator (small bar above input)
- Add CV-paste confirmation banner when large text detected

---

## Phase 4: Onboarding Replacement & Migration ✅ DONE

**Goal**: New users are onboarded entirely through the agent sidebar. Remove the wizard.

**Status**: Implemented and compiling cleanly. Build passes. All files modified as planned.

### New user flow

1. User signs up via Clerk → redirected to `/` (home page)
2. `AgentSidebarProvider` detects: profile exists but `agentThreadId` is null → auto-creates thread + auto-opens sidebar
3. Agent's first message (empty thread welcome): "Hey! I'm here to help you build your AI safety profile. You can paste your LinkedIn URL, drop a CV, or just tell me about yourself."
4. User interacts via smart input → agent builds profile in real-time
5. User can close sidebar anytime, browse the app, come back

### Modified files

**`src/routes/profile/edit.tsx`** ✅ — Simplified

- Removed `ProfileCreationWizard` import and the `step === 'input'` branch
- Removed `fromExtraction` and `chatFirst` search params from route schema
- Default step is now `basic` (direct edit form shown immediately)
- Added "Open Agent" button (Sparkles icon) that calls `useAgentSidebar().open()`
- Removed onboarding session tracking (`isOnboardingSession` ref, enrichment redirect effect)

**`src/routes/profile/agent.tsx`** ✅ — Converted to redirect

- Renders `<RedirectAndOpenSidebar>` inside `<Authenticated>` wrapper
- Calls `useAgentSidebar().open()` + `navigate({ to: '/profile' })` in a `useEffect`
- Route file kept alive so old links/bookmarks still work

**`convex/agent/prompts.ts`** ✅ — Updated welcome behavior

- Added "New users and sparse profiles" section to system prompt
- When profile is mostly empty, agent proactively offers: paste LinkedIn, drop CV, or just chat
- When partially filled, agent focuses on gaps

**`src/routes/login.tsx`** — No changes needed

- Already redirects to `/` (was updated in a prior commit)

**`src/components/auth/onboarding-guard.tsx`** ✅ — Relaxed (not in original plan)

- Removed redirect to `/profile/edit` for enrichment step
- No longer gatekeeps on `hasEnrichmentConversation`
- Now simply ensures a profile exists (spinner while loading)

**`src/routes/org/$slug/join.tsx`** ✅ — Simplified (not in original plan)

- After joining org, always redirects to org page (removed profile-status branching)
- Removed unused `profile` query

### What got removed/deprecated

- `ProfileCreationWizard` is no longer imported from any route (component file still exists for reference)
- Entry point selector flow (`step === 'input'`) removed from `/profile/edit`
- `?fromExtraction=` and `?chatFirst=` URL params removed from route schema
- `?step=input` removed from search schema (only manual edit steps remain)
- `hasEnrichmentConversation` gating in `OnboardingGuard` removed

### What stays

- `ProfileWizard` (manual edit form) — useful for direct field editing alongside the agent
- All step components (`BasicInfoStep`, `EducationStep`, etc.)
- The extraction backend functions (used by smart input)
- `useExtraction` and `useFileUpload` hooks at `src/components/profile/upload/hooks/` (used by smart input)
- `ProfileCreationWizard` component file (not imported, can be deleted in cleanup)

---

## Phase 5: Polish ✅ DONE

**Goal**: Finishing touches for production readiness.

**Status**: Implemented and compiling cleanly. All changes verified with tsc and eslint.

1. **Keyboard shortcut** ✅: `Cmd+.` / `Ctrl+.` to toggle sidebar — global `keydown` handler in `AgentSidebarProvider`
2. **Focus management** ✅: Textarea auto-focuses when sidebar opens (150ms delay for animation). Previous focus saved on `open()` and restored via `requestAnimationFrame` on `close()`
3. **Transition animations** ✅: Already had `transition-transform duration-300` — no changes needed
4. **Mobile sheet** ✅: Changed `85vh` → `85dvh` for proper virtual keyboard handling on mobile browsers
5. **Responsive edge cases** ✅: Narrow desktop (768-899px) uses overlay mode — sidebar floats over content with click-away backdrop instead of pushing layout. `SidebarAwareWrapper` only pushes content when `min-width: 900px`
6. **Empty state polish** ✅: Replaced generic welcome with warm message + three actionable suggestion buttons (Paste LinkedIn URL, Upload CV, Just start chatting) that directly set input or trigger file picker

---

## Critical files

| File                                                    | Action                                                      | Phase | Status |
| ------------------------------------------------------- | ----------------------------------------------------------- | ----- | ------ |
| `src/components/agent-sidebar/AgentSidebarProvider.tsx` | Create                                                      | 1     | ✅     |
| `src/components/agent-sidebar/AgentSidebar.tsx`         | Create                                                      | 1     | ✅     |
| `src/components/agent-sidebar/SidebarAwareWrapper.tsx`  | Create (added during implementation)                        | 1     | ✅     |
| `src/components/agent-sidebar/AgentFAB.tsx`             | Create                                                      | 1     | ✅     |
| `src/routes/__root.tsx`                                 | Modify — inject provider + sidebar                          | 1     | ✅     |
| `src/components/layout/auth-header.tsx`                 | Modify — add toggle button                                  | 1     | ✅     |
| `src/components/layout/mobile-shell.tsx`                | Modify — add FAB                                            | 1     | ✅     |
| `src/hooks/use-agent-page-context.ts`                   | Create                                                      | 2     | ✅     |
| `src/components/profile/agent/AgentChat.tsx`            | Modify — pageContext prop + smart input                     | 2, 3  | ✅     |
| `convex/agent/threadOps.ts`                             | Modify — add pageContext arg                                | 2     | ✅     |
| `convex/agent/actions.ts`                               | Modify — forward pageContext                                | 2     | ✅     |
| `convex/agent/prompts.ts`                               | Modify — context section + new user welcome + export skills | 2,3,4 | ✅     |
| `src/components/agent-sidebar/useSmartInput.ts`         | Create                                                      | 3     | ✅     |
| `convex/agent/mutations.ts`                             | Modify — add bulk apply mutation from extraction            | 3     | ✅     |
| `src/routes/profile/edit.tsx`                           | Modify — remove wizard, keep direct editor                  | 4     | ✅     |
| `src/routes/profile/agent.tsx`                          | Modify — convert to redirect                                | 4     | ✅     |
| `src/routes/login.tsx`                                  | Already redirects to `/` — no changes needed                | 4     | ✅     |
| `src/components/auth/onboarding-guard.tsx`              | Modify — remove enrichment gating                           | 4     | ✅     |
| `src/routes/org/$slug/join.tsx`                         | Modify — simplify post-join redirect                        | 4     | ✅     |

### Reused without changes

- `AgentChat.tsx` core logic (messages, streaming, tool calls, approve/undo) — only small additions
- All `convex/agent/` tools, queries, index
- `useExtraction` and `useFileUpload` hooks (at `src/components/profile/upload/hooks/`)
- `LiveProfileView.tsx`
- `ProfileWizard` and step components (for manual editing)
- `Sheet` and other shadcn components

---

## Convex Best Practices Notes

These were identified during review and are baked into the phase descriptions above. Collected here for quick reference.

1. **Validated pageContext (Phase 2)**: `pageContext` uses `v.union(v.literal(...))` — not free-form `v.string()` — to prevent arbitrary client strings reaching the LLM system prompt. The frontend hook returns enum literals; the backend maps them to human-readable descriptions.

2. **internalMutation for bulk apply (Phase 3)**: `applyExtractedDataFromSidebar` is `internalMutation` since it's called from the extraction pipeline, not directly from clients. If a client trigger is needed, wrap in a public mutation with auth checks.

3. **Return validators (Phase 3)**: All new mutations declare explicit `returns` fields. The bulk apply returns `v.array(v.id("agentToolCalls"))`.

4. **Input validation + ConvexError (Phase 3)**: Bulk apply validates nested structures with typed validators (not `v.any()`). Skills validated against taxonomy. Malformed data throws `ConvexError` with structured error codes.

5. **Synthetic message authorship (Phase 3)**: Extraction summary messages flagged with metadata to distinguish from user-typed messages. Consider a dedicated `addSystemMessage` mutation path.

6. **No new indexes needed**: Existing `by_thread_and_createdAt` and `by_profile` indexes on `agentToolCalls` cover all queries from the new mutation.

7. **Existing tech debt (out of scope)**: `updates` and `previousValues` stored as `v.string()` (JSON) sacrifice type safety. Not addressed in this plan but could be improved alongside it.

---

## Verification

1. **New user onboarding**: Sign up → land on home → sidebar auto-opens with welcome → paste LinkedIn URL → profile builds → close sidebar → browse matches
2. **Sidebar persists across navigation**: Send a message, navigate to `/opportunities`, come back to `/` — chat history preserved, no remount
3. **Context awareness**: Ask "help me" from `/matches` → agent references matches. Ask from `/profile` → agent references profile gaps
4. **Smart input**: Paste LinkedIn URL → extraction → profile updates → agent acknowledges. Paste large text → confirmation banner → extraction. Upload PDF → extraction runs.
5. **Mobile**: FAB visible above tab bar → tap → bottom sheet with full chat → dismiss → FAB reappears
6. **Desktop push layout**: Sidebar opens → page content shifts left smoothly → sidebar closes → content returns
7. **Direct edit coexistence**: Edit a field on `/profile/edit`, then ask agent → agent sees the updated value
8. **Undo flow**: Agent applies LinkedIn data → user sees tool calls → undo specific entries → profile reverts those fields
