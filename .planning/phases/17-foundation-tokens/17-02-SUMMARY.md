---
phase: 17-foundation-tokens
plan: 02
subsystem: ui
tags:
  [css, tailwind, animation, fonts, preload, reduced-motion, easing, keyframes]

# Dependency graph
requires:
  - phase: 17-01
    provides: Font packages, color tokens, typography scale
provides:
  - Font preloading infrastructure (no FOIT/FOUT)
  - Animation easing tokens (ease-spring, ease-gentle)
  - Duration tokens (150ms-600ms range)
  - Entrance animation keyframes (fade-in, slide-up, slide-down, scale-in)
  - Reduced motion media query support
affects: [18-page-layouts, 19-components, 20-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - 'Font preloading via woff2?url imports'
    - 'Spring easing with slight overshoot for organic motion'
    - 'Reduced motion media query preserves fade animations'
    - '@theme inline for Tailwind animation utility generation'

key-files:
  created: []
  modified:
    - src/styles/app.css
    - src/routes/__root.tsx

key-decisions:
  - 'Spring easing uses 1.56 y2 control point for subtle overshoot'
  - '8px translateY offset for slide animations (subtle but intentional)'
  - 'Preload links positioned before stylesheet for browser prioritization'

patterns-established:
  - "Font preloads use crossOrigin: 'anonymous' for CORS compliance"
  - 'Animation keyframes defined inside @theme inline block'
  - 'Reduced motion: disable all motion except fade for basic feedback'

# Metrics
duration: 4min
completed: 2026-01-20
---

# Phase 17 Plan 02: Animation & Font Preloading Summary

**Spring easing animations with woff2 font preloading and reduced motion accessibility support**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-20T02:10:00Z
- **Completed:** 2026-01-20T02:14:00Z
- **Tasks:** 2
- **Files modified:** 2 (src/styles/app.css, src/routes/\_\_root.tsx)

## Accomplishments

- Added animation easing tokens with spring easing (slight overshoot for organic feel)
- Defined duration tokens in 150ms-600ms range per CONTEXT.md motion guidelines
- Created four entrance animation keyframes (fade-in, slide-up, slide-down, scale-in)
- Added font preloading to eliminate FOIT/FOUT on page load
- Implemented reduced motion media query respecting user accessibility preferences

## Task Commits

Each task was committed atomically:

1. **Task 1: Define animation tokens and keyframes** - `a9206f4` (feat)
2. **Task 2: Add font preloading to \_\_root.tsx** - `f64c374` (feat)

## Files Created/Modified

- `src/styles/app.css` - Animation timing/duration/transform tokens, keyframes, reduced motion support
- `src/routes/__root.tsx` - woff2 imports and preload links for fonts

## Decisions Made

1. **Spring easing curve** - Used cubic-bezier(0.34, 1.56, 0.64, 1) for organic settle with slight overshoot. The 1.56 y2 value gives just enough bounce to feel alive without being distracting.

2. **8px slide offset** - slide-up and slide-down use 8px translateY. This is subtle enough not to be jarring but noticeable enough to add life.

3. **scale-in at 0.95** - Elements scale from 95% to 100% for a gentle "pop in" effect that complements the spring easing.

4. **Preload before stylesheet** - Font preload links placed before the stylesheet link to ensure browsers prioritize font loading.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Animation tokens ready for Phase 19 (Components) motion system
- Font preloading eliminates flash of unstyled/invisible text
- Tailwind utilities available: `animate-fade-in`, `animate-slide-up`, `ease-spring`, `ease-gentle`
- Reduced motion support built in from the start (accessibility)
- Transform tokens (`--scale-press`, `--scale-hover`) ready for button interactions

---

_Phase: 17-foundation-tokens_
_Completed: 2026-01-20_
