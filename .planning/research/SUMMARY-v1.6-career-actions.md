# Research Summary: v1.6 Career Actions

**Domain:** LLM-generated personalized career coaching actions
**Researched:** 2026-02-10
**Overall confidence:** HIGH

## Executive Summary

v1.6 Career Actions is a feature-level extension that requires zero new dependencies. The existing Convex + Anthropic SDK + shadcn/ui + Tailwind v4 stack handles every requirement: structured LLM output via forced tool_choice, state management via Convex schema unions, real-time UI updates, and themed visual treatment via OKLCH tokens.

The core technical challenge is not "what tools do we need" but "how do we wire action generation into the existing matching pipeline cleanly." The matching pipeline already uses chained scheduled actions, batched LLM calls, and Zod validation -- action generation follows the same pattern with one additional Haiku call chained after the final match batch.

The UI challenge is making career actions feel visually distinct from opportunity matches (violet accent) while using the same component patterns (Card, Badge, interactive states). The OKLCH color system makes this trivial -- add a violet palette at hue 290, which is maximally distant from the existing coral (30), teal (180), and navy (240) hues.

The completion flow (mark done -> enrichment chat -> profile update -> re-run matching) threads through three existing systems (enrichment chat, extraction, matching) that are already built and tested. The only extension needed is passing action context into the enrichment chat system prompt.

## Key Findings

**Stack:** No new dependencies. Extend existing Convex schema, Anthropic SDK patterns, and OKLCH design tokens.
**Architecture:** Chain action generation after matching pipeline's last batch. New `careerActions` table with 5-state union. New `convex/actions/` module.
**Critical pitfall:** Action generation must run AFTER matching, not in parallel, because it uses match context (gaps, growth areas) to generate relevant actions.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Schema + Backend** - Define careerActions table, write compute/prompts/mutations/queries/validation
   - Addresses: Action generation, state management, completion tracking
   - Avoids: UI work before the data layer is stable

2. **Pipeline Integration** - Wire action generation into matching pipeline's last-batch hook
   - Addresses: Automatic generation alongside matching, on-demand refresh
   - Avoids: Separate generation trigger (duplicates matching trigger logic)

3. **Violet Tokens + Action UI** - Add OKLCH violet palette, build ActionCard and CareerActionsSection components
   - Addresses: Visual distinction, action interactions (save, dismiss, start, complete)
   - Avoids: Building UI before data shape is final

4. **Completion Flow** - Wire "done" state to enrichment chat with action context seeding
   - Addresses: Profile enrichment loop, re-run matching after completion
   - Avoids: Breaking existing enrichment chat behavior

5. **Page Integration** - Add action sections to matches page and opportunities page
   - Addresses: User-facing display, match detail relevance
   - Avoids: Complex routing changes (uses existing page structure)

**Phase ordering rationale:**

- Schema first because everything depends on the data shape
- Pipeline integration second because it validates the generation works end-to-end
- UI third because it needs both the schema and real generated data to test against
- Completion flow fourth because it threads through multiple existing systems and is a secondary interaction
- Page integration last because it's layout/composition work that depends on all prior components

**Research flags for phases:**

- Phase 1-2: Standard patterns, unlikely to need research (mirrors existing matching pipeline exactly)
- Phase 3: May need visual iteration on violet hue value (290 is the recommendation, but needs visual validation in both light and dark mode)
- Phase 4: Enrichment chat seeding is a novel extension -- test that action context in the system prompt doesn't confuse the career coach persona
- Phase 5: Standard composition work, no research needed

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Zero new deps. All patterns verified against existing codebase.                                         |
| Features     | HIGH       | Requirements clearly defined in PROJECT.md. State machine is simple.                                    |
| Architecture | HIGH       | Mirrors existing matching pipeline patterns exactly.                                                    |
| Pitfalls     | MEDIUM     | Completion flow threading through 3 systems has integration risk. Action quality from Haiku unverified. |

## Gaps to Address

- Violet hue (290) needs visual validation in both themes during implementation
- Action generation prompt quality needs testing with real profile data (prompt may need iteration)
- Rate limiting: if action generation adds delay to matching, users may perceive matching as slower (mitigation: generate actions after match results are already saved and visible)
- Dismissed action resurfacing policy needs definition (how different must a regenerated action be from a dismissed one?)
