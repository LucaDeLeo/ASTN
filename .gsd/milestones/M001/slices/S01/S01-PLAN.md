# S01: Interactive Prompts

**Goal:** Create the Convex schema tables and backend functions for the unified prompt system.
**Demo:** Create the Convex schema tables and backend functions for the unified prompt system.

## Must-Haves

## Tasks

- [x] **T01: 37-interactive-prompts 01**
  - Create the Convex schema tables and backend functions for the unified prompt system.

Purpose: Establish the data layer that all prompt UI depends on -- two tables (coursePrompts, coursePromptResponses) with CRUD mutations, response save/submit with draft support, visibility-filtered queries respecting three reveal modes, and spotlight/reveal facilitator actions.

Output: Two new schema tables, `convex/course/prompts.ts` with prompt CRUD + reveal, `convex/course/responses.ts` with response save + visibility queries + spotlight.

- [x] **T02: 37-interactive-prompts 02**
  - Build the participant-facing prompt UI as a single reusable component with field subcomponents and draft/submit flow.

Purpose: Participants need to see prompts (markdown body + fields) and respond to them. The PromptRenderer must be a single component that works identically whether placed on a module page or a session page (PROMPT-09). It handles draft saving and final submission with visual feedback.

Output: `PromptRenderer.tsx` and supporting subcomponents in `src/components/course/`.

- [x] **T03: 37-interactive-prompts 03**
  - Build the facilitator-facing prompt management UI: a form for creating/editing prompts with dynamic fields, a response viewer with spotlight controls, and a reveal trigger.

Purpose: Facilitators need to create prompts with different field types and visibility modes, view all participant responses, spotlight exceptional ones, and trigger reveal on write_then_reveal prompts. These are admin-only components that complement the participant-facing PromptRenderer from Plan 02.

Output: `PromptForm.tsx` for creation/editing, `PromptResponseViewer.tsx` for viewing responses, `PromptRevealControl.tsx` for triggering reveal.

- [x] **T04: 37-interactive-prompts 04**
  - Wire prompt components into the existing module and admin pages, then verify the full end-to-end flow.

Purpose: The prompt system components (Plans 02 and 03) need to be integrated into the actual application pages. Participants should see prompts on the program page alongside module materials. Facilitators should be able to create prompts and view responses from the admin program page. This plan also includes a human verification checkpoint to confirm the full flow works.

Output: Updated program page with prompt rendering, updated admin page with prompt management, verified end-to-end flow.

## Files Likely Touched

- `convex/schema.ts`
- `convex/course/prompts.ts`
- `convex/course/responses.ts`
- `convex/course/_helpers.ts`
- `src/components/course/PromptRenderer.tsx`
- `src/components/course/PromptFieldText.tsx`
- `src/components/course/PromptFieldChoice.tsx`
- `src/components/course/PromptFieldMultiChoice.tsx`
- `src/components/course/PromptMarkdownBody.tsx`
- `src/components/course/SpotlightBadge.tsx`
- `src/components/course/PromptForm.tsx`
- `src/components/course/PromptResponseViewer.tsx`
- `src/components/course/PromptRevealControl.tsx`
- `src/routes/org/$slug/program/$programSlug.tsx`
- `src/routes/org/$slug/admin/programs.tsx`
