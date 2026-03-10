# Technology Stack: v2.0 Course Program Platform

**Project:** ASTN - Course Program Platform with AI Integration
**Researched:** 2026-03-10
**Overall confidence:** HIGH

## Executive Summary

v2.0 requires **one new npm dependency** (`@convex-dev/presence` for session runner presence tracking) and **upgrades zero existing packages**. The existing stack -- `@convex-dev/agent` for tool-use AI, `@convex-dev/persistent-text-streaming` for chat streaming, Convex file storage for audio, Convex scheduled functions for timers, shadcn/ui for UI, and `react-resizable-panels` for sidebar layout -- already handles every major capability needed.

The five new feature areas map cleanly to existing infrastructure:

1. **Unified prompt system** -- Convex schema + React components (no new deps)
2. **AI sidebar (learning partner)** -- `@convex-dev/agent` (already installed at 0.6.0-alpha.1) with a second Agent instance and `useUIMessages`/`useSmoothText` hooks
3. **Facilitator agent** -- `@convex-dev/agent` with `createTool` for read/write tools, same propose-and-approve pattern already used for profile building
4. **Session runner** -- Convex reactive subscriptions + `ctx.scheduler.runAfter` for server-side timers + `@convex-dev/presence` for connected-user tracking
5. **Audio materials** -- Convex file storage (already used for document uploads) + native HTML5 `<audio>` element

The codebase already has two AI chat sidebar implementations (participant `AgentChat` + admin `AdminAgentChat`), resizable sidebar patterns, file upload infrastructure, markdown rendering, and streaming patterns. This milestone is predominantly new Convex functions, new schema tables, and new React components built on existing primitives.

## What NOT To Add

| Temptation                                   | Why Not                                                                                                                                          | What Instead                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Socket.io / Pusher for real-time             | Convex reactive subscriptions are already real-time via WebSocket; adding a separate real-time layer creates two sources of truth                | Use Convex `useQuery` subscriptions which auto-update when data changes                             |
| Timer library (react-timer-hook, etc.)       | Server-side timers via Convex `ctx.scheduler.runAfter` + client reads from `sessionLiveState.phaseStartedAt` and computes remaining time locally | `phaseStartedAt` timestamp in DB + client-side `useEffect` with `setInterval` for display countdown |
| Rich text editor (TipTap, Slate, etc.)       | Prompt responses are short text or choice selections; markdown rendering via existing `marked` + `dompurify` covers facilitator notes            | Plain `<Textarea>` for responses + markdown rendering for display                                   |
| Separate WebRTC / video for sessions         | Sessions are in-person (BAISH) or use external Zoom; platform handles the structured activities, not the video call                              | Session runner manages phases/prompts/pairs; video stays external                                   |
| `howler.js` or audio library                 | HTML5 `<audio>` element handles MP3 playback natively; only need play/pause/seek which the browser provides                                      | Custom `<AudioPlayer>` component wrapping native `<audio>` with shadcn/ui styling                   |
| `@tanstack/react-virtual` for response lists | Session cohorts are ~10 people; virtualizing 10 response cards is overhead with no benefit                                                       | Simple `.map()` rendering; revisit only if cohorts grow to 100+                                     |
| `zustand` / `jotai` for session state        | Session live state is server-authoritative (facilitator controls phases); Convex reactive queries already provide the client state               | `useQuery(api.sessions.getLiveState)` -- single source of truth                                     |
| `@convex-dev/workflow` for session phases    | Phase sequencing is facilitator-driven (manual advance), not automated; a workflow engine adds complexity for a human-in-the-loop flow           | Simple `currentPhaseIndex` field that increments via mutation                                       |
| Separate notification system                 | Pilot is 10-person in-person cohort using WhatsApp; build notifications when scaling to multiple remote cohorts                                  | Facilitator (or agent) sends reminders manually via WhatsApp                                        |

## Recommended Stack

### New Dependency

| Package                | Version | Purpose                                           | Why                                                                                                                                                                                                                      |
| ---------------------- | ------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@convex-dev/presence` | ^0.3.0  | Track connected participants during live sessions | Efficient heartbeat-based presence without polling; Convex-native component using scheduled functions so clients only get updates when users join/leave. Needed for "who's connected" display and absence-aware pairing. |

**Installation:**

```bash
bun add @convex-dev/presence
```

**Convex config addition** (`convex/convex.config.ts`):

```typescript
import presence from '@convex-dev/presence/convex.config'
app.use(presence)
```

**Rationale:** The session runner needs to know which participants are currently connected to handle real-time pairing (pair from connected users, not from RSVP list) and show the facilitator who's present. Convex's own presence component is the canonical solution -- heartbeat-based, efficient (no re-running queries on every heartbeat), and includes a React `usePresence` hook that handles heartbeats and graceful disconnect automatically.

### Existing Dependencies (No Changes Needed)

#### AI Layer

| Technology                              | Installed Version | Purpose in v2.0                                                               | Notes                                                                                                                                                                     |
| --------------------------------------- | ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@convex-dev/agent`                     | 0.6.0-alpha.1     | Learning partner sidebar + Facilitator agent                                  | Create two new `Agent` instances with different tools and instructions. Already used for profile agent with `createTool`, `streamText`, `useUIMessages`, `useSmoothText`. |
| `@ai-sdk/anthropic`                     | ^3.0.46           | Model provider for Agent instances                                            | Same `anthropic.chat('claude-sonnet-4-6')` pattern used by `profileAgent`                                                                                                 |
| `@convex-dev/persistent-text-streaming` | 0.3.0             | Fallback streaming for non-agent AI calls (e.g., proactive exercise feedback) | Already used for enrichment chat; same `useStream` pattern                                                                                                                |

**Agent architecture for v2.0:**

Two new Agent instances alongside the existing `profileAgent`:

```typescript
// convex/program/agents/learningPartner.ts
export const learningPartnerAgent = new Agent(components.agent, {
  name: 'learning-partner',
  languageModel: anthropic.chat('claude-sonnet-4-6'),
  instructions: '', // Set dynamically per-turn with module context
  tools: {
    // Read-only tools -- no write access
    get_module_materials: getModuleMaterials,
    get_my_progress: getMyProgress,
    get_my_responses: getMyResponses,
    get_upcoming_session: getUpcomingSession,
  },
  stopWhen: stepCountIs(5),
})

// convex/program/agents/facilitatorAgent.ts
export const facilitatorAgent = new Agent(components.agent, {
  name: 'facilitator-copilot',
  languageModel: anthropic.chat('claude-sonnet-4-6'),
  instructions: '', // Set dynamically with full program context
  tools: {
    // Read tools (no approval needed)
    query_participant_progress: queryParticipantProgress,
    query_prompt_responses: queryPromptResponses,
    query_attendance: queryAttendance,
    query_session_data: querySessionData,
    query_sidebar_conversations: querySidebarConversations,
    // Write tools (all create proposals, not direct writes)
    draft_comment: draftComment,
    draft_message: draftMessage,
    suggest_pairs: suggestPairs,
    draft_session_summary: draftSessionSummary,
    flag_pattern: flagPattern,
    create_adhoc_prompt: createAdhocPrompt,
  },
  stopWhen: stepCountIs(10),
})
```

**Why `@convex-dev/agent` for both (not raw Anthropic SDK):**

- Thread management (conversation history per participant per module, per facilitator per program) is built in
- `createTool` gives the agent typed access to Convex queries/mutations with the same `ctx.runQuery`/`ctx.runMutation` pattern already proven in the profile agent
- `streamText` with `saveStreamDeltas` provides real-time streaming to the UI with word-level chunking
- `useUIMessages` + `useSmoothText` React hooks handle the display side without custom streaming code
- The propose-and-approve pattern (agent writes to `agentProposals` table, facilitator approves) maps directly to the existing `proposeToolChange` pattern from the profile agent's tools

**Why Sonnet 4.6 for both agents:**

- Learning partner needs to reason about AI safety concepts, give Socratic feedback on exercises, and synthesize module materials -- this is quality reasoning, not bulk classification
- Facilitator agent needs to synthesize multiple participants' responses, identify patterns, draft coherent comments -- again, quality reasoning
- Haiku 4.5 would be appropriate for a future "batch summary" background job but not for interactive agent conversations
- Cost is manageable: ~10 participants x ~5 sidebar messages per session = ~50 Sonnet calls/session at ~$0.01-0.03 each = $0.50-1.50/session

#### Backend

| Technology                 | Installed Version | Purpose in v2.0                                                                   | Notes                                                   |
| -------------------------- | ----------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `convex`                   | 1.32.0            | Database, real-time sync, serverless functions, file storage, scheduled functions | 5 new tables, 2 table updates, ~20 new Convex functions |
| `zod`                      | ^3.25             | LLM output validation (shadow mode for agent proposals)                           | Same pattern as matching/career actions validation      |
| `@convex-dev/rate-limiter` | 0.3.2             | Rate limit AI sidebar messages and prompt submissions                             | Already configured; add new rate limit keys             |

**Schema additions (all in existing `convex/schema.ts`):**

- `prompts` -- unified prompt primitive
- `promptResponses` -- participant responses with visibility control
- `agentProposals` -- facilitator agent propose-and-approve workflow
- `facilitatorComments` -- approved comments on responses
- `sessionLiveState` -- real-time session state (current phase, timer, pairs)
- `sidebarConversations` -- metadata table linking threads to modules (actual messages stored by `@convex-dev/agent` component)
- Update `programModules` materials validator to add `"audio"` type and `isEssential` boolean
- Update `programSessions` to add `phases` array

**Key Convex patterns for v2.0:**

1. **Server-side timer:** Store `phaseStartedAt: number` and `durationMinutes: number` in `sessionLiveState`. Client computes remaining = `durationMinutes * 60 * 1000 - (Date.now() - phaseStartedAt)` reactively. No `ctx.scheduler.runAfter` needed for the timer display -- it's purely computed. Optionally schedule a "phase expired" notification mutation.

2. **Write-then-reveal:** `promptResponses.visibility` starts as `"private"`. Facilitator calls `revealResponses({ promptId })` mutation which sets all responses for that prompt to `"revealed"`. Participants' query filters by `visibility === "revealed" || userId === currentUser`.

3. **File storage for audio:** Already have `generateUploadUrl` and `saveDocument` mutations. Audio uploads use the same pattern -- facilitator uploads MP3, gets `storageId`, stores it in the module's materials array. Playback URL via `ctx.storage.getUrl(storageId)`.

#### Frontend

| Technology                 | Installed Version | Purpose in v2.0                                                       | Notes                                                                        |
| -------------------------- | ----------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| shadcn/ui + radix-ui       | 1.4.3             | All UI components (Card, Dialog, Textarea, Switch, Badge, etc.)       | No new shadcn components needed beyond what's installed                      |
| `react-resizable-panels`   | ^4                | Sidebar layout for AI chat panels                                     | Already used in `AgentProfileBuilder`; reuse pattern for participant sidebar |
| `lucide-react`             | ^0.562.0          | Icons (Timer, Play, Pause, Users, MessageSquare, etc.)                | Already installed with extensive icon set                                    |
| `class-variance-authority` | ^0.7.1            | Variant classes for prompt cards, phase indicators, proposal cards    | Already used throughout                                                      |
| `sonner`                   | ^2.0.7            | Toast notifications for phase changes, reveals, etc.                  | Already used throughout                                                      |
| `marked` + `dompurify`     | 17.0.3 / 3.3.1    | Markdown rendering for prompt text, facilitator notes, agent messages | Already used in AgentChat, AdminAgentChat, and module views                  |
| `date-fns`                 | ^4.1.0            | Time formatting for timers, session dates                             | Already used throughout                                                      |
| `@use-gesture/react`       | ^10.3.1           | Drag interactions (if needed for manual pairing UI)                   | Already installed                                                            |

#### Styling

| Technology       | Installed Version | Purpose in v2.0                                        | Notes                |
| ---------------- | ----------------- | ------------------------------------------------------ | -------------------- |
| `tailwindcss`    | ^4.1.13           | All styling                                            | No new config needed |
| `tw-animate-css` | ^1.4.0            | Entry animations for response cards, phase transitions | Already configured   |

**New CSS tokens needed:**

- Session-specific colors for phase states (active, upcoming, completed)
- Timer color states (normal, warning at <2min, expired)
- These are small additions to existing OKLCH token system in `app.css`

### Audio Player Component (Build Custom, No Library)

For audio material playback, build a small custom `<AudioPlayer>` component using:

- Native HTML5 `<audio>` element for playback (ref-based control)
- `useRef` for the audio element, `useState` for playing/currentTime/duration
- `loadedmetadata` event for duration, `timeupdate` for progress
- shadcn/ui `Slider` for seek bar, `Button` for play/pause
- Convex `ctx.storage.getUrl(storageId)` for the audio source URL

**Why not a library:** The audio player needs to play a single MP3 file with play/pause/seek. That is 30-40 lines of React with native `<audio>`. Libraries like `react-h5-audio-player` or `howler.js` add dependencies for features we do not need (playlists, equalizers, visualizations). The shadcn ecosystem has audio player patterns (see shadcn.io dialog-audio-player block) that match our design system.

**Implementation sketch:**

```typescript
function AudioPlayer({ storageId }: { storageId: Id<'_storage'> }) {
  const audioUrl = useQuery(api.modules.getAudioUrl, { storageId })
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  // loadedmetadata -> setDuration
  // timeupdate -> setProgress
  // play/pause toggle
  // Slider onChange -> audioRef.current.currentTime = ...

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Button size="icon" variant="ghost" onClick={togglePlay}>
        {playing ? <Pause /> : <Play />}
      </Button>
      <Slider value={[progress]} max={duration} onValueChange={seek} />
      <span className="text-xs text-muted-foreground">{formatTime(progress)}/{formatTime(duration)}</span>
    </div>
  )
}
```

### Session Timer (Build Custom, No Library)

The session timer is a display-only countdown computed from server-authoritative timestamps:

```typescript
function PhaseTimer({ phaseStartedAt, durationMinutes, extensions }: {
  phaseStartedAt: number
  durationMinutes: number
  extensions: number // seconds added
}) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const totalMs = (durationMinutes * 60 + extensions) * 1000
    const tick = () => {
      const elapsed = Date.now() - phaseStartedAt
      setRemaining(Math.max(0, totalMs - elapsed))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [phaseStartedAt, durationMinutes, extensions])

  const isWarning = remaining > 0 && remaining < 120_000 // <2 min
  const isExpired = remaining === 0

  return (
    <span className={cn(
      "font-mono text-2xl",
      isWarning && "text-amber-500",
      isExpired && "text-red-500 animate-pulse"
    )}>
      {formatTimer(remaining)}
    </span>
  )
}
```

**Why server-authoritative:** The facilitator sets the timer by advancing phases (which writes `phaseStartedAt` to `sessionLiveState`). All participants read this same timestamp via `useQuery` and compute remaining time locally. This ensures everyone sees the same timer without WebSocket timer sync complexity. Timer drift of up to 1-2 seconds between clients is acceptable for a 5-20 minute phase.

### Pairing Algorithm (Pure TypeScript, No Library)

Pairing for ~10 participants is trivial:

- **Complementary:** Group by exercise choice, interleave groups, pair adjacent
- **Random:** Fisher-Yates shuffle, pair adjacent, handle odd number (create one trio)
- **Manual:** Facilitator drag-and-drop using existing `@use-gesture/react`

This is 20-30 lines of pure TypeScript. No graph matching library needed.

### Presence Integration

```typescript
// convex/program/presence.ts
import { Presence } from '@convex-dev/presence'
import { components } from '../_generated/api'

export const presence = new Presence(components.presence)

// Expose mutations/queries for the React hook
export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx) // Add auth check
    return await presence.heartbeat(
      ctx,
      args.roomId,
      args.userId,
      args.sessionId,
      args.interval,
    )
  },
})

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken)
  },
})

export const disconnect = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await presence.disconnect(ctx, sessionToken)
  },
})
```

**Client usage:**

```typescript
import usePresence from '@convex-dev/presence/react'

// In session participant view
const presenceState = usePresence(
  api.program.presence,
  `session-${sessionId}`,
  userId,
)
```

**Room ID convention:** `session-${sessionId}` for live sessions. This gives the facilitator a real-time list of who's connected, which feeds into pairing decisions and the "who's here" display.

## Integration Points

### How New Features Connect to Existing Code

| New Feature       | Connects To                       | How                                                                                              |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Prompt system     | `programModules` table            | Prompts have optional `moduleId` for pre-work, optional `sessionId` for in-session               |
| Prompt responses  | `programParticipation`            | Can update `materialsCompleted` count when prompts are completed                                 |
| AI sidebar        | `profileAgent` pattern            | Same `Agent` class, `createTool`, `streamText`, `useUIMessages` -- new instance, different tools |
| Facilitator agent | `AdminAgentChat` pattern          | Same sidebar layout pattern; different agent instance with program-specific tools                |
| Session runner    | `programSessions` table           | Adds `phases` array to existing table + new `sessionLiveState` table for live state              |
| Audio materials   | `upload.ts` / `generateUploadUrl` | Same file storage pattern; add "audio" to material type validator                                |
| Presence          | Session runner                    | `usePresence` provides connected user list; session runner reads this for pairing                |

### What Stays the Same

- Authentication: Clerk + `requireAuth` / `getUserId` helpers unchanged
- Auth patterns: Same `requireOrgAdmin` for facilitator endpoints
- Rate limiting: Same `@convex-dev/rate-limiter` with new keys
- Markdown rendering: Same `marked` + `dompurify` pipeline
- Agent streaming: Same `saveStreamDeltas` + `useUIMessages` pattern
- File upload: Same `generateUploadUrl` + `saveDocument` flow
- Logging: Same `convex/lib/logging.ts` structured logging
- LLM usage tracking: Same `lib/llmUsage.logUsage` pattern

## Model Selection

| Use Case                    | Model             | Rationale                                                         | Est. Cost per Session                     |
| --------------------------- | ----------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| Learning partner sidebar    | Claude Sonnet 4.6 | Quality reasoning for Socratic feedback on AI safety concepts     | ~$0.50-1.50 (50 messages x $0.01-0.03)    |
| Facilitator agent           | Claude Sonnet 4.6 | Synthesizing responses, drafting comments, pattern identification | ~$0.30-1.00 (30 messages x $0.01-0.03)    |
| Proactive exercise feedback | Claude Sonnet 4.6 | Quality feedback on participant submissions                       | ~$0.10-0.30 (10 submissions x $0.01-0.03) |

**Total estimated AI cost per weekly session:** ~$1-3 for a 10-person cohort. Acceptable for pilot.

**Future optimization:** If scaling to multiple concurrent cohorts, consider:

- Haiku 4.5 for batch session summaries (post-session, not interactive)
- Haiku 4.5 for pattern detection across responses (structured classification)
- Caching module context to reduce input tokens on repeated sidebar messages

## Versions Summary

| Package                                 | Current       | Required      | Action             |
| --------------------------------------- | ------------- | ------------- | ------------------ |
| `@convex-dev/agent`                     | 0.6.0-alpha.1 | 0.6.0-alpha.1 | No change          |
| `@convex-dev/persistent-text-streaming` | 0.3.0         | 0.3.0         | No change          |
| `@convex-dev/rate-limiter`              | 0.3.2         | 0.3.2         | No change          |
| `@convex-dev/presence`                  | Not installed | ^0.3.0        | **NEW -- install** |
| `convex`                                | 1.32.0        | 1.32.0        | No change          |
| `@ai-sdk/anthropic`                     | ^3.0.46       | ^3.0.46       | No change          |
| `react-resizable-panels`                | ^4            | ^4            | No change          |
| `marked`                                | ^17.0.3       | ^17.0.3       | No change          |
| `dompurify`                             | ^3.3.1        | ^3.3.1        | No change          |

## Installation

```bash
# The only new dependency
bun add @convex-dev/presence
```

No other installation steps needed. All other dependencies are already present.

## Sources

- [Convex Agent documentation (Context7)](https://docs.convex.dev/agents) -- HIGH confidence
- [Convex Agent GitHub - tools and multiple agents](https://github.com/get-convex/agent) -- HIGH confidence
- [Convex Presence component](https://www.convex.dev/components/presence) -- HIGH confidence
- [@convex-dev/presence npm](https://www.npmjs.com/package/@convex-dev/presence) -- version 0.3.0 confirmed
- [Convex file storage docs](https://docs.convex.dev/file-storage/upload-files) -- HIGH confidence
- [Convex scheduled functions docs](https://docs.convex.dev/scheduling/scheduled-functions) -- HIGH confidence
- [Convex persistent text streaming](https://github.com/get-convex/persistent-text-streaming) -- HIGH confidence
- Existing codebase patterns: `convex/agent/index.ts`, `convex/agent/tools.ts`, `convex/enrichment/streaming.ts`, `convex/upload.ts`, `src/components/profile/agent/AgentChat.tsx`, `src/components/admin-agent/AdminAgentChat.tsx` -- verified by reading source
