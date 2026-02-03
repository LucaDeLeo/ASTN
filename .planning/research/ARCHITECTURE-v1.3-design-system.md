# Architecture Patterns: Design System for Visual Overhaul

**Project:** ASTN v1.3 Visual Overhaul
**Researched:** 2026-01-19
**Focus:** React 19 + Tailwind v4 + shadcn/ui design system architecture

---

## Executive Summary

This document defines the architecture for systematically overhauling ASTN's visual design. The approach leverages Tailwind v4's CSS-first configuration with the `@theme` directive, extends shadcn/ui components through composition, and establishes a layered CSS architecture for design tokens, typography, and animation utilities.

**Key architectural decisions:**

1. **Tokens via `@theme` directive** - Not a separate tokens file, but inline in `app.css`
2. **Fonts via Fontsource** - Self-hosted variable fonts with preload strategy
3. **Animations via CSS keyframes** - Extended in `@theme`, supplemented by tw-animate-css
4. **Component variants via CVA** - Extend existing shadcn patterns, not replace them
5. **Layered CSS** - `@layer theme, base, components, utilities` for specificity control

---

## Recommended Architecture

### File Structure

```
src/
├── styles/
│   ├── app.css                 # Main entry - imports + @theme + @layer base
│   ├── tokens/
│   │   ├── colors.css          # Color palette definitions (imported into app.css)
│   │   ├── typography.css      # Font definitions + scales
│   │   ├── spacing.css         # Custom spacing scale (if needed)
│   │   └── animations.css      # Keyframes + animation utilities
│   └── fonts/
│       └── index.css           # @font-face declarations
│
├── components/
│   ├── ui/                     # shadcn/ui primitives (keep as-is)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── design/                 # NEW: Extended design components
│       ├── animated-card.tsx   # Card with entrance animations
│       ├── gradient-bg.tsx     # Reusable background patterns
│       ├── page-transition.tsx # View transition wrapper
│       └── typography.tsx      # Heading, Text, Display components
│
├── lib/
│   ├── utils.ts                # cn() utility (existing)
│   └── design/
│       └── variants.ts         # Shared CVA variant definitions
│
└── routes/
    └── __root.tsx              # Font preload links added here
```

### CSS Architecture Layers

```css
/* src/styles/app.css */

/* 1. Framework import - Tailwind v4 */
@import 'tailwindcss';

/* 2. Third-party animation utilities */
@import 'tw-animate-css';

/* 3. Font definitions (self-hosted via Fontsource) */
@import './fonts/index.css';

/* 4. Design tokens organized by concern */
@import './tokens/colors.css';
@import './tokens/typography.css';
@import './tokens/animations.css';

/* 5. Dark mode variant */
@custom-variant dark (&:is(.dark *));

/* 6. Theme extension - registers tokens with Tailwind */
@theme inline {
  /* Pulled from tokens files via CSS custom properties */
  --font-display: var(--font-family-display);
  --font-body: var(--font-family-body);
  --font-mono: var(--font-family-mono);

  /* Animation timing functions */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);

  /* Animation durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* Radius (existing, keep) */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  /* ... existing radius tokens ... */

  /* Color mappings (existing, keep) */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... existing color tokens ... */
}

/* 7. Base layer - global defaults */
@layer base {
  html {
    /* Prevent FOUT with font-display: swap in @font-face */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-background text-foreground font-body;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

/* 8. Component layer - reusable patterns */
@layer components {
  /* Card entrance animation class */
  .animate-card-enter {
    animation: card-enter var(--duration-normal) var(--ease-out-expo) backwards;
  }

  /* Staggered delay utilities */
  .stagger-1 {
    animation-delay: 50ms;
  }
  .stagger-2 {
    animation-delay: 100ms;
  }
  .stagger-3 {
    animation-delay: 150ms;
  }
  .stagger-4 {
    animation-delay: 200ms;
  }
  .stagger-5 {
    animation-delay: 250ms;
  }
}
```

---

## Component Styling Approach

### Strategy: Extend shadcn, Don't Replace

The existing shadcn/ui components use Class Variance Authority (CVA). The architecture **extends** these patterns rather than replacing them.

**Rationale:**

- shadcn components are ejected into the codebase - they're our code to modify
- CVA provides type-safe variant definitions
- Tailwind classes compose well with existing patterns
- No additional runtime cost

### Pattern: Composition Over Modification

```tsx
// WRONG: Modifying shadcn button directly
// This creates maintenance burden on shadcn updates

// RIGHT: Compose a design-enhanced wrapper
// src/components/design/animated-button.tsx
import { Button, buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  entrance?: 'fade' | 'scale' | 'slide'
}

export function AnimatedButton({
  className,
  entrance = 'fade',
  ...props
}: AnimatedButtonProps) {
  return (
    <Button
      className={cn(
        // Add animation classes while preserving original styling
        entrance === 'fade' && 'animate-fade-in',
        entrance === 'scale' && 'animate-scale-in',
        entrance === 'slide' && 'animate-slide-up',
        className,
      )}
      {...props}
    />
  )
}
```

### Pattern: Card with Hover and Entrance

```tsx
// src/components/design/animated-card.tsx
import { Card } from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  index?: number // For stagger calculation
  interactive?: boolean
}

export function AnimatedCard({
  className,
  index = 0,
  interactive = true,
  ...props
}: AnimatedCardProps) {
  return (
    <Card
      className={cn(
        // Entrance animation with stagger
        'animate-card-enter',
        // Hover effects (only if interactive)
        interactive && [
          'transition-all duration-200',
          'hover:-translate-y-0.5',
          'hover:shadow-lg',
          'hover:shadow-primary/5',
        ],
        className,
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      {...props}
    />
  )
}
```

### Pattern: Typography Components

```tsx
// src/components/design/typography.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const headingVariants = cva('font-display tracking-tight text-foreground', {
  variants: {
    size: {
      h1: 'text-4xl font-bold leading-tight md:text-5xl',
      h2: 'text-3xl font-semibold leading-snug md:text-4xl',
      h3: 'text-2xl font-semibold leading-snug',
      h4: 'text-xl font-medium',
    },
  },
  defaultVariants: {
    size: 'h2',
  },
})

interface HeadingProps
  extends
    React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function Heading({
  className,
  size,
  as: Tag = 'h2',
  ...props
}: HeadingProps) {
  return <Tag className={cn(headingVariants({ size }), className)} {...props} />
}

const textVariants = cva('font-body text-foreground', {
  variants: {
    size: {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
    },
    muted: {
      true: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'base',
  },
})

export function Text({
  className,
  size,
  muted,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof textVariants>) {
  return (
    <p className={cn(textVariants({ size, muted }), className)} {...props} />
  )
}
```

---

## Font Loading Strategy

### Approach: Fontsource + Preload

**Why Fontsource:**

- Self-hosted fonts (no external requests to Google)
- Tree-shakeable - only include weights you use
- Variable font support
- Works with Vite's static asset handling

**Why Preload:**

- Critical fonts load before render
- Eliminates FOUT (Flash of Unstyled Text)
- Works with TanStack Start's head management

### Implementation

```bash
# Install font packages
bun add @fontsource-variable/dm-sans @fontsource/dm-mono
```

```css
/* src/styles/fonts/index.css */

/* Variable font for body - single file, all weights */
@font-face {
  font-family: 'DM Sans';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2')
    format('woff2-variations');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+2000-206F, U+2074,
    U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Monospace for display headings and code */
@font-face {
  font-family: 'DM Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2')
    format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+2000-206F, U+2074,
    U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'DM Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('@fontsource/dm-mono/files/dm-mono-latin-500-normal.woff2')
    format('woff2');
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+2000-206F, U+2074,
    U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

```css
/* src/styles/tokens/typography.css */

:root {
  /* Font families */
  --font-family-display: 'DM Mono', ui-monospace, monospace;
  --font-family-body: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  --font-family-mono: 'DM Mono', ui-monospace, monospace;

  /* Font sizes - fluid scale */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem);
  --text-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 3rem);
  --text-5xl: clamp(3rem, 2.25rem + 3.75vw, 4rem);
}
```

```tsx
// src/routes/__root.tsx - Add font preloads
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      /* existing */
    ],
    links: [
      // Font preloads - critical for preventing FOUT
      {
        rel: 'preload',
        href: '/fonts/dm-sans-latin-wght-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: '/fonts/dm-mono-latin-400-normal.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      // Existing links...
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  // ...
})
```

### Vite Configuration for Fonts

```ts
// vite.config.ts - Font asset handling
import { defineConfig } from 'vite'

export default defineConfig({
  // ... existing config
  assetsInclude: ['**/*.woff2', '**/*.woff'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Put fonts in /fonts/ directory
          if (/\.(woff2?|ttf|otf|eot)$/.test(assetInfo.name ?? '')) {
            return 'fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
```

---

## Animation Architecture

### Token-Based Animation System

```css
/* src/styles/tokens/animations.css */

:root {
  /* Easing functions */
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);

  /* Durations */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 700ms;
}

/* Keyframe definitions */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
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

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
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

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Page transition keyframes */
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes page-exit {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}

/* Utility classes - registered via @layer components in app.css */
```

### Animation Utilities in Tailwind Theme

```css
/* In app.css @theme inline block */
@theme inline {
  /* ... existing tokens ... */

  /* Animation utilities - makes these available as Tailwind classes */
  --animate-fade-in: fade-in var(--duration-normal) var(--ease-out) forwards;
  --animate-fade-out: fade-out var(--duration-fast) var(--ease-in) forwards;
  --animate-slide-up: slide-up var(--duration-normal) var(--ease-out-expo)
    forwards;
  --animate-slide-down: slide-down var(--duration-normal) var(--ease-out-expo)
    forwards;
  --animate-scale-in: scale-in var(--duration-normal) var(--ease-spring)
    forwards;
  --animate-card-enter: card-enter var(--duration-slow) var(--ease-out-expo)
    backwards;
  --animate-page-enter: page-enter var(--duration-normal) var(--ease-out)
    forwards;
}
```

### tw-animate-css Integration

The project already includes `tw-animate-css`. This provides:

- `animate-in` / `animate-out` utilities
- `fade-in` / `fade-out` modifiers
- `slide-in-from-*` / `slide-out-to-*` directional animations
- Duration and delay modifiers

```tsx
// Usage example with tw-animate-css
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
  Content
</div>
```

**Recommendation:** Use tw-animate-css for simple cases, custom keyframes for complex orchestration.

---

## Background/Atmosphere System

### Reusable Background Components

```tsx
// src/components/design/gradient-bg.tsx
import { cn } from '~/lib/utils'

interface GradientBgProps {
  variant?: 'default' | 'warm' | 'cool' | 'subtle'
  noise?: boolean
  className?: string
  children: React.ReactNode
}

export function GradientBg({
  variant = 'default',
  noise = true,
  className,
  children,
}: GradientBgProps) {
  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Background layer */}
      <div
        className={cn(
          'absolute inset-0 -z-10',
          variant === 'default' &&
            'bg-gradient-to-b from-background via-background to-muted/30',
          variant === 'warm' &&
            'bg-[radial-gradient(ellipse_at_top,oklch(0.98_0.02_30),oklch(0.96_0.01_30)_70%,oklch(0.94_0.02_30))]',
          variant === 'cool' &&
            'bg-[radial-gradient(ellipse_at_top,oklch(0.98_0.01_240),oklch(0.96_0.005_240)_70%)]',
          variant === 'subtle' && 'bg-gray-50 dark:bg-gray-950',
        )}
      />

      {/* Noise texture layer */}
      {noise && (
        <div
          className="absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Content */}
      {children}
    </div>
  )
}
```

### Background Tokens

```css
/* src/styles/tokens/colors.css */

:root {
  /* ... existing color tokens ... */

  /* Background gradients as custom properties */
  --gradient-warm: radial-gradient(
    ellipse at center,
    oklch(0.98 0 0) 0%,
    oklch(0.96 0.02 30) 70%,
    oklch(0.94 0.04 30) 100%
  );

  --gradient-subtle: linear-gradient(
    to bottom,
    var(--background),
    oklch(0.97 0.01 30)
  );

  --gradient-cool: radial-gradient(
    ellipse at top,
    oklch(0.98 0.01 240),
    oklch(0.96 0.005 240) 70%
  );
}

.dark {
  --gradient-warm: radial-gradient(
    ellipse at center,
    oklch(0.15 0 0) 0%,
    oklch(0.12 0.02 30) 70%,
    oklch(0.1 0.03 30) 100%
  );

  --gradient-subtle: linear-gradient(
    to bottom,
    var(--background),
    oklch(0.12 0.01 30)
  );
}
```

---

## Build Order (Dependencies)

### Phase Execution Order

```
Phase 1: Foundation (tokens + fonts)
├── 1.1 Create tokens/colors.css (independent)
├── 1.2 Create tokens/typography.css (independent)
├── 1.3 Create tokens/animations.css (independent)
└── 1.4 Set up fonts/index.css + Fontsource packages
    └── Depends on: 1.2 (typography tokens reference fonts)

Phase 2: CSS Architecture
├── 2.1 Refactor app.css with imports + @theme
│   └── Depends on: Phase 1 (all token files)
├── 2.2 Update __root.tsx with font preloads
│   └── Depends on: 1.4 (fonts set up)
└── 2.3 Update vite.config.ts for font asset handling
    └── Depends on: 1.4 (fonts set up)

Phase 3: Design Components
├── 3.1 Create components/design/typography.tsx
│   └── Depends on: 2.1 (CSS with font tokens)
├── 3.2 Create components/design/animated-card.tsx
│   └── Depends on: 2.1 (CSS with animation tokens)
├── 3.3 Create components/design/gradient-bg.tsx
│   └── Depends on: 2.1 (CSS with gradient tokens)
└── 3.4 Create lib/design/variants.ts
    └── Depends on: 3.1-3.3 (shared patterns identified)

Phase 4: Page Updates
├── 4.1 Update page backgrounds (use GradientBg)
│   └── Depends on: 3.3
├── 4.2 Update typography across pages
│   └── Depends on: 3.1
├── 4.3 Add card animations to list pages
│   └── Depends on: 3.2
└── 4.4 Add hover effects to interactive elements
    └── Depends on: 2.1 (animation tokens)
```

### Dependency Graph

```
                    ┌─────────────────────────────────────────┐
                    │           Phase 1: Tokens               │
                    │  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
                    │  │ colors  │ │  typo   │ │ animations│  │
                    │  └────┬────┘ └────┬────┘ └─────┬─────┘  │
                    │       │           │            │         │
                    │       │     ┌─────┴────┐       │         │
                    │       │     │  fonts   │       │         │
                    │       │     └─────┬────┘       │         │
                    └───────┼───────────┼────────────┼─────────┘
                            │           │            │
                            └─────────┬─┴────────────┘
                                      │
                    ┌─────────────────┼─────────────────────────┐
                    │    Phase 2: CSS Architecture              │
                    │                 │                         │
                    │        ┌────────┴────────┐                │
                    │        │    app.css      │                │
                    │        │   refactored    │                │
                    │        └───────┬─────────┘                │
                    │                │                          │
                    │    ┌───────────┼───────────┐              │
                    │    │           │           │              │
                    │  ┌─┴────┐  ┌───┴───┐  ┌────┴────┐         │
                    │  │__root│  │ vite  │  │ (ready) │         │
                    │  │preload│  │config │  │         │         │
                    │  └──────┘  └───────┘  └─────────┘         │
                    └───────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────────────┐
                    │    Phase 3: Design Components             │
                    │                 │                         │
                    │    ┌────────────┼────────────┐            │
                    │    │            │            │            │
                    │  ┌─┴──────┐ ┌───┴────┐ ┌─────┴───┐        │
                    │  │ typo   │ │animated│ │gradient │        │
                    │  │ .tsx   │ │card.tsx│ │ bg.tsx  │        │
                    │  └────────┘ └────────┘ └─────────┘        │
                    └───────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────────────┐
                    │    Phase 4: Page Updates                  │
                    │         (can parallelize)                 │
                    │                 │                         │
                    │    ┌───┬───┬───┴───┬───┐                  │
                    │    │   │   │       │   │                  │
                    │   BG  Typo Cards Hover  ...               │
                    └───────────────────────────────────────────┘
```

---

## Patterns to Follow

### Pattern 1: Token-First Design

**What:** Define design values as CSS custom properties first, then reference in components.

**When:** Any visual property that should be consistent across the app.

**Example:**

```css
/* Define once in tokens */
:root {
  --shadow-card-hover: 0 8px 30px oklch(0.7 0.08 30 / 0.15);
}

/* Use in components */
.card-interactive:hover {
  box-shadow: var(--shadow-card-hover);
}
```

### Pattern 2: Progressive Enhancement for Animations

**What:** Build animations that gracefully degrade.

**When:** All animations.

**Example:**

```css
.animate-card-enter {
  /* Static fallback - visible immediately */
  opacity: 1;
  transform: none;

  /* Enhanced experience with animation */
  animation: card-enter var(--duration-slow) var(--ease-out-expo) backwards;
}

@media (prefers-reduced-motion: reduce) {
  .animate-card-enter {
    animation: none;
  }
}
```

### Pattern 3: Composition for Variants

**What:** Use CVA for type-safe variant combinations, compose at the component level.

**When:** Any component with multiple visual variations.

**Example:**

```tsx
const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      interactive: {
        true: 'transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer',
        false: '',
      },
      elevated: {
        true: 'shadow-md',
        false: '',
      },
    },
    defaultVariants: {
      interactive: false,
      elevated: false,
    },
  },
)
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Inline Animation Styles

**What goes wrong:** Animation values scattered across components, impossible to maintain consistency.

**Instead:** Define animations in tokens, apply via utility classes.

```tsx
// BAD
<div style={{ animation: 'fadeIn 0.3s ease-out' }}>

// GOOD
<div className="animate-fade-in">
```

### Anti-Pattern 2: Modifying shadcn Primitives Directly

**What goes wrong:** Creates merge conflicts when updating shadcn, loses the benefit of community maintenance.

**Instead:** Wrap or compose shadcn components.

```tsx
// BAD - editing src/components/ui/button.tsx directly for animations

// GOOD - create wrapper in src/components/design/
export function AnimatedButton(props) {
  return (
    <Button className={cn('animate-scale-in', props.className)} {...props} />
  )
}
```

### Anti-Pattern 3: Mixing Font Loading Methods

**What goes wrong:** Some fonts via Google CDN, some self-hosted, some inline. Inconsistent loading behavior and FOUT.

**Instead:** Single font loading strategy (Fontsource for all fonts).

### Anti-Pattern 4: Animation Without Reduced Motion Support

**What goes wrong:** Users with vestibular disorders experience discomfort.

**Instead:** Always include `@media (prefers-reduced-motion: reduce)` overrides.

---

## Scalability Considerations

| Concern            | At Current Scale         | At 100+ Pages                   | At Design System Library |
| ------------------ | ------------------------ | ------------------------------- | ------------------------ |
| Token organization | Single files per concern | Split by feature area           | Package per domain       |
| Font loading       | Preload critical fonts   | Dynamic font subsetting         | Font CDN with fallbacks  |
| Animation          | CSS keyframes            | Consider Motion library         | Shared animation configs |
| Component variants | CVA in components        | Extract to shared variants file | Design token package     |

---

## Sources

### HIGH Confidence (Official Documentation)

- Tailwind v4 `@theme` directive: tailwindcss.com/docs/functions-and-directives
- shadcn/ui Tailwind v4 migration: ui.shadcn.com/docs/tailwind-v4
- Fontsource documentation: fontsource.org/docs/getting-started
- TanStack Start head management: tanstack.com/start/latest/docs/api/router/head

### MEDIUM Confidence (Verified Community Patterns)

- CVA (Class Variance Authority): cva.style/docs
- tw-animate-css utilities: github.com/jamiebuilds/tailwindcss-animate
- Font preload strategies: web.dev/preload-critical-assets

### Project-Specific

- ASTN Visual Design Assessment: `.planning/VISUAL_DESIGN_ASSESSMENT.md`
- Existing CSS architecture: `src/styles/app.css`
- shadcn configuration: `components.json`
