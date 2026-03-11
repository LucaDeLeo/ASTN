# T01: 37-interactive-prompts 01

**Slice:** S01 — **Milestone:** M001

## Description

Create the Convex schema tables and backend functions for the unified prompt system.

Purpose: Establish the data layer that all prompt UI depends on -- two tables (coursePrompts, coursePromptResponses) with CRUD mutations, response save/submit with draft support, visibility-filtered queries respecting three reveal modes, and spotlight/reveal facilitator actions.

Output: Two new schema tables, `convex/course/prompts.ts` with prompt CRUD + reveal, `convex/course/responses.ts` with response save + visibility queries + spotlight.

## Must-Haves

- [ ] 'coursePrompts table exists with fields for title, body, attachedTo union, fields array, revealMode, and revealedAt'
- [ ] 'coursePromptResponses table exists with fieldResponses array, draft/submitted status, and spotlight fields'
- [ ] 'Facilitator can create, update, and delete prompts via mutations with orgAdmin auth'
- [ ] 'Participant can save draft responses and submit final responses via upsert mutation'
- [ ] 'Response visibility respects revealMode (immediate, facilitator_only, write_then_reveal)'
- [ ] 'Facilitator can trigger reveal on write_then_reveal prompts'
- [ ] 'Facilitator can toggle spotlight on responses'

## Files

- `convex/schema.ts`
- `convex/course/prompts.ts`
- `convex/course/responses.ts`
- `convex/course/_helpers.ts`
