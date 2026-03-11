# T03: 40-live-sessions 03

**Slice:** S04 — **Milestone:** M001

## Description

Build the facilitator-facing session runner UI: phase setup editor and live session dashboard.

Purpose: The facilitator needs to define session agenda (phases with titles, durations, prompts, pair configs) and then run the session live with real-time controls.
Output: Dedicated session runner route and session component library (setup, runner, timer, presence, pairs, ad-hoc prompts).

## Must-Haves

- [ ] 'Facilitator can define session phases with title, duration, notes, prompt refs, and pair config'
- [ ] 'Facilitator can reorder phases via drag or up/down buttons'
- [ ] "Facilitator sees a 'Start Session' button that begins the live session"
- [ ] 'Live runner shows current phase with countdown timer, controls (advance, extend, skip, end)'
- [ ] 'Timer turns red and pulses when under 60 seconds'
- [ ] 'Facilitator sees presence indicators showing who submitted, who is typing, who is idle'
- [ ] 'Facilitator can create ad-hoc prompts during a live session via a dialog'
- [ ] 'Session runner route is a dedicated page under admin programs'

## Files

- `src/routes/org/$slug/admin/programs/$programId/session-runner.tsx`
- `src/components/session/SessionSetup.tsx`
- `src/components/session/PhaseCard.tsx`
- `src/components/session/SessionRunner.tsx`
- `src/components/session/LiveTimer.tsx`
- `src/components/session/PresenceIndicator.tsx`
- `src/components/session/PairDisplay.tsx`
- `src/components/session/AdHocPromptDialog.tsx`
