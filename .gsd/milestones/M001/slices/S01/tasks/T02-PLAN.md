# T02: 37-interactive-prompts 02

**Slice:** S01 — **Milestone:** M001

## Description

Build the participant-facing prompt UI as a single reusable component with field subcomponents and draft/submit flow.

Purpose: Participants need to see prompts (markdown body + fields) and respond to them. The PromptRenderer must be a single component that works identically whether placed on a module page or a session page (PROMPT-09). It handles draft saving and final submission with visual feedback.

Output: `PromptRenderer.tsx` and supporting subcomponents in `src/components/course/`.

## Must-Haves

- [ ] 'Participant sees a prompt with its markdown body and all field types (text, choice, multiple_choice) rendered correctly'
- [ ] 'Participant can fill in text fields, select radio options, and check multiple-choice options'
- [ ] 'Participant can save a partial response as draft and see it restored when returning'
- [ ] 'Participant can submit a final response and sees confirmation'
- [ ] 'The PromptRenderer component is context-agnostic -- it takes only a promptId prop and works anywhere'
- [ ] 'Spotlighted responses show a visual badge'

## Files

- `src/components/course/PromptRenderer.tsx`
- `src/components/course/PromptFieldText.tsx`
- `src/components/course/PromptFieldChoice.tsx`
- `src/components/course/PromptFieldMultiChoice.tsx`
- `src/components/course/PromptMarkdownBody.tsx`
- `src/components/course/SpotlightBadge.tsx`
