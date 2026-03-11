# Phase 37: Unified Prompt System - Research

**Researched:** 2026-03-10
**Domain:** Convex schema design, real-time reactive UI, interactive form primitives
**Confidence:** HIGH

## Summary

Phase 37 introduces the foundational interactive primitive for the v2.0 Course Program Platform: a **prompt** that facilitators create and participants respond to. The prompt must work identically whether attached to a module (pre-work) or a session phase (in-session), supporting text fields, single-choice, and multiple-choice inputs with three visibility modes (immediate, facilitator_only, write_then_reveal).

The existing codebase already has all the infrastructure needed: Convex schema with program/module/session tables, `checkProgramAccess`/`requireOrgAdmin` auth helpers, `useQuery`/`useMutation` real-time patterns from `convex/react`, shadcn/ui form components, and TanStack file-based routing. The main work is adding two new tables (`coursePrompts` and `coursePromptResponses`) in the `convex/course/` directory, building the CRUD mutations with proper access control, and creating a single reusable React component that handles all field types and visibility modes.

The critical design decision (already locked in STATE.md) is that write-then-reveal state lives on the prompt document (`revealedAt` timestamp), not on individual responses. This avoids the TOCTOU race condition where a facilitator triggers reveal but some responses haven't been marked yet. When `revealedAt` is set, all queries that return responses simply check `prompt.revealedAt !== undefined` to decide whether to include other participants' responses.

**Primary recommendation:** Two tables (`coursePrompts`, `coursePromptResponses`), one `convex/course/` directory with `prompts.ts` and `responses.ts`, one reusable `<PromptRenderer>` React component, and `react-markdown` for prompt body rendering.

## Standard Stack

### Core

| Library      | Version        | Purpose                                                           | Why Standard                |
| ------------ | -------------- | ----------------------------------------------------------------- | --------------------------- |
| convex       | (existing)     | Database, real-time sync, serverless functions                    | Already the project backend |
| convex/react | (existing)     | `useQuery`/`useMutation` hooks for reactive UI                    | Already integrated          |
| react        | 19             | UI framework with React Compiler                                  | Already in use              |
| shadcn/ui    | new-york style | Form components (Input, Textarea, Select, Checkbox, Card, Button) | Already the project UI kit  |
| tailwind v4  | (existing)     | Styling                                                           | Already configured          |

### Supporting

| Library        | Version    | Purpose                                                      | When to Use                                     |
| -------------- | ---------- | ------------------------------------------------------------ | ----------------------------------------------- |
| react-markdown | ^9.x       | Render prompt body markdown safely                           | Every prompt display (body field uses markdown) |
| remark-gfm     | ^4.x       | GitHub Flavored Markdown (tables, strikethrough, task lists) | Plugin for react-markdown                       |
| lucide-react   | (existing) | Icons for prompt types, reveal states, spotlight badge       | Already in use project-wide                     |
| sonner         | (existing) | Toast notifications for save/reveal/spotlight actions        | Already in use                                  |

### Alternatives Considered

| Instead of                                          | Could Use                              | Tradeoff                                                                                                                             |
| --------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| react-markdown                                      | Existing `renderMarkdown` helper       | Current helper only handles bold/italic/links -- no headings, lists, code blocks, or paragraphs. Prompt bodies need real markdown.   |
| Separate coursePrompts/coursePromptResponses tables | Embedded responses array on prompt doc | Convex 1 MiB doc limit; ~10 participants with long text responses could hit limit; separate table is standard Convex pattern         |
| Single monolithic table for prompts+responses       | Two tables                             | Two tables provides clean separation of facilitator-authored content vs participant responses, better indexes, easier access control |

### Installation

```bash
bun add react-markdown remark-gfm
```

No other new dependencies needed -- everything else is already in the project.

## Architecture Patterns

### Recommended Project Structure

```
convex/course/
  prompts.ts          # CRUD mutations/queries for coursePrompts table
  responses.ts        # Submit/save/get mutations/queries for coursePromptResponses table
  _helpers.ts         # Shared auth helpers (re-export from ../lib/auth + course-specific)

src/components/course/
  PromptRenderer.tsx  # The ONE reusable prompt component (reads prompt, renders fields)
  PromptFieldText.tsx       # Text/textarea field subcomponent
  PromptFieldChoice.tsx     # Single choice (radio) field subcomponent
  PromptFieldMultiChoice.tsx # Multiple choice (checkbox) field subcomponent
  PromptResponseViewer.tsx  # Facilitator view: all responses for a prompt
  PromptMarkdownBody.tsx    # Markdown body renderer (wraps react-markdown)
  SpotlightBadge.tsx        # Visual badge for spotlighted responses
```

### Pattern 1: Schema Design -- Two Tables with Attachment Polymorphism

**What:** One `coursePrompts` table with a discriminated union `attachedTo` field that references either a module or a session phase. One `coursePromptResponses` table with a foreign key to `coursePrompts`.

**When to use:** Always -- this IS the prompt system data model.

```typescript
// convex/schema.ts -- additions
coursePrompts: defineTable({
  programId: v.id('programs'),

  // Where this prompt is attached (module pre-work OR session phase)
  attachedTo: v.union(
    v.object({
      type: v.literal('module'),
      moduleId: v.id('programModules'),
    }),
    v.object({
      type: v.literal('session_phase'),
      sessionId: v.id('programSessions'),
      phaseIndex: v.number(),  // Which phase within the session
    }),
  ),

  // Content
  title: v.string(),
  body: v.optional(v.string()),  // Markdown
  orderIndex: v.number(),        // For multiple prompts on same attachment

  // Fields (the actual questions)
  fields: v.array(v.object({
    id: v.string(),              // Stable field identifier (e.g., "field_1")
    type: v.union(
      v.literal('text'),
      v.literal('choice'),
      v.literal('multiple_choice'),
    ),
    label: v.string(),
    required: v.boolean(),
    placeholder: v.optional(v.string()),
    options: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
    }))),                        // For choice/multiple_choice
    maxLength: v.optional(v.number()),  // For text fields
  })),

  // Visibility configuration
  revealMode: v.union(
    v.literal('immediate'),         // Responses visible to all immediately
    v.literal('facilitator_only'),  // Only facilitator sees responses
    v.literal('write_then_reveal'), // Hidden until facilitator triggers reveal
  ),
  revealedAt: v.optional(v.number()),  // Timestamp when reveal was triggered

  // Metadata
  createdBy: v.string(),  // Clerk userId
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_program', ['programId'])
  .index('by_module', ['programId', 'attachedTo.type'])  // Note: can't index into union directly
  // Use separate indexes for each attachment type query pattern
  .index('by_program_and_order', ['programId', 'orderIndex']),

coursePromptResponses: defineTable({
  promptId: v.id('coursePrompts'),
  programId: v.id('programs'),     // Denormalized for efficient queries
  userId: v.string(),              // Clerk userId

  // Response data -- keyed by field id
  fieldResponses: v.array(v.object({
    fieldId: v.string(),           // Matches field.id from prompt
    textValue: v.optional(v.string()),
    selectedOptionIds: v.optional(v.array(v.string())),
  })),

  // Status
  status: v.union(
    v.literal('draft'),           // Partially saved
    v.literal('submitted'),       // Final submission
  ),

  // Spotlight (facilitator highlights)
  spotlighted: v.optional(v.boolean()),
  spotlightedBy: v.optional(v.string()),
  spotlightedAt: v.optional(v.number()),

  // Timestamps
  savedAt: v.number(),            // Last save time (draft or submit)
  submittedAt: v.optional(v.number()),
})
  .index('by_prompt', ['promptId'])
  .index('by_prompt_and_user', ['promptId', 'userId'])
  .index('by_program_and_user', ['programId', 'userId']),
```

**Important schema notes:**

- Convex cannot index into discriminated union sub-fields (e.g., `attachedTo.moduleId`). Instead, query by `programId` and filter in the handler, or add denormalized top-level fields.
- Consider adding `moduleId: v.optional(v.id('programModules'))` and `sessionId: v.optional(v.id('programSessions'))` as denormalized top-level fields with their own indexes for efficient lookups. This is the recommended Convex pattern when you need to query by union sub-fields.

**Refined schema with denormalized index fields:**

```typescript
coursePrompts: defineTable({
  programId: v.id('programs'),

  // Denormalized for indexing (mirrors attachedTo)
  moduleId: v.optional(v.id('programModules')),
  sessionId: v.optional(v.id('programSessions')),

  // Canonical attachment info
  attachedTo: v.union(
    v.object({
      type: v.literal('module'),
      moduleId: v.id('programModules'),
    }),
    v.object({
      type: v.literal('session_phase'),
      sessionId: v.id('programSessions'),
      phaseIndex: v.number(),
    }),
  ),

  // ... rest of fields same as above
})
  .index('by_program', ['programId'])
  .index('by_module', ['moduleId'])
  .index('by_session', ['sessionId'])
  .index('by_program_and_order', ['programId', 'orderIndex']),
```

### Pattern 2: Write-Then-Reveal with Timestamp on Prompt (LOCKED DECISION)

**What:** The `revealedAt` field on `coursePrompts` controls visibility atomically. When a facilitator triggers reveal, a single mutation sets `revealedAt = Date.now()`. All response queries check this field.

**When to use:** Every time responses are fetched for display to participants.

```typescript
// convex/course/responses.ts
export const getPromptResponses = query({
  args: { promptId: v.id('coursePrompts') },
  returns: v.array(/* response validator */),
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get(promptId)
    if (!prompt) throw new Error('Prompt not found')

    const program = await ctx.db.get(prompt.programId)
    if (!program) throw new Error('Program not found')

    const access = await checkProgramAccess(ctx, program)
    if (!access) throw new Error('Access denied')

    const allResponses = await ctx.db
      .query('coursePromptResponses')
      .withIndex('by_prompt', (q) => q.eq('promptId', promptId))
      .collect()

    // Admin/facilitator sees everything
    if (access.isAdmin) return allResponses

    // Participant visibility depends on reveal mode
    switch (prompt.revealMode) {
      case 'immediate':
        // All submitted responses visible
        return allResponses.filter((r) => r.status === 'submitted')

      case 'facilitator_only':
        // Participant sees only their own
        return allResponses.filter((r) => r.userId === access.userId)

      case 'write_then_reveal':
        if (prompt.revealedAt) {
          // After reveal: all submitted responses visible
          return allResponses.filter((r) => r.status === 'submitted')
        }
        // Before reveal: only own response
        return allResponses.filter((r) => r.userId === access.userId)
    }
  },
})
```

### Pattern 3: Draft Save + Submit (Partial Response Persistence)

**What:** Participants can save partial responses as `draft` and finalize as `submitted`. A single `coursePromptResponses` document per participant per prompt, upserted on each save.

**When to use:** Every participant interaction with a prompt.

```typescript
// convex/course/responses.ts
export const saveResponse = mutation({
  args: {
    promptId: v.id('coursePrompts'),
    fieldResponses: v.array(
      v.object({
        fieldId: v.string(),
        textValue: v.optional(v.string()),
        selectedOptionIds: v.optional(v.array(v.string())),
      }),
    ),
    submit: v.boolean(), // false = save draft, true = submit
  },
  returns: v.id('coursePromptResponses'),
  handler: async (ctx, { promptId, fieldResponses, submit }) => {
    const userId = await requireAuth(ctx)
    const prompt = await ctx.db.get(promptId)
    if (!prompt) throw new Error('Prompt not found')

    // Check participant is enrolled
    const program = await ctx.db.get(prompt.programId)
    if (!program) throw new Error('Program not found')
    await requireProgramAccess(ctx, program)

    // Upsert: find existing response or create new
    const existing = await ctx.db
      .query('coursePromptResponses')
      .withIndex('by_prompt_and_user', (q) =>
        q.eq('promptId', promptId).eq('userId', userId),
      )
      .first()

    const now = Date.now()

    if (existing) {
      // Don't allow editing after submission (optional: could allow re-drafting)
      if (existing.status === 'submitted') {
        throw new ConvexError('Response already submitted')
      }
      await ctx.db.patch(existing._id, {
        fieldResponses,
        status: submit ? 'submitted' : 'draft',
        savedAt: now,
        submittedAt: submit ? now : undefined,
      })
      return existing._id
    }

    return await ctx.db.insert('coursePromptResponses', {
      promptId,
      programId: prompt.programId,
      userId,
      fieldResponses,
      status: submit ? 'submitted' : 'draft',
      savedAt: now,
      submittedAt: submit ? now : undefined,
    })
  },
})
```

### Pattern 4: Single Reusable Component

**What:** One `<PromptRenderer>` component that accepts a prompt document and renders identically regardless of context. The parent (module page or session page) just passes the prompt ID.

**When to use:** Everywhere a prompt appears.

```tsx
// src/components/course/PromptRenderer.tsx
interface PromptRendererProps {
  promptId: Id<'coursePrompts'>
  mode: 'participate' | 'review' // participant view vs facilitator review
}

function PromptRenderer({ promptId, mode }: PromptRendererProps) {
  const prompt = useQuery(api.course.prompts.get, { promptId })
  const myResponse = useQuery(api.course.responses.getMyResponse, { promptId })
  const allResponses = useQuery(
    api.course.responses.getPromptResponses,
    mode === 'review' ? { promptId } : 'skip',
  )
  // ... render prompt body, fields, responses
}
```

### Anti-Patterns to Avoid

- **Embedding responses in the prompt document:** Convex 1 MiB document limit. Even with ~10 participants, text responses can be substantial. Always use a separate table.
- **Per-response reveal flag:** Setting `revealed: true` on each response document creates a TOCTOU race. Use the prompt-level `revealedAt` timestamp instead.
- **Different components for module vs session prompts:** This defeats the "one reusable primitive" requirement. The component should be context-agnostic.
- **Using `.filter()` in Convex queries:** Project rule -- always use `.withIndex()`. Define proper indexes for all query patterns.
- **Storing field options as a comma-separated string:** Use a proper array of objects with `id` and `label` for type safety and reliable matching.

## Don't Hand-Roll

| Problem                    | Don't Build             | Use Instead                                                      | Why                                                                                                                    |
| -------------------------- | ----------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Markdown rendering         | Custom regex parser     | `react-markdown` + `remark-gfm`                                  | Prompt bodies need headings, lists, code blocks, links -- the existing `renderMarkdown` only handles bold/italic/links |
| Form field validation      | Custom validation logic | Convex `v.` validators on mutations + HTML5 `required` attribute | Convex validators are the single source of truth; client-side is just UX                                               |
| Real-time response updates | WebSocket polling       | Convex `useQuery` subscriptions                                  | Already built into the stack -- responses update in real-time automatically                                            |
| Optimistic save feedback   | Custom state tracking   | `useMutation` + sonner toast                                     | Standard pattern already used throughout the codebase                                                                  |
| Access control             | Custom middleware       | Existing `checkProgramAccess` / `requireOrgAdmin` helpers        | Already battle-tested in `convex/programs.ts`                                                                          |

**Key insight:** The prompt system is fundamentally a CRUD+visibility layer on top of existing program infrastructure. The hard parts (real-time sync, auth, reactive queries) are already solved by Convex. The new work is schema design, visibility logic, and a clean component.

## Common Pitfalls

### Pitfall 1: Indexing into Discriminated Union Sub-Fields

**What goes wrong:** Trying to create an index like `.index('by_module', ['attachedTo.moduleId'])` fails because Convex doesn't support indexing nested union fields.
**Why it happens:** Convex indexes work on top-level fields only.
**How to avoid:** Denormalize -- add top-level `moduleId` and `sessionId` optional fields that mirror the `attachedTo` union, and index those.
**Warning signs:** Queries that use `.filter()` instead of `.withIndex()` to find prompts by module.

### Pitfall 2: Forgetting `returns` Validator on Convex Functions

**What goes wrong:** TypeScript compiles but Convex deployment fails or produces untyped results.
**Why it happens:** Project rule (convex/CLAUDE.md) requires both `args` and `returns` on every function.
**How to avoid:** Always include `returns:` validator. Copy pattern from existing functions in `programs.ts`.
**Warning signs:** Missing `returns` field in function definitions.

### Pitfall 3: Race Condition on Draft Save

**What goes wrong:** Participant has two tabs open, saves in both, one overwrites the other.
**Why it happens:** Upsert pattern reads then writes -- if both tabs read before either writes, last write wins.
**How to avoid:** Convex OCC (Optimistic Concurrency Control) handles this automatically -- the second transaction retries with fresh data. Make the save mutation idempotent by always fully replacing `fieldResponses`.
**Warning signs:** Partial data loss when saving from multiple contexts.

### Pitfall 4: Spotlight Privilege Escalation

**What goes wrong:** A participant calls the spotlight mutation directly (all public mutations are internet-exposed).
**Why it happens:** Spotlight is a facilitator-only action but the mutation is public.
**How to avoid:** Always check `requireOrgAdmin` in the spotlight mutation. Or use `internalMutation` and expose via a facilitator-gated public wrapper.
**Warning signs:** Non-admin users spotlighting responses.

### Pitfall 5: Reveal Mode Leaking Responses Before Reveal

**What goes wrong:** Response query returns other participants' responses before reveal in `write_then_reveal` mode.
**Why it happens:** Visibility filtering logic has a bug or is missing from a query path.
**How to avoid:** Centralize visibility logic in a single helper function used by ALL response queries. Never access `coursePromptResponses` without going through the visibility filter.
**Warning signs:** Participants seeing each other's responses before facilitator triggers reveal.

### Pitfall 6: Missing `"use node"` Directive

**What goes wrong:** Action files that use Node.js APIs fail at runtime.
**Why it happens:** Convex runs in a custom runtime; Node.js APIs need explicit opt-in.
**How to avoid:** This phase likely does NOT need actions (no external API calls). All operations are queries and mutations. Only add `"use node"` if an action is truly needed.
**Warning signs:** Runtime errors about missing Node.js globals.

## Code Examples

### Prompt CRUD -- Create Prompt (Facilitator)

```typescript
// convex/course/prompts.ts
import { mutation, query } from '../_generated/server'
import { v } from 'convex/values'
import { ConvexError } from 'convex/values'
import { getUserId } from '../lib/auth'

// Shared field validator (reused across functions)
const fieldValidator = v.object({
  id: v.string(),
  type: v.union(
    v.literal('text'),
    v.literal('choice'),
    v.literal('multiple_choice'),
  ),
  label: v.string(),
  required: v.boolean(),
  placeholder: v.optional(v.string()),
  options: v.optional(v.array(v.object({ id: v.string(), label: v.string() }))),
  maxLength: v.optional(v.number()),
})

const attachedToValidator = v.union(
  v.object({ type: v.literal('module'), moduleId: v.id('programModules') }),
  v.object({
    type: v.literal('session_phase'),
    sessionId: v.id('programSessions'),
    phaseIndex: v.number(),
  }),
)

export const create = mutation({
  args: {
    programId: v.id('programs'),
    attachedTo: attachedToValidator,
    title: v.string(),
    body: v.optional(v.string()),
    orderIndex: v.number(),
    fields: v.array(fieldValidator),
    revealMode: v.union(
      v.literal('immediate'),
      v.literal('facilitator_only'),
      v.literal('write_then_reveal'),
    ),
  },
  returns: v.id('coursePrompts'),
  handler: async (ctx, args) => {
    // Only org admin (facilitator) can create prompts
    const program = await ctx.db.get(args.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const userId = await getUserId(ctx)
    const now = Date.now()

    return await ctx.db.insert('coursePrompts', {
      ...args,
      // Denormalized index fields
      moduleId:
        args.attachedTo.type === 'module'
          ? args.attachedTo.moduleId
          : undefined,
      sessionId:
        args.attachedTo.type === 'session_phase'
          ? args.attachedTo.sessionId
          : undefined,
      createdBy: userId!,
      createdAt: now,
      updatedAt: now,
    })
  },
})
```

### Trigger Reveal (Facilitator)

```typescript
// convex/course/prompts.ts
export const triggerReveal = mutation({
  args: { promptId: v.id('coursePrompts') },
  returns: v.null(),
  handler: async (ctx, { promptId }) => {
    const prompt = await ctx.db.get(promptId)
    if (!prompt) throw new ConvexError('Prompt not found')
    if (prompt.revealMode !== 'write_then_reveal') {
      throw new ConvexError('Prompt is not in write_then_reveal mode')
    }
    if (prompt.revealedAt) {
      return null // Already revealed (idempotent)
    }

    const program = await ctx.db.get(prompt.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    await ctx.db.patch(promptId, {
      revealedAt: Date.now(),
      updatedAt: Date.now(),
    })
    return null
  },
})
```

### Spotlight Response (Facilitator)

```typescript
// convex/course/responses.ts
export const toggleSpotlight = mutation({
  args: { responseId: v.id('coursePromptResponses') },
  returns: v.null(),
  handler: async (ctx, { responseId }) => {
    const response = await ctx.db.get(responseId)
    if (!response) throw new ConvexError('Response not found')

    const prompt = await ctx.db.get(response.promptId)
    if (!prompt) throw new ConvexError('Prompt not found')

    const program = await ctx.db.get(prompt.programId)
    if (!program) throw new ConvexError('Program not found')
    await requireOrgAdmin(ctx, program.orgId)

    const userId = await getUserId(ctx)
    const isSpotlighted = response.spotlighted === true

    await ctx.db.patch(responseId, {
      spotlighted: !isSpotlighted,
      spotlightedBy: isSpotlighted ? undefined : userId!,
      spotlightedAt: isSpotlighted ? undefined : Date.now(),
    })
    return null
  },
})
```

### Prompt Renderer Component (React)

```tsx
// src/components/course/PromptRenderer.tsx
import { useQuery, useMutation } from 'convex/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '~/convex/_generated/api'

// The body markdown renderer
function PromptBody({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none">
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  )
}
```

## State of the Art

| Old Approach                             | Current Approach                                  | When Changed                      | Impact                                                     |
| ---------------------------------------- | ------------------------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| Per-response reveal flags                | Prompt-level `revealedAt` timestamp               | Decided in v2.0 design (STATE.md) | Eliminates TOCTOU race on reveal                           |
| All program code in `convex/programs.ts` | New course features in `convex/course/` directory | Decided in v2.0 design (STATE.md) | `programs.ts` is 1795 lines; new code must go in `course/` |
| Simple `renderMarkdown` helper           | `react-markdown` library                          | This phase                        | Prompt bodies need full markdown support                   |

**Deprecated/outdated:**

- The existing `renderMarkdown` in `src/lib/render-markdown.tsx` handles only bold/italic/links. It remains fine for chat messages but is inadequate for prompt bodies.
- `convex-helpers` is not currently used in the project (not in package.json). The project uses manual auth helpers instead. Continue this pattern for consistency.

## Open Questions

1. **Should participants be able to edit after submission?**
   - What we know: Current design prevents editing after `submitted` status
   - What's unclear: Whether facilitators want to allow re-submission (e.g., for iterative exercises)
   - Recommendation: Start with no editing after submission. If needed later, add an `allowResubmit` flag on the prompt. This is a safe default that can be relaxed.

2. **Prompt ordering within an attachment point**
   - What we know: `orderIndex` field supports multiple prompts per module/session phase
   - What's unclear: Whether drag-and-drop reordering is needed in the facilitator UI
   - Recommendation: Support `orderIndex` in the schema but use a simple up/down arrow reorder UI initially. Full drag-and-drop can be added later.

3. **Maximum number of fields per prompt**
   - What we know: Convex array limit is 8192 elements, so no technical constraint
   - What's unclear: Whether there should be a UX-driven limit
   - Recommendation: No hard limit in schema. Optionally limit to 20 fields in the UI to prevent facilitator overload. Enforced in the mutation with a simple check.

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                           | Research Support                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PROMPT-01 | Facilitator can create prompts with markdown text and multiple fields (text, choice, multiple_choice) | Schema `coursePrompts` table with `body` (markdown), `fields` array with discriminated `type` field. `react-markdown` for rendering. CRUD in `convex/course/prompts.ts` |
| PROMPT-02 | Facilitator can attach prompts to modules (pre-work) or session phases (in-session)                   | `attachedTo` discriminated union with denormalized `moduleId`/`sessionId` for indexing. Same `<PromptRenderer>` component used in both contexts                         |
| PROMPT-03 | Participant can respond to prompts with text inputs and choice selections                             | `coursePromptResponses` table with `fieldResponses` array. `saveResponse` mutation handles both text values and selected option IDs                                     |
| PROMPT-04 | Participant can save partial responses and resume later                                               | Upsert pattern in `saveResponse` with `draft`/`submitted` status. `by_prompt_and_user` index for fast lookup of existing draft                                          |
| PROMPT-05 | Facilitator can configure reveal mode per prompt (immediate, facilitator_only, write_then_reveal)     | `revealMode` field on `coursePrompts` with three literal union values. Set at creation, can be updated before responses exist                                           |
| PROMPT-06 | Facilitator can trigger reveal on write_then_reveal prompts to show all responses                     | `triggerReveal` mutation sets `revealedAt` timestamp on prompt. All response queries check this field for visibility. Idempotent                                        |
| PROMPT-07 | Facilitator can view all participant responses for any prompt                                         | `getPromptResponses` query returns all responses when `access.isAdmin === true`. `<PromptResponseViewer>` component for facilitator dashboard                           |
| PROMPT-08 | Facilitator can spotlight/highlight exceptional responses visible to entire cohort                    | `spotlighted`/`spotlightedBy`/`spotlightedAt` fields on response document. `toggleSpotlight` mutation with admin check. `<SpotlightBadge>` component                    |
| PROMPT-09 | Same prompt component renders identically whether attached to a module or a session phase             | Single `<PromptRenderer>` component accepts `promptId` only. Parent context (module page or session page) passes the ID. Component is context-agnostic                  |

</phase_requirements>

## Sources

### Primary (HIGH confidence)

- Context7 `/websites/convex_dev` -- Schema design, union types, document size limits (1 MiB), array limits (8192), index patterns
- Context7 `/remarkjs/react-markdown` -- Installation, basic usage, custom components, remark-gfm plugin
- Project codebase: `convex/schema.ts` lines 955-1146 -- existing program/module/session/materialProgress tables
- Project codebase: `convex/programs.ts` lines 1270-1321 -- `checkProgramAccess` / `requireProgramAccess` helpers
- Project codebase: `convex/lib/auth.ts` -- `getUserId`, `requireAuth`, `requireOrgAdmin` patterns
- Project codebase: `convex/CLAUDE.md` -- Mandatory `args`/`returns` validators, no `.filter()`, index naming conventions

### Secondary (MEDIUM confidence)

- Project codebase: `src/lib/render-markdown.tsx` -- Current markdown helper limitations (only bold/italic/links)
- Project codebase: `src/routes/org/$slug/program/$programSlug.tsx` -- Existing participant program page pattern (useQuery with conditional "skip")

### Tertiary (LOW confidence)

- None -- all findings verified against codebase or Context7

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all libraries either already in project or verified via Context7
- Architecture: HIGH -- schema patterns verified against Convex docs and existing codebase patterns
- Pitfalls: HIGH -- derived from Convex documentation limits and project-specific conventions in convex/CLAUDE.md

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain -- Convex schema patterns and react-markdown are mature)
