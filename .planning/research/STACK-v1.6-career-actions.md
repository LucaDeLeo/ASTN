# Technology Stack: v1.6 Career Actions

**Project:** ASTN - Personalized Career Actions
**Researched:** 2026-02-10
**Overall confidence:** HIGH

## Executive Summary

v1.6 requires **zero new npm dependencies**. The existing stack -- Convex, Anthropic SDK, shadcn/ui, Tailwind v4 with OKLCH tokens, Zod, lucide-react -- handles everything needed for career action generation, state management, and violet-accented UI. The work is schema extension, prompt engineering, Convex function authoring, CSS token addition, and React component creation.

This is not a stack expansion milestone. It is a feature built entirely on existing infrastructure.

## What NOT To Add

These are the things that might seem tempting but are unnecessary:

| Temptation                           | Why Not                                                                                                                                              | What Instead                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| State machine library (XState, etc.) | Action states are a simple linear progression with 2 side-exits; Convex `v.union()` + mutation guards handle this                                    | Convex schema union type + mutation-level validation                |
| Progress bar library                 | shadcn/ui Progress component uses `@radix-ui/react-progress` which is not installed, but action completion is a simple counter, not a continuous bar | Custom completion count display with existing Badge/Card components |
| Animation library for action cards   | Existing `tw-animate-css` + CSS keyframes in `app.css` + view transitions handle all needed motion                                                   | Extend existing animation tokens for violet card entrance           |
| Separate LLM orchestration layer     | The matching pipeline already chains batched Anthropic calls via `ctx.scheduler.runAfter`                                                            | Extend the existing matching pipeline to also generate actions      |
| `@radix-ui/react-progress`           | Only needed if you want a continuous progress bar; action completion is discrete (3/5 done)                                                          | Simple text + width-based div or Badge showing "3 of 5 completed"   |

## Recommended Stack (All Existing)

### LLM Layer (No Changes)

| Technology          | Version                     | Purpose                                | Notes                                                                 |
| ------------------- | --------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| `@anthropic-ai/sdk` | ^0.71.2 (installed: 0.71.2) | Claude API calls for action generation | Same SDK, same patterns as matching                                   |
| Claude Haiku 4.5    | `claude-haiku-4-5-20251001` | Action generation model                | Already used in matching pipeline; fast + cheap for structured output |

**Rationale:** Haiku 4.5 is the right model because career actions are a structured classification/generation task, not a deep reasoning task. The matching pipeline already uses Haiku for batched opportunity scoring at ~$0.001/call. Action generation is comparable complexity. Sonnet would be overkill and 10x more expensive.

### Backend (Convex Schema Extension)

| Technology | Version                     | Purpose                                        | Notes                                    |
| ---------- | --------------------------- | ---------------------------------------------- | ---------------------------------------- |
| `convex`   | ^1.31.7 (installed: 1.31.7) | Database, real-time sync, serverless functions | Schema extension only                    |
| `zod`      | ^3.25                       | LLM output validation (shadow mode)            | Same pattern as `matching/validation.ts` |

**What to extend:**

1. **New `careerActions` table** in `schema.ts` -- stores generated actions with status state machine
2. **New `convex/actions/` directory** -- mirrors `convex/matching/` structure (compute.ts, prompts.ts, mutations.ts, queries.ts, validation.ts)
3. **Extend `convex/matching/compute.ts`** -- after matching completes (isLastBatch), chain into action generation
4. **Extend `convex/matches.ts`** -- add public queries/mutations for action CRUD

### Frontend (No New Components Libraries)

| Technology                 | Version           | Purpose                                | Notes                                                                                    |
| -------------------------- | ----------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| shadcn/ui components       | Already installed | Card, Badge, Button for action cards   | Use existing components with violet variant classes                                      |
| `lucide-react`             | ^0.562.0          | Icons for action types and states      | Already has appropriate icons (Lightbulb, Rocket, Users, BookOpen, Wrench, Target, etc.) |
| `class-variance-authority` | ^0.7.1            | Variant classes for action card states | Already used by Badge, Button                                                            |
| `sonner`                   | ^2.0.7            | Toast notifications for state changes  | Already used throughout app                                                              |

### Styling (CSS Token Extension)

| Technology         | Version   | Purpose                                | Notes                                                                    |
| ------------------ | --------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Tailwind CSS v4    | ^4.1.13   | Utility classes with new violet tokens | CSS-only config via `@theme inline` in app.css                           |
| OKLCH color system | N/A (CSS) | Perceptually uniform violet palette    | Follows existing pattern: coral (hue 30), teal (hue 180), navy (hue 240) |

## New CSS Tokens Required

Add to `src/styles/app.css` following the existing OKLCH primitive pattern:

```css
/* Violet palette for career actions (hue ~290 in OKLCH) */
--violet-50: oklch(0.98 0.02 290);
--violet-100: oklch(0.95 0.04 290);
--violet-200: oklch(0.9 0.08 290);
--violet-300: oklch(0.82 0.12 290);
--violet-400: oklch(0.72 0.16 290);
--violet-500: oklch(0.62 0.18 290); /* Primary action accent */
--violet-600: oklch(0.52 0.16 290);
--violet-700: oklch(0.42 0.14 290);
--violet-800: oklch(0.32 0.12 290);
--violet-900: oklch(0.25 0.08 290);
```

And in the `@theme inline` block:

```css
--color-violet-50: var(--violet-50);
--color-violet-100: var(--violet-100);
/* ... through 900 */
```

Dark mode overrides:

```css
.dark {
  /* Brighter violet for dark mode visibility, matching coral pattern */
  --violet-500: oklch(0.72 0.2 290);
}
```

**Why hue 290:** OKLCH hue 290 is a blue-violet that reads as distinctly "violet" while maintaining good contrast ratios. The existing palette uses hue 30 (coral), 180 (teal), and 240 (navy). Hue 290 provides maximum perceptual distance from all three, preventing confusion with any existing accent color. This was verified by checking that 290 is equidistant from the coral (30) and teal (180) hues in the OKLCH wheel.

**Confidence: HIGH** -- This follows the exact pattern established by the coral and teal palettes in the existing `app.css`. The hue value (290) is a design choice that should be validated visually during implementation, but the approach is sound.

## New Convex Schema Design

```typescript
// In schema.ts - new careerActions table
careerActions: defineTable({
  profileId: v.id('profiles'),

  // Action content (from LLM)
  type: v.union(
    v.literal('replicate_paper'),
    v.literal('find_collaborators'),
    v.literal('start_org'),
    v.literal('identify_gaps'),
    v.literal('volunteer'),
    v.literal('build_tool'),
    v.literal('teach_write'),
    v.literal('develop_skill'),
  ),
  title: v.string(),          // Short action title (e.g., "Replicate a mechanistic interpretability paper")
  description: v.string(),    // 2-3 sentence explanation of why + how
  reasoning: v.string(),      // Why this action fits THIS person specifically

  // State machine: suggested → saved | dismissed | in_progress → done
  status: v.union(
    v.literal('suggested'),    // Default: freshly generated
    v.literal('saved'),        // User bookmarked for later
    v.literal('dismissed'),    // User not interested
    v.literal('in_progress'),  // User actively working on it
    v.literal('done'),         // User completed it
  ),

  // Completion tracking
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  enrichmentTriggered: v.optional(v.boolean()),  // Whether completion chat was started

  // Generation metadata
  computedAt: v.number(),
  modelVersion: v.string(),
  generationRun: v.number(),   // Links actions from the same generation batch

  // Soft-delete for dismissed (can resurface)
  dismissedAt: v.optional(v.number()),
})
  .index('by_profile', ['profileId'])
  .index('by_profile_status', ['profileId', 'status'])
  .index('by_profile_generation', ['profileId', 'generationRun']),
```

**State machine transitions (enforced in mutations):**

```
suggested  --> saved        (user saves)
suggested  --> dismissed    (user dismisses)
suggested  --> in_progress  (user starts)
saved      --> in_progress  (user starts)
saved      --> dismissed    (user dismisses)
in_progress --> done        (user completes -> triggers enrichment)
in_progress --> suggested   (user cancels progress)
dismissed  --> (gone until next generation, which may regenerate similar actions)
```

This is simple enough that a state machine library is not warranted. Each transition is a single Convex mutation that checks `current status -> allowed next status`.

## Prompt Engineering Pattern

**Approach:** Extend the existing forced-tool-use pattern from `matching/prompts.ts`. Career actions use a separate tool call within the same or a follow-up LLM invocation.

```typescript
// Tool definition for structured action output
const generateCareerActionsTool: Anthropic.Tool = {
  name: 'generate_career_actions',
  description: 'Generate personalized career actions for this candidate',
  input_schema: {
    type: 'object',
    properties: {
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: [...ACTION_TYPES] },
            title: { type: 'string' },
            description: { type: 'string' },
            reasoning: { type: 'string' },
          },
          required: ['type', 'title', 'description', 'reasoning'],
        },
        minItems: 3,
        maxItems: 5,
      },
    },
    required: ['actions'],
  },
}
```

**System prompt strategy:** The action generation prompt needs access to:

1. Profile context (same `buildProfileContext` from matching)
2. Match results summary (which tiers, what gaps were identified)
3. Growth areas (already accumulated in matching pipeline)
4. Previously dismissed action types (to avoid regenerating)

This means action generation should run **after** matching completes, not in parallel, because it benefits from match context. The matching pipeline already has a `isLastBatch` concept -- action generation chains after it.

**Confidence: HIGH** -- This exact pattern (forced tool_choice, Zod validation, chained scheduler) is battle-tested in the existing matching pipeline.

## Integration Points with Existing Pipeline

### 1. Matching Pipeline Extension

The current flow:

```
computeMatchesForProfile → processMatchBatch (×N) → saveBatchResults (isLastBatch=true)
```

Extended flow:

```
computeMatchesForProfile → processMatchBatch (×N) → saveBatchResults (isLastBatch=true)
                                                            ↓
                                                   generateCareerActions
                                                            ↓
                                                   saveCareerActions
```

**Implementation:** In `saveBatchResults`, when `isLastBatch` is true, schedule `internal.actions.compute.generateForProfile` via `ctx.scheduler.runAfter(0, ...)`. This is the exact same chaining pattern used for batch processing.

### 2. Completion Flow

```
User marks action "done" → mutation sets status='done'
                        → Frontend navigates to enrichment chat
                        → Chat system prompt seeded with action context
                        → Extraction flow runs (existing)
                        → Profile updated (existing)
                        → User triggers match refresh (existing)
                        → New actions generated as part of matching (new)
```

The enrichment chat (`convex/enrichment/conversation.ts`) already takes profile context. The extension is:

- Add an optional `actionContext` parameter to `sendMessage`
- When present, inject it into the system prompt: "The user just completed: [action title]. [action description]. Ask them about what they learned and how it went."

### 3. Public API Surface

New functions in `convex/careerActions.ts` (public-facing, mirrors `convex/matches.ts` pattern):

| Function         | Type     | Purpose                                                      |
| ---------------- | -------- | ------------------------------------------------------------ |
| `getMyActions`   | query    | Get current user's actions (suggested + saved + in_progress) |
| `saveAction`     | mutation | Toggle save status                                           |
| `dismissAction`  | mutation | Dismiss an action                                            |
| `startAction`    | mutation | Mark as in-progress                                          |
| `completeAction` | mutation | Mark as done, flag for enrichment                            |
| `cancelProgress` | mutation | Revert in-progress to suggested                              |

### 4. UI Integration Points

| Location                              | What to Add                                        | How                                  |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| Matches page (`/matches`)             | "Career Actions" section below growth areas        | New `CareerActionsSection` component |
| Opportunities page (`/opportunities`) | "Things you can do now" card section               | New `CareerActionCards` component    |
| Match detail (`/matches/$id`)         | Related actions for this match's gap areas         | Filter actions by relevance          |
| Enrichment chat                       | Seeded context when started from action completion | Extend `sendMessage` args            |

## Alternatives Considered

| Category                 | Recommended                          | Alternative                            | Why Not                                                                                      |
| ------------------------ | ------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| State management         | Convex `v.union()` + mutation guards | XState / state machine lib             | 5 states, 8 transitions -- a library adds complexity without value at this scale             |
| Action generation model  | Claude Haiku 4.5                     | Claude Sonnet 4.5                      | Actions are structured generation, not deep reasoning. Haiku is 10x cheaper and fast enough. |
| Action generation timing | After matching (chained)             | Parallel with matching                 | Actions benefit from match context (gaps, growth areas). Sequential is better here.          |
| Violet accent            | OKLCH CSS tokens in app.css          | Tailwind plugin or separate stylesheet | Follows exact existing pattern for coral/teal. No plugins needed in Tailwind v4.             |
| Progress tracking        | Discrete count ("3/5 done")          | Continuous progress bar                | Actions are discrete items, not a continuous process. A bar would be misleading.             |
| Action persistence       | Convex table with soft-delete        | Ephemeral (regenerate each time)       | Users need to save/track progress across sessions. Persistence is essential.                 |
| Completion enrichment    | Extend existing chat system          | New purpose-built form                 | Reuse existing infrastructure. Chat is already proven for profile enrichment.                |

## Installation

No new packages required. The only changes are:

```bash
# Nothing to install -- all existing dependencies
```

Code changes needed:

1. `convex/schema.ts` -- add `careerActions` table
2. `convex/actions/` -- new directory (compute.ts, prompts.ts, mutations.ts, queries.ts, validation.ts)
3. `convex/careerActions.ts` -- public API (queries + mutations)
4. `convex/matching/compute.ts` -- chain into action generation after last batch
5. `convex/enrichment/conversation.ts` -- accept optional action context
6. `src/styles/app.css` -- violet OKLCH tokens
7. `src/components/actions/` -- new UI components (ActionCard, CareerActionsSection)
8. `src/routes/matches/index.tsx` -- add CareerActionsSection
9. `src/routes/opportunities/index.tsx` -- add action cards section

## Cost Estimate

Action generation adds one additional Haiku 4.5 call per match computation:

- Input: ~2000 tokens (profile + match summary + growth areas)
- Output: ~500 tokens (3-5 structured actions)
- Cost: ~$0.001 per generation ($0.25/1M input + $1.25/1M output)
- At 100 users refreshing weekly: ~$0.10/week

This is negligible compared to the matching pipeline cost (3-4 Haiku calls per computation).

## Sources

- Existing codebase analysis: `convex/matching/compute.ts`, `convex/matching/prompts.ts`, `convex/enrichment/conversation.ts`, `convex/schema.ts`
- Existing design tokens: `src/styles/app.css` (OKLCH color system, animation tokens)
- Existing component patterns: `src/components/matches/MatchCard.tsx`, `src/components/matches/GrowthAreas.tsx`
- [shadcn/ui Progress component docs](https://ui.shadcn.com/docs/components/radix/progress) -- confirmed Radix dependency, decided against adding
- Package versions verified from installed `node_modules/` (Convex 1.31.7, Anthropic SDK 0.71.2)
