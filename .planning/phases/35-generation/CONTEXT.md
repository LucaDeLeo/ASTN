Now I have a comprehensive understanding of the codebase and research. Let me formulate the implementation decisions.

---

## Implementation Decisions

**[1. Schema: `careerActions` table structure]**

- Decision: Use the schema from the research doc almost verbatim — `careerActions` table with `profileId`, `type` (8-literal union), `title`, `description`, `rationale`, `status` (5-literal union: `active`/`saved`/`dismissed`/`in_progress`/`done`), timestamp fields (`startedAt`, `completedAt`, `generatedAt`), `modelVersion`, and `completionConversationStarted`. Index on `by_profile` and `by_profile_status`.
- Rationale: Separate table from matches is correct — different lifecycles, different state machines. The 8-type taxonomy is well-researched and constrained. Using `active` instead of `suggested` to match the existing match status naming convention (`active`/`dismissed`/`saved`).
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

- Decision: New `src/components/actions/ActionCard.tsx` component. Uses `violet-100`/`violet-600`/`violet-800` color tokens (Tailwind v4 has violet built in). Card shows: type badge (violet), title, description text, "Based on:" rationale line, and status-dependent CTA buttons. No swipe gestures for actions — use button interactions only. Desktop hover reveals save/dismiss (matching MatchCard pattern).
- Rationale: Actions are lower information density than matches (no org, location, probability). Simpler card is appropriate. Violet distinguishes from the emerald/blue/amber tier system. Skipping swipe keeps scope reasonable — actions have more states than matches (in_progress, done) that don't map cleanly to left/right swipe.
- Confidence: HIGH

**[7. Matches page placement: "Your Next Moves" section after match tiers, before growth areas]**

- Decision: Insert `CareerActionsSection` component between the last `MatchTierSection` and the existing `GrowthAreas` component on `/matches`. Section header: "Your Next Moves" with violet accent. Shows active + in-progress actions in a grid. Completed actions in a collapsible section (same pattern as `SavedMatchesSection`). Dismissed actions hidden.
- Rationale: This positioning creates a narrative flow: "Here are jobs to apply to" → "Here are things you can do yourself" → "Here are skills to build." Growth areas are the "why," actions are the "what."
- Confidence: HIGH

**[8. Dashboard preview: 1-2 actions below top matches]**

- Decision: Add a "Your Next Moves" section to the Dashboard (`src/routes/index.tsx`) between "Your Top Matches" and "Suggested Organizations." Show up to 2 active actions (priority order from generation). Link to `/matches` for full view. Use the same `ActionCard` component with a compact variant or just show the first 2.
- Rationale: Dashboard already shows top matches in the same pattern (slice to 3, link to full view). 1-2 actions is enough to create awareness without overwhelming the dashboard.
- Confidence: HIGH

**[9. Type badge icons: one icon per action type]**

- Decision: Map each of the 8 action types to a lucide-react icon. Proposed mapping:
  - `replicate` → `FlaskConical`
  - `collaborate` → `Users`
  - `start_org` → `Rocket`
  - `identify_gaps` → `Search`
  - `volunteer` → `HandHeart`
  - `build_tools` → `Wrench`
  - `teach_write` → `PenLine`
  - `develop_skills` → `GraduationCap`
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

- Decision: If no actions have been generated yet (new user, no matches run), the "Your Next Moves" section shows a minimal prompt: "Refresh your matches to generate personalized career actions." No separate CTA — the existing "Refresh Matches" button handles it.
- Rationale: Actions generate alongside matches. A user who has never run matching won't have actions. The simplest solution is to guide them to the existing refresh flow.
- Confidence: HIGH

---

## Uncertainties

> **None that require human input.** The research documents are thorough and the existing codebase patterns are clear. All decisions above are grounded in existing patterns or explicit requirements from the milestone spec. Implementation can proceed.

---

## Claude's Discretion

- Exact wording of the system prompt for action generation (will follow patterns from `convex/matching/prompts.ts`)
- Specific animation/transition details for action cards (will follow `AnimatedCard` stagger pattern)
- Exact responsive grid breakpoints for action cards (will match `MatchTierSection` grid: 1 col mobile, 2 col tablet, 3 col desktop)
- Whether to show a "2 of 5 completed" progress indicator in Phase 35 or defer to later (leaning toward including it — it's trivial and motivational)
- Exact ordering of sections in completed actions collapsible (by `completedAt` desc, most recent first)

---

## Auto-Discuss Metadata

- **Rounds:** 2
- **Codex Available:** no
- **Uncertainties Resolution:**
- **Timestamp:** 2026-02-11T00:57:56Z

<details>
<summary>Codex Review (Round 2)</summary>

[READY] Codex not available

</details>
