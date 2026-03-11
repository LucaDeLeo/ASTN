# T02: 40-live-sessions 02

**Slice:** S04 — **Milestone:** M001

## Description

Build the live session lifecycle backend: facilitator control mutations, presence tracking, pairing algorithms, and ad-hoc prompt support.

Purpose: This is the core runtime engine. It manages the real-time state that both facilitator and participant UIs will subscribe to. Without this, no live session can run.
Output: sessionRunner.ts (lifecycle mutations), sessionPairing.ts (pairing algorithms), extended sessionQueries.ts (presence, pairs, results queries).

## Must-Haves

- [ ] 'Facilitator can start a live session, creating a sessionLiveState document'
- [ ] 'Facilitator can advance to next phase, extend timer, skip phase, and end session'
- [ ] 'Only one live session per program can run at a time (invariant enforced)'
- [ ] 'All facilitator actions are idempotent (duplicate calls produce same result)'
- [ ] 'Presence heartbeats are stored in sessionPresence table'
- [ ] 'Facilitator can query presence to see who is typing/submitted/idle'
- [ ] 'Random pairing shuffles present participants into pairs (with one trio if odd)'
- [ ] 'Complementary pairing groups participants by different choices on a specified prompt field'
- [ ] 'Manual pairing accepts explicit pair assignments from facilitator'
- [ ] 'Ad-hoc prompts can be created during a live session and added to activePromptIds'
- [ ] 'Phase results (actual durations) are recorded when advancing or ending'

## Files

- `convex/course/sessionRunner.ts`
- `convex/course/sessionPairing.ts`
- `convex/course/sessionQueries.ts`
