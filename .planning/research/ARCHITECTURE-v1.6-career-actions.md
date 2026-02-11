# Architecture Patterns: v1.6 Career Actions

**Domain:** LLM-generated personalized career coaching actions
**Researched:** 2026-02-10

## Recommended Architecture

Career actions follow the existing chained-scheduled-action pattern from the matching pipeline. Action generation is triggered alongside matching, runs as a separate scheduled action, and stores results in a dedicated `careerActions` table.

### System Flow

```
User triggers "Refresh Matches" (or auto-trigger)
        |
        v
triggerMatchComputation (existing public action)
        |
        +-- ctx.runAction(computeMatchesForProfile)  [existing, unchanged]
        |       |
        |       v
        |   processMatchBatch (x N batches, chained via scheduler)
        |       |
        |       v
        |   saveBatchResults (isLastBatch = true)
        |       |
        |       +-- saves matches to DB [existing]
        |
        +-- ctx.scheduler.runAfter(0, computeActionsForProfile)  [NEW, parallel]
                |
                v
        computeActionsForProfile (single Haiku call)
                |
                v
        saveGeneratedActions (replace stale, preserve user-modified)
```

**Key decision: parallel vs sequential.** Action generation runs in parallel with matching via `ctx.scheduler.runAfter`, not chained after matching completes. Rationale:

- Matches should display immediately, not wait for action generation
- Convex real-time sync means actions appear in UI as soon as they're saved
- If action generation fails, matches are unaffected

However, action generation benefits from match context (gaps, growth areas). The implementation reads existing matches from the database at generation time. For a first-time user with no existing matches, actions are generated from profile context alone, which is sufficient for quality actions. On subsequent refreshes, match context enriches generation.

### Component Boundaries

| Component                                         | Responsibility                                           | Communicates With                                      | New/Modified         |
| ------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------ | -------------------- |
| `convex/careerActions/compute.ts`                 | LLM call for action generation                           | Anthropic SDK, matching/queries, careerActions/queries | NEW                  |
| `convex/careerActions/prompts.ts`                 | System prompt, tool definition, context builders         | compute.ts                                             | NEW                  |
| `convex/careerActions/mutations.ts`               | Save generated actions, state transitions                | schema (careerActions table)                           | NEW                  |
| `convex/careerActions/queries.ts`                 | Internal queries + public queries for frontend           | schema                                                 | NEW                  |
| `convex/careerActions/validation.ts`              | Zod schema for LLM output (shadow mode)                  | compute.ts                                             | NEW                  |
| `convex/matches.ts`                               | Add scheduler call in triggerMatchComputation            | careerActions/compute                                  | MODIFIED (+5 lines)  |
| `convex/enrichment/conversation.ts`               | Accept optional seedContext for action completion chat   | enrichmentMessages                                     | MODIFIED (+15 lines) |
| `convex/schema.ts`                                | Add careerActions table definition                       | all modules                                            | MODIFIED (+35 lines) |
| `src/components/actions/ActionCard.tsx`           | Individual action card with violet accent + interactions | Card, Badge, Button                                    | NEW                  |
| `src/components/actions/CareerActionsSection.tsx` | Section wrapper with header, empty state                 | ActionCard, queries                                    | NEW                  |
| `src/components/actions/CompletionFlow.tsx`       | "Done" modal: notes + enrichment chat seeding            | enrichment hooks                                       | NEW                  |

### Data Flow

**Generation flow:**

```
Profile data (reuse getFullProfile query)
  + Existing matches from DB (for context: gaps, tiers, growth areas)
  + Dismissed action descriptions (to avoid regenerating)
  + In-progress/done action descriptions (to not duplicate)
        |
        v
  buildActionGenerationContext()
        |
        v
  Claude Haiku 4.5 (forced tool_choice: generate_career_actions)
        |
        v
  Zod validation (shadow mode: log errors, accept data)
        |
        v
  saveGeneratedActions mutation:
    - Delete old 'suggested' actions
    - Preserve 'saved', 'in_progress', 'done' actions
    - Insert new 'suggested' actions with generationRun timestamp
```

**Interaction flow:**

```
User clicks Save/Dismiss/Start/Complete on ActionCard
        |
        v
  Convex mutation (real-time sync -> instant UI update)
        |
        v
  Status transition validated in mutation:
    suggested -> saved | dismissed | in_progress
    saved -> in_progress | dismissed
    in_progress -> done | suggested (cancel)
```

**Completion flow:**

```
User marks action "done"
        |
        v
  completeAction mutation (status='done', completedAt=now)
        |
        v
  Frontend shows CompletionFlow modal
        |
        +-- User optionally enters reflection notes
        +-- "Reflect with AI" navigates to enrichment chat
            (seedContext: action title + description + notes)
        |
        v
  Enrichment chat (existing, with seedContext in system prompt)
        |
        v
  Extraction + profile update (existing flow, unchanged)
        |
        v
  User triggers match refresh -> new actions generated
```

## State Machine

```
              [suggested]
              /    |    \
         save/  dismiss  \start
           /      |       \
      [saved]  [dismissed]  \
         |                   \
       start              [in_progress]
         |               /       \
         +-------->    done    cancel
                      /           \
                [done]        [suggested]
                  |
          CompletionFlow
          (enrichment chat)
```

Valid transitions (enforced in mutations):

| From        | To          | Trigger               | Side Effects                              |
| ----------- | ----------- | --------------------- | ----------------------------------------- |
| suggested   | saved       | User saves            | None                                      |
| suggested   | dismissed   | User dismisses        | Set dismissedAt                           |
| suggested   | in_progress | User starts           | Set startedAt                             |
| saved       | in_progress | User starts           | Set startedAt                             |
| saved       | dismissed   | User dismisses        | Set dismissedAt                           |
| in_progress | done        | User completes        | Set completedAt, flag enrichmentTriggered |
| in_progress | suggested   | User cancels progress | Clear startedAt                           |

## Patterns to Follow

### Pattern 1: Chained Scheduled Actions

**What:** Use `ctx.scheduler.runAfter(0, ...)` for LLM calls that should not block the calling function
**Where established:** `convex/matching/compute.ts` lines 84-96 (batch chaining)
**Apply to:** Triggering action generation from `triggerMatchComputation`

```typescript
await ctx.scheduler.runAfter(
  0,
  internal.careerActions.compute.computeActionsForProfile,
  { profileId: profile._id },
)
```

### Pattern 2: Forced Tool Use + Zod Shadow Validation

**What:** `tool_choice: { type: 'tool', name: 'X' }` guarantees structured JSON; Zod validates but doesn't block
**Where established:** `convex/matching/compute.ts` lines 171-183, `convex/matching/validation.ts`
**Apply to:** Action generation LLM call

### Pattern 3: XML Delimiter Injection Defense

**What:** Wrap user data in `<candidate_profile>` tags with system prompt instruction to treat as data
**Where established:** `convex/matching/prompts.ts` lines 72-73, `convex/enrichment/conversation.ts` lines 29-30
**Apply to:** Action generation prompt (profile data, match context)

### Pattern 4: Internal vs Public Functions

**What:** `internalAction` / `internalMutation` for functions called by other Convex functions; public `query` / `mutation` for client-facing
**Where established:** All `convex/matching/` files use internal; `convex/matches.ts` exposes public API
**Apply to:** `convex/careerActions/` uses internal; public API surface in same file or separate `convex/careerActions.ts`

### Pattern 5: Preserve User State on Regeneration

**What:** When regenerating actions, only replace `suggested` status. Preserve `saved`, `in_progress`, `done`.
**Rationale:** Users invest effort in saving and starting actions. Replacing them destroys trust.

```typescript
for (const action of existingActions) {
  if (action.status === 'suggested') {
    await ctx.db.delete('careerActions', action._id)
  }
  // saved, in_progress, done are untouched
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Blocking Matches on Action Generation

**What:** Awaiting action generation inside `triggerMatchComputation` before returning
**Why bad:** If Haiku call is slow or fails, match display is delayed. Matches are the primary value.
**Instead:** Fire-and-forget via scheduler. Both results arrive reactively.

### Anti-Pattern 2: Storing Actions in Matches Table

**What:** Adding action fields to the `matches` table
**Why bad:** Different lifecycles -- matches are bulk-replaced, actions have individual state machines. Mixing creates impossible update semantics.
**Instead:** Separate `careerActions` table.

### Anti-Pattern 3: New Chat System for Completion

**What:** Building separate message storage and extraction for action reflection
**Why bad:** Duplicates ~600 lines of enrichment infrastructure
**Instead:** Add `seedContext` parameter to existing enrichment chat.

### Anti-Pattern 4: Complex Deduplication Logic

**What:** NLP-based similarity detection between dismissed and new actions
**Why bad:** Over-engineering for 50-100 user pilot. False positives worse than false negatives.
**Instead:** Pass dismissed action descriptions to LLM prompt. Let the model decide.

### Anti-Pattern 5: Separate Refresh Button

**What:** Adding "Refresh Actions" button separate from "Refresh Matches"
**Why bad:** Confusing UX. Creates a mental model of two independent systems.
**Instead:** Single "Refresh Matches" triggers both. Actions section shows shared timestamp.

## File Plan

### New Files (~900 lines estimated)

| File                                              | Lines (est) | Purpose                                      |
| ------------------------------------------------- | ----------- | -------------------------------------------- |
| `convex/careerActions/compute.ts`                 | ~100        | LLM action generation                        |
| `convex/careerActions/prompts.ts`                 | ~180        | System prompt, tool schema, context builders |
| `convex/careerActions/mutations.ts`               | ~130        | Save, state transitions, completion          |
| `convex/careerActions/queries.ts`                 | ~100        | Internal + public queries                    |
| `convex/careerActions/validation.ts`              | ~35         | Zod schemas                                  |
| `src/components/actions/ActionCard.tsx`           | ~140        | Card with violet accent + interactions       |
| `src/components/actions/CareerActionsSection.tsx` | ~80         | Section wrapper                              |
| `src/components/actions/CompletionFlow.tsx`       | ~100        | Completion modal + chat seeding              |

### Modified Files (~70 lines changed)

| File                                 | Change                               | Lines (est) |
| ------------------------------------ | ------------------------------------ | ----------- |
| `convex/schema.ts`                   | Add careerActions table              | ~35         |
| `convex/matches.ts`                  | Schedule action generation           | ~5          |
| `convex/enrichment/conversation.ts`  | Add seedContext parameter            | ~15         |
| `src/styles/app.css`                 | Violet OKLCH tokens                  | ~20         |
| `src/routes/matches/index.tsx`       | Import + render CareerActionsSection | ~10         |
| `src/routes/opportunities/index.tsx` | Import + render action cards         | ~10         |

## Sources

- Direct codebase analysis: `convex/matching/compute.ts`, `convex/matching/prompts.ts`, `convex/matching/mutations.ts`, `convex/matches.ts`, `convex/enrichment/conversation.ts`, `convex/schema.ts`
- Existing component patterns: `src/components/matches/MatchCard.tsx`, `src/components/matches/GrowthAreas.tsx`
- Convex scheduler patterns verified in existing codebase usage
