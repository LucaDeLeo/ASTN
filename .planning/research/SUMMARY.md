# Project Research Summary

**Project:** ASTN v1.6 - Career Actions
**Domain:** LLM-generated personalized career coaching actions
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

Career actions extend ASTN beyond "apply to these jobs" into "do these things to build your career" — inspired by the EA Forum post "Stop Applying And Get To Work." The feature generates 3-5 personalized actions per user (replicate research, find collaborators, start initiatives, build tools, etc.) using Claude Haiku 4.5 and the existing ASTN infrastructure.

The research reveals excellent news: this requires zero new npm dependencies. The existing stack (Convex, Anthropic SDK, shadcn/ui, Tailwind v4 with OKLCH tokens) handles everything needed. Action generation chains after matching via the same scheduler pattern, LLM calls use the same forced-tool-use approach, and the UI extends existing component patterns with violet accent colors. The work is schema extension, prompt engineering, Convex function authoring, CSS token addition, and React component creation.

The highest-value differentiator is the completion loop: users mark actions done, optionally enter an enrichment chat about what they learned, extractions update their profile, which triggers match recomputation and action regeneration. This virtuous cycle makes ASTN career actions fundamentally different from static todo lists. The highest risks are generic LLM output (fortune cookies), resource hallucinations, and destroying user state on regeneration — all mitigated through prompt engineering, resource-name bans, and status preservation logic.

## Key Findings

### Recommended Stack

**No new dependencies required.** The entire feature builds on existing infrastructure:

**Core technologies:**

- **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — Fast, cheap ($0.001/call), appropriate for structured action generation. Already used in matching pipeline.
- **Convex** (1.31.7) — Schema extension only. Add `careerActions` table with status state machine. Reuse scheduler patterns for generation chaining.
- **OKLCH color system** (Tailwind v4) — Add violet palette (hue ~290) following existing coral/teal pattern. Violet-500 at `oklch(0.62 0.18 290)` for light mode, `oklch(0.72 0.20 290)` for dark mode.
- **shadcn/ui components** — Card, Badge, Button with violet variant classes. No new components from Radix needed.

**What NOT to add:**

- State machine libraries (XState) — 5 states with simple linear transitions don't warrant a library
- Progress bar library — Action completion is discrete (3/5 done), not continuous
- Animation library — Existing tw-animate-css + CSS keyframes handle violet card entrance
- Separate LLM orchestration — Extend existing matching pipeline scheduler pattern

### Expected Features

**Must have (table stakes):**

- Profile-driven generation (3-5 actions referencing specific profile signals)
- Generated alongside matching (chain after last batch, fire-and-forget via scheduler)
- Action-specific reasoning ("why this for ME" not generic advice)
- Save/dismiss/in-progress/done status tracking
- Violet visual distinction from match tiers (emerald/blue/amber)
- Actions on matches page (natural home for career guidance)
- On-demand refresh (same "Refresh Matches" trigger regenerates both)

**Should have (differentiators):**

- **Completion → enrichment chat → profile update loop** — The killer feature. Actions improve your profile, which improves matches, which generates new actions. This virtuous cycle is unique to ASTN.
- Actions informed by match gaps — Feed aggregated growth areas into generation prompt
- Cross-pollination with growth areas — Growth areas show "what to build," actions show "how"
- Action type variety enforcement — LLM prompted to distribute across at least 3 of 8 types
- Dashboard integration — Show 1-2 top actions alongside top matches

**Defer (v2+):**

- Action-to-match bridging (showing related actions on match detail pages)
- Opportunities page integration (matches page covers primary use case)
- Dismissed action resurfacing intelligence (simple regeneration handles this)
- Detailed step-by-step plans (keeps actions directive, not project management)

**Anti-features (explicitly NOT build):**

- Specific resource links (papers, courses, URLs) — high hallucination risk, creates false dependencies
- Gamification (points, streaks, badges) — trivializes existential risk work, creates perverse incentives
- Action deadlines or time estimates — false pressure for self-directed work
- Social/public sharing — performance pressure, dilutes personal nature
- Continuous progress bars — actions are discrete (done/not done), not gradual completion

### Architecture Approach

Career actions follow the existing chained-scheduled-action pattern from matching. Action generation runs in parallel with matching (via `ctx.scheduler.runAfter`), reads matches from DB for context, generates 3-5 actions via single Haiku call with forced tool_choice, and saves to dedicated `careerActions` table.

**Major components:**

1. **convex/careerActions/** directory — Mirrors `convex/matching/` structure (compute.ts, prompts.ts, mutations.ts, queries.ts, validation.ts). Single Haiku call with forced `generate_career_actions` tool.
2. **Schema extension** — New `careerActions` table with 5-state machine (suggested → saved|dismissed|in_progress → done). Preserves user state on regeneration (only replace `suggested`, never touch `saved`/`in_progress`/`done`).
3. **Enrichment integration** — Extend `convex/enrichment/conversation.ts` with optional `seedContext` parameter. Completion flow seeds chat with action title + description, reuses existing extraction/review UI.
4. **UI components** — `ActionCard.tsx` (violet accent, type badge, status-dependent CTAs), `CareerActionsSection.tsx` (section wrapper), `CompletionFlow.tsx` (done modal with enrichment chat entry).

**Data flow:** Profile + matches → buildActionGenerationContext() → Haiku tool call → Zod validation (shadow mode) → saveGeneratedActions (preserve user state) → real-time UI update via Convex sync.

### Critical Pitfalls

1. **Generic Actions (Fortune Cookies)** — LLM generates vague advice ("Learn more about AI safety") instead of personalized actions. **Prevention:** Feed specific profile details (skills, work history, AI safety interests) into prompt. Include match gaps. Prompt instruction: "Each action MUST reference specific profile elements." Add `profileBasis` field to tool schema forcing LLM to cite which profile data drove each action. Test against 5+ real BAISH profiles before shipping.

2. **Hallucinated Resources** — LLM invents specific papers, organizations, programs, URLs that don't exist. User follows action, discovers resource is fake, loses trust. **Prevention:** Ban resource names in prompt. "Do NOT reference specific papers, programs, fellowships by name. Describe what the user should LOOK FOR, not specific resources." Grep generated actions for citation patterns (et al., arXiv), program names, URLs and flag for review.

3. **Destroying User State on Regeneration** — Bulk-replacing all actions (including saved/in-progress ones) when matching refreshes. **Prevention:** `saveGeneratedActions` MUST check status before deleting. Only delete `suggested` actions. Preserve `saved`, `in_progress`, `done` across all regenerations. Unit test this logic explicitly (highest-risk mutation).

4. **Completion Flow Corrupts Enrichment Chat** — Starting action-completion chat conflicts with existing profile enrichment conversation. **Prevention:** Check if active enrichment conversation exists before starting completion chat. Warn user: "You have an active conversation. Complete it first or start fresh." For v2, add `conversationType` discriminator to enrichmentMessages.

5. **Action Generation Fails Silently** — Haiku call fails but user sees no feedback (generation is fire-and-forget via scheduler). **Prevention:** Log failures via existing pattern. UI shows "No actions yet — try refreshing" if no actions exist after matching completes. Consider `careerActionsStatus` field on profile (`generating`, `generated`, `failed`) for loading/error UI states.

## Implications for Roadmap

Based on research, suggested two-phase structure:

### Phase 1: Generation + Display + Status Tracking

**Rationale:** Core value delivery without high-complexity enrichment integration. Users see personalized actions, can save/dismiss/track progress. Validates action quality and engagement before investing in completion loop.

**Delivers:**

- 3-5 personalized career actions per user
- Violet-accented cards on matches page
- Save/dismiss/in-progress/done status tracking
- Dashboard preview (1-2 top actions)
- Regeneration alongside match refresh

**Features addressed (from FEATURES.md):**

- Profile-driven generation (table stakes)
- 3-5 actions per person (table stakes)
- Generated with matching (table stakes)
- Action-specific reasoning (table stakes)
- Save/bookmark/dismiss (table stakes)
- Mark in-progress/done (table stakes)
- Violet visual distinction (table stakes)
- Actions on matches page (table stakes)
- Actions informed by match gaps (differentiator)
- Type variety enforcement (differentiator)
- Dashboard integration (differentiator)

**Stack elements (from STACK.md):**

- Convex schema extension (`careerActions` table)
- Haiku 4.5 LLM call (forced tool_choice, Zod validation)
- Violet OKLCH tokens in app.css
- ActionCard, CareerActionsSection components
- Scheduler chaining after matching

**Avoids pitfalls:**

- #1 Generic Actions: Profile context + growth areas in prompt, `profileBasis` field required
- #2 Hallucinated Resources: Ban resource names in system prompt
- #3 Destroying State: Status-aware deletion in `saveGeneratedActions`
- #5 Silent Failures: Status field for UI feedback, log errors

**File plan:**

- Schema: ~35 lines in `convex/schema.ts`
- Backend: ~545 lines in `convex/careerActions/` (compute, prompts, mutations, queries, validation)
- Styling: ~20 lines violet tokens in `src/styles/app.css`
- Components: ~220 lines (ActionCard, CareerActionsSection)
- Integration: ~15 lines in `convex/matches.ts` + `src/routes/matches/index.tsx`

**Estimated effort:** 5-7 days (schema + generation pipeline + UI + testing)

### Phase 2: Completion Loop (Enrichment Integration)

**Rationale:** The highest-value differentiator. Actions that improve your profile create a virtuous cycle unique to ASTN. Ship after Phase 1 validates action quality with real users — no point building completion flow if actions aren't good.

**Delivers:**

- "Tell us about it" vs "Just mark done" completion paths
- Action-seeded enrichment chat (short conversation, 2-4 exchanges)
- Extraction review with action context shown
- Profile update triggers match + action regeneration
- Full virtuous cycle: action → profile growth → better matches → new actions

**Features addressed (from FEATURES.md):**

- Completion → enrichment → profile update loop (differentiator, killer feature)

**Uses (from STACK.md):**

- Extend `convex/enrichment/conversation.ts` with `seedContext` parameter
- Reuse `convex/enrichment/extraction.ts` and review UI
- Reuse existing enrichment system prompt patterns

**Implements (from ARCHITECTURE.md):**

- CompletionFlow.tsx component (done modal)
- Enrichment chat seeding with action context
- Extraction → profile update → regeneration cascade

**Avoids pitfalls:**

- #4 Enrichment Chat Conflict: Check for active conversation before starting completion chat
- #9 Completion Cascade Waterfall: Don't auto-recompute. Show "Profile updated. Refresh matches to see changes" prompt instead.

**File plan:**

- Component: ~100 lines `CompletionFlow.tsx`
- Backend: ~15 lines extending `conversation.ts` for seedContext
- Integration: ~10 lines connecting completion to enrichment

**Estimated effort:** 3-4 days (modal + chat seeding + extraction flow + cascade logic + testing)

### Phase Ordering Rationale

- **Why Generation first:** Core value is personalized actions. Completion loop adds marginal value if the actions themselves aren't good. Ship generation + display to validate quality and engagement with real BAISH users before investing in completion infrastructure.
- **Why Status tracking in Phase 1:** Save/dismiss/in-progress/done are fundamental to action UX. Without state tracking, actions feel ephemeral and users can't curate them. This is table-stakes, not a Phase 2 add-on.
- **Why Completion second:** Touches 3 major systems (actions, enrichment, matching) and requires careful state management. Deferring it allows Phase 1 to validate the action taxonomy, prompt quality, and UI patterns before building the most complex integration.
- **Dependency structure:** Phase 2 depends on Phase 1 (can't complete actions that don't exist). Phase 1 stands alone as valuable feature. Clear critical path.

### Research Flags

**Phases with standard patterns (skip research-phase):**

- **Phase 1:** Well-documented. Reuses existing matching pipeline scheduler pattern, enrichment prompt patterns, match card UI patterns. All patterns exist in codebase. Research provided taxonomy (8 action types), prompt strategy (forced tool use, profile grounding), and state machine (5 states, 8 transitions).
- **Phase 2:** Well-documented. Reuses existing enrichment infrastructure (`conversation.ts`, `extraction.ts`, review UI). Research identified the key risk (conversation conflict) and mitigation (status check before starting). Completion → extraction → profile update is all existing code paths.

**No phases need deeper research during planning.** This is a feature built entirely on existing infrastructure with well-understood patterns. The research has already covered the full scope.

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                                                                         |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Verified all dependencies exist in node_modules. No new installs required. OKLCH pattern matches existing coral/teal.                                                                                                                         |
| Features     | HIGH       | Taxonomy derived from 80K Hours, SPAR, AI Safety Camp, EA Forum post. Table stakes identified via matching pipeline analogy. Differentiators grounded in ASTN's unique profile enrichment system.                                             |
| Architecture | HIGH       | Direct codebase analysis of matching pipeline, enrichment system, schema patterns. All proposed patterns exist in current code. File line counts based on existing analogues.                                                                 |
| Pitfalls     | HIGH       | Critical pitfalls (#1-#3) identified from existing matching/enrichment behavior patterns. LLM hallucination risks well-documented in AI safety community. State preservation logic is the highest-risk area and flagged for explicit testing. |

**Overall confidence:** HIGH

### Gaps to Address

- **Violet hue selection:** OKLCH hue 290 is a design recommendation, not a technical requirement. Should be validated visually during implementation. Dark mode violet values (lightness 0.72) follow coral pattern but need visual QA on actual dark backgrounds.
- **Action quality evaluation:** The 8-type taxonomy is derived from career pathway research, but actual LLM output quality can only be validated with real BAISH profiles. Plan to test against 5+ diverse profiles before shipping Phase 1.
- **Growth areas overlap:** Research identifies potential redundancy between existing "Growth Areas" section and new career actions. Mitigation is to feed growth areas into action generation and update growth areas copy to reference actions. May discover during implementation that growth areas should be removed entirely — defer this decision until seeing both features side-by-side.
- **Completion cascade timing:** Pitfall #9 recommends NOT auto-recomputing on action completion (show prompt instead). This is a UX recommendation that should be validated with user behavior. If users consistently forget to manually refresh, may need to revisit the auto-trigger decision.

## Sources

### Primary (HIGH confidence)

- Existing ASTN codebase: `convex/matching/compute.ts`, `convex/matching/prompts.ts`, `convex/enrichment/conversation.ts`, `convex/schema.ts`, `src/styles/app.css`, `src/components/matches/MatchCard.tsx` — Implementation patterns, schema patterns, UI patterns, OKLCH color system
- [Stop Applying And Get To Work — EA Forum](https://forum.effectivealtruism.org/posts/NfDbPsFmaXqajQP4J/stop-applying-and-get-to-work) — Feature inspiration, action philosophy, self-directed project validation
- [AI Safety Technical Research Career Review — 80,000 Hours](https://80000hours.org/career-reviews/ai-safety-researcher/) — Action type taxonomy, hiring signals (DeepMind: "if you can reproduce a typical ML paper in a few hundred hours, we're interested")
- [Technical AI Safety Upskilling Resources — 80,000 Hours](https://80000hours.org/2025/06/technical-ai-safety-upskilling-resources/) — Self-directed project types, program references (ARENA, SPAR, AI Safety Camp)
- Package versions verified from installed `node_modules/` — Convex 1.31.7, Anthropic SDK 0.71.2, shadcn/ui components

### Secondary (MEDIUM confidence)

- [An Outsider's Roadmap into AI Safety Research 2025 — LessWrong](https://www.lesswrong.com/posts/bcuzjKmNZHWDuEwBz/an-outsider-s-roadmap-into-ai-safety-research-2025) — Career pathway patterns
- [SPAR — Research Program for AI Risks](https://sparai.org/) — Collaboration model (3-month mentor pairings)
- [AI Safety Camp](https://www.aisafety.camp/) — Project-based entry patterns
- [AI Safety and Governance Career Paths — Probably Good](https://probablygood.org/career-profiles/ai-safety-governance/) — Governance action types
- [shadcn/ui Progress component docs](https://ui.shadcn.com/docs/components/radix/progress) — Confirmed Radix dependency, informed decision against continuous progress bar

### Tertiary (LOW confidence, informational only)

- [Dynamic Career Path Recommendation System (Jiang, 2025)](https://journals.sagepub.com/doi/abs/10.1177/14727978241313261) — Academic reference for career recommendation systems
- [Personalized Career Pathway: Hybrid ML Approach](https://www.researchgate.net/publication/388618425_PERSONALIZED_CAREER_PATHWAY_A_HYBRID_MACHINE_LEARNING_APPROACH_FOR_DYNAMIC_RECOMMENDATIONS) — Recommendation system patterns

---

_Research completed: 2026-02-10_
_Ready for roadmap: yes_
