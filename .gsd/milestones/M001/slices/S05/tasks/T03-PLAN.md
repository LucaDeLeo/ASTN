# T03: 41-participant-experience 03

**Slice:** S05 — **Milestone:** M001

## Description

Implement participant-facing UI for all four module enhancements: essential/optional visual distinction, inline audio playback, time-to-session indicator, and continue-here progress marker.

Purpose: These features all appear on the participant program page and its MaterialChecklist sub-component. Grouping them avoids touching $programSlug.tsx and MaterialChecklist.tsx multiple times.

Output: Participants see essential vs optional badges on materials, can play audio inline, see time-to-session awareness, and get a visual marker pointing to their next incomplete item.

## Must-Haves

- [ ] 'Materials visually distinguished as essential or optional with badge/label'
- [ ] 'Audio materials render inline audio player instead of external link'
- [ ] 'Participant sees time-to-session indicator with days until next session and estimated pre-work remaining'
- [ ] 'Participant sees continue-here marker on first incomplete material or exercise'
- [ ] 'Progress section counts only essential materials'
- [ ] 'Remaining time calculation excludes optional materials'

## Files

- `src/components/programs/MaterialChecklist.tsx`
- `src/routes/org/$slug/program/$programSlug.tsx`
