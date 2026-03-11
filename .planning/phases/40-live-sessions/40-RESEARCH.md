# Phase 40: Session Runner - Research

**Researched:** 2026-03-11
**Domain:** Real-time session management with Convex subscriptions, timers, pairing, and live state coordination
**Confidence:** HIGH

## Summary

Phase 40 builds a live session runner on top of the existing `programSessions`, `coursePrompts`, and `coursePromptResponses` infrastructure. The core challenge is managing real-time state (current phase, timer, active prompts, presence) visible to both facilitator and participants simultaneously while avoiding subscription churn that degrades performance.

The CONTEXT.md from the discuss phase resolved the most critical architectural decisions: separate `sessionPresence` table for typing indicators (avoids churning `coursePromptResponses` subscriptions), stable `phaseId` references instead of fragile `phaseIndex`, `activePromptIds` array on live state, Clerk string user IDs for pair documents, and no auto-marking of `sessionAttendance` from participation. These decisions were validated against the actual schema by Codex and are all sound.

The architecture splits into three table groups: (1) **definition tables** written during setup (`sessionPhases`), (2) **hot live state** written by facilitator actions during a running session (`sessionLiveState` single-doc), and (3) **result tables** written during and after the session (`sessionPairAssignments`, `sessionPresence`). The single-doc `sessionLiveState` pattern is the standard Convex approach for broadcasting global state to many subscribers efficiently -- all participants subscribe to one document rather than polling multiple tables.

**Primary recommendation:** Use a single `sessionLiveState` document per live session containing `currentPhaseId`, `phaseStartedAt`, `phaseDurationMs`, `activePromptIds`, and `status`. Facilitator mutations update this document; participants subscribe to it. Client-side countdown timer derived from `phaseStartedAt + phaseDurationMs - Date.now()`. No server-side auto-advance timer.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Typing indicators** use a separate `sessionPresence` table, NOT fields on `coursePromptResponses`. Presence writes would churn response subscriptions since participants subscribe to `getPromptResponses`.
2. **Attendance auto-marking** is removed entirely. `sessionAttendance` has a required `slot` field (morning/afternoon) and drives completion logic. Auto-upserting from response submissions would break both.
3. **User IDs in pair documents** use `string` (Clerk IDs), NOT `Id<"users">`. The entire codebase uses Clerk string IDs consistently.
4. **Phase references** use `phaseId` (stable Convex `_id`), NOT `phaseIndex` (fragile integer). Prompts use `promptIds` array + `activePromptIds` on live state.
5. **One live session per program** invariant enforced.
6. **Idempotency/race guards** on all facilitator actions (start, advance, extend, end).
7. **Lock edits** while session is live (cannot modify phase definitions during a running session).
8. **Org admin only** permissions model for facilitator actions.
9. **Pairing cohort** is enrolled participants who are present (not all enrolled, not RSVP'd).
10. **No auto-advance** -- facilitator manually advances phases.
11. **Client countdown** from server-written timestamps (no server-side timer scheduling).
12. **Split hot live state** from stable phase definitions.
13. **Reuse existing `coursePrompts`** system for session prompts, including ad-hoc prompts created during live sessions.

### Claude's Discretion

1. **Complementary pairing definition** -- flagged for human review. Implementation should use submitted responses from an explicitly chosen prompt field (choice field).
2. **Session rerun behavior** -- flagged for human review. For now, treat completed sessions as immutable history.
3. **Post-session view** -- flagged for human review. Basic read-only view of completed session data.

### Deferred Ideas (OUT OF SCOPE)

- History-aware pairing (avoid repeat pairings across sessions) -- ADV-01 v2 requirement
- Auto-approve for low-risk agent actions -- ADV-02 v2 requirement
- Branching/conditional phase logic -- explicitly out of scope
- Session template library -- SCALE-02 v2 requirement

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                               | Research Support                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| SESS-01 | Define session as ordered list of phases (title, duration, notes, prompt, pair config)    | `sessionPhases` table with `orderIndex`, references to `coursePrompts` via `promptIds`, optional `pairConfig` field |
| SESS-02 | Start live session, advance through phases sequentially                                   | `sessionLiveState` single-doc pattern with `currentPhaseId`, `status` field, idempotent advance mutation            |
| SESS-03 | Timer displays remaining time on facilitator and participant views                        | Client-side countdown from `phaseStartedAt + phaseDurationMs`, Convex realtime subscription to live state           |
| SESS-04 | Extend timer, skip phase, advance to next phase                                           | Facilitator mutations on `sessionLiveState`: `extendPhase`, `skipPhase`, `advancePhase` with idempotency guards     |
| SESS-05 | Participants see current phase title, timer, prompt in real-time                          | Single `useQuery` subscription to `sessionLiveState`, conditional prompt rendering based on `activePromptIds`       |
| SESS-06 | Facilitator sees who submitted, who's typing, who hasn't started                          | `sessionPresence` table for typing; derive submitted/not-started from `coursePromptResponses` query per prompt      |
| SESS-07 | Pairing: complementary (from exercise choices), random, manual strategies                 | `sessionPairAssignments` table with `strategy` field, algorithm runs in mutation at facilitator trigger             |
| SESS-08 | Pairing handles odd numbers (trio) and absences (present participants only)               | Pair algorithm uses `sessionPresence` to filter present participants, creates groups of 2 with one group of 3       |
| SESS-09 | Ad-hoc prompts during live session appear for all participants immediately                | Create `coursePrompt` attached to session, add to `activePromptIds` on `sessionLiveState`, participants auto-see    |
| SESS-10 | Session data preserved: responses, pairs, actual durations, attendance from participation | `sessionPhaseResults` or fields on `sessionPhases` for actual durations; pairs and responses already persisted      |

</phase_requirements>

## Standard Stack

### Core

| Library         | Version | Purpose                         | Why Standard                                                     |
| --------------- | ------- | ------------------------------- | ---------------------------------------------------------------- |
| Convex          | latest  | Database, real-time sync, funcs | Already the backend; subscriptions give free real-time updates   |
| React 19        | 19.x    | UI rendering                    | Already in use; React Compiler enabled                           |
| shadcn/ui       | latest  | UI components (new-york style)  | Already in use; Card, Button, Badge, Dialog, Progress components |
| TanStack Router | latest  | File-based routing              | Already in use; new facilitator runner route needed              |
| lucide-react    | latest  | Icons                           | Already in use throughout the app                                |

### Supporting

| Library | Version | Purpose             | When to Use                                |
| ------- | ------- | ------------------- | ------------------------------------------ |
| sonner  | latest  | Toast notifications | Facilitator action feedback (advance, etc) |

### Alternatives Considered

| Instead of                  | Could Use                    | Tradeoff                                                   |
| --------------------------- | ---------------------------- | ---------------------------------------------------------- |
| Client-side countdown timer | Server-side scheduled funcs  | Scheduled funcs add complexity; client timer is sufficient |
| Single live state doc       | Multiple docs per concern    | Single doc = one subscription, multiple = more granular    |
| Presence in separate table  | Presence on response records | Separate table avoids churning response subscriptions      |

**Installation:**

```bash
# No new dependencies needed -- all already in the project
```

## Architecture Patterns

### Recommended Project Structure

```
convex/
  course/
    sessionRunner.ts          # Facilitator mutations: start, advance, extend, skip, end
    sessionSetup.ts           # Phase CRUD: create, update, reorder, delete phases
    sessionQueries.ts         # Queries: getLiveState, getPhases, getPresence, getPairs
    sessionPairing.ts         # Pairing algorithms: random, complementary, manual
src/
  routes/
    org/$slug/admin/programs/
      $programId/
        session-runner.tsx     # Facilitator runner view (dedicated route)
  components/
    session/
      SessionSetup.tsx         # Phase list editor (before going live)
      SessionRunner.tsx        # Live facilitator dashboard
      PhaseCard.tsx            # Individual phase in setup list
      LiveTimer.tsx            # Countdown timer component (shared)
      PresenceIndicator.tsx    # Who submitted/typing/idle
      PairDisplay.tsx          # Pair assignment view
      ParticipantLiveView.tsx  # Participant's live session banner
```

### Pattern 1: Single-Document Live State (Hot State Pattern)

**What:** One `sessionLiveState` document per live session broadcasts all transient state. All participants subscribe to this single document.
**When to use:** When many clients need the same rapidly-changing state (current phase, timer, active prompts).
**Why:** Convex subscriptions are per-query. One query reading one doc = one subscription for all participants. Writing to this doc triggers re-render for all subscribers simultaneously.

```typescript
// convex/course/sessionQueries.ts
export const getLiveState = query({
  args: { sessionId: v.id('programSessions') },
  returns: v.union(liveStateReturnValidator, v.null()),
  handler: async (ctx, { sessionId }) => {
    // Access check
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) return null
    const program = await ctx.db.get('programs', session.programId)
    if (!program) return null
    await checkProgramAccess(ctx, program)

    return await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()
  },
})
```

```typescript
// Client: single subscription for all live data
function ParticipantLiveView({ sessionId }: { sessionId: Id<'programSessions'> }) {
  const liveState = useQuery(api.course.sessionQueries.getLiveState, { sessionId })
  if (!liveState || liveState.status !== 'running') return null

  return (
    <div>
      <PhaseTitle phaseId={liveState.currentPhaseId} />
      <LiveTimer startedAt={liveState.phaseStartedAt} durationMs={liveState.phaseDurationMs} />
      {liveState.activePromptIds.map(id => (
        <PromptRenderer key={id} promptId={id} mode="participate" />
      ))}
    </div>
  )
}
```

### Pattern 2: Client-Side Countdown Timer

**What:** Timer state derived client-side from server timestamps. No server-side auto-advance.
**When to use:** When displaying remaining time without server-side scheduling overhead.
**Why:** Server writes `phaseStartedAt` and `phaseDurationMs`. Client computes remaining = `phaseStartedAt + phaseDurationMs - Date.now()`. When facilitator extends, `phaseDurationMs` is updated and all clients see the new value via subscription.

```typescript
// src/components/session/LiveTimer.tsx
function LiveTimer({ startedAt, durationMs }: { startedAt: number; durationMs: number }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startedAt
      setRemaining(Math.max(0, durationMs - elapsed))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt, durationMs])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <span className={remaining < 60000 ? 'text-red-500 animate-pulse' : ''}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  )
}
```

### Pattern 3: Idempotent Facilitator Actions

**What:** Every facilitator mutation checks current state before applying changes. Same action called twice = same result.
**When to use:** All facilitator controls (start, advance, extend, skip, end).
**Why:** Convex OCC can retry mutations. Network issues can cause duplicate clicks. Idempotency prevents double-advance or other corruption.

```typescript
// convex/course/sessionRunner.ts
export const advancePhase = mutation({
  args: { sessionId: v.id('programSessions') },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get('programSessions', sessionId)
    if (!session) throw new ConvexError('Session not found')
    const program = await ctx.db.get('programs', session.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const liveState = await ctx.db
      .query('sessionLiveState')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .first()
    if (!liveState || liveState.status !== 'running') return null // Idempotent

    // Record actual duration of current phase
    const actualDuration = Date.now() - liveState.phaseStartedAt

    // Find next phase
    const phases = await ctx.db
      .query('sessionPhases')
      .withIndex('by_sessionId_and_order', (q) => q.eq('sessionId', sessionId))
      .collect()
    const currentIdx = phases.findIndex(
      (p) => p._id === liveState.currentPhaseId,
    )
    const nextPhase = phases[currentIdx + 1]

    if (!nextPhase) {
      // No more phases -- end session
      await ctx.db.patch('sessionLiveState', liveState._id, {
        status: 'completed',
        phaseEndedAt: Date.now(),
      })
      return null
    }

    await ctx.db.patch('sessionLiveState', liveState._id, {
      currentPhaseId: nextPhase._id,
      phaseStartedAt: Date.now(),
      phaseDurationMs: nextPhase.durationMs,
      activePromptIds: nextPhase.promptIds ?? [],
      phaseEndedAt: undefined,
    })
    return null
  },
})
```

### Pattern 4: Presence via Separate Table

**What:** Typing/activity indicators stored in `sessionPresence`, not on response records.
**When to use:** When you need to track ephemeral user state without polluting data subscriptions.
**Why:** CONTEXT.md decision. Participants subscribe to `getPromptResponses`. If presence writes hit `coursePromptResponses`, every keypress would invalidate that subscription for all subscribers.

```typescript
// sessionPresence table: heartbeat-style presence
// Client writes every ~5s while typing
export const updatePresence = mutation({
  args: {
    sessionId: v.id('programSessions'),
    phaseId: v.id('sessionPhases'),
    status: v.union(v.literal('typing'), v.literal('idle')),
  },
  returns: v.null(),
  handler: async (ctx, { sessionId, phaseId, status }) => {
    const userId = await requireAuth(ctx)
    const existing = await ctx.db
      .query('sessionPresence')
      .withIndex('by_sessionId_and_userId', (q) =>
        q.eq('sessionId', sessionId).eq('userId', userId),
      )
      .first()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch('sessionPresence', existing._id, {
        phaseId,
        status,
        lastSeen: now,
      })
    } else {
      await ctx.db.insert('sessionPresence', {
        sessionId,
        userId,
        phaseId,
        status,
        lastSeen: now,
      })
    }
    return null
  },
})
```

### Anti-Patterns to Avoid

- **Server-side auto-advance timer:** Using `ctx.scheduler.runAfter(durationMs, ...)` for auto-advancing phases creates race conditions with manual advance and adds cancellation complexity. The facilitator should always control advancement.
- **Writing presence to response records:** Churns `getPromptResponses` subscriptions for all participants. Use separate table.
- **Using `phaseIndex` instead of `phaseId`:** Fragile -- if phases are reordered or deleted during setup, index-based references break. Use Convex document `_id`.
- **Multiple live sessions per program:** Creates UX confusion and state management complexity. Enforce one-live-session invariant.
- **Auto-marking attendance from participation:** `sessionAttendance` has `slot: morning|afternoon` and drives completion logic. Auto-upserting breaks both constraints.
- **Polling for timer updates:** Unnecessary -- Convex subscriptions already push state changes. Client-side `setInterval` for visual countdown is fine.

## Don't Hand-Roll

| Problem              | Don't Build                     | Use Instead                                       | Why                                                 |
| -------------------- | ------------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| Real-time state sync | Custom WebSocket or polling     | Convex `useQuery` subscriptions                   | Convex handles real-time natively                   |
| Countdown timer sync | Server-scheduled tick functions | Client-side interval from server timestamps       | Simpler, no scheduling overhead, no race conditions |
| Prompt rendering     | New prompt UI for sessions      | Existing `PromptRenderer` component               | Already built in Phase 37, supports all field types |
| Response collection  | New response system             | Existing `coursePromptResponses` + mutations      | Already built, includes draft/submit/spotlight flow |
| Permission checking  | Custom auth middleware          | Existing `requireOrgAdmin` + `checkProgramAccess` | Already built with proper Clerk ID handling         |
| Pair shuffling       | Custom shuffle algorithm        | Fisher-Yates shuffle (standard)                   | Well-known, unbiased, O(n)                          |

**Key insight:** Phase 40 is primarily a coordination layer over existing systems. The prompt system (Phase 37), sidebar (Phase 38), and agent (Phase 39) are already built. The session runner orchestrates when and how these existing primitives appear to participants.

## Common Pitfalls

### Pitfall 1: Subscription Churn from Presence Writes

**What goes wrong:** Putting typing indicators on `coursePromptResponses` causes every keystroke to invalidate subscriptions for all participants viewing responses.
**Why it happens:** Convex re-executes queries when any document in their read set changes. Writing to a response doc = all queries reading that table re-run.
**How to avoid:** Use separate `sessionPresence` table. Facilitator subscribes to presence separately. Participants never subscribe to presence.
**Warning signs:** Lag or flickering in participant views during active typing phases.

### Pitfall 2: Race Conditions in Facilitator Actions

**What goes wrong:** Double-clicking "Next Phase" advances two phases. Network retry sends duplicate extend requests.
**Why it happens:** Mutations are not inherently idempotent. Without guards, each call makes a change.
**How to avoid:** Every mutation checks current state first. `advancePhase` reads `currentPhaseId`, computes next, and only patches if state matches expectations. Disable buttons during mutation pending state.
**Warning signs:** Phase skipping, timer resets, or duplicate pair assignments.

### Pitfall 3: Stale Presence Data

**What goes wrong:** A participant closes their browser but their presence still shows "typing" to the facilitator.
**Why it happens:** No heartbeat expiry. Presence was written but never cleaned up.
**How to avoid:** Include `lastSeen` timestamp on presence records. Facilitator query filters to `lastSeen > Date.now() - 30000` (30s). Optionally, a scheduled function cleans up old presence records.
**Warning signs:** Ghost "typing" indicators for participants who left.

### Pitfall 4: Live State Document Doesn't Exist

**What goes wrong:** Participant loads the program page during a live session but `getLiveState` returns null because the live state doc hasn't been created yet.
**Why it happens:** Race between facilitator starting session and participant query.
**How to avoid:** `startSession` mutation creates `sessionLiveState` document atomically. `getLiveState` query gracefully returns null (no session live). Participant UI shows "No active session" instead of crashing.
**Warning signs:** Blank or error state on participant page right after session starts.

### Pitfall 5: Editing Phases During Live Session

**What goes wrong:** Facilitator modifies phase order or deletes a phase while session is running, corrupting `currentPhaseId` reference.
**Why it happens:** No lock on phase CRUD during live state.
**How to avoid:** All phase setup mutations check if a `sessionLiveState` with `status: 'running'` exists for this session. If so, throw error. Ad-hoc prompts use the `activePromptIds` mechanism instead of modifying phases.
**Warning signs:** Missing phase errors, broken navigation, or orphaned prompt references.

### Pitfall 6: Pairing with Wrong Participant Set

**What goes wrong:** Pair algorithm includes participants who left or never joined the live session.
**Why it happens:** Using `programParticipation` (enrolled list) instead of actually-present participants.
**How to avoid:** Pair algorithm filters from `sessionPresence` records with recent `lastSeen`. Alternatively, use a separate "joined session" flag. Always handle odd count by creating one trio.
**Warning signs:** Pairs including absent participants, or participants left unpaired.

## Code Examples

### New Schema Tables

```typescript
// convex/schema.ts additions

// Session phases (ordered agenda items within a session)
sessionPhases: defineTable({
  sessionId: v.id('programSessions'),
  programId: v.id('programs'),  // Denormalized
  title: v.string(),
  durationMs: v.number(),  // Default duration in milliseconds
  notes: v.optional(v.string()),  // Facilitator-only notes
  promptIds: v.optional(v.array(v.id('coursePrompts'))),  // Attached prompts
  pairConfig: v.optional(v.object({
    strategy: v.union(
      v.literal('random'),
      v.literal('complementary'),
      v.literal('manual'),
    ),
    sourcePromptId: v.optional(v.id('coursePrompts')),  // For complementary
    sourceFieldId: v.optional(v.string()),  // Which choice field to pair on
  })),
  orderIndex: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_sessionId', ['sessionId'])
  .index('by_sessionId_and_order', ['sessionId', 'orderIndex']),

// Live session state (single doc per running session -- hot state)
sessionLiveState: defineTable({
  sessionId: v.id('programSessions'),
  programId: v.id('programs'),  // Denormalized
  status: v.union(
    v.literal('running'),
    v.literal('paused'),
    v.literal('completed'),
  ),
  currentPhaseId: v.id('sessionPhases'),
  phaseStartedAt: v.number(),  // Timestamp when current phase began
  phaseDurationMs: v.number(),  // Current duration (may have been extended)
  activePromptIds: v.array(v.id('coursePrompts')),  // Currently visible prompts
  startedAt: v.number(),  // Session start timestamp
  startedBy: v.string(),  // Clerk userId
  completedAt: v.optional(v.number()),
})
  .index('by_sessionId', ['sessionId'])
  .index('by_programId_and_status', ['programId', 'status']),

// Session presence (typing/activity indicators -- separate from responses)
sessionPresence: defineTable({
  sessionId: v.id('programSessions'),
  userId: v.string(),  // Clerk userId
  phaseId: v.id('sessionPhases'),
  status: v.union(v.literal('typing'), v.literal('idle'), v.literal('submitted')),
  lastSeen: v.number(),
})
  .index('by_sessionId', ['sessionId'])
  .index('by_sessionId_and_userId', ['sessionId', 'userId'])
  .index('by_sessionId_and_phaseId', ['sessionId', 'phaseId']),

// Pair assignments per phase
sessionPairAssignments: defineTable({
  sessionId: v.id('programSessions'),
  phaseId: v.id('sessionPhases'),
  programId: v.id('programs'),  // Denormalized
  strategy: v.union(
    v.literal('random'),
    v.literal('complementary'),
    v.literal('manual'),
  ),
  pairs: v.array(v.object({
    members: v.array(v.string()),  // Clerk userIds (2 or 3 for trios)
  })),
  createdAt: v.number(),
  createdBy: v.string(),  // Clerk userId
})
  .index('by_sessionId', ['sessionId'])
  .index('by_sessionId_and_phaseId', ['sessionId', 'phaseId']),

// Session phase results (actual durations recorded after each phase)
sessionPhaseResults: defineTable({
  sessionId: v.id('programSessions'),
  phaseId: v.id('sessionPhases'),
  actualDurationMs: v.number(),
  startedAt: v.number(),
  endedAt: v.number(),
})
  .index('by_sessionId', ['sessionId']),
```

### Existing `coursePrompts` Schema Integration

The existing `coursePrompts.attachedTo` discriminated union already supports session phases:

```typescript
// Already in schema -- no changes needed to coursePrompts
attachedTo: v.union(
  v.object({ type: v.literal('module'), moduleId: v.id('programModules') }),
  v.object({
    type: v.literal('session_phase'),
    sessionId: v.id('programSessions'),
    phaseIndex: v.number(),  // NOTE: migrate to phaseId reference
  }),
),
```

**Migration needed:** The `phaseIndex: v.number()` in the `session_phase` attachment needs to become `phaseId: v.id('sessionPhases')` per CONTEXT.md decisions. This is a schema change to `coursePrompts.attachedTo`.

### One-Live-Session Invariant

```typescript
// In startSession mutation
const existingLive = await ctx.db
  .query('sessionLiveState')
  .withIndex('by_programId_and_status', (q) =>
    q.eq('programId', program._id).eq('status', 'running'),
  )
  .first()
if (existingLive) {
  throw new ConvexError('A session is already running for this program')
}
```

### Fisher-Yates Shuffle for Random Pairing

```typescript
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createPairs(userIds: string[]): Array<{ members: string[] }> {
  const shuffled = shuffle(userIds)
  const pairs: Array<{ members: string[] }> = []

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 2 >= shuffled.length && shuffled.length % 2 !== 0) {
      // Odd number: last 3 become a trio
      pairs.push({ members: shuffled.slice(i) })
      break
    }
    pairs.push({ members: [shuffled[i], shuffled[i + 1]] })
  }
  return pairs
}
```

### Complementary Pairing Algorithm

```typescript
function createComplementaryPairs(
  userIds: string[],
  responsesByUser: Map<string, string>, // userId -> selected option ID
): Array<{ members: string[] }> {
  // Group users by their choice
  const groups = new Map<string, string[]>()
  for (const userId of userIds) {
    const choice = responsesByUser.get(userId) ?? 'no_response'
    if (!groups.has(choice)) groups.set(choice, [])
    groups.get(choice)!.push(userId)
  }

  // Pair across different choices (complementary = different choices)
  const choiceKeys = [...groups.keys()]
  const paired = new Set<string>()
  const pairs: Array<{ members: string[] }> = []

  for (let i = 0; i < choiceKeys.length; i++) {
    for (let j = i + 1; j < choiceKeys.length; j++) {
      const groupA = groups.get(choiceKeys[i])!.filter((u) => !paired.has(u))
      const groupB = groups.get(choiceKeys[j])!.filter((u) => !paired.has(u))

      const pairCount = Math.min(groupA.length, groupB.length)
      for (let k = 0; k < pairCount; k++) {
        pairs.push({ members: [groupA[k], groupB[k]] })
        paired.add(groupA[k])
        paired.add(groupB[k])
      }
    }
  }

  // Remaining unpaired users: fall back to random pairing
  const remaining = userIds.filter((u) => !paired.has(u))
  if (remaining.length > 0) {
    pairs.push(...createPairs(remaining)) // reuse random pairing
  }

  return pairs
}
```

## State of the Art

| Old Approach                  | Current Approach                      | When Changed | Impact                                         |
| ----------------------------- | ------------------------------------- | ------------ | ---------------------------------------------- |
| Polling for live state        | Convex reactive subscriptions         | N/A          | No polling needed -- real-time by default      |
| Server-side timers            | Client-side countdown from timestamps | N/A          | Simpler, no scheduling/cancellation complexity |
| phaseIndex integer references | phaseId Convex \_id references        | Phase 40     | Stable references survive reordering           |
| Presence on response records  | Separate sessionPresence table        | Phase 40     | Avoids subscription churn                      |

**Deprecated/outdated:**

- `phaseIndex` in `coursePrompts.attachedTo.session_phase` needs migration to use `phaseId` (CONTEXT.md decision)

## Open Questions

1. **Complementary pairing semantics**
   - What we know: Pair users who made different choices on a specific prompt field
   - What's unclear: "Complementary" could mean cross-choice (different answers) or same-choice (similar thinking). Flagged for human review in CONTEXT.md.
   - Recommendation: Default to cross-choice (pair people with different answers for richer discussion). Make it configurable later if needed. Use the `sourceFieldId` on `pairConfig` to specify which choice field drives pairing.

2. **Session rerun behavior**
   - What we know: A session that completed could theoretically be run again
   - What's unclear: Should it create new phase results alongside old ones? Clear old data?
   - Recommendation: For now, completed sessions are immutable. If rerun is needed later, create a new `sessionLiveState` and new `sessionPhaseResults`, keeping the old ones as history. Flagged for human review.

3. **Post-session view**
   - What we know: Session data should be viewable after completion
   - What's unclear: UX for reviewing completed session data (responses, pairs, durations)
   - Recommendation: Basic read-only view that shows phase list with actual durations, pair assignments, and links to prompt responses. Can be a section on the existing admin program page.

4. **Schema migration for `coursePrompts.attachedTo.session_phase`**
   - What we know: Current schema uses `phaseIndex: v.number()`, needs to become `phaseId`
   - What's unclear: Whether any session-attached prompts already exist in production
   - Recommendation: Since session phases don't exist yet (this phase creates them), the migration is likely a no-op. Change the schema union variant. If any session_phase prompts exist, they'll need a backfill.

## Sources

### Primary (HIGH confidence)

- Convex docs (Context7 /websites/convex_dev) -- OCC, scheduled functions, subscription model
- Project codebase (direct read) -- schema.ts, course/prompts.ts, course/responses.ts, programs.ts
- CONTEXT.md (Codex-validated decisions) -- architectural constraints verified against actual code
- Convex CLAUDE.md (project rules) -- validator requirements, index naming, query patterns

### Secondary (MEDIUM confidence)

- Convex realtime skill (.claude/skills/convex-realtime/) -- subscription patterns, optimistic updates
- Convex best practices skill (.claude/skills/convex-best-practices/) -- idempotency, OCC patterns
- Convex schema validator skill (.claude/skills/convex-schema-validator/) -- schema migration strategy

### Tertiary (LOW confidence)

- None -- all findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- no new dependencies; everything already in the project
- Architecture: HIGH -- CONTEXT.md decisions validated by Codex against actual schema; patterns are standard Convex
- Pitfalls: HIGH -- subscription churn, OCC races, presence staleness are well-documented Convex concerns
- Schema design: HIGH -- follows existing codebase conventions (Clerk string IDs, denormalized fields, index naming)
- Pairing algorithms: MEDIUM -- algorithms are straightforward but "complementary" semantics need human input

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no external dependency changes expected)
