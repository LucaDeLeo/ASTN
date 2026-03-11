# T03: 37-interactive-prompts 03

**Slice:** S01 — **Milestone:** M001

## Description

Build the facilitator-facing prompt management UI: a form for creating/editing prompts with dynamic fields, a response viewer with spotlight controls, and a reveal trigger.

Purpose: Facilitators need to create prompts with different field types and visibility modes, view all participant responses, spotlight exceptional ones, and trigger reveal on write_then_reveal prompts. These are admin-only components that complement the participant-facing PromptRenderer from Plan 02.

Output: `PromptForm.tsx` for creation/editing, `PromptResponseViewer.tsx` for viewing responses, `PromptRevealControl.tsx` for triggering reveal.

## Must-Haves

- [ ] 'Facilitator can create a new prompt with title, markdown body, multiple fields, and reveal mode'
- [ ] 'Facilitator can add text, choice, and multiple_choice fields dynamically to the prompt form'
- [ ] 'Facilitator can configure reveal mode (immediate, facilitator_only, write_then_reveal) during creation'
- [ ] 'Facilitator can view all participant responses for any prompt in a clean list'
- [ ] 'Facilitator can trigger reveal on write_then_reveal prompts with a single action'
- [ ] 'Facilitator can toggle spotlight on individual responses'

## Files

- `src/components/course/PromptForm.tsx`
- `src/components/course/PromptResponseViewer.tsx`
- `src/components/course/PromptRevealControl.tsx`
