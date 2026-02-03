# Phase 17: Foundation & Tokens - Research

**Researched:** 2026-01-19
**Domain:** Design system foundation - tokens, fonts, CSS architecture
**Confidence:** HIGH

## Summary

This phase establishes the design system foundation that all visual phases depend on. The research covers Tailwind v4 token architecture, font loading strategies, fluid typography, and animation tokens.

The codebase already has a Tailwind v4 setup with `@theme inline` directive and OKLCH color tokens in `src/styles/app.css`. The current implementation uses the shadcn/ui pattern with CSS custom properties mapped to Tailwind utilities. The foundation is solid but needs extension for the visual overhaul.

**Primary recommendation:** Extend the existing `@theme inline` block with additional tokens (typography, animation, warm color palette) while maintaining the current shadcn/ui compatibility layer. Self-host variable fonts (Plus Jakarta Sans, Lora) with preloading in `__root.tsx`.

## Current State Analysis

### Existing CSS Architecture

**Location:** `src/styles/app.css` (180 lines)

**Current Structure:**

```
@import 'tailwindcss';
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

@layer base { ... }
@theme inline { ... }
:root { ... }
.dark { ... }
@layer base { ... }
@keyframes (custom animations)
```

**Key Findings:**

1. **Already using Tailwind v4** with `@theme inline` directive
2. **OKLCH color format** already in use (e.g., `oklch(0.70 0.16 30)`)
3. **Coral/salmon primary** already defined: `--primary: oklch(0.70 0.16 30)`
4. **Radius tokens** use calc-based approach: `--radius-sm: calc(var(--radius) - 4px)`
5. **Three custom animations** exist: `shake`, `reveal`, `pulse-processing`
6. **tw-animate-css** plugin installed for animation utilities
7. **No custom fonts** - uses system defaults currently
8. **No typography scale** - font sizes are ad-hoc in components

### Root Component (`__root.tsx`)

**Current head setup:**

- Stylesheet link to `appCss`
- Leaflet CSS (external CDN)
- Favicon links
- No font preloading

**Opportunity:** Add font preload links in the `head()` function.

### Current Color Tokens (Light Mode)

| Token          | Value                 | Notes        |
| -------------- | --------------------- | ------------ |
| `--background` | `oklch(1 0 0)`        | Pure white   |
| `--foreground` | `oklch(0.145 0 0)`    | Near black   |
| `--primary`    | `oklch(0.70 0.16 30)` | Coral/salmon |
| `--muted`      | `oklch(0.97 0 0)`     | Light gray   |
| `--border`     | `oklch(0.922 0 0)`    | Border gray  |

**Gap:** No warm off-white/cream backgrounds, no extended warm neutral palette.

## Tailwind v4 Token Architecture

### How @theme Works (HIGH confidence)

The `@theme` directive in Tailwind v4 defines CSS custom properties that become Tailwind utilities.

**Key patterns from official docs:**

```css
@theme {
  /* Creates font-[display] utility */
  --font-display: "Satoshi", "sans-serif";

  /* Creates color-[avocado-500] utility */
  --color-avocado-500: oklch(0.84 0.18 117.33);

  /* Creates ease-[fluid] utility */
  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);

  /* Animations with keyframes inside @theme */
  --animate-fade-in-scale: fade-in-scale 0.3s ease-out;
  @keyframes fade-in-scale { ... }
}
```

**Naming conventions that generate utilities:**

| Prefix        | Generates                  | Example                                  |
| ------------- | -------------------------- | ---------------------------------------- |
| `--font-*`    | `font-[name]`              | `--font-display` -> `font-display`       |
| `--color-*`   | `bg-[name]`, `text-[name]` | `--color-coral-500` -> `bg-coral-500`    |
| `--ease-*`    | `ease-[name]`              | `--ease-spring` -> `ease-spring`         |
| `--animate-*` | `animate-[name]`           | `--animate-fade-in` -> `animate-fade-in` |
| `--text-*`    | `text-[name]`              | `--text-lg` -> `text-lg` (for fluid)     |

### @theme vs @theme inline

- **`@theme`**: Standalone, replaces defaults
- **`@theme inline`**: Merges with existing theme (what we have)

Current codebase uses `@theme inline` which is correct for extending shadcn/ui tokens.

### Token Organization Pattern

**Recommended layered approach:**

```css
/* Layer 1: Primitive tokens in :root */
:root {
  --coral-50: oklch(0.98 0.02 30);
  --coral-500: oklch(0.7 0.16 30);
  /* ... */
}

/* Layer 2: Semantic tokens map to primitives */
@theme inline {
  --color-accent: var(--coral-500);
  --color-background-warm: var(--cream-50);
}
```

This matches the CONTEXT.md decision: "Hybrid - raw scales as primitives, semantic tokens built on top."

## Font Loading Strategy

### Standard Stack (HIGH confidence)

| Library                                  | Version | Purpose           | Why Standard                                |
| ---------------------------------------- | ------- | ----------------- | ------------------------------------------- |
| `@fontsource-variable/plus-jakarta-sans` | latest  | Display/body font | Self-hosted variable fonts, preload support |
| `@fontsource-variable/lora`              | latest  | Accent serif font | Variable weight support for headings        |

**Installation:**

```bash
bun add @fontsource-variable/plus-jakarta-sans @fontsource-variable/lora
```

### Font Loading Pattern for Vite/React

**Step 1: Import in CSS**

```css
/* src/styles/app.css */
@import '@fontsource-variable/plus-jakarta-sans';
@import '@fontsource-variable/lora';
```

**Step 2: Preload in \_\_root.tsx**

```tsx
import plusJakartaWoff2 from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url';
import loraWoff2 from '@fontsource-variable/lora/files/lora-latin-wght-normal.woff2?url';

head: () => ({
  links: [
    // Preload fonts for FOIT/FOUT prevention
    { rel: 'preload', href: plusJakartaWoff2, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    { rel: 'preload', href: loraWoff2, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    // ... existing links
  ],
}),
```

**Step 3: Define font-family in @theme**

```css
@theme inline {
  --font-display: 'Lora Variable', Georgia, serif;
  --font-body: 'Plus Jakarta Sans Variable', system-ui, sans-serif;
}
```

### FOIT/FOUT Prevention

| Strategy           | Implementation                                |
| ------------------ | --------------------------------------------- |
| Preload            | `<link rel="preload" as="font">` in head      |
| font-display: swap | Built into Fontsource CSS                     |
| Variable fonts     | Single file for all weights (smaller payload) |
| Self-hosted        | No external network requests                  |

### Why Fontsource (HIGH confidence)

1. **Self-hosted**: No Google Fonts dependency, GDPR compliant
2. **Variable font support**: `@fontsource-variable/*` packages
3. **Preload helpers**: Exposes `.woff2?url` for Vite imports
4. **CSS included**: `font-display: swap` already configured
5. **Tree-shakeable**: Only import what you need

## Fluid Typography Approach

### Clamp Pattern (HIGH confidence)

Modern fluid typography uses CSS `clamp()` with this formula:

```css
font-size: clamp(MIN, PREFERRED, MAX);

/* Example: 1.5rem minimum, scales with viewport, 3rem maximum */
h1 {
  font-size: clamp(1.5rem, 1rem + 2vw, 3rem);
}
```

### Recommended Typographic Scale

Based on CONTEXT.md decisions: "Clear hierarchy - obvious jumps between levels"

| Token         | Min (mobile) | Max (desktop) | CSS clamp()                                 |
| ------------- | ------------ | ------------- | ------------------------------------------- |
| `--text-xs`   | 0.75rem      | 0.875rem      | `clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)` |
| `--text-sm`   | 0.875rem     | 1rem          | `clamp(0.875rem, 0.8rem + 0.3vw, 1rem)`     |
| `--text-base` | 1rem         | 1.125rem      | `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)`   |
| `--text-lg`   | 1.125rem     | 1.25rem       | `clamp(1.125rem, 1rem + 0.5vw, 1.25rem)`    |
| `--text-xl`   | 1.25rem      | 1.5rem        | `clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)`   |
| `--text-2xl`  | 1.5rem       | 2rem          | `clamp(1.5rem, 1.2rem + 1.25vw, 2rem)`      |
| `--text-3xl`  | 1.875rem     | 2.5rem        | `clamp(1.875rem, 1.4rem + 1.9vw, 2.5rem)`   |
| `--text-4xl`  | 2.25rem      | 3.5rem        | `clamp(2.25rem, 1.5rem + 3vw, 3.5rem)`      |
| `--text-5xl`  | 3rem         | 4.5rem        | `clamp(3rem, 2rem + 4vw, 4.5rem)`           |

### Implementation in @theme

```css
@theme inline {
  /* Fluid typography tokens */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  /* ... */
}
```

### Line Height Tokens

Per CONTEXT.md: "Balanced - comfortable reading with 1.5-1.6 line-height"

| Use Case    | Line Height |
| ----------- | ----------- |
| Headings    | 1.2 - 1.3   |
| Body text   | 1.5 - 1.6   |
| UI elements | 1.25        |

## Animation Token Patterns

### Easing Functions (HIGH confidence)

Per CONTEXT.md: "Custom spring - slight overshoot and settle, organic with a playful edge"

**Standard easing variables:**

```css
:root {
  /* Standard easings */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.55, 0.055, 0.675, 0.19);
  --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
  --ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);

  /* Spring easing (organic settle) */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Gentle (slightly slower) */
  --ease-gentle: cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

**Spring easing recommendation:** `cubic-bezier(0.34, 1.56, 0.64, 1)` provides slight overshoot without being bouncy.

### Duration Tokens

Per CONTEXT.md: "200-400ms - slightly leisurely, lets you appreciate the movement"

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-slower: 600ms;
}
```

### Animation Keyframes

Define reusable keyframes in @theme:

```css
@theme inline {
  /* Entrance animations */
  --animate-fade-in: fade-in 250ms var(--ease-out) forwards;
  --animate-slide-up: slide-up 300ms var(--ease-spring) forwards;
  --animate-scale-in: scale-in 200ms var(--ease-spring) forwards;

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
}
```

### Reduced Motion Support (CRITICAL)

Per CONTEXT.md: "Simplified - fade only, no movement, still has some polish"

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    /* Keep opacity transitions for visual feedback */
  }
}

/* OR more granular approach */
@media (prefers-reduced-motion: reduce) {
  .animate-slide-up {
    animation: fade-in 150ms var(--ease-out) forwards;
  }
}
```

### Hover/Press Effects

Per CONTEXT.md: "Button press: Both scale (0.97-0.98 shrink) and shadow reduction"

```css
/* Add to @theme */
--scale-press: 0.97;
--shadow-hover: 0 8px 30px oklch(0.7 0.08 30 / 0.15);
--shadow-press: 0 4px 15px oklch(0.7 0.06 30 / 0.1);
```

## Standard Stack

### Core Dependencies

| Library                                  | Version | Purpose             | Why Standard               |
| ---------------------------------------- | ------- | ------------------- | -------------------------- |
| `tailwindcss`                            | ^4.1.13 | CSS framework       | Already installed          |
| `@tailwindcss/vite`                      | ^4.1.13 | Vite integration    | Already installed          |
| `tw-animate-css`                         | ^1.4.0  | Animation utilities | Already installed          |
| `@fontsource-variable/plus-jakarta-sans` | latest  | Display font        | Self-hosted variable fonts |
| `@fontsource-variable/lora`              | latest  | Serif accent font   | Self-hosted variable fonts |

**Installation (fonts only):**

```bash
bun add @fontsource-variable/plus-jakarta-sans @fontsource-variable/lora
```

### Supporting (Already Present)

| Library                    | Purpose                   |
| -------------------------- | ------------------------- |
| `class-variance-authority` | Component variant styling |
| `clsx`                     | Conditional class names   |
| `tailwind-merge`           | Merge Tailwind classes    |

## Don't Hand-Roll

| Problem             | Don't Build                       | Use Instead                        | Why                                              |
| ------------------- | --------------------------------- | ---------------------------------- | ------------------------------------------------ |
| Font loading        | Custom @font-face + preload logic | Fontsource packages                | Handles unicode ranges, fallbacks, preload setup |
| Animation utilities | Custom animation classes          | tw-animate-css (already installed) | Comprehensive, tested, maintained                |
| Color manipulation  | Custom OKLCH calculations         | OKLCH in CSS directly              | Native browser support                           |
| Fluid typography    | Custom JS viewport calculations   | CSS clamp()                        | Pure CSS, no JS needed                           |

## Common Pitfalls

### Pitfall 1: Font Flash (FOIT/FOUT)

**What goes wrong:** Fonts load after page render, causing layout shift or invisible text
**Why it happens:** Fonts not preloaded, or loaded from slow CDN
**How to avoid:**

- Preload font files with `<link rel="preload">`
- Use `font-display: swap` (Fontsource default)
- Self-host fonts (no external network dependency)
  **Warning signs:** Flash of unstyled text, CLS warnings in Lighthouse

### Pitfall 2: Token Naming Collisions

**What goes wrong:** New tokens override shadcn/ui tokens unexpectedly
**Why it happens:** Using same names as existing semantic tokens
**How to avoid:**

- Keep primitive tokens (coral-500) separate from semantic tokens (primary)
- Use `@theme inline` to extend rather than replace
- Document which tokens are "owned" by shadcn/ui
  **Warning signs:** Component styles break after adding new tokens

### Pitfall 3: Fluid Typography Extremes

**What goes wrong:** Text too small on mobile or too large on desktop
**Why it happens:** clamp() formula not tested at viewport extremes
**How to avoid:**

- Set explicit min (first value) and max (third value)
- Test at 320px and 1920px viewports
- Use rem units for accessibility (respects user font size)
  **Warning signs:** Text unreadable on small phones, giant on ultrawide monitors

### Pitfall 4: Animation Performance

**What goes wrong:** Janky animations, high CPU usage
**Why it happens:** Animating expensive properties (width, height, margin)
**How to avoid:**

- Only animate `transform` and `opacity`
- Use `will-change` sparingly
- Test on low-end devices
  **Warning signs:** Dropped frames, battery drain complaints

### Pitfall 5: Reduced Motion Ignored

**What goes wrong:** Users with vestibular disorders experience motion sickness
**Why it happens:** No `@media (prefers-reduced-motion)` queries
**How to avoid:**

- Add reduced motion styles from the start
- Test with browser devtools motion simulation
- Provide fade-only fallbacks for all animations
  **Warning signs:** Accessibility audit failures, user complaints

## Code Examples

### Complete @theme Extension Pattern

```css
/* src/styles/app.css */
@import 'tailwindcss';
@import 'tw-animate-css';
@import '@fontsource-variable/plus-jakarta-sans';
@import '@fontsource-variable/lora';

@custom-variant dark (&:is(.dark *));

/* Primitive color tokens */
:root {
  /* Warm neutrals (cream paper palette) */
  --cream-50: oklch(0.99 0.01 90);
  --cream-100: oklch(0.98 0.015 85);
  --cream-200: oklch(0.96 0.02 80);

  /* Coral palette */
  --coral-50: oklch(0.98 0.02 30);
  --coral-100: oklch(0.95 0.04 30);
  --coral-200: oklch(0.9 0.08 30);
  --coral-300: oklch(0.85 0.12 30);
  --coral-400: oklch(0.78 0.14 30);
  --coral-500: oklch(0.7 0.16 30);
  --coral-600: oklch(0.6 0.14 30);
  --coral-700: oklch(0.5 0.12 30);

  /* Muted teal (complementary) */
  --teal-500: oklch(0.65 0.1 180);

  /* Semantic colors (warm-shifted) */
  --success: oklch(0.65 0.15 145); /* sage green */
  --warning: oklch(0.75 0.15 75); /* amber */
  --error: oklch(0.55 0.18 25); /* brick red */

  /* Animation tokens */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-gentle: cubic-bezier(0.25, 0.1, 0.25, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* Existing shadcn tokens... */
}

@theme inline {
  /* Typography */
  --font-display: 'Lora Variable', Georgia, serif;
  --font-body: 'Plus Jakarta Sans Variable', system-ui, sans-serif;

  /* Fluid type scale */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.2rem + 1.25vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.4rem + 1.9vw, 2.5rem);
  --text-4xl: clamp(2.25rem, 1.5rem + 3vw, 3.5rem);

  /* Extended colors */
  --color-cream-50: var(--cream-50);
  --color-cream-100: var(--cream-100);
  --color-cream-200: var(--cream-200);
  --color-coral-500: var(--coral-500);
  --color-teal-500: var(--teal-500);

  /* Easing utilities */
  --ease-spring: var(--ease-spring);
  --ease-gentle: var(--ease-gentle);

  /* Animation definitions */
  --animate-fade-in: fade-in 250ms var(--ease-gentle) forwards;
  --animate-slide-up: slide-up 300ms var(--ease-spring) forwards;
  --animate-scale-in: scale-in 200ms var(--ease-spring) forwards;

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Existing shadcn color mappings... */
}
```

### Font Preload in \_\_root.tsx

```tsx
import plusJakartaWoff2 from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2?url';
import loraWoff2 from '@fontsource-variable/lora/files/lora-latin-wght-normal.woff2?url';

export const Route = createRootRouteWithContext<{...}>()({
  head: () => ({
    links: [
      // Font preloads (before stylesheet)
      { rel: 'preload', href: plusJakartaWoff2, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'preload', href: loraWoff2, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      // Stylesheet
      { rel: 'stylesheet', href: appCss },
      // ... rest of links
    ],
  }),
  // ...
});
```

## Open Questions

1. **Stagger animation limit**: CONTEXT.md mentions stagger limit is Claude's discretion. Recommend 5-6 items before rest appears instantly to avoid tedious waits on long lists.

2. **Shadow warmth intensity**: CONTEXT.md leaves this to Claude's discretion. The login page already uses `oklch(0.70 0.08 30/0.15)` for shadows - recommend keeping chroma at 0.06-0.10 for subtle warmth.

3. **Spacing scale**: Standard Tailwind spacing is likely sufficient. If extended spacing needed, can add later without breaking changes.

## Sources

### Primary (HIGH confidence)

- Tailwind CSS v4 official docs (functions-and-directives, theme)
- shadcn/ui Tailwind v4 migration guide
- Fontsource documentation (preload, variable fonts)
- MDN (clamp(), prefers-reduced-motion)

### Secondary (MEDIUM confidence)

- Josh W. Comeau's spring animation article
- Smashing Magazine fluid typography guide

### Tertiary (LOW confidence)

- Various GitHub repos demonstrating patterns

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Fontsource is the de facto standard for self-hosted fonts
- Architecture: HIGH - @theme inline pattern is well-documented for shadcn/ui + Tailwind v4
- Pitfalls: HIGH - These are well-known issues with established solutions
- Fluid typography: HIGH - CSS clamp() is stable and widely supported

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain, mature technologies)
