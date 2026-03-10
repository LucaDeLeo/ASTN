# Architecture Patterns: v2.0 Course Program Platform

**Domain:** Course/program platform with AI integration on existing ASTN
**Researched:** 2026-03-10
**Confidence:** HIGH (leveraging well-understood existing patterns)

## Recommended Architecture

The v2.0 platform adds 6 new Convex tables and 2 existing table modifications alongside the existing 7 program tables. All new features integrate through Convex's reactive subscription model -- the same pattern that already powers the profile agent, enrichment chat, and CRM dashboard.

### Architecture Diagram

```
                          CONVEX BACKEND
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │  EXISTING TABLES          NEW TABLES                    │
  │  ─────────────            ──────────                    │
  │  programs                 prompts                       │
  │  programParticipation     promptResponses               │
  │  programModules ──mod──>  sidebarConversations          │
  │  programSessions ──mod──> agentProposals                │
  │  sessionRsvps             facilitatorComments           │
  │  sessionAttendance        sessionLiveState              │
  │  materialProgress                                       │
  │                                                         │
  ├────────────┬───────────────┬────────────────────────────┤
  │            │               │                            │
  │ PARTICIPANT│  FACILITATOR  │  FACILITATOR               │
  │ VIEW       │  ADMIN VIEW   │  AGENT                     │
  │            │               │                            │
  │ Module page│  Program mgmt │  @convex-dev/agent          │
  │ + prompts  │  + responses  │  with program tools        │
  │ + sidebar  │  + proposals  │  Propose-and-approve       │
  │ + session  │  + session    │  via agentProposals        │
  │   mode     │    controls   │                            │
  │            │               │  READS same data           │
  │ AI Sidebar │  READS same   │  as admin view.            │
  │ via HTTP   │  data as      │                            │
  │ streaming  │  agent.       │  PROPOSES via              │
  │            │               │  agentProposals.           │
  │ WRITES own │  WRITES       │  Never writes directly     │
  │ responses  │  directly.    │  to participant-visible    │
  │ + sidebar  │  Approves     │  data.                     │
  │ messages.  │  proposals.   │                            │
  └────────────┴───────────────┴────────────────────────────┘
```

### Component Boundaries

| Component                                            | Responsibility                                                          | Communicates With                                    | New/Modified |
| ---------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- | ------------ |
| `convex/coursePrompts.ts`                            | CRUD for prompts table, response submission, reveal/highlight mutations | prompts, promptResponses tables                      | NEW          |
| `convex/courseSidebar.ts`                            | AI sidebar conversation management, context building                    | sidebarConversations table, Claude API               | NEW          |
| `convex/courseSidebar/streaming.ts`                  | HTTP streaming for sidebar AI responses                                 | sidebarConversations, persistentTextStreaming        | NEW          |
| `convex/facilitatorAgent/index.ts`                   | Agent definition with program-specific tools                            | @convex-dev/agent, all program tables                | NEW          |
| `convex/facilitatorAgent/tools.ts`                   | Read/write tools for facilitator agent                                  | All program + new tables via queries/mutations       | NEW          |
| `convex/facilitatorAgent/actions.ts`                 | Stream agent response, build system prompt                              | facilitatorAgent, Claude API                         | NEW          |
| `convex/courseProposals.ts`                          | agentProposals + facilitatorComments CRUD                               | agentProposals, facilitatorComments tables           | NEW          |
| `convex/sessionRunner.ts`                            | Live session state management (advance phase, reveal, timer, pairs)     | sessionLiveState, prompts, promptResponses           | NEW          |
| `convex/programs.ts`                                 | Existing program functions                                              | Extended with phases on programSessions              | MODIFIED     |
| `src/components/course/PromptCard.tsx`               | Unified prompt rendering + response UI                                  | coursePrompts queries/mutations                      | NEW          |
| `src/components/course/AISidebar.tsx`                | Chat sidebar for participant learning partner                           | courseSidebar streaming                              | NEW          |
| `src/components/course/FacilitatorAgent.tsx`         | Chat sidebar for facilitator agent                                      | facilitatorAgent actions                             | NEW          |
| `src/components/course/ProposalCard.tsx`             | Approve/edit/dismiss agent proposals                                    | courseProposals mutations                            | NEW          |
| `src/components/course/SessionRunner.tsx`            | Live session facilitator controls                                       | sessionRunner mutations                              | NEW          |
| `src/components/course/SessionParticipant.tsx`       | Participant session view (current phase, prompt, timer)                 | sessionRunner queries, coursePrompts                 | NEW          |
| `src/routes/org/$slug/program/$programSlug.tsx`      | Participant program page                                                | Extended with prompts, sidebar, session mode         | MODIFIED     |
| `src/routes/org/$slug/admin/programs/$programId.tsx` | Admin program page                                                      | Extended with responses, proposals, session controls | MODIFIED     |
| `convex/http.ts`                                     | HTTP routing                                                            | Extended with sidebar streaming endpoint             | MODIFIED     |
| `convex/schema.ts`                                   | Database schema                                                         | 6 new tables + 2 table modifications                 | MODIFIED     |

### Data Flow

#### 1. Prompt Response Flow (Core Path)

```
Participant opens module
  -> useQuery(getModulePrompts) -> reactive list of prompts
  -> Participant fills fields, clicks Submit
  -> useMutation(submitResponse) -> writes to promptResponses with visibility: "private"
  -> If prompt.aiFeedback === true:
      -> ctx.scheduler.runAfter(0, ...) fires sidebar feedback action
      -> Action builds context (module materials + prompt + response)
      -> Streams Socratic feedback into sidebarConversations
  -> If prompt.revealMode === "write_then_reveal":
      -> Response stays visibility: "private" until facilitator triggers reveal
  -> Facilitator clicks "Reveal" -> batchReveal mutation sets visibility: "revealed"
  -> All participant UIs update reactively (Convex subscription)
```

#### 2. AI Sidebar Flow (Reuses Enrichment Pattern)

```
Participant opens sidebar
  -> useQuery(getSidebarMessages, { programId, moduleId, userId })
  -> Participant types question
  -> useMutation(startSidebarChat) -> saves user message, creates stream
  -> HTTP action /sidebar-stream:
      -> Builds context: module materials + participant progress + exercise responses
      -> Streams Claude response via persistentTextStreaming (same as enrichment)
      -> Saves assistant message on completion
  -> useStream hook provides real-time text updates (identical to enrichment pattern)
```

#### 3. Facilitator Agent Flow (Extends Profile Agent Pattern)

```
Facilitator opens agent sidebar on admin page
  -> useQuery(getAgentThread, { programId })
  -> Facilitator types question/command
  -> Agent receives message with system prompt containing:
      -> Program structure, module list, session schedule
      -> Current context (which view the facilitator is on)
  -> Agent calls read tools (no approval needed):
      -> queryParticipantProgress, queryExerciseResponses, queryAttendance
      -> querySidebarConversations, querySessionData
  -> Agent calls write tools (proposals only):
      -> draftComment -> writes to agentProposals with status: "proposed"
      -> suggestPairs -> writes to agentProposals
      -> draftMessage -> writes to agentProposals
  -> Proposal appears in facilitator UI (reactive subscription to agentProposals)
  -> Facilitator: approve -> mutation writes to facilitatorComments / executes action
                  edit -> facilitator modifies, then approve
                  dismiss -> status: "dismissed"
```

#### 4. Session Runner Flow (Real-Time State)

```
Facilitator starts session
  -> useMutation(startSession) -> creates sessionLiveState doc:
      { sessionId, status: "live", currentPhaseIndex: 0, phaseStartedAt: now }
  -> All participant UIs subscribing to:
      useQuery(getSessionLiveState, { sessionId })
      -> See: current phase title, timer, prompt (if any)

During session:
  -> Facilitator advances phase
      -> useMutation(advancePhase) -> currentPhaseIndex++, phaseStartedAt: now
      -> All participants see new phase reactively
  -> Participant submits response to session prompt
      -> Same submitResponse mutation as pre-work
      -> But visibility: "private" (write-then-reveal)
  -> Facilitator reveals responses
      -> useMutation(revealPhaseResponses, { promptId })
      -> Sets all promptResponses for that prompt to visibility: "revealed"
      -> All participants see each other's responses reactively
  -> Timer: client-side countdown from phaseStartedAt + durationMinutes
      -> No server polling. Timer is derived from phaseStartedAt (Convex doc).
      -> Facilitator extends timer -> mutation adds to timerExtensions field
```

## Integration Points: New vs. Modified

### New Files (Backend)

| File                                 | Purpose                                             | Tables Touched                             |
| ------------------------------------ | --------------------------------------------------- | ------------------------------------------ |
| `convex/coursePrompts.ts`            | Prompt CRUD, response submission, reveal, highlight | prompts, promptResponses                   |
| `convex/courseSidebar.ts`            | Sidebar conversation queries/mutations              | sidebarConversations                       |
| `convex/courseSidebar/streaming.ts`  | HTTP streaming for sidebar AI                       | sidebarConversations                       |
| `convex/facilitatorAgent/index.ts`   | Agent definition (like `convex/agent/index.ts`)     | via tools                                  |
| `convex/facilitatorAgent/tools.ts`   | Read/write tools (like `convex/agent/tools.ts`)     | All program tables                         |
| `convex/facilitatorAgent/actions.ts` | Stream response (like `convex/agent/actions.ts`)    | via agent                                  |
| `convex/courseProposals.ts`          | Proposal approve/edit/dismiss                       | agentProposals, facilitatorComments        |
| `convex/sessionRunner.ts`            | Session lifecycle mutations                         | sessionLiveState, prompts, promptResponses |

### Modified Files (Backend)

| File                      | What Changes                                                                               | Why                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `convex/schema.ts`        | Add 6 new table definitions + modify 2 existing                                            | New data model                                             |
| `convex/programs.ts`      | Add `phases` array to session creation/update mutations (`createSession`, `updateSession`) | Sessions need phase definitions                            |
| `convex/http.ts`          | Add `/sidebar-stream` route + CORS handler                                                 | New streaming endpoint for AI sidebar                      |
| `convex/convex.config.ts` | No changes needed                                                                          | Already has `persistentTextStreaming` + `agent` components |

### New Files (Frontend)

| File                                           | Purpose                                                             | Pattern Source                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `src/components/course/PromptCard.tsx`         | Prompt display + response form                                      | Similar to existing form patterns in `ModuleFormDialog.tsx`     |
| `src/components/course/PromptResponseList.tsx` | List of responses (facilitator view + post-reveal participant view) | Similar to participant list in admin page                       |
| `src/components/course/AISidebar.tsx`          | Participant learning partner chat                                   | Reuses `useStream` pattern from `useCompletionEnrichment.ts`    |
| `src/components/course/FacilitatorAgent.tsx`   | Facilitator agent chat sidebar                                      | Reuses agent pattern from profile agent UI                      |
| `src/components/course/ProposalCard.tsx`       | Approve/edit/dismiss proposals                                      | New component, simple card with 3 action buttons                |
| `src/components/course/SessionRunner.tsx`      | Facilitator session controls                                        | New component: phase list, timer, advance, reveal buttons       |
| `src/components/course/SessionParticipant.tsx` | Participant session view                                            | New component: current phase, prompt, timer, revealed responses |
| `src/components/course/PhaseEditor.tsx`        | Phase configuration in session form                                 | Extends existing `SessionFormDialog.tsx` pattern                |
| `src/components/course/PairDisplay.tsx`        | Show pair assignment during session                                 | Simple component: pair name + activity description              |

### Modified Files (Frontend)

| File                                                 | What Changes                                                          | Why                                         |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------- |
| `src/routes/org/$slug/program/$programSlug.tsx`      | Add prompt rendering, sidebar toggle, session mode detection          | Participant view gains interactive features |
| `src/routes/org/$slug/admin/programs/$programId.tsx` | Add response viewing, proposal cards, session controls, agent sidebar | Admin view gains facilitator features       |
| `src/components/programs/ModuleFormDialog.tsx`       | Add prompt creation within module form                                | Prompts attach to modules for pre-work      |
| `src/components/programs/SessionFormDialog.tsx`      | Add phase editor within session form                                  | Sessions need phase definitions             |
| `src/components/programs/MaterialChecklist.tsx`      | Add essential/optional visual treatment, audio player                 | Module enhancement features                 |

## Patterns to Follow

### Pattern 1: Prompt as Universal Primitive

**What:** Every interactive element (exercise, poll, reflection, feedback) is a `prompt` document. One component renders them all. One table stores them all.

**When:** Any time you need participant input -- pre-work, in-session, feedback.

**Why:** The design doc explicitly states "One Component, Everywhere." Separate exercise/poll/feedback systems would triple the code and create data silos.

**Example schema:**

```typescript
// convex/schema.ts addition
prompts: defineTable({
  programId: v.id('programs'),
  moduleId: v.optional(v.id('programModules')),  // pre-work prompts
  sessionId: v.optional(v.id('programSessions')), // session prompts
  phaseIndex: v.optional(v.number()),              // ordering within sessions
  text: v.string(),
  fields: v.array(v.object({
    label: v.string(),
    type: v.union(v.literal('text'), v.literal('choice'), v.literal('multiple_choice')),
    options: v.optional(v.array(v.string())),
    placeholder: v.optional(v.string()),
  })),
  estimatedMinutes: v.optional(v.number()),
  aiFeedback: v.boolean(),
  revealMode: v.union(
    v.literal('immediate'),
    v.literal('facilitator_only'),
    v.literal('write_then_reveal'),
  ),
  orderIndex: v.number(),
  createdAt: v.number(),
})
  .index('by_program', ['programId'])
  .index('by_module', ['moduleId'])
  .index('by_session', ['sessionId'])
  .index('by_session_and_phase', ['sessionId', 'phaseIndex']),
```

### Pattern 2: Reuse Streaming Infrastructure

**What:** The AI sidebar uses the exact same `@convex-dev/persistent-text-streaming` + HTTP action pattern as the existing enrichment chat.

**When:** Building the participant AI sidebar.

**Why:** The enrichment streaming pattern (`startChat` mutation -> HTTP action -> `useStream` hook) is proven, handles auth, CORS, and token tracking. The sidebar just needs different context (module materials instead of profile data) and a different system prompt.

**Implementation:**

```typescript
// convex/courseSidebar/streaming.ts -- follows enrichment/streaming.ts structure
export const startSidebarChat = mutation({
  args: {
    programId: v.id('programs'),
    moduleId: v.optional(v.id('programModules')),
    message: v.string(),
  },
  returns: v.object({ streamId: StreamIdValidator }),
  handler: async (ctx, { programId, moduleId, message }) => {
    const userId = await requireAuth(ctx)
    // Verify participant enrollment via programParticipation index
    // Save user message to sidebarConversations
    // Create stream
    const streamId = await persistentTextStreaming.createStream(ctx)
    return { streamId }
  },
})

// HTTP action builds context from:
// 1. Module materials (from programModules.materials)
// 2. Participant's materialProgress for this module
// 3. Participant's promptResponses for this module's prompts
// 4. Previous sidebar messages for this module
// Then streams Claude response with Socratic learning partner system prompt
```

### Pattern 3: Facilitator Agent Mirrors Profile Agent

**What:** The facilitator agent uses `@convex-dev/agent` with `createTool` exactly like the existing profile agent, but with program-scoped tools instead of profile tools.

**When:** Building the facilitator agent.

**Why:** The profile agent pattern (`convex/agent/index.ts` + `tools.ts` + `actions.ts`) is proven and already integrated. The facilitator agent is structurally identical -- different tools, different system prompt, same infrastructure. The `@convex-dev/agent` component is already registered in `convex.config.ts`.

**Key difference:** The profile agent's tools write directly to the profile (via `proposeToolChange`). The facilitator agent's write tools create `agentProposals` documents that the facilitator must approve. This is the propose-and-approve pattern.

**Example tools:**

```typescript
// convex/facilitatorAgent/tools.ts
export const queryParticipantProgress = createTool({
  description: 'Get progress summary for all participants or a specific one',
  args: z.object({
    participantUserId: z
      .string()
      .optional()
      .describe('Filter to specific participant, or omit for all'),
  }),
  handler: async (ctx, args): Promise<string> => {
    const progress = await ctx.runQuery(
      internal.facilitatorAgent.queries.getParticipantProgress,
      { programId: ctx.threadId, userId: args.participantUserId },
    )
    return formatProgressSummary(progress)
  },
})

export const draftComment = createTool({
  description:
    'Draft a comment on a participant exercise response. Facilitator must approve before it becomes visible.',
  args: z.object({
    promptResponseId: z.string().describe('The response to comment on'),
    content: z.string().describe('The comment text'),
  }),
  handler: async (ctx, args): Promise<string> => {
    await ctx.runMutation(internal.facilitatorAgent.mutations.createProposal, {
      programId: ctx.threadId, // programId stored as thread context
      type: 'comment',
      targetId: args.promptResponseId,
      content: args.content,
    })
    return `Draft comment created. Facilitator will review.`
  },
})
```

### Pattern 4: Visibility as Server-Controlled State

**What:** Response visibility (`private` / `revealed`) is a server-side field enforced in queries, not client-side filtering.

**When:** Implementing write-then-reveal and facilitator-only modes.

**Why:** Security. If visibility is client-side, a participant could inspect network traffic and see unrevealed responses. The query must filter by role.

**Implementation:**

```typescript
// convex/coursePrompts.ts
export const getPromptResponses = query({
  args: {
    promptId: v.id('prompts'),
    programId: v.id('programs'),
  },
  returns: v.array(/* response schema */),
  handler: async (ctx, { promptId, programId }) => {
    const userId = await getUserId(ctx)
    const isAdmin = await isOrgAdminForProgram(ctx, programId)

    const responses = await ctx.db
      .query('promptResponses')
      .withIndex('by_prompt', (q) => q.eq('promptId', promptId))
      .collect()

    if (isAdmin) {
      // Facilitators see everything (context parity with agent)
      return responses
    }

    // Participants see: their own response + revealed responses
    return responses.filter(
      (r) => r.userId === userId || r.visibility === 'revealed',
    )
  },
})
```

### Pattern 5: Session Timer as Derived State

**What:** The timer is not a ticking server value. It is derived client-side from `phaseStartedAt` + `durationMinutes` + `timerExtensions`. The server stores timestamps; the client computes remaining time.

**When:** Building the session runner timer.

**Why:** Convex is a reactive database, not a WebSocket ticker. Storing a "remaining seconds" field that decrements every second would generate N mutations/second and kill performance. Instead, store the start time and compute locally.

**Implementation:**

```typescript
// Client-side timer hook
function usePhaseTimer(liveState: SessionLiveState, phases: Phase[]) {
  const phase = phases[liveState.currentPhaseIndex]
  const endTime =
    liveState.phaseStartedAt +
    phase.durationMinutes * 60 * 1000 +
    liveState.timerExtensions * 1000

  const [remaining, setRemaining] = useState(() =>
    Math.max(0, endTime - Date.now()),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, endTime - Date.now()))
    }, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  return { remaining, isExpired: remaining === 0 }
}
```

### Pattern 6: Context Parity Between UI and Agent

**What:** The facilitator's visual dashboard and the AI agent read from the exact same Convex queries. The agent's read tools call the same `internalQuery` functions that back the admin UI.

**When:** Designing facilitator agent tools.

**Why:** If the agent sees different data than the facilitator, they will disagree about reality. The design doc calls this "Context Parity." Convex's reactive subscriptions mean both see updates simultaneously.

**Implementation:** Define shared `internalQuery` functions in a `convex/facilitatorAgent/queries.ts` file. The admin page's `useQuery` calls the public wrappers; the agent's tools call the internal versions. Both resolve to the same data.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Table Per Prompt Type

**What:** Creating `exercises`, `polls`, `feedbackForms`, `sessionActivities` as separate tables.

**Why bad:** Quadruples schema surface, creates 4 response tables, 4 query patterns, 4 components. The agent needs 4 different read tools. The session runner needs to handle 4 types.

**Instead:** One `prompts` table with `revealMode` to distinguish behavior. The field type (`text`, `choice`, `multiple_choice`) handles rendering differences.

### Anti-Pattern 2: Polling for Session State

**What:** Using `setInterval` to poll a session status endpoint every N seconds.

**Why bad:** Convex reactive queries make this unnecessary. `useQuery(getSessionLiveState, { sessionId })` automatically updates when the document changes. Polling adds latency and unnecessary load.

**Instead:** One `useQuery` subscription. When the facilitator advances a phase, all participants see it within ~100ms via Convex's reactive push.

### Anti-Pattern 3: Agent Writing Directly to Participant-Visible Data

**What:** The facilitator agent calling a mutation that directly inserts a `facilitatorComment` visible to the participant.

**Why bad:** Violates the propose-and-approve principle. AI-generated comments may be wrong, off-tone, or inappropriate. The facilitator must review before participants see anything.

**Instead:** Agent creates an `agentProposal` with `status: "proposed"`. Facilitator approves, which triggers the actual write to `facilitatorComments`.

### Anti-Pattern 4: Storing Sidebar Messages as Nested Array (Risky at Scale)

**What:** Storing all sidebar messages as a `messages: v.array(...)` field on the `sidebarConversations` document (as specified in the design doc).

**Risk:** Convex documents have a 1MB size limit. Long conversations with rich context could approach this. Every new message rewrites the entire document.

**Decision for BAISH pilot:** Start with the nested array approach as designed. For 10 participants with ~50 messages per module conversation, each message averaging ~500 bytes, the total is ~25KB per conversation -- well under the 1MB limit. If conversations grow long in future cohorts, extract to a separate `sidebarMessages` table following the `enrichmentMessages` pattern.

### Anti-Pattern 5: Client-Side Timer State Without Server Anchor

**What:** Starting a `setInterval` on the facilitator's browser and trusting it as the source of truth for phase timing.

**Why bad:** If the facilitator refreshes the page, the timer resets. If two admins are watching, they see different times. The timer is not auditable for post-session analytics.

**Instead:** `phaseStartedAt` is stored in `sessionLiveState`. All clients derive the timer from this server timestamp. The facilitator's "extend timer" button adds seconds to `timerExtensions` via mutation. Every client sees the same time.

## Schema Additions: Complete Specification

### New Tables

```typescript
// In convex/schema.ts

prompts: defineTable({
  programId: v.id('programs'),
  moduleId: v.optional(v.id('programModules')),
  sessionId: v.optional(v.id('programSessions')),
  phaseIndex: v.optional(v.number()),
  text: v.string(),
  fields: v.array(v.object({
    label: v.string(),
    type: v.union(v.literal('text'), v.literal('choice'), v.literal('multiple_choice')),
    options: v.optional(v.array(v.string())),
    placeholder: v.optional(v.string()),
  })),
  estimatedMinutes: v.optional(v.number()),
  aiFeedback: v.boolean(),
  revealMode: v.union(
    v.literal('immediate'),
    v.literal('facilitator_only'),
    v.literal('write_then_reveal'),
  ),
  orderIndex: v.number(),
  createdAt: v.number(),
})
  .index('by_program', ['programId'])
  .index('by_module', ['moduleId'])
  .index('by_session', ['sessionId'])
  .index('by_session_and_phase', ['sessionId', 'phaseIndex']),

promptResponses: defineTable({
  promptId: v.id('prompts'),
  programId: v.id('programs'),
  userId: v.string(),
  responses: v.any(), // record<string, string | string[]> keyed by field label
  visibility: v.union(v.literal('private'), v.literal('revealed')),
  highlighted: v.boolean(),
  submittedAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_prompt', ['promptId'])
  .index('by_prompt_and_user', ['promptId', 'userId'])
  .index('by_program_and_user', ['programId', 'userId']),

agentProposals: defineTable({
  programId: v.id('programs'),
  type: v.union(
    v.literal('comment'),
    v.literal('message'),
    v.literal('pairs'),
    v.literal('summary'),
    v.literal('flag'),
    v.literal('prompt'),
  ),
  targetId: v.optional(v.string()),
  content: v.string(),
  status: v.union(
    v.literal('proposed'),
    v.literal('approved'),
    v.literal('edited'),
    v.literal('dismissed'),
  ),
  approvedBy: v.optional(v.string()),
  approvedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index('by_program', ['programId'])
  .index('by_program_and_status', ['programId', 'status']),

facilitatorComments: defineTable({
  promptResponseId: v.id('promptResponses'),
  programId: v.id('programs'),
  authorId: v.string(),
  content: v.string(),
  fromAgent: v.boolean(),
  createdAt: v.number(),
})
  .index('by_response', ['promptResponseId'])
  .index('by_program', ['programId']),

sessionLiveState: defineTable({
  sessionId: v.id('programSessions'),
  programId: v.id('programs'),
  currentPhaseIndex: v.number(),
  phaseStartedAt: v.number(),
  timerExtensions: v.number(),
  activePairs: v.optional(v.array(v.object({
    participantA: v.string(),
    participantB: v.string(),
  }))),
  status: v.union(
    v.literal('not_started'),
    v.literal('live'),
    v.literal('completed'),
  ),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
})
  .index('by_session', ['sessionId'])
  .index('by_program_and_status', ['programId', 'status']),

sidebarConversations: defineTable({
  programId: v.id('programs'),
  moduleId: v.optional(v.id('programModules')),
  userId: v.string(),
  messages: v.array(v.object({
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    timestamp: v.number(),
  })),
  updatedAt: v.number(),
})
  .index('by_program_and_user', ['programId', 'userId'])
  .index('by_module_and_user', ['moduleId', 'userId']),
```

### Existing Table Modifications

```typescript
// programModules.materials -- add "audio" type, isEssential, storageId
materials: v.optional(
  v.array(
    v.object({
      label: v.string(),
      url: v.string(),
      type: v.union(
        v.literal('link'),
        v.literal('pdf'),
        v.literal('video'),
        v.literal('reading'),
        v.literal('audio'),    // NEW
      ),
      estimatedMinutes: v.optional(v.number()),
      isEssential: v.optional(v.boolean()),        // NEW
      storageId: v.optional(v.id('_storage')),     // NEW -- for audio uploads
    }),
  ),
),

// programSessions -- add phases array
phases: v.optional(v.array(v.object({
  title: v.string(),
  durationMinutes: v.number(),
  facilitatorNotes: v.optional(v.string()),
  promptId: v.optional(v.id('prompts')),
  pairConfig: v.optional(v.object({
    strategy: v.union(
      v.literal('complementary'),
      v.literal('random'),
      v.literal('manual'),
    ),
    sourcePromptId: v.optional(v.id('prompts')),
  })),
}))),
```

## Suggested Build Order

The build order follows the dependency graph. Each phase uses features built in the previous phase.

### Phase 1: Unified Prompt System (Foundation)

**What to build:**

- Schema: `prompts` and `promptResponses` tables
- Backend: `convex/coursePrompts.ts` with CRUD, submit, reveal, highlight
- Frontend: `PromptCard.tsx`, `PromptResponseList.tsx`
- Integration: Add prompt rendering to participant module view (`$programSlug.tsx`)
- Integration: Add prompt creation to admin module form (`ModuleFormDialog.tsx`)
- Write-then-reveal mechanism (visibility flag + facilitator reveal mutation)

**Dependencies:** None -- this is the foundation.

**Why first:** Everything else depends on prompts. The AI sidebar gives feedback on prompt responses. The facilitator agent queries prompt responses. The session runner uses prompts as phase activities.

**Estimated scope:** ~8-10 new files, ~3 modified files.

### Phase 2: AI Sidebar (Participant Learning Partner)

**What to build:**

- Schema: `sidebarConversations` table
- Backend: `convex/courseSidebar.ts` + `convex/courseSidebar/streaming.ts`
- Backend: Add `/sidebar-stream` route to `convex/http.ts`
- Frontend: `AISidebar.tsx` with `useStream` hook (mirrors enrichment pattern)
- Context builder: module materials + progress + responses as system prompt
- Integration: Sidebar toggle on participant program page

**Dependencies:** Phase 1 (needs promptResponses for context).

**Why second:** Biggest experiential differentiator. Transforms the platform from a content tracker to a learning environment. Also provides automatic AI feedback on prompt submissions.

**Estimated scope:** ~5-6 new files, ~2 modified files.

### Phase 3: Facilitator Agent

**What to build:**

- Schema: `agentProposals` and `facilitatorComments` tables
- Backend: `convex/facilitatorAgent/` directory (index.ts, tools.ts, actions.ts, queries.ts, mutations.ts)
- Frontend: `FacilitatorAgent.tsx`, `ProposalCard.tsx`
- Agent tools: ~6 read tools (progress, responses, attendance, sidebar convos, session data, profiles), ~4 write tools (draft comment, draft message, suggest pairs, create prompt)
- Integration: Agent sidebar on admin program page

**Dependencies:** Phase 1 + Phase 2 (agent reads responses and sidebar conversations).

**Why third:** The data from Phases 1 and 2 becomes actionable. The agent synthesizes exercise responses, surfaces patterns, drafts comments, and prepares session observations.

**Estimated scope:** ~8-10 new files, ~1 modified file.

### Phase 4: Session Runner

**What to build:**

- Schema: `sessionLiveState` table
- Schema modification: `phases` array on `programSessions`
- Backend: `convex/sessionRunner.ts` (start, advance, reveal, extend, pairs, complete)
- Frontend: `SessionRunner.tsx`, `SessionParticipant.tsx`, `PhaseEditor.tsx`, `PairDisplay.tsx`
- Timer hook: client-side countdown from server timestamps
- Pairing algorithm: complementary (from prompt choice responses), random, manual
- Integration: Phase editor in session form, session mode on participant view

**Dependencies:** Phase 1 (session phases reference prompts), Phase 3 (agent provides real-time observations during sessions).

**Why fourth:** Sessions reuse the same prompts, responses, and agent -- the new pieces are phase sequencing, timer, and pairing.

**Estimated scope:** ~6-8 new files, ~3 modified files.

### Module Enhancements (Independent, Can Happen Anytime)

**What to build:**

- Schema modification: `isEssential` + `audio` type + `storageId` on material items
- Backend: Audio file upload via Convex file storage (`ctx.storage.store`)
- Frontend: Essential/optional visual treatment (essential first, indicator badge), audio player inline, time-to-session indicator (computed from `linkedSessionId` + material estimates), continue-here marker (first incomplete item)

**Dependencies:** None (these modify existing module rendering only).

**Estimated scope:** ~2-3 modified files, ~1 new component.

## Scalability Considerations

| Concern               | At 10 participants (BAISH)          | At 100 participants                          | At 1,000 participants                            |
| --------------------- | ----------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Prompt responses      | All responses in one query, trivial | Index by promptId, still fine                | Server-side pagination needed                    |
| Session live state    | Single doc, all subscribe           | Single doc, all subscribe                    | Single doc still works (Convex handles fan-out)  |
| Sidebar conversations | 10 conversations/module             | 100 -- facilitator view needs pagination     | Facilitator cannot read all; need summary/search |
| Agent proposals       | Few per session                     | Moderate volume                              | Agent needs rate limiting                        |
| Timer sync            | ~100ms latency is fine              | ~100ms still fine                            | ~100ms still fine (read-only derived state)      |
| Pairing algorithm     | Trivial for 10                      | O(n) random, O(n^2) complementary still fast | Need smarter algorithm at 500+                   |

**Key insight:** For the BAISH pilot (10 participants), none of these are concerns. The architecture supports 100+ without changes. At 1,000+, the facilitator-reads-everything pattern breaks down and needs aggregation/summarization layers -- but that is explicitly out of scope per the design doc.

## Sources

- Convex documentation: reactive queries, optimistic updates, real-time subscriptions (Context7, HIGH confidence)
- Convex `@convex-dev/agent` documentation: createTool, Agent configuration (Context7, HIGH confidence)
- Existing codebase patterns verified by direct code reading:
  - `convex/agent/index.ts` + `tools.ts` + `actions.ts` -- profile agent pattern
  - `convex/enrichment/streaming.ts` -- HTTP streaming with persistentTextStreaming
  - `convex/enrichment/conversation.ts` -- system prompt + context building
  - `src/components/actions/hooks/useCompletionEnrichment.ts` -- useStream hook pattern
  - `convex/programs.ts` -- existing program CRUD with requireOrgAdmin
  - `convex/schema.ts` lines 956-1146 -- existing program table schemas
  - `convex/http.ts` -- HTTP route registration
  - `convex/convex.config.ts` -- component registration (agent + persistentTextStreaming already present)
  - `convex/lib/auth.ts` -- auth helpers (getUserId, requireAuth, requireOrgAdmin patterns)
  - `convex/lib/models.ts` -- model configuration pattern
- Design document: `COURSE-PROGRAM-PLAN.md` -- primary source for feature requirements and data model
