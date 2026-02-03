# Phase 23: Touch Interactions - Research

**Researched:** 2026-01-21
**Domain:** Mobile touch interactions, gesture handling, haptic feedback
**Confidence:** HIGH

## Summary

This phase implements native-feeling touch interactions for the ASTN mobile experience. The requirements span four distinct areas: pull-to-refresh on list views, immediate tap feedback (<100ms), swipe gestures for common actions, and haptic feedback for native builds.

The project already has solid foundations for touch interactions. The button component includes `active:scale-[0.97]` and `transition-all` for tap feedback, CSS variables define animation timing (150ms-400ms), and the codebase uses Tailwind v4 which supports modern touch utilities. The data layer uses Convex's reactive `useQuery` which automatically syncs but lacks manual refresh triggers, making pull-to-refresh a data-fetching enhancement rather than a replacement.

**Primary recommendation:** Use `@use-gesture/react` for swipe gesture detection (works with existing React 19), implement pull-to-refresh with a lightweight custom component using the same library, enhance tap feedback with CSS `touch-action: manipulation` to eliminate 300ms delay, and use the Vibration API with Safari fallback for haptics.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library            | Version | Purpose                         | Why Standard                                                             |
| ------------------ | ------- | ------------------------------- | ------------------------------------------------------------------------ |
| @use-gesture/react | 10.x    | Gesture detection (drag, swipe) | Best-in-class React gesture library, works with React 19, tree-shakeable |
| CSS touch-action   | Native  | Browser touch handling          | Zero-JS solution for tap delay elimination                               |
| Vibration API      | Native  | Haptic feedback                 | Browser standard, no library needed                                      |

### Supporting

| Library           | Version | Purpose           | When to Use                                                     |
| ----------------- | ------- | ----------------- | --------------------------------------------------------------- |
| @react-spring/web | 9.x     | Spring animations | Optional: only if needing physics-based animations for gestures |

### Alternatives Considered

| Instead of             | Could Use                    | Tradeoff                                                                                       |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| @use-gesture           | Hammer.js                    | Hammer is older, larger, less React-native; @use-gesture is smaller and hooks-based            |
| @use-gesture           | framer-motion gestures       | Framer would add significant bundle size for just gesture detection                            |
| Custom pull-to-refresh | react-simple-pull-to-refresh | NPM packages are often unmaintained; custom implementation is ~100 lines and more controllable |
| Vibration API          | No haptics                   | Safari doesn't support Vibration API; graceful degradation is acceptable                       |

**Installation:**

```bash
npm install @use-gesture/react
# Optional, only if needing spring physics:
npm install @react-spring/web
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   ├── use-pull-to-refresh.ts    # Pull-to-refresh logic
│   ├── use-swipe-action.ts       # Swipe gesture detection
│   └── use-haptic.ts             # Haptic feedback utility
├── components/
│   ├── ui/
│   │   └── pull-to-refresh.tsx   # Pull-to-refresh wrapper component
│   └── gestures/
│       └── swipeable-card.tsx    # Swipeable card wrapper
└── styles/
    └── app.css                   # Touch-related CSS utilities
```

### Pattern 1: Pull-to-Refresh with @use-gesture

**What:** Custom pull-to-refresh using drag gesture detection
**When to use:** List views that need manual refresh capability
**Example:**

```typescript
// Source: @use-gesture docs + custom integration
import { useDrag } from '@use-gesture/react'
import { useState, useCallback } from 'react'

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const THRESHOLD = 80 // pixels to trigger refresh

  const bind = useDrag(
    ({ movement: [, my], last, cancel }) => {
      // Only allow pulling down when at top of scroll
      if (my < 0) {
        cancel()
        return
      }

      setPullDistance(Math.min(my, THRESHOLD * 1.5))

      if (last && my >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true)
        onRefresh().finally(() => {
          setIsRefreshing(false)
          setPullDistance(0)
        })
      } else if (last) {
        setPullDistance(0)
      }
    },
    {
      axis: 'y',
      filterTaps: true,
      from: () => [0, pullDistance],
    },
  )

  return { bind, pullDistance, isRefreshing }
}
```

### Pattern 2: Swipe Actions with Gesture Detection

**What:** Detect swipe direction for card actions (dismiss, save)
**When to use:** Cards that need swipe-to-dismiss or swipe-to-save
**Example:**

```typescript
// Source: @use-gesture docs state properties
import { useDrag } from '@use-gesture/react'

export function useSwipeAction(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
) {
  const [offset, setOffset] = useState(0)

  const bind = useDrag(
    ({ movement: [mx], swipe: [swipeX], last }) => {
      if (last) {
        if (swipeX === -1 && onSwipeLeft) onSwipeLeft()
        if (swipeX === 1 && onSwipeRight) onSwipeRight()
        setOffset(0)
      } else {
        setOffset(mx)
      }
    },
    {
      axis: 'x',
      swipe: {
        distance: 50, // min pixels to trigger swipe
        velocity: 0.5, // min velocity (px/ms)
        duration: 220, // max duration (ms)
      },
    },
  )

  return { bind, offset }
}
```

### Pattern 3: Haptic Feedback Utility

**What:** Cross-browser haptic feedback with graceful degradation
**When to use:** Key interactions (successful actions, errors, confirmations)
**Example:**

```typescript
// Source: MDN Vibration API documentation
export function useHaptic() {
  const vibrate = useCallback((pattern: number | number[]) => {
    // Check if Vibration API is supported
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
    // Silently fail on unsupported browsers (Safari)
  }, [])

  return {
    tap: () => vibrate(10), // Light tap: 10ms
    success: () => vibrate([10, 50, 10]), // Double pulse
    error: () => vibrate([50, 30, 50, 30, 50]), // Error pattern
    warning: () => vibrate([30, 20, 30]), // Warning pattern
  }
}
```

### Pattern 4: Tap Feedback with CSS

**What:** Immediate visual feedback using CSS-only approach
**When to use:** All interactive elements
**Example:**

```css
/* Source: web.dev touch feedback best practices */

/* Remove 300ms tap delay */
html {
  touch-action: manipulation;
}

/* Suppress default browser tap highlight */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Explicit active states for touch feedback */
.interactive {
  transition:
    transform 100ms ease-out,
    opacity 100ms ease-out;
}

.interactive:active {
  transform: scale(0.97);
  opacity: 0.9;
}
```

### Anti-Patterns to Avoid

- **Using setTimeout for feedback:** Creates visible delay; use CSS transitions instead
- **Blocking scroll for gestures:** Always preserve vertical scroll unless explicitly needed; use `touch-action: pan-y` on horizontal-only gesture elements
- **Document-wide touch handlers:** Confine gesture handlers to specific elements to avoid scroll performance issues
- **Ignoring overscroll-behavior:** Always set `overscroll-behavior-y: contain` on pull-to-refresh containers to prevent native refresh competing

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                     | Don't Build                 | Use Instead                  | Why                                                              |
| --------------------------- | --------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| Swipe velocity calculation  | Manual touch event math     | @use-gesture swipe detection | Edge cases with direction, velocity thresholds, duration windows |
| Gesture conflict resolution | Custom touch event juggling | @use-gesture axis locking    | Library handles gesture prioritization automatically             |
| Pull threshold physics      | Linear distance tracking    | Rubberband formula           | UX feels wrong without proper overscroll physics                 |
| Cross-browser touch events  | Raw touchstart/touchend     | @use-gesture                 | Handles pointer events, touch events, mouse events uniformly     |

**Key insight:** Touch interaction feels "wrong" when thresholds, velocities, and timing don't match native apps. Libraries encode years of UX tuning.

## Common Pitfalls

### Pitfall 1: 300ms Click Delay

**What goes wrong:** Taps feel sluggish on mobile
**Why it happens:** Browsers historically waited 300ms to detect double-tap-to-zoom
**How to avoid:** Add `touch-action: manipulation` to html element
**Warning signs:** User complains buttons feel "laggy"

### Pitfall 2: Pull-to-Refresh Conflicts with Native

**What goes wrong:** Both custom and browser pull-to-refresh trigger
**Why it happens:** Browser has built-in pull-to-refresh on overscroll
**How to avoid:** Set `overscroll-behavior-y: contain` on the scrollable container
**Warning signs:** Seeing browser refresh indicator alongside custom one

### Pitfall 3: Gesture Blocks Scrolling

**What goes wrong:** User can't scroll page after touching gesture element
**Why it happens:** Gesture handler captures all touch events
**How to avoid:** Use `touch-action: pan-y` for horizontal-only gestures, configure axis locking in @use-gesture
**Warning signs:** Page "stuck" after touching swipeable element

### Pitfall 4: Haptic Feedback Unsupported

**What goes wrong:** App throws error on Safari/iOS
**Why it happens:** Safari doesn't support Vibration API (81% global support, NO Safari support)
**How to avoid:** Always check `'vibrate' in navigator` before calling; silently degrade
**Warning signs:** Console errors mentioning vibrate, broken on iOS testing

### Pitfall 5: Swipe Triggers Accidentally

**What goes wrong:** Normal scrolling triggers swipe actions
**Why it happens:** Swipe thresholds too low, or direction not locked
**How to avoid:** Require minimum velocity (0.5 px/ms) and distance (50px); use axis locking
**Warning signs:** Users complaining cards dismiss when they meant to scroll

### Pitfall 6: Visual Feedback Too Slow

**What goes wrong:** Tap feedback feels unresponsive despite working
**Why it happens:** Transition duration too long, or using JS instead of CSS
**How to avoid:** Keep feedback transitions under 100ms; use CSS active states not JS state
**Warning signs:** Users tapping multiple times thinking first tap didn't register

## Code Examples

Verified patterns from official sources:

### Convex Query Refresh Integration

```typescript
// Integration with existing Convex useQuery pattern
// Source: Project codebase + Convex docs

import { useQuery } from "convex/react";
import { usePullToRefresh } from "~/hooks/use-pull-to-refresh";

function MatchList() {
  const matchesData = useQuery(api.matches.getMyMatches);

  // Convex queries auto-refresh, but we can trigger recomputation
  const triggerComputation = useAction(api.matches.triggerMatchComputation);

  const { bind, pullDistance, isRefreshing } = usePullToRefresh(async () => {
    await triggerComputation();
    // Convex will automatically update matchesData when backend changes
  });

  return (
    <div
      {...bind()}
      style={{
        touchAction: 'pan-y',
        overscrollBehaviorY: 'contain'
      }}
    >
      <RefreshIndicator distance={pullDistance} isRefreshing={isRefreshing} />
      {matchesData?.matches && <MatchContent matches={matchesData.matches} />}
    </div>
  );
}
```

### Swipeable Match Card

```typescript
// Source: @use-gesture docs + project patterns
import { useDrag } from '@use-gesture/react';
import { Card } from '~/components/ui/card';

interface SwipeableMatchCardProps {
  match: MatchData;
  onDismiss: () => void;
  onSave: () => void;
}

export function SwipeableMatchCard({ match, onDismiss, onSave }: SwipeableMatchCardProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useDrag(
    ({ movement: [mx], swipe: [swipeX], last, cancel }) => {
      if (last) {
        if (swipeX === -1) {
          api.start({ x: -300 });
          onDismiss();
        } else if (swipeX === 1) {
          api.start({ x: 300 });
          onSave();
        } else {
          api.start({ x: 0 });
        }
      } else {
        api.start({ x: mx, immediate: true });
      }
    },
    { axis: 'x', filterTaps: true }
  );

  return (
    <animated.div {...bind()} style={{ x, touchAction: 'pan-y' }}>
      <MatchCard match={match} />
    </animated.div>
  );
}
```

### Global Touch Styles

```css
/* Add to src/styles/app.css */
/* Source: MDN, web.dev best practices */

/* Remove 300ms tap delay globally */
html {
  touch-action: manipulation;
}

/* Remove default tap highlight (provide custom :active styles instead) */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Pull-to-refresh container must prevent browser refresh */
.pull-to-refresh-container {
  overscroll-behavior-y: contain;
}

/* Horizontal swipe elements preserve vertical scroll */
.swipeable {
  touch-action: pan-y;
}
```

## State of the Art

| Old Approach                   | Current Approach             | When Changed | Impact                                                 |
| ------------------------------ | ---------------------------- | ------------ | ------------------------------------------------------ |
| Hammer.js for gestures         | @use-gesture with hooks      | ~2020        | Smaller bundle, better React integration, tree-shaking |
| User-scalable=no for tap delay | touch-action: manipulation   | ~2019        | Removes delay without blocking accessibility zoom      |
| Raw touchstart/touchend        | Pointer Events API           | ~2018        | Unified handling of touch, mouse, pen input            |
| Custom gesture math            | @use-gesture swipe detection | ~2020        | Built-in velocity, direction, duration thresholds      |

**Deprecated/outdated:**

- `FastClick.js`: No longer needed; modern browsers with proper viewport meta don't have 300ms delay
- `user-scalable=no`: Accessibility violation; use touch-action instead
- Hammer.js: Still works but @use-gesture is more modern, smaller, and better for React

## Open Questions

Things that couldn't be fully resolved:

1. **iOS Safari Haptic Workaround**
   - What we know: Safari doesn't support Vibration API; iOS WebKit has no haptic feedback mechanism
   - What's unclear: Whether any workaround exists for web apps (not native)
   - Recommendation: Accept graceful degradation; haptics are "native builds only" per requirements

2. **Convex Real-time vs Pull-to-Refresh UX**
   - What we know: Convex useQuery auto-syncs in real-time; manual refresh may seem redundant
   - What's unclear: Best UX pattern when data is already live
   - Recommendation: Pull-to-refresh should trigger re-computation (triggerMatchComputation), not just refetch; gives users sense of control

3. **react-spring Necessity**
   - What we know: @use-gesture works without it; spring physics make animations feel better
   - What's unclear: Whether CSS transitions are sufficient for this app's needs
   - Recommendation: Start without react-spring; add only if CSS transitions feel inadequate during implementation

## Sources

### Primary (HIGH confidence)

- @use-gesture official docs (https://use-gesture.netlify.app/docs/) - Gesture API, swipe state, configuration options
- MDN Vibration API (https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) - API usage, patterns
- MDN touch-action (https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) - Values, use cases
- MDN overscroll-behavior (https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) - Pull-to-refresh control

### Secondary (MEDIUM confidence)

- web.dev touch feedback article - Best practices verified with MDN
- Can I Use Vibration API - Browser support data (81% global, no Safari)

### Tertiary (LOW confidence)

- None - all findings verified with primary sources

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - @use-gesture is well-documented with official docs consulted
- Architecture: HIGH - Patterns derived from official documentation examples
- Pitfalls: HIGH - Common issues documented in MDN and web.dev

**Research date:** 2026-01-21
**Valid until:** 2026-04-21 (90 days - stable APIs, no major changes expected)
