# Domain Pitfalls: v1.6 Career Actions

**Domain:** LLM-generated personalized career coaching actions
**Researched:** 2026-02-10

## Critical Pitfalls

Mistakes that cause rewrites or major user trust issues.

### Pitfall 1: Generic Actions That Feel Like Fortune Cookies

**What goes wrong:** The LLM generates vague, generic career advice ("Learn more about AI safety", "Network with people in the field") instead of specific, personalized actions.
**Why it happens:** Insufficient profile context in the prompt, or the prompt doesn't emphasize specificity strongly enough. Haiku is more prone to generic output than Sonnet.
**Consequences:** Users dismiss all actions after seeing 2-3 generic ones. Feature becomes noise they ignore. Trust in the system erodes.
**Prevention:**

- Include specific profile details in the prompt context (skills list, work history, AI safety interests, enrichment summary)
- Include match gaps and growth areas as context ("You keep missing the ML engineering requirement")
- Prompt instruction: "Each action MUST reference specific elements of this person's profile. Generic advice like 'learn more about X' is not acceptable."
- Add a `profileBasis` field to the tool schema so the LLM must cite which profile data generated each action
- Test against real profiles from BAISH pilot (at least 5) before shipping
  **Detection:** If >50% of generated actions don't reference specific profile elements, the prompt needs iteration.

### Pitfall 2: Hallucinated Resources and Dead-End Actions

**What goes wrong:** The LLM suggests actions referencing specific papers, organizations, programs, people, or URLs that don't exist. "Replicate the Chen et al. (2025) paper on reward hacking detection" when no such paper exists.
**Why it happens:** Haiku confidently generates plausible-sounding AI safety resources from training patterns. Career actions specifically point people toward external work, making hallucination risk higher than in matching.
**Consequences:** User follows an action, discovers the resource doesn't exist, loses trust in ALL actions. In a small community (50-100 BAISH profiles), word spreads fast.
**Prevention:**

- Constrain actions to categories without external resource verification: "Write a blog post about X," "Build a tool that does Y"
- Explicit prompt instruction: "Do NOT reference specific papers, programs, fellowships, or external resources by name. Describe what the user should LOOK FOR, not specific resources."
- For "find collaborators" actions, reference the user's existing org memberships rather than inventing organizations
  **Detection:** Grep generated actions for citation patterns (et al., arXiv), program names (fellowship, bootcamp), URLs. Flag for review.

### Pitfall 3: Destroying User State on Regeneration

**What goes wrong:** When matching is refreshed, all career actions are replaced -- including ones the user saved or is actively working on.
**Why it happens:** Following the matching pipeline pattern too closely. Matches are bulk-replaced because they're computed fresh each time. Actions have individual state machines.
**Consequences:** User loses saved actions and in-progress tracking. Feels like the system doesn't respect their choices. Immediate trust violation.
**Prevention:**

- `saveGeneratedActions` mutation MUST check action status before deleting
- Only delete `suggested` status actions (stale suggestions)
- Preserve `saved`, `in_progress`, `done` actions across all regenerations
- Unit test this logic explicitly (this is the highest-risk mutation)
  **Detection:** After regeneration, verify preserved actions still exist in the database.

### Pitfall 4: Completion Flow Corrupts Enrichment Chat State

**What goes wrong:** Starting a seeded enrichment chat from action completion corrupts or conflicts with an existing enrichment conversation (e.g., user was in the middle of initial profile enrichment).
**Why it happens:** The enrichment chat uses a single conversation history per profile (`enrichmentMessages` table, indexed by profileId). A seeded action-completion chat would write to the same message history.
**Consequences:** Existing enrichment conversation context is lost or confused. Extraction may pull incorrect data.
**Prevention:**

- Check if an active enrichment conversation exists before starting an action-completion chat
- Option A: Warn user ("You have an active conversation. Complete it first or start fresh")
- Option B: Add a `conversationType` discriminator to enrichmentMessages to distinguish profile-enrichment from action-reflection
- Option C: Clear existing messages when starting a new seeded conversation (with user confirmation)
- Simplest for v1: Option A (check + warn). Option B for v2 if users frequently hit this.
  **Detection:** Check `enrichmentMessages` count for profile before starting completion flow.

## Moderate Pitfalls

### Pitfall 5: Action Generation Fails Silently

**What goes wrong:** Haiku returns an error, validation fails, or the scheduled action throws -- but the user sees no feedback because generation is fire-and-forget via scheduler.
**Why it happens:** `ctx.scheduler.runAfter` is non-blocking by design. If the scheduled action fails, the caller never knows.
**Prevention:**

- Log all failures via existing `log('error', ...)` pattern
- UI should show "No actions yet -- try refreshing" if no actions exist after matching completes
- Consider a `careerActionsStatus` field on the profile (`generating`, `generated`, `failed`) so the UI can show loading/error states
- Matching pipeline has the same issue but tolerates it because partial results work. For actions (single call, all-or-nothing), status tracking is more important.
  **Detection:** Monitor Convex logs for `careerActions.compute` errors. Track ratio of profiles with matches but no actions.

### Pitfall 6: Rate Limiting Competition Between Matching and Actions

**What goes wrong:** Action generation triggers simultaneously with matching. Both hit the Anthropic API. If the account hits rate limits, matching batches are delayed.
**Why it happens:** Parallel execution without rate limit coordination.
**Prevention:**

- Add a small delay: `ctx.scheduler.runAfter(2000, ...)` instead of `runAfter(0, ...)` -- gives matching a 2-second head start
- Matching already has exponential backoff. The delay just prevents action generation from consuming the first available slot.
- At pilot scale (sequential user triggers), this is unlikely to be an issue. Flag for scale.
  **Detection:** Monitor if matching latency increases after action generation is added.

### Pitfall 7: Violet Accent Clashes in Dark Mode

**What goes wrong:** The violet accent color looks washed out, too bright, or clashes with the warm charcoal dark mode palette.
**Why it happens:** OKLCH hue 290 at light-mode lightness/chroma values may not translate to dark backgrounds. The existing coral adjusts from 0.70 to 0.75 lightness for dark mode.
**Prevention:**

- Define separate dark mode violet values (higher lightness, adjusted chroma)
- Test against dark backgrounds: `oklch(0.16 0.005 30)` and `oklch(0.22 0.005 30)`
- Verify WCAG AA contrast ratio (4.5:1) for violet text on dark backgrounds
- Follow coral's pattern: light 0.62, dark 0.72 for violet-500
  **Detection:** Visual QA in both themes. Browser devtools forced-colors simulation.

### Pitfall 8: Actions and Growth Areas Overlap

**What goes wrong:** The existing "Your Growth Areas" section on the matches page shows "Skills to build" and "Experience to gain." Career actions address the same themes. Users see duplicate advice: Growth Areas says "Build ML skills" and an action says "Develop your ML engineering skills."
**Why it happens:** Both features draw from the same match data. Growth areas aggregate recommendations from matches. Actions generate from profile + growth area context.
**Prevention:**

- Feed growth areas INTO action generation (so actions are the "how" for growth area "what")
- Update growth areas copy to reference actions: "See your Career Actions for specific steps"
- Consider removing growth areas section entirely in favor of actions (actions subsume growth areas)
- At minimum, visually differentiate: growth areas are informational (no interaction), actions are directive (interactive)
  **Detection:** Compare growth area text with action descriptions for the same profile. If >70% overlap, the features are redundant.

### Pitfall 9: Completion Cascade Creates Loading Waterfall

**What goes wrong:** User clicks "Done" on action. This triggers: profile update -> match recomputation -> action regeneration. User sees dashboard flash through loading states, matches reshuffle, action list completely changes.
**Why it happens:** No debouncing between completion and recomputation. Each step involves LLM calls.
**Prevention:**

- Do NOT automatically recompute on action completion
- Show: "Your profile was updated. Refresh matches to see changes" -- a prompt, not an auto-trigger
- Use optimistic UI: immediately show action as completed, defer expensive recomputation
- If multiple actions completed in a session, batch the profile updates
  **Detection:** If completion-to-stable takes >10 seconds, the cascade is too aggressive.

## Minor Pitfalls

### Pitfall 10: View Transition Conflict with Match Cards

**What goes wrong:** Adding action cards to the matches page may conflict with existing view transition names (`match-title`, `match-strength`).
**Prevention:** Use distinct view-transition-name values (`action-title`), or don't use view transitions for action cards (they don't navigate to detail pages in v1.6).

### Pitfall 11: Haiku Generates Wrong Action Count

**What goes wrong:** Despite prompting for 3-5 actions, Haiku returns 1-2 or 6+.
**Prevention:**

- Zod validation: `z.array(...).min(3).max(5)` in shadow mode
- If fewer than 3: log warning, accept what we get (2 good actions > nothing)
- If more than 5: truncate to 5 (first 5 are usually highest quality)
- Prompt: "Generate exactly 3-5 actions. Not fewer, not more."

### Pitfall 12: Action Types Don't Match Profile

**What goes wrong:** An operations person gets "replicate a paper" which requires ML skills they don't have.
**Prevention:** Include profile context in prompt so the LLM selects appropriate types. Prompt instruction: "Only suggest action types that align with the person's skills and interests."

### Pitfall 13: Dismissed Actions Pollute Context Window

**What goes wrong:** Over time, dismissed action descriptions grow large, consuming prompt context.
**Prevention:**

- Cap dismissed context at last 20 actions
- Only include from last 3 generation runs
- Truncate to first sentence per action

## Phase-Specific Warnings

| Phase Topic          | Likely Pitfall                               | Mitigation                                              |
| -------------------- | -------------------------------------------- | ------------------------------------------------------- |
| Schema design        | Over-engineering states                      | Keep it to 5 states. No `paused`, `failed`, `archived`. |
| LLM prompt           | Fortune cookies (#1), hallucinations (#2)    | Require profile grounding, ban resource names           |
| Pipeline integration | Rate limiting (#6), silent failures (#5)     | 2-second delay, status field for UI feedback            |
| Regeneration logic   | Destroying user state (#3)                   | Status check before deletion. Test thoroughly.          |
| Violet UI tokens     | Dark mode clash (#7)                         | Test both themes, adjust lightness for dark             |
| Completion flow      | Enrichment state conflict (#4), cascade (#9) | Check for existing conversation, no auto-recompute      |
| Growth areas overlap | Redundant advice (#8)                        | Feed growth areas into action prompt, update copy       |
| Page integration     | View transitions (#10)                       | Distinct names or skip transitions                      |

## Sources

- Existing matching pipeline behavior: `convex/matching/compute.ts`, `convex/matching/mutations.ts`
- Enrichment message table structure: `convex/schema.ts` lines 180-186
- Dark mode token patterns: `src/styles/app.css` lines 340-428
- View transition patterns: `src/styles/app.css` lines 616-688, `src/components/matches/MatchCard.tsx`
- LLM validation patterns: `convex/matching/validation.ts`
