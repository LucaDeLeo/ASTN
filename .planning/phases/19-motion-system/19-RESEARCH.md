# Phase 19: Motion System - Research

**Researched:** 2026-01-19
**Domain:** CSS animations, View Transitions API, React animation patterns
**Confidence:** HIGH

## Summary

This phase adds purposeful motion to reinforce the warm aesthetic: card hover effects, staggered entrance animations, page transitions, and button press feedback. The project already has excellent animation infrastructure from Phase 17 (easing curves, duration tokens, warm shadows, keyframes) that should be leveraged.

The recommended approach prioritizes CSS-native solutions over JavaScript animation libraries. TanStack Router has built-in View Transitions API support that integrates naturally with the existing routing. The project already uses tw-animate-css which provides Tailwind utilities for entrance/exit animations.

**Primary recommendation:** Use CSS-first animations with TanStack Router's native `viewTransition` prop for page transitions, CSS `animation-delay` for staggered entrances, and CSS `:active` pseudo-class for button press feedback. No new dependencies required.

## Standard Stack

The established approach for this domain:

### Core (Already in Project)

| Library         | Version | Purpose                       | Why Standard                                                                                |
| --------------- | ------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| tw-animate-css  | 1.4.0   | Tailwind animation utilities  | Already installed, provides `animate-in`, `fade-in`, `slide-in-from-*`, `delay-*` utilities |
| TanStack Router | 1.132.2 | Routing with View Transitions | Built-in `viewTransition` prop on Link, `defaultViewTransition` router option               |
| Tailwind v4     | 4.1.13  | CSS framework                 | Native CSS custom properties, @theme support                                                |

### Supporting (No New Dependencies Needed)

| Feature              | Implementation | Why                                                      |
| -------------------- | -------------- | -------------------------------------------------------- |
| View Transitions API | Browser native | 90%+ browser support (Baseline Newly available Oct 2025) |
| CSS animation-delay  | Browser native | Performant staggered animations                          |
| CSS :active state    | Browser native | Button press feedback without JS                         |

### Alternatives Considered

| Instead of           | Could Use                        | Tradeoff                                                                     |
| -------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| CSS animations       | Framer Motion                    | More control but adds ~50KB, overkill for simple entrance/hover effects      |
| CSS animation-delay  | Motion One                       | More orchestration features but unnecessary complexity for 8-10 item stagger |
| View Transitions API | React 19 unstable_ViewTransition | API is experimental, View Transitions API is now Baseline                    |

**No installation needed** - all required animation capabilities exist in current stack.

## Architecture Patterns

### Recommended Component Structure

```
src/
  components/
    animation/
      AnimatedCard.tsx     # Reusable card with stagger support
      PageTransition.tsx   # Optional wrapper for route transitions (if needed)
    ui/
      button.tsx           # Add press feedback variants
      card.tsx             # Add hover lift + shadow behavior
```

### Pattern 1: Staggered Entrance via CSS Custom Property

**What:** Pass index to children as CSS variable, use `animation-delay: calc(var(--index) * 50ms)`
**When to use:** List pages (matches, opportunities) with up to 8-10 visible items
**Source:** tw-animate-css documentation, CSS Tricks staggered animation patterns

```tsx
// AnimatedCard component
interface AnimatedCardProps {
  index: number
  children: React.ReactNode
  className?: string
}

export function AnimatedCard({
  index,
  children,
  className,
}: AnimatedCardProps) {
  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards',
        className,
      )}
      style={{
        animationDelay: `${Math.min(index, 9) * 50}ms`, // Cap at 10 items (450ms max delay)
      }}
    >
      {children}
    </div>
  )
}
```

### Pattern 2: Card Hover with Lift and Shadow Transition

**What:** On hover, card lifts slightly (translateY) and shadow intensifies
**When to use:** All interactive cards
**Source:** Phase 17 design tokens (--shadow-warm-\*, --ease-gentle)

```tsx
// Add to Card component or as variant
<Card
  className="
  transition-all duration-200 ease-gentle
  hover:-translate-y-0.5
  hover:shadow-warm-md
  active:translate-y-0
  active:shadow-warm-sm
"
/>
```

### Pattern 3: View Transitions via TanStack Router

**What:** Enable native View Transitions API through router configuration
**When to use:** Navigation between list and detail pages
**Source:** TanStack Router docs, View Transitions example

```tsx
// In router configuration (router.tsx or entry)
const router = createRouter({
  routeTree,
  defaultViewTransition: true,
  // OR with direction awareness:
  // defaultViewTransition: {
  //   types: ({ fromLocation, toLocation }) => {
  //     // Determine transition direction based on route depth
  //     const fromDepth = fromLocation?.pathname.split('/').length ?? 0;
  //     const toDepth = toLocation.pathname.split('/').length;
  //     return toDepth > fromDepth ? ['slide-forward'] : ['slide-back'];
  //   }
  // }
})
```

CSS for view transitions:

```css
/* Cross-fade (default fallback) */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
  animation-timing-function: var(--ease-gentle);
}

/* Slide transitions for forward/back */
@keyframes slide-from-right {
  from {
    transform: translateX(10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-to-left {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-10px);
    opacity: 0;
  }
}

html[data-view-transition-types~='slide-forward']::view-transition-new(root) {
  animation: slide-from-right 200ms var(--ease-gentle);
}

html[data-view-transition-types~='slide-forward']::view-transition-old(root) {
  animation: slide-to-left 200ms var(--ease-gentle);
}
```

### Pattern 4: Button Press "Squish" Feedback

**What:** Button scales down slightly on press, returns on release
**When to use:** All buttons with default/primary/secondary variants
**Source:** Common UI pattern, uses transform: scale for GPU acceleration

```tsx
// In button.tsx buttonVariants
const buttonVariants = cva(
  '... transition-all duration-fast active:scale-[0.97] ...',
  // existing variants
)
```

### Anti-Patterns to Avoid

- **Animating layout properties:** Never animate width, height, margin, padding - use transform and opacity only (GPU accelerated)
- **Long stagger delays:** Cap stagger at 8-10 items max (400-500ms total), beyond that feels sluggish
- **Animation on every re-render:** Use `fill-mode-backwards` and ensure animations only play once on mount
- **Blocking interactions:** Keep all animations under 300ms for primary actions
- **Forgetting reduced motion:** Always respect `prefers-reduced-motion` (already in app.css)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem             | Don't Build                   | Use Instead                                                     | Why                                     |
| ------------------- | ----------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| Entrance animations | Custom keyframes              | tw-animate-css utilities (`animate-in fade-in slide-in-from-*`) | Already configured, Tailwind-native     |
| Stagger timing      | Complex useEffect/setTimeout  | CSS `animation-delay` with index                                | Browser handles timing, more performant |
| Page transitions    | React state-based transitions | View Transitions API + TanStack Router                          | Browser-native, hardware accelerated    |
| Easing curves       | Custom cubic-bezier values    | Phase 17 tokens (`--ease-spring`, `--ease-gentle`)              | Already defined and tested              |
| Shadow transitions  | Multiple shadow keyframes     | Tailwind transition + hover shadow class                        | Simpler, more maintainable              |

**Key insight:** CSS animations are more performant than JS-driven animations because they run on the compositor thread. The browser can optimize them better than any JS library.

## Common Pitfalls

### Pitfall 1: Animation Replay on Data Updates

**What goes wrong:** Entrance animations replay when React re-renders due to data changes
**Why it happens:** Key changes or component remounts trigger animation restart
**How to avoid:**

- Use stable keys (item IDs, not array indices)
- Apply animations to wrapper elements that don't re-render
- Use `fill-mode-forwards` to maintain end state
  **Warning signs:** Cards flash/bounce on polling updates, filter changes trigger full re-animation

### Pitfall 2: Stagger Delay Accumulation

**What goes wrong:** Very long stagger delays (e.g., 50 items \* 100ms = 5 seconds)
**Why it happens:** Linear calculation without cap
**How to avoid:** Cap stagger index at max visible items (8-10), use `Math.min(index, 9)`
**Warning signs:** Last items take seconds to appear, feels broken

### Pitfall 3: View Transition Flicker on Safari

**What goes wrong:** Flash of unstyled content during view transition
**Why it happens:** Safari's implementation timing differs slightly
**How to avoid:** Keep transition duration short (200-250ms), ensure fallback crossfade works
**Warning signs:** White flash between pages on iOS Safari

### Pitfall 4: Blocking User Input During Animations

**What goes wrong:** User clicks during animation don't register
**Why it happens:** Overlay or transform affecting pointer events
**How to avoid:** Never use `pointer-events: none` during transitions, keep animations short
**Warning signs:** Double-clicking needed, users report "unresponsive" buttons

### Pitfall 5: Reduced Motion Violations

**What goes wrong:** Animations play for users who requested reduced motion
**Why it happens:** Forgetting to check prefers-reduced-motion
**How to avoid:** Already handled in app.css - verify new animations respect this
**Warning signs:** Accessibility complaints, vestibular disorder triggers

## Code Examples

Verified patterns from official sources and project analysis:

### Staggered List with AnimatedCard (tw-animate-css)

```tsx
// Source: tw-animate-css docs + existing opportunity-list.tsx pattern
function StaggeredList({ items }: { items: Item[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards"
          style={{ animationDelay: `${Math.min(index, 9) * 50}ms` }}
        >
          <ItemCard item={item} />
        </div>
      ))}
    </div>
  )
}
```

### Card Hover Effect (Using Phase 17 Tokens)

```tsx
// Source: Phase 17 design tokens in app.css
<Card
  className="
  transition-all
  duration-[var(--duration-normal)]
  ease-[var(--ease-gentle)]
  shadow-warm
  hover:shadow-warm-md
  hover:-translate-y-0.5
  active:translate-y-0
  active:shadow-warm-sm
"
/>
```

### Button with Press Feedback

```tsx
// Source: Common pattern, confirmed with button.tsx structure
const buttonVariants = cva(
  `inline-flex items-center justify-center
   transition-all duration-[var(--duration-fast)]
   active:scale-[var(--scale-press)]
   disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      /* existing */
    },
  },
)
```

### TanStack Router Link with View Transition

```tsx
// Source: TanStack Router docs
<Link
  to="/matches/$id"
  params={{ id: match._id }}
  viewTransition // Enable View Transitions API for this navigation
>
  View Details
</Link>
```

### View Transition CSS (Cross-fade Default)

```css
/* Source: Chrome Developers blog, MDN View Transitions docs */
/* Add to app.css */

/* Default crossfade for all page transitions */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: var(--duration-normal);
  animation-timing-function: var(--ease-gentle);
}

/* Reduce motion: instant swap, no animation */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none !important;
  }
}
```

## State of the Art

| Old Approach                                 | Current Approach                      | When Changed | Impact                              |
| -------------------------------------------- | ------------------------------------- | ------------ | ----------------------------------- |
| JS animation libraries (GSAP, Framer Motion) | CSS animations + View Transitions API | 2024-2025    | Smaller bundles, better performance |
| React Transition Group                       | View Transitions API                  | 2024-2025    | Browser-native, less code           |
| Custom page transition hooks                 | TanStack Router viewTransition        | 2024         | Built into router, zero config      |
| Intersection Observer for entrance           | CSS animation with initial opacity 0  | Always       | Simpler, no JS needed               |

**Deprecated/outdated:**

- React 19 `unstable_ViewTransition`: Still experimental, use browser API directly
- Framer Motion for simple animations: Overkill, CSS is sufficient
- `animate.css` library: tw-animate-css is Tailwind-native alternative

## Open Questions

Things that couldn't be fully resolved:

1. **Shared Element Transitions (Card to Detail Morphing)**
   - What we know: View Transitions API supports `view-transition-name` for shared elements
   - What's unclear: TanStack Router doesn't have built-in shared element state management
   - Recommendation: Start with crossfade transitions, add shared element as enhancement if time permits. The CONTEXT.md mentions this as a "nice to have" with crossfade as fallback.

2. **Animation Replay Prevention on Filter/Sort Changes**
   - What we know: React keys can cause re-animation
   - What's unclear: Exact implementation without testing
   - Recommendation: Use stable IDs for keys, test with real data during implementation

## Sources

### Primary (HIGH confidence)

- tw-animate-css documentation (already in project, verified utilities)
- TanStack Router v1.132 docs - View Transitions example and API
- MDN View Transitions API documentation (Dec 2025)
- Phase 17 app.css tokens (verified in codebase)

### Secondary (MEDIUM confidence)

- Chrome Developers blog "What's new in view transitions (2025 update)" - Oct 2025
- Can I Use View Transitions (90%+ support, Baseline Newly available Oct 2025)

### Tertiary (LOW confidence)

- GitHub discussions on TanStack Router page transitions with Framer Motion (alternative approach, not recommended)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All tools already in project, verified
- Architecture patterns: HIGH - Based on existing code patterns and official docs
- Pitfalls: MEDIUM - Based on common issues, some project-specific testing needed

**Research date:** 2026-01-19
**Valid until:** 2026-03-19 (60 days - stable browser APIs, no rapid changes expected)
