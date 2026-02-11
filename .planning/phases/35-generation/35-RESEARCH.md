# Phase 35: Generation, Display & Interactions - Research

**Researched:** 2026-02-10
**Domain:** Convex backend (schema + LLM pipeline) + React frontend (components + page integration)
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**[1. Schema: `careerActions` table structure]**

- Decision: Use the schema from the research doc almost verbatim -- `careerActions` table with `profileId`, `type` (8-literal union), `title`, `description`, `rationale`, `status` (5-literal union: `active`/`saved`/`dismissed`/`in_progress`/`done`), timestamp fields (`startedAt`, `completedAt`, `generatedAt`), `modelVersion`, and `completionConversationStarted`. Index on `by_profile` and `by_profile_status`.
- Rationale: Separate table from matches is correct -- different lifecycles, different state machines. The 8-type taxonomy is well-researched and constrained. Using `active` instead of `suggested` to match the existing match status naming convention (`active`/`dismissed`/`saved`).
- Confidence: HIGH

**[2. Generation trigger: parallel with matching via scheduler]**

- Decision: In `triggerMatchComputation` (convex/matches.ts), schedule `computeActionsForProfile` via `ctx.scheduler.runAfter(0, ...)` alongside the existing `computeMatchesForProfile` call. Actions generate in parallel with matches, not chained after.
- Rationale: Matches should display immediately. Actions arriving 1-2 seconds later via Convex real-time sync is fine UX. If action generation fails, matches are unaffected. For first-time users with no existing matches, profile context alone is sufficient for quality actions.
- Confidence: HIGH

**[3. LLM call structure: single Haiku call with forced tool_choice]**

- Decision: Single `claude-haiku-4-5-20251001` call with `tool_choice: { type: 'tool', name: 'generate_career_actions' }`. Input: profile context (reuse `buildProfileContext()`), existing match growth areas from DB, descriptions of currently saved/in-progress/done actions (to avoid duplicating). Output: array of 3-5 actions, each with `type`, `title`, `description`, `rationale`.
- Rationale: Matches exactly the existing matching pipeline pattern. Single call is sufficient for 3-5 items (unlike matching which needs batching for 50 opportunities). Haiku 4.5 is the right model per CLAUDE.md guidance (speed + cost for structured output).
- Confidence: HIGH

**[4. Regeneration: delete active, preserve user-modified]**

- Decision: On regeneration, delete only `status === 'active'` actions. Actions with status `saved`, `in_progress`, or `done` are preserved. Pass preserved action titles/types to the LLM prompt so it can avoid generating duplicates.
- Rationale: Users invest intent when they save or start an action. Destroying that state would break trust. This mirrors the philosophy but differs from match regeneration (which replaces all matches), because actions have richer user state.
- Confidence: HIGH

**[5. File organization: `convex/careerActions/` directory]**

- Decision: New directory `convex/careerActions/` with `compute.ts`, `prompts.ts`, `mutations.ts`, `queries.ts`, `validation.ts`. Public query API exposed directly from `queries.ts` (not a separate top-level file), since Convex auto-generates API paths from directory structure.
- Rationale: Mirrors `convex/matching/` organization exactly. Keeps action logic self-contained.
- Confidence: HIGH

**[6. Action card component: violet-accented, simpler than MatchCard]**

- Decision: New `src/components/actions/ActionCard.tsx` component. Uses `violet-100`/`violet-600`/`violet-800` color tokens (Tailwind v4 has violet built in). Card shows: type badge (violet), title, description text, "Based on:" rationale line, and status-dependent CTA buttons. No swipe gestures for actions -- use button interactions only. Desktop hover reveals save/dismiss (matching MatchCard pattern).
- Rationale: Actions are lower information density than matches (no org, location, probability). Simpler card is appropriate. Violet distinguishes from the emerald/blue/amber tier system. Skipping swipe keeps scope reasonable -- actions have more states than matches (in_progress, done) that don't map cleanly to left/right swipe.
- Confidence: HIGH

**[7. Matches page placement: "Your Next Moves" section after match tiers, before growth areas]**

- Decision: Insert `CareerActionsSection` component between the last `MatchTierSection` and the existing `GrowthAreas` component on `/matches`. Section header: "Your Next Moves" with violet accent. Shows active + in-progress actions in a grid. Completed actions in a collapsible section (same pattern as `SavedMatchesSection`). Dismissed actions hidden.
- Rationale: This positioning creates a narrative flow: "Here are jobs to apply to" -> "Here are things you can do yourself" -> "Here are skills to build." Growth areas are the "why," actions are the "what."
- Confidence: HIGH

**[8. Dashboard preview: 1-2 actions below top matches]**

- Decision: Add a "Your Next Moves" section to the Dashboard (`src/routes/index.tsx`) between "Your Top Matches" and "Suggested Organizations." Show up to 2 active actions (priority order from generation). Link to `/matches` for full view. Use the same `ActionCard` component with a compact variant or just show the first 2.
- Rationale: Dashboard already shows top matches in the same pattern (slice to 3, link to full view). 1-2 actions is enough to create awareness without overwhelming the dashboard.
- Confidence: HIGH

**[9. Type badge icons: one icon per action type]**

- Decision: Map each of the 8 action types to a lucide-react icon. Proposed mapping:
  - `replicate` -> `FlaskConical`
  - `collaborate` -> `Users`
  - `start_org` -> `Rocket`
  - `identify_gaps` -> `Search`
  - `volunteer` -> `HandHeart`
  - `build_tools` -> `Wrench`
  - `teach_write` -> `PenLine`
  - `develop_skills` -> `GraduationCap`
- Rationale: Visual differentiation aids scanning. All icons exist in lucide-react (already a project dependency). Violet badge with icon + label makes each type instantly recognizable.
- Confidence: MEDIUM (icon choices are subjective, may adjust during implementation)

**[10. Status mutation pattern: individual mutations per transition]**

- Decision: Create focused mutations: `saveAction`, `dismissAction`, `startAction`, `completeAction`, `unsaveAction`. Each validates the transition is legal (e.g., can't start a dismissed action). Mirror the existing match `saveMatch`/`dismissMatch` pattern.
- Rationale: Focused mutations are easier to audit for correctness than a generic `updateActionStatus` mutation. The existing codebase uses this pattern for matches.
- Confidence: HIGH

**[11. Completion flow scope for Phase 35]**

- Decision: In Phase 35, "Mark Done" simply sets `status: 'done'` and `completedAt`. The completion enrichment chat (two paths: "Tell us about it" vs "Just mark done") belongs to Phase 36. Phase 35 only implements the status toggle.
- Rationale: The roadmap explicitly separates Phase 35 (Generation, Display & Interactions) from Phase 36 (Completion Loop). The success criteria for Phase 35 say "mark done" as a state, not the enrichment flow. Keeping this boundary clean reduces Phase 35 scope.
- Confidence: HIGH

**[12. No new CSS custom properties needed]**

- Decision: Use Tailwind's built-in `violet-*` utilities directly (`bg-violet-100`, `text-violet-600`, `border-violet-200`, etc.) rather than adding OKLCH custom properties to `app.css`.
- Rationale: The existing design system uses OKLCH for semantic tokens (primary, secondary, etc.) but the tier colors (emerald, blue, amber) use Tailwind utilities directly. Violet should follow the same pattern. Adding custom OKLCH tokens for a single accent color is over-engineering.
- Confidence: HIGH

**[13. Action generation context includes growth areas]**

- Decision: The action generation prompt receives: (1) full profile context via `buildProfileContext()`, (2) aggregated growth areas from existing matches in DB, (3) titles/types of preserved actions (saved/in-progress/done) to avoid duplication. Growth areas are fetched by querying the matches table at generation time.
- Rationale: Growth areas bridge the gap between "what matches tell you" and "what you should do." Including them makes actions feel like they close the loop on match feedback, which is a key differentiator.
- Confidence: HIGH

**[14. Empty state handling]**

- Decision: If no actions have been generated yet (new user, no matches run), the "Your Next Moves" section shows a minimal prompt: "Refresh your matches to generate personalized career actions." No separate CTA -- the existing "Refresh Matches" button handles it.
- Rationale: Actions generate alongside matches. A user who has never run matching won't have actions. The simplest solution is to guide them to the existing refresh flow.
- Confidence: HIGH

### Claude's Discretion

- Exact wording of the system prompt for action generation (will follow patterns from `convex/matching/prompts.ts`)
- Specific animation/transition details for action cards (will follow `AnimatedCard` stagger pattern)
- Exact responsive grid breakpoints for action cards (will match `MatchTierSection` grid: 1 col mobile, 2 col tablet, 3 col desktop)
- Whether to show a "2 of 5 completed" progress indicator in Phase 35 or defer to later (leaning toward including it -- it's trivial and motivational)
- Exact ordering of sections in completed actions collapsible (by `completedAt` desc, most recent first)

### Deferred Ideas (OUT OF SCOPE)

None explicitly listed. However, the following are Phase 36 scope and must NOT be implemented in Phase 35:

- Completion enrichment chat (COMP-01 through COMP-04)
- "Tell us about it" vs "Just mark done" modal flow
- Seeding enrichment chat with action context
- Auto-recompute after profile updates from completion

The following are explicitly out of scope per REQUIREMENTS.md:

- Specific resource links (papers, URLs, program names) in generated actions
- Gamification (points, streaks, badges)
- Action deadlines or time estimates
- Social/public sharing of actions
- Continuous progress bars on actions
- Detailed step-by-step project plans
- Auto-recompute on completion
  </user_constraints>

## Summary

Phase 35 adds LLM-generated personalized career actions to the existing ASTN platform. It spans three layers: (1) a Convex backend with a new `careerActions` table, LLM generation pipeline, and state mutation functions; (2) React frontend components for displaying and interacting with action cards; and (3) integration into the existing matches page and dashboard.

The implementation requires zero new dependencies. Every technology needed is already in the project: Anthropic SDK for LLM calls, Convex for database/scheduler/real-time sync, lucide-react for icons, Tailwind v4 for violet color utilities, shadcn/ui Card/Badge/Button for UI primitives, and Zod for validation.

The architecture mirrors the existing matching pipeline (`convex/matching/`) almost exactly. The key differences are: (a) action generation is a single LLM call (not batched), (b) regeneration preserves user-modified actions instead of replacing all, and (c) actions have a richer state machine (5 states vs 3 for matches).

**Primary recommendation:** Follow the matching pipeline's file structure, LLM call pattern, and mutation conventions exactly. The only novel code is the action generation prompt, the regeneration preservation logic, and the ActionCard component.

## Standard Stack

### Core

| Library             | Version  | Purpose                             | Why Standard                                                                                                       |
| ------------------- | -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `convex`            | ^1.31.7  | Database, scheduler, real-time sync | Already the project's backend. Schema extensions, scheduled actions, mutations, queries all use existing patterns. |
| `@anthropic-ai/sdk` | ^0.71.2  | Claude Haiku 4.5 API calls          | Already used for matching. Forced `tool_choice` for structured output is the established pattern.                  |
| `react`             | ^19.2.1  | Frontend UI                         | Already the project's UI framework. React Compiler enabled via babel plugin.                                       |
| `zod`               | ^3.25    | LLM output validation               | Already used in `convex/matching/validation.ts`. Shadow mode validation (log errors, accept data).                 |
| `tailwindcss`       | ^4.1.13  | Styling with violet-\* utilities    | Already the project's CSS framework. Built-in violet color palette works out of the box.                           |
| `lucide-react`      | ^0.562.0 | Icons for action type badges        | Already a project dependency. All 8 proposed icons verified to exist.                                              |

### Supporting

| Library                    | Version | Purpose                                                                 | When to Use                                                           |
| -------------------------- | ------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `tw-animate-css`           | ^1.4.0  | Entrance animations (`animate-in`, `fade-in`, `slide-in-from-bottom-2`) | ActionCard entrance animation via existing `AnimatedCard` wrapper.    |
| `class-variance-authority` | ^0.7.1  | Component variants (`cva`)                                              | If ActionCard needs compact/full variants for dashboard vs full view. |
| `tailwind-merge`           | ^3.4.0  | Class merging via `cn()` utility                                        | Already used everywhere. Use for conditional classes in ActionCard.   |

### Alternatives Considered

None. All decisions are locked. No new dependencies needed.

**Installation:**

```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure

```
convex/
├── careerActions/           # NEW: mirrors convex/matching/ structure
│   ├── compute.ts           # LLM generation (internalAction, "use node")
│   ├── prompts.ts           # System prompt, tool definition, context builders
│   ├── mutations.ts         # Save actions, state transitions (internalMutation + public mutation)
│   ├── queries.ts           # Internal queries + public queries for frontend
│   └── validation.ts        # Zod schema for LLM output
├── matches.ts               # MODIFIED: add scheduler call in triggerMatchComputation
└── schema.ts                # MODIFIED: add careerActions table definition

src/
├── components/
│   └── actions/             # NEW: mirrors src/components/matches/ structure
│       ├── ActionCard.tsx           # Individual action card with violet accent
│       ├── CareerActionsSection.tsx  # Section wrapper for matches page
│       └── CompletedActionsSection.tsx # Collapsible completed actions
├── routes/
│   ├── matches/index.tsx    # MODIFIED: add CareerActionsSection
│   └── index.tsx            # MODIFIED: add dashboard action preview
```

### Pattern 1: Convex Internal Action with "use node" for LLM Calls

**What:** All files that call the Anthropic SDK must start with `"use node"` directive and use `internalAction`.
**When to use:** `convex/careerActions/compute.ts`
**Source:** Verified in `convex/matching/compute.ts` line 1.

```typescript
// convex/careerActions/compute.ts
'use node'

import { v } from 'convex/values'
import Anthropic from '@anthropic-ai/sdk'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

const MODEL_VERSION = 'claude-haiku-4-5-20251001'

export const computeActionsForProfile = internalAction({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    // 1. Get profile via internal query
    const profile = await ctx.runQuery(
      internal.careerActions.queries.getFullProfile,
      { profileId },
    )
    // 2. Get existing matches for growth area context
    // 3. Get preserved actions (saved/in_progress/done)
    // 4. Build context, call Haiku, validate, save
  },
})
```

### Pattern 2: Forced Tool Choice with Zod Shadow Validation

**What:** Use `tool_choice: { type: 'tool', name: 'generate_career_actions' }` to guarantee structured JSON output. Validate with Zod in shadow mode (log errors but accept data).
**When to use:** The single LLM call in `compute.ts`.
**Source:** Verified in `convex/matching/compute.ts` lines 172-183 and `convex/matching/validation.ts`.

```typescript
// In compute.ts
const response = await anthropic.messages.create({
  model: MODEL_VERSION,
  max_tokens: 4096,
  tools: [generateCareerActionsTool],
  tool_choice: { type: 'tool', name: 'generate_career_actions' },
  system: ACTION_GENERATION_SYSTEM_PROMPT,
  messages: [{ role: 'user', content: contextString }],
})

const toolUse = response.content.find((block) => block.type === 'tool_use')
const parseResult = actionResultSchema.safeParse(toolUse.input)
if (!parseResult.success) {
  log('error', 'computeActionsForProfile: validation failed', {
    issues: parseResult.error.issues,
  })
}
const result = (
  parseResult.success ? parseResult.data : toolUse.input
) as ActionGenerationResult
```

### Pattern 3: Scheduler Fire-and-Forget for Parallel Generation

**What:** Use `ctx.scheduler.runAfter(0, ...)` to trigger action generation alongside matching, without blocking the caller.
**When to use:** In `convex/matches.ts` `triggerMatchComputation`.
**Source:** Verified pattern in `convex/matching/compute.ts` line 84.

```typescript
// In convex/matches.ts triggerMatchComputation handler
// Existing: trigger matching
const result = await ctx.runAction(
  internal.matching.compute.computeMatchesForProfile,
  { profileId: profile._id },
)

// NEW: trigger action generation in parallel
await ctx.scheduler.runAfter(
  0,
  internal.careerActions.compute.computeActionsForProfile,
  { profileId: profile._id },
)
```

### Pattern 4: Public Mutations with Auth Check for Status Transitions

**What:** Each status transition gets its own public mutation that validates auth and checks the transition is legal.
**When to use:** `convex/careerActions/mutations.ts` for save, dismiss, start, complete, unsave.
**Source:** Verified in `convex/matches.ts` lines 254-301 (`dismissMatch`, `saveMatch`).

```typescript
// convex/careerActions/mutations.ts
export const saveAction = mutation({
  args: { actionId: v.id('careerActions') },
  handler: async (ctx, { actionId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const action = await ctx.db.get('careerActions', actionId)
    if (!action) throw new Error('Action not found')

    // Verify ownership via profile
    const profile = await ctx.db.get('profiles', action.profileId)
    if (!profile || profile.userId !== userId) throw new Error('Not authorized')

    // Validate transition: only active -> saved
    if (action.status !== 'active') {
      throw new Error('Can only save active actions')
    }

    await ctx.db.patch('careerActions', actionId, { status: 'saved' })
  },
})
```

### Pattern 5: Regeneration with Selective Deletion

**What:** On regeneration, delete only `active` status actions, preserve `saved`, `in_progress`, `done`. Pass preserved action info to LLM to avoid duplicates.
**When to use:** `saveGeneratedActions` internal mutation.
**Source:** Novel for this feature. Matches use bulk replacement (`convex/matching/mutations.ts` line 158).

```typescript
// In saveGeneratedActions mutation
const existing = await ctx.db
  .query('careerActions')
  .withIndex('by_profile', (q) => q.eq('profileId', profileId))
  .collect()

// Delete only active (stale suggestions)
for (const action of existing) {
  if (action.status === 'active') {
    await ctx.db.delete('careerActions', action._id)
  }
}
// preserved = existing.filter(a => a.status !== 'active' && a.status !== 'dismissed')
// Insert new actions with status 'active'
```

### Pattern 6: Collapsible Section (SavedMatchesSection Pattern)

**What:** Completed actions use the same collapsible expand/collapse pattern as saved matches.
**When to use:** `CompletedActionsSection` component.
**Source:** Verified in `src/components/matches/SavedMatchesSection.tsx`.

Key features to replicate:

- `sessionStorage` for persisted expanded state across navigation
- `grid-rows-[1fr]`/`grid-rows-[0fr]` CSS animation for smooth expand/collapse
- Count badge in header
- Violet color scheme instead of emerald

### Anti-Patterns to Avoid

- **Blocking matches on action generation:** Never `await` the action compute inside `triggerMatchComputation`. Use `ctx.scheduler.runAfter` only. If actions fail, matches are unaffected.
- **Storing actions in the matches table:** Different lifecycles, different state machines. Separate `careerActions` table is mandatory.
- **Generic `updateActionStatus` mutation:** Use individual named mutations per transition. Easier to audit, matches existing pattern.
- **Referencing specific external resources in actions:** The LLM prompt must explicitly forbid naming specific papers, programs, or URLs. High hallucination risk.
- **Swipe gestures on action cards:** Decision is button-only interactions. Actions have 5 states that don't map to left/right swipe.
- **Separate "Refresh Actions" button:** Actions refresh when matches refresh. Single trigger. No separate UI.
- **View transition names on action cards:** Actions don't navigate to detail pages in Phase 35. No view-transition-name needed.

## Don't Hand-Roll

| Problem                    | Don't Build          | Use Instead                                        | Why                                                                             |
| -------------------------- | -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| Structured LLM output      | Custom JSON parsing  | `tool_choice: { type: 'tool' }` with Anthropic SDK | Guaranteed valid JSON. Existing pattern.                                        |
| Output validation          | Manual field checks  | Zod schemas in shadow mode                         | Existing pattern in `convex/matching/validation.ts`. Catches LLM format drift.  |
| Real-time UI updates       | Polling or WebSocket | Convex reactive queries                            | Built into the framework. Components re-render automatically when data changes. |
| Card entrance animation    | Custom CSS keyframes | `AnimatedCard` wrapper with `tw-animate-css`       | Existing component with stagger support.                                        |
| Collapsible section        | Custom accordion     | `grid-rows-[1fr]`/`grid-rows-[0fr]` CSS pattern    | Proven in `SavedMatchesSection`. Performant, no JS animation library.           |
| Auth checking in mutations | Custom middleware    | `getUserId(ctx)` from `convex/lib/auth.ts`         | Existing auth helper used by all mutations.                                     |
| Logging                    | Custom logger        | `log()` from `convex/lib/logging.ts`               | Existing structured logging. Outputs JSON to Convex dashboard.                  |

**Key insight:** Phase 35 requires zero novel technical solutions. Every pattern exists in the codebase. The value is in composition, not invention.

## Common Pitfalls

### Pitfall 1: Generic Fortune-Cookie Actions

**What goes wrong:** LLM generates vague advice like "Learn more about AI safety" instead of personalized, specific actions.
**Why it happens:** Insufficient profile context in prompt, or prompt doesn't enforce specificity strongly enough. Haiku is more prone to generic output than Sonnet.
**How to avoid:**

- Include full profile context via `buildProfileContext()` (education, work history, skills, enrichment summary)
- Include match growth areas as context ("Your matches repeatedly show ML engineering as a gap")
- Prompt instruction: "Each action MUST reference specific elements of this person's profile"
- Require `profileBasis` field in tool schema citing which profile signals drove each action (addresses GEN-07)
  **Warning signs:** Generated actions don't mention any specific skills, experiences, or interests from the profile.

### Pitfall 2: Hallucinated Resources

**What goes wrong:** LLM suggests "Replicate the Chen et al. (2025) paper" when no such paper exists, or names specific programs/people that are fabricated.
**Why it happens:** Haiku generates plausible-sounding AI safety resources from training patterns.
**How to avoid:**

- Explicit prompt instruction: "Do NOT reference specific papers, programs, fellowships, or external resources by name"
- Describe what the user should LOOK FOR, not specific resources
- Test generated actions for citation patterns (et al., arXiv, specific org names)
  **Warning signs:** Actions contain proper nouns, URLs, paper citations, or specific program names.

### Pitfall 3: Destroying User State on Regeneration

**What goes wrong:** Regeneration deletes saved or in-progress actions.
**Why it happens:** Following match regeneration pattern too closely (matches do bulk replacement).
**How to avoid:**

- `saveGeneratedActions` MUST check status before deleting. Only delete `active` status.
- Preserve `saved`, `in_progress`, `done` actions across all regenerations.
- This is the highest-risk mutation -- test it explicitly with each status combination.
  **Warning signs:** After refreshing matches, user loses saved/in-progress actions.

### Pitfall 4: Action Generation Fails Silently

**What goes wrong:** Haiku call fails or returns invalid data, but user sees no feedback because generation is fire-and-forget via scheduler.
**Why it happens:** `ctx.scheduler.runAfter` is non-blocking by design.
**How to avoid:**

- Log all failures via `log('error', ...)` pattern
- UI "Your Next Moves" section shows empty state text if no actions exist after matching has run
- The empty state message guides user to "Refresh your matches to generate personalized career actions"
  **Warning signs:** Users have matches but no actions. Monitor Convex logs for `careerActions.compute` errors.

### Pitfall 5: Rate Limiting Competition

**What goes wrong:** Action generation and matching both hit Anthropic API simultaneously, causing rate limit errors that delay matching.
**Why it happens:** Both are scheduled at `runAfter(0, ...)` which means immediate execution.
**How to avoid:**

- The decision says `runAfter(0, ...)` for parallel execution. At BAISH pilot scale (50-100 users, sequential triggers), this is unlikely to be an issue.
- If rate limiting occurs, add a small delay: `runAfter(2000, ...)` instead.
- Matching already has exponential backoff retry logic.
  **Warning signs:** Matching latency increases after action generation is added.

### Pitfall 6: `profileBasis` vs `rationale` Schema Mismatch

**What goes wrong:** CONTEXT.md decision #1 lists `rationale` as a field. GEN-07 requirement says `profileBasis`. These could be the same field or different fields.
**Why it happens:** Requirements and decisions were authored at different times.
**How to avoid:**

- The `rationale` field in the schema serves as the user-facing reasoning ("why this action for me")
- GEN-07's `profileBasis` is about citing which profile signals drove the recommendation
- **Recommendation:** Include BOTH in the tool schema output. `rationale` is the natural language explanation shown on the card. `profileBasis` is an array of profile signal identifiers (e.g., `["skills:ml_engineering", "interests:interpretability"]`) that the LLM must provide.
- In the database schema, store `rationale` (string, displayed) and optionally encode profile basis into the rationale text. OR add a dedicated `profileBasis` field (array of strings).
- **The planner should decide:** simplest is a single `rationale` field that naturally references profile elements, with the prompt enforcing this. The `profileBasis` array is a stronger guarantee but adds schema complexity.
  **Warning signs:** Card shows reasoning that doesn't reference any specific profile elements.

## Code Examples

Verified patterns from the existing codebase that Phase 35 should follow:

### Schema Table Definition

```typescript
// Source: convex/schema.ts (matches table pattern, lines 418-473)
// careerActions table should follow this structure
careerActions: defineTable({
  profileId: v.id('profiles'),
  type: v.union(
    v.literal('replicate'),
    v.literal('collaborate'),
    v.literal('start_org'),
    v.literal('identify_gaps'),
    v.literal('volunteer'),
    v.literal('build_tools'),
    v.literal('teach_write'),
    v.literal('develop_skills'),
  ),
  title: v.string(),
  description: v.string(),
  rationale: v.string(),           // "Why this action for you" - must reference profile
  profileBasis: v.optional(v.array(v.string())), // Profile signals that drove this (GEN-07)
  status: v.union(
    v.literal('active'),
    v.literal('saved'),
    v.literal('dismissed'),
    v.literal('in_progress'),
    v.literal('done'),
  ),
  generatedAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  modelVersion: v.string(),
  completionConversationStarted: v.optional(v.boolean()),  // Phase 36 flag
})
  .index('by_profile', ['profileId'])
  .index('by_profile_status', ['profileId', 'status']),
```

### Anthropic Tool Definition

```typescript
// Source: convex/matching/prompts.ts (matchOpportunitiesTool pattern, lines 218-331)
export const generateCareerActionsTool: Anthropic.Tool = {
  name: 'generate_career_actions',
  description:
    'Generate personalized career actions for an AI safety professional',
  input_schema: {
    type: 'object' as const,
    properties: {
      actions: {
        type: 'array',
        minItems: 3,
        maxItems: 5,
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: [
                'replicate',
                'collaborate',
                'start_org',
                'identify_gaps',
                'volunteer',
                'build_tools',
                'teach_write',
                'develop_skills',
              ],
            },
            title: {
              type: 'string',
              description: 'Concise action title (5-10 words)',
            },
            description: {
              type: 'string',
              description: 'Detailed description (2-3 sentences)',
            },
            rationale: {
              type: 'string',
              description: 'Why this action fits THIS person specifically',
            },
            profileBasis: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Profile elements that drove this recommendation (e.g., "ML engineering skills", "interpretability interest")',
            },
          },
          required: [
            'type',
            'title',
            'description',
            'rationale',
            'profileBasis',
          ],
        },
      },
    },
    required: ['actions'],
  },
}
```

### Zod Validation Schema

```typescript
// Source: convex/matching/validation.ts pattern
import { z } from 'zod'

const actionTypes = z.enum([
  'replicate',
  'collaborate',
  'start_org',
  'identify_gaps',
  'volunteer',
  'build_tools',
  'teach_write',
  'develop_skills',
])

export const actionItemSchema = z
  .object({
    type: actionTypes,
    title: z.string(),
    description: z.string(),
    rationale: z.string(),
    profileBasis: z.array(z.string()).optional().default([]),
  })
  .passthrough()

export const actionResultSchema = z
  .object({
    actions: z.array(actionItemSchema).min(1).max(7), // Accept slightly out of range
  })
  .passthrough()
```

### Internal Query (Reuse getFullProfile Pattern)

```typescript
// Source: convex/matching/queries.ts (lines 5-28)
// careerActions/queries.ts can reuse the same getFullProfile query
// or import from matching/queries if Convex supports cross-module internal imports

export const getExistingActions = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query('careerActions')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

export const getPreservedActions = internalQuery({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    const actions = await ctx.db
      .query('careerActions')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
    return actions.filter(
      (a) =>
        a.status === 'saved' ||
        a.status === 'in_progress' ||
        a.status === 'done',
    )
  },
})
```

### Public Query for Frontend

```typescript
// Source: convex/matches.ts getMyMatches pattern (lines 15-131)
// Public query returns actions grouped by status for the frontend

export const getMyActions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) return null

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (!profile) return { actions: [], hasProfile: false }

    const actions = await ctx.db
      .query('careerActions')
      .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
      .collect()

    return {
      active: actions.filter((a) => a.status === 'active'),
      inProgress: actions.filter((a) => a.status === 'in_progress'),
      saved: actions.filter((a) => a.status === 'saved'),
      completed: actions.filter((a) => a.status === 'done'),
      hasProfile: true,
    }
  },
})
```

### ActionCard Component Structure

```typescript
// Source: src/components/matches/MatchCard.tsx pattern (lines 91-266)
// ActionCard is simpler: no opportunity data, no view transitions, no swipe

interface ActionCardProps {
  action: {
    _id: string
    type: ActionType
    title: string
    description: string
    rationale: string
    status: ActionStatus
  }
  onSave?: () => void
  onDismiss?: () => void
  onStart?: () => void
  onComplete?: () => void
  onUnsave?: () => void
}

// Type badge config (mirrors tierConfig in MatchCard)
const typeConfig = {
  replicate: { label: 'Replicate Research', icon: FlaskConical },
  collaborate: { label: 'Find Collaborators', icon: Users },
  start_org: { label: 'Start Initiative', icon: Rocket },
  identify_gaps: { label: 'Identify Gaps', icon: Search },
  volunteer: { label: 'Volunteer', icon: HandHeart },
  build_tools: { label: 'Build Tools', icon: Wrench },
  teach_write: { label: 'Teach or Write', icon: PenLine },
  develop_skills: { label: 'Develop Skills', icon: GraduationCap },
}
```

### Dashboard Integration

```typescript
// Source: src/routes/index.tsx Dashboard function (lines 92-287)
// Add section between "Your Top Matches" and "Suggested Organizations"

// In Dashboard component:
const actionsData = useQuery(api.careerActions.queries.getMyActions)
const topActions = actionsData?.active?.slice(0, 2) ?? []

// After the saved/top matches section, before org suggestions:
{topActions.length > 0 && (
  <section className="mb-8">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-display font-semibold text-foreground">
        Your Next Moves
      </h2>
      <Button asChild variant="ghost" size="sm">
        <Link to="/matches">View all</Link>
      </Button>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {topActions.map((action, index) => (
        <AnimatedCard key={action._id} index={index}>
          <ActionCard action={action} />
        </AnimatedCard>
      ))}
    </div>
  </section>
)}
```

### Matches Page Integration

```typescript
// Source: src/routes/matches/index.tsx MatchesContent (lines 128-327)
// Insert CareerActionsSection between tiers and growth areas

// After MatchTierSection renders:
{hasMatches && (
  <>
    <MatchTierSection tier="great" matches={matches.great} />
    <MatchTierSection tier="good" matches={matches.good} />
    <MatchTierSection tier="exploring" matches={matches.exploring} />
  </>
)}

{/* NEW: Career Actions section */}
<CareerActionsSection />

{/* Existing: Growth areas */}
{growthAreas.length > 0 && (
  <div className="mt-8">
    <GrowthAreas areas={growthAreas} />
  </div>
)}
```

## State of the Art

| Old Approach                   | Current Approach                                      | When Changed    | Impact                                                                      |
| ------------------------------ | ----------------------------------------------------- | --------------- | --------------------------------------------------------------------------- |
| Actions chained after matching | Actions parallel via scheduler (decision #2)          | Phase 35 design | Matches display immediately, actions arrive via real-time sync              |
| OKLCH custom violet tokens     | Tailwind built-in `violet-*` utilities (decision #12) | Phase 35 design | Matches tier color pattern (emerald/blue/amber use Tailwind directly)       |
| `suggested` status name        | `active` status name (decision #1)                    | Phase 35 design | Consistent with existing match status naming (`active`/`dismissed`/`saved`) |

**Deprecated/outdated:**

- The earlier research doc suggested chaining actions AFTER matching completes. The CONTEXT.md overrides this to parallel execution.
- The earlier research doc suggested OKLCH custom violet tokens. The CONTEXT.md overrides this to use Tailwind built-in utilities.
- The earlier research doc used `suggested` as a status. The CONTEXT.md changes this to `active`.

## Open Questions

1. **`profileBasis` field representation**
   - What we know: GEN-07 requires "Each action includes a `profileBasis` field citing which profile signals drove the recommendation." CONTEXT.md decision #1 lists `rationale` but not `profileBasis` by name.
   - What's unclear: Whether `rationale` alone satisfies GEN-07, or if a separate `profileBasis` array field is needed.
   - Recommendation: Add `profileBasis: v.optional(v.array(v.string()))` to the schema. Include it in the tool schema so the LLM must generate it. The `rationale` field is the human-readable explanation; `profileBasis` is the machine-readable citation of profile signals. If during implementation this feels over-engineered, the planner can collapse it into just the `rationale` field with a strong prompt instruction.

2. **Progress indicator in Phase 35**
   - What we know: CONTEXT.md Claude's Discretion mentions "leaning toward including" a "2 of 5 completed" progress indicator.
   - What's unclear: Whether this is worth the implementation effort in Phase 35.
   - Recommendation: Include it. It is a single line of UI: `{completed.length} of {total.length} completed`. Trivial to implement and motivational.

3. **Dismissed action context cap**
   - What we know: Dismissed actions should be passed to the LLM to avoid regenerating them. Over time, dismissed list grows.
   - What's unclear: How many dismissed actions to include before it consumes too much context.
   - Recommendation: Cap at last 20 dismissed actions, truncated to title + type only. This keeps context small (~500 tokens max).

4. **Convex API path for `careerActions` directory**
   - What we know: Convex auto-generates API paths from directory names. `convex/matching/` generates `internal.matching.compute`, etc.
   - Verified: `convex/careerActions/` will generate `internal.careerActions.compute`, `internal.careerActions.mutations`, `internal.careerActions.queries`. Confirmed by examining existing directory-based patterns (`internal.matching.*`, `internal.enrichment.*`, `internal.events.*`).
   - No question here: This is verified to work.

## Valid Status Transitions

Reference for the planner when creating mutation tasks:

| From          | To            | Mutation Name     | Side Effects      |
| ------------- | ------------- | ----------------- | ----------------- |
| `active`      | `saved`       | `saveAction`      | None              |
| `active`      | `dismissed`   | `dismissAction`   | None              |
| `active`      | `in_progress` | `startAction`     | Set `startedAt`   |
| `saved`       | `active`      | `unsaveAction`    | None              |
| `saved`       | `in_progress` | `startAction`     | Set `startedAt`   |
| `saved`       | `dismissed`   | `dismissAction`   | None              |
| `in_progress` | `done`        | `completeAction`  | Set `completedAt` |
| `in_progress` | `active`      | (cancel progress) | Clear `startedAt` |

Note: `done` is a terminal state in Phase 35. Phase 36 adds the completion enrichment flow.

## Button Visibility by Status

Reference for the planner when creating ActionCard tasks:

| Status        | Primary CTA               | Secondary Actions    | Desktop Hover Actions |
| ------------- | ------------------------- | -------------------- | --------------------- |
| `active`      | "Start" (-> in_progress)  | --                   | Save, Dismiss         |
| `saved`       | "Start" (-> in_progress)  | Unsave (-> active)   | Dismiss               |
| `in_progress` | "Mark Done" (-> done)     | "Cancel" (-> active) | --                    |
| `done`        | -- (show completed state) | --                   | --                    |
| `dismissed`   | (not shown)               | --                   | --                    |

## Files to Create

| File                                                 | Est. Lines | Purpose                                                     |
| ---------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| `convex/careerActions/compute.ts`                    | ~80        | LLM action generation (`internalAction`, `"use node"`)      |
| `convex/careerActions/prompts.ts`                    | ~160       | System prompt, tool definition, context builders            |
| `convex/careerActions/mutations.ts`                  | ~150       | Internal save + public status transitions                   |
| `convex/careerActions/queries.ts`                    | ~100       | Internal queries + public `getMyActions` query              |
| `convex/careerActions/validation.ts`                 | ~30        | Zod schema for LLM output                                   |
| `src/components/actions/ActionCard.tsx`              | ~130       | Violet-accented card with status-dependent buttons          |
| `src/components/actions/CareerActionsSection.tsx`    | ~80        | Section wrapper for matches page                            |
| `src/components/actions/CompletedActionsSection.tsx` | ~60        | Collapsible completed actions (SavedMatchesSection pattern) |

## Files to Modify

| File                           | Change                                                            | Est. Lines |
| ------------------------------ | ----------------------------------------------------------------- | ---------- |
| `convex/schema.ts`             | Add `careerActions` table definition                              | ~30        |
| `convex/matches.ts`            | Add `ctx.scheduler.runAfter(0, ...)` in `triggerMatchComputation` | ~8         |
| `src/routes/matches/index.tsx` | Import `CareerActionsSection`, add between tiers and growth areas | ~15        |
| `src/routes/index.tsx`         | Import `ActionCard`, add "Your Next Moves" section to Dashboard   | ~25        |

## Sources

### Primary (HIGH confidence)

- `convex/matching/compute.ts` - LLM call pattern, scheduler chaining, retry logic
- `convex/matching/prompts.ts` - `buildProfileContext()`, tool definition, system prompt structure
- `convex/matching/mutations.ts` - Batch save pattern, regeneration logic
- `convex/matching/queries.ts` - Internal query patterns
- `convex/matching/validation.ts` - Zod shadow validation pattern
- `convex/matches.ts` - Public query/mutation pattern, `triggerMatchComputation` entry point
- `convex/schema.ts` - Table definition patterns, index conventions
- `convex/lib/auth.ts` - `getUserId()` auth helper
- `convex/lib/logging.ts` - `log()` structured logging
- `src/components/matches/MatchCard.tsx` - Card component pattern, hover actions, badge styling
- `src/components/matches/MatchTierSection.tsx` - Grid layout, AnimatedCard + SwipeableCard wrapping
- `src/components/matches/SavedMatchesSection.tsx` - Collapsible section pattern
- `src/components/matches/GrowthAreas.tsx` - Growth areas display (placement reference)
- `src/components/animation/AnimatedCard.tsx` - Entrance animation with stagger
- `src/routes/matches/index.tsx` - Matches page structure, data fetching, section ordering
- `src/routes/index.tsx` - Dashboard structure, top matches preview pattern
- `package.json` - Dependency versions verified

### Secondary (MEDIUM confidence)

- `.planning/research/ARCHITECTURE-v1.6-career-actions.md` - Prior architecture research
- `.planning/research/FEATURES-v1.6-career-actions.md` - Feature taxonomy and requirements detail
- `.planning/research/PITFALLS-v1.6-career-actions.md` - Domain-specific pitfall catalog
- `.planning/research/SUMMARY-v1.6-career-actions.md` - Research executive summary
- `.planning/REQUIREMENTS.md` - GEN-01 through ACTN-05 requirement definitions

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Zero new dependencies. All tools verified in existing codebase.
- Architecture: HIGH - Mirrors existing matching pipeline exactly. All patterns verified with code references.
- Pitfalls: HIGH - Comprehensive pitfall catalog from prior research. Highest-risk items (regeneration, hallucination) have clear mitigations.
- UI components: HIGH - Follow established MatchCard/SavedMatchesSection patterns. Violet colors use Tailwind built-in.

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stable domain, no dependency updates expected)
