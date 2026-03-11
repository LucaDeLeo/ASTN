# Phase 38: AI Sidebar - Research

**Researched:** 2026-03-10
**Domain:** AI chat sidebar with @convex-dev/agent, Socratic learning partner, Convex real-time streaming
**Confidence:** HIGH

## Summary

Phase 38 builds a per-module AI learning partner sidebar on the program page. The project already has a mature `@convex-dev/agent` integration (version `0.6.0-alpha.1`) powering the profile agent sidebar -- including thread management, streaming with `saveStreamDeltas`, `useUIMessages` hook, and `optimisticallySendMessage`. The sidebar pattern (left panel with resize, mobile Sheet, keyboard shortcut) also already exists in `src/components/agent-sidebar/`. This phase reuses these proven patterns but scopes them to course modules instead of profile enrichment.

The key architectural difference is threading granularity: the existing profile agent uses one thread per user (stored on `profiles.agentThreadId`), while the course sidebar needs one thread per user per module. This means a lookup table or new index pattern rather than storing the thread ID on a single document. The `@convex-dev/agent` component manages its own internal tables for threads and messages, so the project just needs a mapping table (`courseSidebarThreads`) to find the right thread for a given user+module pair.

**Primary recommendation:** Reuse the existing `profileAgent` pattern (Agent definition, threadOps mutations, queries with `listUIMessages`/`syncStreams`, and `useUIMessages` React hook) but create a new `learningAgent` with Socratic instructions. Add a `courseSidebarThreads` mapping table, an `aiFeedback` field on `coursePrompts`, and build the UI as a right-side panel on the program page (separate from the existing left-side profile agent sidebar).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

The CONTEXT.md had no explicit Decisions/Discretion/Deferred sections (Codex review timed out). However, STATE.md records these locked decisions:

- Participant AI sidebar uses `@convex-dev/agent` inside Convex with ASTN API keys
- Sidebar messages must use separate table (not embedded array) to avoid 1 MiB Convex document limit
- New course features go in `convex/course/` directory (`convex/programs.ts` already 1000+ lines)

### Claude's Discretion

Four items flagged for review in CONTEXT.md:

1. **Proactive feedback delivery** -- auto-inject vs toast notification (leaning auto-inject)
2. **Sidebar position** -- right side vs replace profile sidebar (leaning right side)
3. **`@convex-dev/agent` multi-agent support** -- needs verification on alpha API
4. **Facilitator conversation viewing** -- MEDIUM confidence, depends on agent message query API

### Deferred Ideas (OUT OF SCOPE)

None explicitly listed.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                        | Research Support                                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| SIDE-01 | Participant can chat with an AI learning partner from the program page                             | New `learningAgent` definition + right-side sidebar panel reusing existing sidebar component patterns                               |
| SIDE-02 | AI sidebar has context of current module materials, participant's progress, and exercise responses | System prompt built dynamically per-turn with module data, `materialProgress`, and `coursePromptResponses` queries                  |
| SIDE-03 | AI uses Socratic method when participants ask about exercises                                      | Enforced via agent `instructions` with explicit Socratic pedagogy rules; no code change needed beyond prompt engineering            |
| SIDE-04 | AI proactively offers feedback when participant submits a prompt with `aiFeedback` enabled         | Add `aiFeedback` field to `coursePrompts` schema; trigger scheduled action from `saveResponse` mutation when `aiFeedback && submit` |
| SIDE-05 | AI can recommend study priorities based on remaining materials and deadlines                       | Context builder includes incomplete materials list + session dates; instructions tell agent to prioritize by deadline proximity     |
| SIDE-06 | Conversation history persists per-participant per-module                                           | `courseSidebarThreads` mapping table (userId + moduleId -> threadId); `@convex-dev/agent` handles message persistence internally    |
| SIDE-07 | Facilitator can view participant sidebar conversations from admin page                             | Query `courseSidebarThreads` by programId, then `listUIMessages` per thread; read-only view on admin program page                   |
| SIDE-08 | Sidebar runs via `@convex-dev/agent` with ASTN API keys                                            | Already installed (`0.6.0-alpha.1`), already configured in `convex.config.ts`; uses `ANTHROPIC_API_KEY` env var on server           |

</phase_requirements>

## Standard Stack

### Core

| Library                  | Version         | Purpose                                    | Why Standard                                                 |
| ------------------------ | --------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `@convex-dev/agent`      | `0.6.0-alpha.1` | Agent thread/message management, streaming | Already installed and battle-tested in profile agent sidebar |
| `@ai-sdk/anthropic`      | `^3.0.46`       | Anthropic model provider for AI SDK        | Already installed, used by `profileAgent`                    |
| `ai`                     | `^6.0.95`       | Vercel AI SDK core (tool definitions)      | Already installed, peer dependency of `@convex-dev/agent`    |
| `convex`                 | `^1.32.0`       | Backend platform                           | Core project infrastructure                                  |
| `react-resizable-panels` | `^4`            | Panel layout (if needed for split view)    | Already installed                                            |

### Supporting

| Library                   | Version    | Purpose                          | When to Use                                          |
| ------------------------- | ---------- | -------------------------------- | ---------------------------------------------------- |
| `@convex-dev/agent/react` | (bundled)  | `useUIMessages`, `useSmoothText` | Frontend message rendering with streaming            |
| `lucide-react`            | `^0.562.0` | Icons (MessageSquare, Bot, etc.) | Sidebar toggle button, message UI                    |
| `sonner`                  | `^2.0.7`   | Toast notifications              | Proactive feedback notification if auto-inject fails |

### Alternatives Considered

| Instead of                              | Could Use                           | Tradeoff                                                                              |
| --------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `@convex-dev/agent` threads             | Custom messages table               | Agent handles streaming, history, embeddings automatically; custom = reimplementation |
| Right-side panel                        | Reuse existing left-side sidebar    | Would conflict with profile agent; separate sidebars serve different purposes         |
| `@convex-dev/persistent-text-streaming` | Agent's built-in `saveStreamDeltas` | Agent has streaming built in; persistent-text-streaming is for non-agent chat         |

**Installation:** Nothing new to install. All dependencies already present.

## Architecture Patterns

### Recommended Project Structure

```
convex/course/
  _helpers.ts          # Existing auth helpers
  prompts.ts           # Existing (add aiFeedback field)
  responses.ts         # Existing (add trigger for proactive feedback)
  sidebar.ts           # NEW: thread management, message sending, context building
  sidebarAgent.ts      # NEW: "use node" - Agent definition + streaming action
  sidebarQueries.ts    # NEW: listMessages, facilitator view queries

src/components/course/
  AISidebar.tsx         # NEW: sidebar panel component
  AISidebarProvider.tsx # NEW: context provider (moduleId-scoped thread management)
  AISidebarChat.tsx     # NEW: chat messages + input (reuse patterns from AgentChat)
  AISidebarToggle.tsx   # NEW: toggle button on program page
```

### Pattern 1: Per-Module Thread Mapping

**What:** A `courseSidebarThreads` table maps (userId, moduleId) to a `@convex-dev/agent` thread ID. This replaces the profile agent's pattern of storing `agentThreadId` on the profile document.

**When to use:** When one user needs multiple independent conversation threads scoped to different entities.

**Example:**

```typescript
// convex/schema.ts addition
courseSidebarThreads: defineTable({
  userId: v.string(),
  moduleId: v.id('programModules'),
  programId: v.id('programs'), // Denormalized for facilitator queries
  threadId: v.string(), // @convex-dev/agent thread ID
  createdAt: v.number(),
})
  .index('by_userId_and_moduleId', ['userId', 'moduleId'])
  .index('by_programId', ['programId'])
  .index('by_programId_and_userId', ['programId', 'userId'])
```

### Pattern 2: Dynamic System Prompt per Turn

**What:** The system prompt is rebuilt on every `streamText` call with fresh context (module materials, progress, responses). This is the exact pattern used by the existing profile agent in `convex/agent/actions.ts`.

**When to use:** When context changes between turns (user completes materials, submits responses).

**Example:**

```typescript
// convex/course/sidebarAgent.ts
'use node'
import { Agent, stepCountIs } from '@convex-dev/agent'
import { anthropic } from '@ai-sdk/anthropic'
import { components } from '../_generated/api'

export const learningAgent = new Agent(components.agent, {
  name: 'learning-partner',
  languageModel: anthropic.chat('claude-sonnet-4-6'),
  instructions: '', // Set dynamically per-turn
  tools: {}, // No tools needed for learning partner
  stopWhen: stepCountIs(3),
})
```

### Pattern 3: Proactive Feedback via Scheduler

**What:** When a prompt response is submitted and the prompt has `aiFeedback: true`, schedule an action that auto-generates a sidebar message. The scheduler pattern (`ctx.scheduler.runAfter(0, ...)`) is already used for the profile agent's `streamResponse`.

**When to use:** SIDE-04 proactive feedback.

**Example:**

```typescript
// In convex/course/responses.ts saveResponse mutation, after successful submit:
if (submit && prompt.aiFeedback) {
  // Ensure thread exists for this user+module
  const thread = await getOrCreateSidebarThread(
    ctx,
    userId,
    moduleId,
    programId,
  )

  // Save a system-injected user message describing the submission
  const { messageId } = await saveMessage(ctx, components.agent, {
    threadId: thread.threadId,
    prompt: `[System: Participant just submitted their response to "${prompt.title}". Please review and provide Socratic feedback.]`,
  })

  await ctx.scheduler.runAfter(0, internal.course.sidebarAgent.streamFeedback, {
    threadId: thread.threadId,
    promptMessageId: messageId,
    moduleId,
    promptId,
    userId,
  })
}
```

### Pattern 4: Facilitator Read-Only View

**What:** Facilitators query `courseSidebarThreads` by programId to list all participants' threads, then use `listUIMessages` to render conversations read-only.

**When to use:** SIDE-07 admin page integration.

**Example:**

```typescript
// convex/course/sidebarQueries.ts
export const getParticipantThreads = query({
  args: { programId: v.id('programs') },
  returns: v.any(),
  handler: async (ctx, { programId }) => {
    // Auth check: must be org admin
    const program = await ctx.db.get('programs', programId)
    if (!program) return []
    await requireOrgAdmin(ctx, program.orgId)

    return await ctx.db
      .query('courseSidebarThreads')
      .withIndex('by_programId', (q) => q.eq('programId', programId))
      .collect()
  },
})
```

### Anti-Patterns to Avoid

- **Embedding messages in a document array:** Convex documents have a 1 MiB limit. The `@convex-dev/agent` component stores messages in its own internal tables, which is the correct approach.
- **Creating a new Agent instance per request:** The `Agent` class should be instantiated once at module level (like `profileAgent`), not inside a handler.
- **Using `generateText` for chat:** Use `streamText` with `saveStreamDeltas` for responsive UX. The existing profile agent already demonstrates this.
- **Sharing threads across modules:** Each module gets its own thread. Mixing contexts from different modules would confuse the AI and lose conversation coherence.

## Don't Hand-Roll

| Problem                       | Don't Build                            | Use Instead                                          | Why                                                           |
| ----------------------------- | -------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Message persistence/streaming | Custom messages table + SSE            | `@convex-dev/agent` threads + `saveStreamDeltas`     | Built-in streaming, pagination, real-time sync                |
| Chat UI message rendering     | Custom message components from scratch | `useUIMessages` hook + existing `AgentChat` patterns | Handles streaming states, pagination, optimistic updates      |
| Thread management             | Manual thread ID generation            | `createThread` from `@convex-dev/agent`              | Manages internal state, user association, metadata            |
| Streaming abort               | Custom abort mechanism                 | `abortStream` from `@convex-dev/agent`               | Already integrated with agent's stream lifecycle              |
| Sidebar panel layout          | Custom CSS positioning                 | Copy existing `AgentSidebar` component patterns      | Resize handle, mobile Sheet, keyboard shortcut already proven |

**Key insight:** The entire backend infrastructure for AI chat already exists in this project. The learning sidebar is essentially a re-skinned version of the profile agent sidebar with different system prompts and a different thread-scoping strategy.

## Common Pitfalls

### Pitfall 1: Thread Leaking Across Modules

**What goes wrong:** If thread lookup fails, a new thread gets created every time, leading to orphaned threads and lost conversation history.
**Why it happens:** Race condition in getOrCreate pattern when sidebar opens.
**How to avoid:** Use a mutex pattern in the mutation -- check for existing thread within the same transaction, create only if absent. The Convex transaction model prevents concurrent creates for the same (userId, moduleId) pair if you do both read+write in one mutation.
**Warning signs:** Multiple `courseSidebarThreads` rows for the same userId+moduleId.

### Pitfall 2: Oversized System Prompts

**What goes wrong:** Stuffing all module materials (full URLs, descriptions, every exercise response) into the system prompt exceeds context limits or burns tokens.
**Why it happens:** Eager context building without token awareness.
**How to avoid:** Include material titles/types/completion status but NOT full content. Include only the current module's prompt titles and the user's submitted text responses (truncated to ~500 chars each). Keep system prompt under ~2000 tokens.
**Warning signs:** Slow responses, high token costs, truncated context.

### Pitfall 3: Proactive Feedback Racing with Sidebar Open

**What goes wrong:** User submits a prompt response while the sidebar is closed. The proactive feedback fires, but the user doesn't see it until they open the sidebar later -- and then it appears out of context.
**Why it happens:** The feedback is auto-injected as a message in the thread regardless of sidebar state.
**How to avoid:** This is actually the correct behavior -- the message persists in the thread and appears when the sidebar is opened. Optionally show a toast notification ("AI has feedback on your submission") to prompt the user to open the sidebar.
**Warning signs:** Users not noticing feedback exists.

### Pitfall 4: `"use node"` Directive Missing

**What goes wrong:** Convex action files using `@ai-sdk/anthropic` fail at deploy time with cryptic errors.
**Why it happens:** The `anthropic()` provider requires Node.js built-ins not available in Convex's default runtime.
**How to avoid:** Always add `'use node'` as the first line of any file that imports from `@ai-sdk/anthropic` or calls LLM APIs.
**Warning signs:** Deploy errors mentioning missing modules or runtime incompatibility.

### Pitfall 5: Not Scoping Facilitator View Queries

**What goes wrong:** Facilitator sees sidebar conversations from other programs, or non-admin users access conversation data.
**Why it happens:** Missing auth checks or incorrect index usage.
**How to avoid:** Always verify org admin status before returning thread data. Index `courseSidebarThreads` by `programId` and filter by it in queries. Use `requireOrgAdmin` helper from `convex/course/_helpers.ts`.
**Warning signs:** Data leakage across programs.

## Code Examples

### Creating the Learning Agent (verified from existing profileAgent pattern)

```typescript
// convex/course/sidebarAgent.ts
'use node'

import { v } from 'convex/values'
import { Agent, stepCountIs } from '@convex-dev/agent'
import { anthropic } from '@ai-sdk/anthropic'
import { components, internal } from '../_generated/api'
import { internalAction } from '../_generated/server'

export const learningAgent = new Agent(components.agent, {
  name: 'learning-partner',
  languageModel: anthropic.chat('claude-sonnet-4-6'),
  instructions: '', // Dynamic per-turn
  tools: {},
  stopWhen: stepCountIs(3),
})

export const streamResponse = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    moduleId: v.id('programModules'),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, promptMessageId, moduleId, userId }) => {
    // Build context: module materials, progress, responses
    const context = await ctx.runQuery(
      internal.course.sidebar.buildModuleContext,
      { moduleId, userId },
    )

    const system = buildLearningSystemPrompt(context)

    const { thread } = await learningAgent.continueThread(ctx, { threadId })
    const result = await thread.streamText(
      { promptMessageId, system } as Parameters<typeof thread.streamText>[0],
      { saveStreamDeltas: { chunking: 'word', throttleMs: 100 } },
    )
    await result.consumeStream()
    return null
  },
})
```

### Thread Operations (verified from existing threadOps.ts pattern)

```typescript
// convex/course/sidebar.ts
import { v } from 'convex/values'
import { createThread, saveMessage } from '@convex-dev/agent'
import { components, internal } from '../_generated/api'
import { mutation, internalQuery } from '../_generated/server'
import { requireAuth } from '../lib/auth'
import { checkProgramAccess } from './_helpers'

export const getOrCreateThread = mutation({
  args: {
    moduleId: v.id('programModules'),
  },
  returns: v.string(),
  handler: async (ctx, { moduleId }) => {
    const userId = await requireAuth(ctx)

    // Check existing thread
    const existing = await ctx.db
      .query('courseSidebarThreads')
      .withIndex('by_userId_and_moduleId', (q) =>
        q.eq('userId', userId).eq('moduleId', moduleId),
      )
      .first()

    if (existing) return existing.threadId

    // Verify access
    const module = await ctx.db.get('programModules', moduleId)
    if (!module) throw new Error('Module not found')
    const program = await ctx.db.get('programs', module.programId)
    if (!program) throw new Error('Program not found')
    await checkProgramAccess(ctx, program)

    // Create new thread
    const threadId = await createThread(ctx, components.agent, { userId })
    await ctx.db.insert('courseSidebarThreads', {
      userId,
      moduleId,
      programId: module.programId,
      threadId,
      createdAt: Date.now(),
    })

    return threadId
  },
})

export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    moduleId: v.id('programModules'),
  },
  returns: v.string(),
  handler: async (ctx, { threadId, prompt, moduleId }) => {
    const userId = await requireAuth(ctx)

    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    })

    await ctx.scheduler.runAfter(
      0,
      internal.course.sidebarAgent.streamResponse,
      {
        threadId,
        promptMessageId: messageId,
        moduleId,
        userId,
      },
    )

    return messageId
  },
})
```

### Message Query (verified from existing agent/queries.ts pattern)

```typescript
// convex/course/sidebarQueries.ts
import { v } from 'convex/values'
import { listUIMessages, syncStreams, vStreamArgs } from '@convex-dev/agent'
import { paginationOptsValidator } from 'convex/server'
import { components } from '../_generated/api'
import { query } from '../_generated/server'

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const streams = await syncStreams(ctx, components.agent, args)
    const paginated = await listUIMessages(ctx, components.agent, args)
    return { ...paginated, streams }
  },
})
```

### Frontend Usage (verified from existing AgentChat pattern)

```typescript
// In AISidebarChat.tsx
import {
  useUIMessages,
  useSmoothText,
  optimisticallySendMessage,
} from '@convex-dev/agent/react'
import { api } from '../../../convex/_generated/api'

const { results: messages } = useUIMessages(
  api.course.sidebarQueries.listMessages,
  { threadId },
  { initialNumItems: 50, stream: true },
)

const sendMessageMut = useMutation(
  api.course.sidebar.sendMessage,
).withOptimisticUpdate(
  optimisticallySendMessage(api.course.sidebarQueries.listMessages),
)
```

## State of the Art

| Old Approach                        | Current Approach                       | When Changed   | Impact                                                           |
| ----------------------------------- | -------------------------------------- | -------------- | ---------------------------------------------------------------- |
| Custom SSE streaming                | `@convex-dev/agent` `saveStreamDeltas` | Already in use | Eliminates manual SSE parsing, auto-persists                     |
| `persistentTextStreaming` component | Agent's built-in streaming             | Already in use | Profile agent already migrated; enrichment chat uses old pattern |
| Manual message tables               | Agent component internal tables        | Already in use | Thread management, pagination, streaming handled by component    |

**Deprecated/outdated:**

- The enrichment chat in `convex/enrichment/streaming.ts` uses the older `@convex-dev/persistent-text-streaming` pattern with manual SSE parsing. The learning sidebar should NOT follow this pattern -- use the agent's built-in streaming instead.

## Open Questions

1. **Multi-agent on same Convex component**
   - What we know: Both `profileAgent` and `learningAgent` will use `components.agent` from the same `@convex-dev/agent` installation. The existing code creates one Agent instance per file (`convex/agent/index.ts`).
   - What's unclear: Whether two Agent instances sharing `components.agent` can coexist without thread ID collisions.
   - Recommendation: HIGH confidence this works -- Agent threads are identified by opaque string IDs, and each `createThread` call generates a unique ID. The `name` field on the Agent is for labeling only. The existing codebase already imports `components.agent` from multiple files. No action needed.

2. **`aiFeedback` field migration**
   - What we know: The `coursePrompts` schema does NOT currently have an `aiFeedback` field. The COURSE-PROGRAM-PLAN.md designed it as `aiFeedback: v.boolean()` with default `true`.
   - What's unclear: Whether to add it as required (breaking existing prompts) or optional.
   - Recommendation: Add as `v.optional(v.boolean())` with a default of `true` in application logic. No backfill needed -- existing prompts without the field are treated as `aiFeedback: true`.

3. **Sidebar position conflict with profile agent**
   - What we know: The existing profile agent sidebar opens on the LEFT. The learning sidebar is planned for the RIGHT side of the program page.
   - What's unclear: Whether both sidebars should be visible simultaneously.
   - Recommendation: The learning sidebar should ONLY appear on program pages. The profile agent sidebar should be hidden (or the FAB suppressed) when on program pages. This avoids having two AI chat interfaces competing for attention. The learning sidebar replaces the profile sidebar's purpose in the program context.

4. **Facilitator conversation viewing granularity**
   - What we know: `listUIMessages` works with a threadId. We can query `courseSidebarThreads` by programId.
   - What's unclear: Whether the facilitator needs to see all conversations at once or per-participant.
   - Recommendation: Per-participant view -- facilitator selects a participant, then sees their module threads listed. Clicking a thread shows the conversation. This is simpler and avoids loading hundreds of messages at once.

## Sources

### Primary (HIGH confidence)

- **`/get-convex/agent` Context7** -- Agent setup, thread creation, `listUIMessages`, `syncStreams`, streaming with `saveStreamDeltas`
- **Existing codebase** (`convex/agent/`) -- Verified patterns for Agent definition, threadOps, queries, actions, and React hooks
- **Existing codebase** (`src/components/agent-sidebar/`) -- Verified sidebar UI patterns (resize, mobile Sheet, provider context)
- **Existing codebase** (`convex/course/`) -- Phase 37 tables, helpers, response mutations

### Secondary (MEDIUM confidence)

- **COURSE-PROGRAM-PLAN.md** -- Original architecture design for `aiFeedback` field and sidebar flow
- **ARCHITECTURE-v2.0-course-platform.md** -- Data flow diagrams for sidebar

### Tertiary (LOW confidence)

- None -- all findings verified against existing codebase or Context7

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- All libraries already installed and proven in production with identical patterns
- Architecture: HIGH -- Direct replication of existing agent sidebar architecture with module-scoped threading
- Pitfalls: HIGH -- Based on real patterns observed in the existing codebase (thread creation races, `"use node"` directive, auth scoping)
- Proactive feedback (SIDE-04): MEDIUM -- The scheduler trigger pattern is proven, but the UX of auto-injecting feedback messages needs user testing

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- all dependencies already locked)
