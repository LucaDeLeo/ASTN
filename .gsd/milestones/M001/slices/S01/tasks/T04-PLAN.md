# T04: 37-interactive-prompts 04

**Slice:** S01 — **Milestone:** M001

## Description

Wire prompt components into the existing module and admin pages, then verify the full end-to-end flow.

Purpose: The prompt system components (Plans 02 and 03) need to be integrated into the actual application pages. Participants should see prompts on the program page alongside module materials. Facilitators should be able to create prompts and view responses from the admin program page. This plan also includes a human verification checkpoint to confirm the full flow works.

Output: Updated program page with prompt rendering, updated admin page with prompt management, verified end-to-end flow.

## Must-Haves

- [ ] 'Prompts attached to a module render on the participant program page below module materials'
- [ ] 'Facilitator can create prompts from the admin program management page'
- [ ] 'Facilitator can view responses from the admin page'
- [ ] 'The same PromptRenderer component is used in both module and session contexts'
- [ ] 'The prompt system works end-to-end: create prompt, respond, save draft, submit, view responses, spotlight, reveal'

## Files

- `src/routes/org/$slug/program/$programSlug.tsx`
- `src/routes/org/$slug/admin/programs.tsx`
