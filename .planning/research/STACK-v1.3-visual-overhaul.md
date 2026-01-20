# Technology Stack: Visual Overhaul (v1.3)

**Project:** ASTN - AI Safety Talent Network
**Dimension:** Typography, Animation, Design Tokens
**Researched:** 2026-01-19
**Goal:** Transform from 3.7/10 generic shadcn to 8+/10 warm, memorable visual identity

---

## Executive Summary

For a "warm & human" aesthetic building on the existing coral palette, the stack needs:
1. **Humanist typography** that feels approachable, not cold/geometric
2. **Organic motion** via the Motion library (formerly Framer Motion)
3. **Design tokens** via Tailwind v4's native `@theme` directive (no JS config needed)

---

## Typography

### Recommendation: Plus Jakarta Sans + Lora

**Display/Headings:** Plus Jakarta Sans (Variable)
**Body Text:** Plus Jakarta Sans (Variable)
**Accent/Quotes:** Lora (Variable, optional serif touch)

| Font | Role | Why This Choice |
|------|------|-----------------|
| Plus Jakarta Sans | Primary (headings + body) | Geometric-humanist hybrid with rounded terminals. Designed for the Jakarta government brand, it conveys approachability while remaining professional. The subtle curves add warmth without sacrificing readability. Variable font supports weights 200-800. |
| Lora | Accent serif (optional) | Calligraphic roots with brushed curves create warmth. Pairs beautifully with humanist sans-serifs. Use for pull quotes, testimonials, or special emphasis. |

### Why Plus Jakarta Sans Over Alternatives

| Font | Verdict | Reason |
|------|---------|--------|
| Inter | AVOID | Ubiquitous, cold, optimized for density not warmth. The "default React app" font. |
| Space Grotesk | AVOID | Overused in AI/tech, becoming the new "generic modern" choice. |
| DM Sans | Good alternative | Similar warmth but less distinctive. Use if Jakarta feels too geometric. |
| Outfit | Good alternative | Rounder, more playful. Better for consumer apps than professional networks. |
| Satoshi | AVOID | Premium font (not free), would require licensing. |
| Sora | Good fallback | Geometric with legibility fixes. More technical feel than Jakarta. |

### Installation

```bash
bun add @fontsource-variable/plus-jakarta-sans @fontsource-variable/lora
```

### CSS Configuration

```tsx
/* In app entry point (e.g., main.tsx or routes/__root.tsx) */
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/lora';
```

```css
/* In app.css - Tailwind v4 @theme */
@theme {
  --font-sans: 'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-serif: 'Lora Variable', ui-serif, Georgia, serif;
}
```

### Typography Scale

Use Tailwind's default scale but extend with semantic tokens:

```css
@theme {
  /* Font families */
  --font-sans: 'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-serif: 'Lora Variable', ui-serif, Georgia, serif;

  /* Semantic font sizes - warm, readable sizing */
  --text-display: 3.5rem;     /* Hero headlines */
  --text-title: 2.25rem;      /* Page titles */
  --text-heading: 1.5rem;     /* Section headings */
  --text-subheading: 1.125rem; /* Card titles */
  --text-body: 1rem;          /* Default body */
  --text-small: 0.875rem;     /* Captions, meta */

  /* Tracking (letter-spacing) - tighter for warmth */
  --tracking-tight: -0.025em;
  --tracking-normal: -0.011em; /* Slightly tighter than default */
  --tracking-wide: 0.025em;
}
```

---

## Animation Library

### Recommendation: Motion (formerly Framer Motion)

**Package:** `motion`
**Import:** `motion/react`

The Motion library is the clear choice for React animation in 2025-2026. It has consolidated Framer Motion and Motion One into a single, unified package.

| Library | Bundle Size | React Integration | Verdict |
|---------|-------------|-------------------|---------|
| **Motion** | ~15-25kb (tree-shaken) | Native, declarative | USE THIS |
| GSAP | ~60kb | Imperative, refs | Overkill for UI animations |
| react-spring | ~20kb | Good | Less active development |
| CSS-only | 0kb | Manual | Use for simple hovers, not orchestration |

### Why Motion

1. **Declarative API** - Animations defined in JSX, not imperative timelines
2. **Layout animations** - Automatic smooth transitions when DOM changes
3. **Stagger support** - Built-in `staggerChildren` for card grids
4. **Exit animations** - `AnimatePresence` handles unmounting gracefully
5. **Hardware acceleration** - Uses transforms and opacity for 60fps
6. **Active maintenance** - Matt Perry (creator) actively developing

### Installation

```bash
bun add motion
```

### Import Pattern

```tsx
// Standard import for most components
import { motion, AnimatePresence } from "motion/react";

// For server components or client-only contexts
import * as motion from "motion/react-client";
```

### Core Animation Patterns for ASTN

#### 1. Staggered Card Entrance (Opportunities, Matches)

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// Usage
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {cards.map((card) => (
    <motion.div key={card.id} variants={cardVariants}>
      <Card {...card} />
    </motion.div>
  ))}
</motion.div>
```

#### 2. Card Hover (Warm lift effect)

```tsx
<motion.div
  whileHover={{
    y: -4,
    boxShadow: "0 12px 40px oklch(0.70 0.08 30 / 0.2)"
  }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>
  <Card />
</motion.div>
```

#### 3. Page Transitions (TanStack Router)

```tsx
// In route component
<motion.main
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  {children}
</motion.main>
```

### What NOT to Use

| Library | Why Avoid |
|---------|-----------|
| `tw-animate-css` | Already in stack but limited. Keep for basic utilities, use Motion for orchestration. |
| Anime.js | No React integration, imperative API |
| React Motion | Abandoned (last update 2019) |
| GSAP | Complex licensing, overkill for this use case |
| Lottie | For complex vector animations, not UI motion |

---

## Design Tokens (Tailwind v4)

### Approach: CSS-First with @theme

Tailwind v4 eliminates the need for `tailwind.config.js`. All design tokens live in CSS using the `@theme` directive.

### Token Structure

```css
/* src/styles/app.css */
@import 'tailwindcss';
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme {
  /* ============================================
   * COLORS - Warm coral palette expansion
   * ============================================ */

  /* Primary coral spectrum */
  --color-coral-50: oklch(0.97 0.02 30);
  --color-coral-100: oklch(0.94 0.04 30);
  --color-coral-200: oklch(0.90 0.08 30);
  --color-coral-300: oklch(0.84 0.12 30);
  --color-coral-400: oklch(0.77 0.14 30);
  --color-coral-500: oklch(0.70 0.16 30);  /* Current primary */
  --color-coral-600: oklch(0.62 0.16 30);
  --color-coral-700: oklch(0.54 0.14 30);
  --color-coral-800: oklch(0.46 0.12 30);
  --color-coral-900: oklch(0.38 0.10 30);

  /* Warm neutrals (tinted with coral) */
  --color-warm-50: oklch(0.98 0.005 30);
  --color-warm-100: oklch(0.96 0.008 30);
  --color-warm-200: oklch(0.92 0.01 30);
  --color-warm-300: oklch(0.86 0.012 30);
  --color-warm-400: oklch(0.70 0.015 30);
  --color-warm-500: oklch(0.55 0.015 30);
  --color-warm-600: oklch(0.42 0.012 30);
  --color-warm-700: oklch(0.32 0.01 30);
  --color-warm-800: oklch(0.22 0.008 30);
  --color-warm-900: oklch(0.14 0.005 30);

  /* Semantic colors */
  --color-success: oklch(0.72 0.15 145);
  --color-warning: oklch(0.80 0.15 85);
  --color-error: oklch(0.65 0.20 25);

  /* ============================================
   * TYPOGRAPHY
   * ============================================ */

  --font-sans: 'Plus Jakarta Sans Variable', ui-sans-serif, system-ui, sans-serif;
  --font-serif: 'Lora Variable', ui-serif, Georgia, serif;

  /* ============================================
   * SPACING - Slightly more generous for warmth
   * ============================================ */

  --spacing-page: 2rem;      /* Page padding */
  --spacing-section: 4rem;   /* Between sections */
  --spacing-card: 1.5rem;    /* Card internal padding */

  /* ============================================
   * SHADOWS - Coral-tinted for warmth
   * ============================================ */

  --shadow-sm: 0 1px 2px oklch(0.70 0.04 30 / 0.08);
  --shadow-md: 0 4px 12px oklch(0.70 0.06 30 / 0.12);
  --shadow-lg: 0 8px 30px oklch(0.70 0.08 30 / 0.15);
  --shadow-xl: 0 16px 50px oklch(0.70 0.10 30 / 0.18);
  --shadow-glow: 0 0 30px oklch(0.70 0.16 30 / 0.25);

  /* ============================================
   * RADII - Slightly larger for friendliness
   * ============================================ */

  --radius: 0.75rem;  /* Increase from 0.625rem */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-full: 9999px;

  /* ============================================
   * TRANSITIONS - Organic easing
   * ============================================ */

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-out-sine: cubic-bezier(0.37, 0, 0.63, 1);

  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* ============================================
   * ANIMATION KEYFRAMES
   * ============================================ */

  --animate-fade-in: fade-in 0.3s var(--ease-out-expo);
  --animate-slide-up: slide-up 0.4s var(--ease-out-expo);
  --animate-scale-in: scale-in 0.3s var(--ease-out-back);
}

/* Keyframe definitions */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
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
```

### Usage in Components

With Tailwind v4, theme variables become utilities automatically:

```tsx
// Colors
<div className="bg-coral-500 text-coral-50" />
<div className="bg-warm-100" />

// Shadows
<div className="shadow-lg hover:shadow-xl" />

// Fonts
<h1 className="font-sans font-semibold" />
<blockquote className="font-serif italic" />

// Transitions
<button className="transition-all duration-normal ease-out-expo" />
```

---

## Background & Atmosphere System

### Recommendation: CSS Gradients + SVG Noise

The login page already has a good foundation. Extend this pattern app-wide.

### Background Utility Classes

```css
/* Add to app.css */
.bg-warm-gradient {
  background: radial-gradient(
    ellipse 80% 60% at 50% 0%,
    oklch(0.98 0.01 30) 0%,
    oklch(0.96 0.02 30) 50%,
    oklch(0.94 0.03 30) 100%
  );
}

.bg-warm-gradient-subtle {
  background: linear-gradient(
    180deg,
    oklch(0.98 0.005 30) 0%,
    oklch(0.97 0.01 30) 100%
  );
}

/* Noise texture overlay */
.bg-noise {
  position: relative;
}

.bg-noise::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

---

## Complete Installation

```bash
# Fonts
bun add @fontsource-variable/plus-jakarta-sans @fontsource-variable/lora

# Animation
bun add motion
```

**Total new dependencies:** 3 packages

---

## Migration Path

### Phase 1: Foundation (Low risk)
1. Install fonts, add to entry point
2. Update `@theme` in app.css with new tokens
3. Test that existing UI still works

### Phase 2: Typography (Medium risk)
1. Replace system fonts with Plus Jakarta Sans
2. Add `font-serif` to quotes/testimonials
3. Adjust tracking/line-height

### Phase 3: Animation (Medium risk)
1. Add Motion to card grids (opportunities, matches)
2. Add hover effects to cards
3. Add page transitions

### Phase 4: Polish (Low risk)
1. Extend warm gradient backgrounds
2. Add noise textures
3. Refine shadows and transitions

---

## What NOT to Do

| Anti-Pattern | Why |
|--------------|-----|
| Use Inter or system fonts | Generic, cold, "default React app" aesthetic |
| Use GSAP for simple UI | Overcomplicated, licensing concerns |
| Use CSS-in-JS for animations | Performance overhead, Motion is better |
| Create custom animation utilities | Motion handles this better |
| Use JS-based design token systems (Style Dictionary, etc.) | Tailwind v4 @theme is sufficient |
| Add multiple animation libraries | Pick one (Motion) and use it consistently |
| Over-animate | Restraint is key. Focus on entrance + hover, not continuous motion |

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Font Selection | HIGH | Plus Jakarta Sans well-documented, free, variable, humanist-warm character verified across multiple sources |
| Animation Library | HIGH | Motion is the clear market leader, actively maintained, well-documented |
| Design Tokens | HIGH | Tailwind v4 @theme is the official recommended approach, verified in official docs |
| Color Tokens | MEDIUM | OKLCH math is correct but needs visual testing with real components |
| Background System | MEDIUM | Pattern is solid but visual impact needs iteration |

---

## Sources

### Official Documentation (HIGH confidence)
- Fontsource Plus Jakarta Sans: https://fontsource.org/fonts/plus-jakarta-sans
- Fontsource Lora: https://fontsource.org/fonts/lora
- Motion documentation: https://motion.dev/docs/react-quick-start
- Motion React installation: https://motion.dev/docs/react-installation
- Tailwind v4 theme docs: https://tailwindcss.com/docs/theme
- Tailwind v4 release: https://tailwindcss.com/blog/tailwindcss-v4

### Typography Research (MEDIUM confidence)
- Typewolf humanist fonts: https://www.typewolf.com/top-10-humanist-sans-serif-fonts
- Figma font pairings: https://www.figma.com/resource-library/font-pairings/
- Lora pairing guide: https://bonfx.com/what-fonts-go-with-lora/
- Google Fonts specimen pages

### Animation Research (HIGH confidence)
- Motion GitHub: https://github.com/framer/motion
- Syncfusion React Animation comparison 2026: https://www.syncfusion.com/blogs/post/top-react-animation-libraries
- Motion vs GSAP comparison: https://motion.dev/docs/gsap-vs-motion

### Design Token Research (HIGH confidence)
- Tailwind v4 @theme guide (Medium): https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens
- Tailwind CSS best practices 2025-2026: https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns
