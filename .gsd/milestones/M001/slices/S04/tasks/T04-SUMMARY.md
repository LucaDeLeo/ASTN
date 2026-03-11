---
id: T04
parent: S04
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration:
verification_result: passed
completed_at:
blocker_discovered: false
---

# T04: 40-live-sessions 04

**# Plan 40-04 Summary: Participant Live View**

## What Happened

# Plan 40-04 Summary: Participant Live View

## What was built

- `ParticipantLiveView` — live session banner on participant program page
- `ParticipantPairView` — shows participant's pair/trio assignment
- Presence heartbeat every 10s while live session is active
- Focus/blur handlers for typing/idle presence status updates
- Integration into program page (renders above Session Timeline)

## Files created

- `src/components/session/ParticipantLiveView.tsx`
- `src/components/session/ParticipantPairView.tsx`

## Files modified

- `src/routes/org/$slug/program/$programSlug.tsx` — added ParticipantLiveView import and placement

## Key decisions

- Component iterates all sessions and renders banner only for running one (avoids conditional hooks)
- At BAISH scale (~6 sessions), querying liveState per session is acceptable
- Only renders for enrolled participants (`participation` check in parent)
- Presence heartbeat uses `useEffect` with 10s interval, silent failure on errors
- PromptRenderer reused in `participate` mode for active prompts
- ParticipantPairView queries `getMyPairs` and shows partner names via user lookup

## Commit

`42de110` feat(40-04): add participant live view with real-time session banner
