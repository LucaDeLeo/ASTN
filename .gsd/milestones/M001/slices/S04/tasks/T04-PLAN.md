# T04: 40-live-sessions 04

**Slice:** S04 — **Milestone:** M001

## Description

Build the participant's real-time view of live sessions and integrate it into the existing program page.

Purpose: Participants need to see the current phase, timer, active prompts, and their pair assignment in real-time as the facilitator runs the session. This is the participant half of the live session experience.
Output: ParticipantLiveView banner component, ParticipantPairView component, and program page integration.

## Must-Haves

- [ ] 'Participant sees a live session banner at top of program page when a session is running'
- [ ] 'Banner shows current phase title and countdown timer updating in real-time'
- [ ] 'Active prompts for the current phase render inline via existing PromptRenderer'
- [ ] 'Participant sees their pair assignment for the current phase'
- [ ] 'Participant presence heartbeat is sent while they interact with prompts'
- [ ] 'Session completion is indicated; responses remain accessible via existing prompt UI'

## Files

- `src/components/session/ParticipantLiveView.tsx`
- `src/components/session/ParticipantPairView.tsx`
- `src/routes/org/$slug/program/$programSlug.tsx`
