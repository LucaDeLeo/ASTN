# Visual Overhaul Research Summary

**Project:** ASTN v1.3 Visual Overhaul
**Domain:** Web application visual design (React/Tailwind/shadcn)
**Researched:** 2026-01-19
**Confidence:** HIGH

## Executive Summary

The v1.3 visual overhaul transforms ASTN from a generic shadcn/ui application (rated 3.7/10) to a distinctive "Warm & Human" interface (target 8+/10). Research confirms this aesthetic aligns perfectly with 2026 design trends and ASTN's mission of human-centered AI safety work. The key insight: **warmth comes from imperfection** - organic shapes, subtle textures, gentle motion, and typography with personality.

The recommended approach uses a minimal stack expansion: Plus Jakarta Sans (typography), Motion library (animations), and Tailwind v4's native `@theme` directive (design tokens). The existing coral palette provides an excellent foundation - it just needs to be extended consistently to shadows, backgrounds, and hover states. Total new dependencies: 3 packages.

The primary risk is scope creep disguised as "polish" and the "big bang" redesign trap (50%+ of visual overhauls never complete). Mitigation: strict visual-only scope, page-by-page migration, and a phased rollout starting with foundational tokens before touching any UI. Secondary risks include font loading performance (FOIT/FOUT) and animation jank - both well-documented with clear prevention strategies.

## Key Findings

### Recommended Stack

**Core technologies:**
- **Plus Jakarta Sans (Variable):** Primary font - geometric-humanist hybrid with rounded terminals conveys warmth while remaining professional. Avoids the "default React app" feel of Inter.
- **Lora (Variable):** Optional serif accent for quotes/testimonials - calligraphic roots with brushed curves.
- **Motion (motion/react):** Animation library - the clear market leader for React, declarative API, built-in stagger/layout/exit animations.
- **Tailwind v4 @theme:** CSS-first design tokens - no JS config needed, tokens become utilities automatically.

**What to avoid:**
- Inter/Roboto (generic, cold)
- GSAP (overkill, licensing concerns)
- CSS-in-JS for animations (performance overhead)
- Multiple animation libraries (pick one)

### Expected Features

**Must have (table stakes):**
- Custom display font (headings) - system fonts signal lack of investment
- Warm off-white backgrounds - pure white feels clinical
- Generous rounded corners (12-16px) - sharp corners feel corporate
- Smooth transitions (150-300ms) with proper easing
- Card hover feedback (lift + shadow)
- Coral-tinted shadows instead of gray

**Should have (differentiators):**
- Staggered card entrance animations
- Noise/grain texture overlay (2-4% opacity)
- Page transitions
- Button press "squish" effect
- Personalized greetings and conversational microcopy

**Defer (v2+):**
- Custom spot illustrations for empty states (high effort)
- Animated backgrounds (slow-moving gradients)
- Scroll-triggered content reveals
- Success celebration animations (confetti)

### Architecture Approach

The architecture extends shadcn/ui through composition rather than modification. Design tokens live in CSS via Tailwind v4's `@theme` directive, organized into modular files (`tokens/colors.css`, `tokens/typography.css`, `tokens/animations.css`). New design-enhanced components (AnimatedCard, GradientBg, Typography) wrap existing shadcn primitives, preserving future update compatibility.

**Major components:**
1. **Token layer** (`src/styles/tokens/`) - color, typography, animation CSS custom properties
2. **Design components** (`src/components/design/`) - AnimatedCard, GradientBg, Heading/Text
3. **Background system** - reusable gradient + noise patterns via GradientBg component

### Critical Pitfalls

1. **"Big Bang" redesign** - Attempting all pages at once leads to 50%+ failure rate. Migrate page-by-page, accept temporary inconsistency.

2. **Font loading disasters (FOIT/FOUT)** - Custom fonts without proper loading strategy cause text flash and layout shift. Self-host via Fontsource, preload critical fonts, use `font-display: swap`.

3. **Animation performance jank** - Animating wrong properties (width, height, margin) kills performance. ONLY animate `transform` and `opacity`. Limit stagger to 8-10 items.

4. **Scope creep as "polish"** - Visual overhaul balloons to include features. Strict "visual only" boundary, parking lot for good ideas.

5. **Breaking shadcn patterns** - Direct modification creates maintenance burden. Customize via CSS variables and composition, never `!important` or inline styles.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation & Tokens
**Rationale:** Typography and color affect every component - they must be stable before any visual changes. Research strongly emphasizes "token-first" approach.
**Delivers:** Design token system, font installation, app.css refactoring
**Addresses:** Custom typography (table stakes), token consistency
**Avoids:** Pitfall #6 (inconsistent token application), Pitfall #5 (breaking shadcn patterns)

Key deliverables:
- Install Plus Jakarta Sans + Lora via Fontsource
- Create `tokens/colors.css` with coral spectrum + warm neutrals
- Create `tokens/typography.css` with fluid scale
- Create `tokens/animations.css` with keyframes + easing functions
- Refactor `app.css` with imports + @theme inline
- Add font preloads to `__root.tsx`

### Phase 2: Core Visual Polish
**Rationale:** After tokens are stable, apply them consistently across existing components. This is where the visual transformation happens.
**Delivers:** Warm backgrounds, updated shadows, rounded corners, typography application
**Addresses:** Off-white backgrounds, coral shadows, generous whitespace
**Avoids:** Pitfall #7 (dark mode afterthought), Pitfall #11 (border radius inconsistency)

Key deliverables:
- Apply warm gradient backgrounds (extend login page pattern)
- Add noise texture overlay
- Update all shadows to use coral tint
- Standardize border-radius usage
- Update typography across pages

### Phase 3: Motion System
**Rationale:** Animation must be added after layout/sizing is stable. Performance-critical phase requiring careful testing.
**Delivers:** Card animations, hover effects, page transitions
**Addresses:** Entrance animations (differentiator), hover feedback (table stakes)
**Avoids:** Pitfall #3 (animation jank), Pitfall #13 (timing inconsistency)

Key deliverables:
- Create AnimatedCard component with stagger support
- Add hover lift effects to all cards
- Implement page transitions (TanStack Router)
- Add button press feedback
- Create reusable animation variants

### Phase 4: Polish & Integration
**Rationale:** Final refinements after core system is stable. Testing and consistency verification.
**Delivers:** Dark mode fixes, accessibility audit, performance verification
**Addresses:** Focus states, dark mode contrast, responsive typography
**Avoids:** Pitfall #10 (lost focus states), Pitfall #8 (background performance)

Key deliverables:
- Dark mode color refinement (intentional coral, not just inverted)
- Focus state audit (`:focus-visible` on all interactive elements)
- Performance testing (mobile, Core Web Vitals)
- Visual regression baseline

### Phase Ordering Rationale

- **Tokens first:** Every component depends on tokens. Changing tokens later cascades through entire codebase.
- **Typography before motion:** Font loading and layout must be stable before animating. Animation timing depends on settled content.
- **Motion before polish:** Animation reveals edge cases (dark mode, focus states, performance) that polish phase addresses.
- **Page-by-page migration within each phase:** Research shows incremental migration has 50%+ higher completion rate than "big bang."

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Motion):** TanStack Router page transition integration is less documented. May need experimentation with AnimatePresence placement.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Fontsource + Tailwind v4 @theme extremely well documented.
- **Phase 2 (Visual Polish):** CSS gradient/shadow/radius are standard patterns.
- **Phase 4 (Polish):** Accessibility testing has established tooling.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Plus Jakarta Sans and Motion are well-documented, verified in official docs |
| Features | HIGH | Multiple 2026 trend sources aligned on "warm & human" aesthetic |
| Architecture | HIGH | Tailwind v4 @theme and shadcn composition patterns verified in official docs |
| Pitfalls | HIGH | Multiple authoritative sources (Smashing Magazine, Evil Martians, etc.) |

**Overall confidence:** HIGH

### Gaps to Address

- **Dark mode coral palette:** Current dark mode variables need intentional design, not just inverted. Should be addressed in Phase 4, but designer input may be needed.
- **OKLCH color testing:** Mathematical OKLCH values need visual testing with real components to ensure warmth translates as expected.
- **TanStack Router transitions:** Documentation for AnimatePresence integration with TanStack Router is sparse - may need experimentation in Phase 3.

## Sources

### Primary (HIGH confidence)
- Fontsource documentation: fontsource.org/docs/getting-started
- Motion documentation: motion.dev/docs/react-quick-start
- Tailwind v4 @theme: tailwindcss.com/docs/functions-and-directives
- shadcn/ui Tailwind v4 migration: ui.shadcn.com/docs/tailwind-v4

### Secondary (MEDIUM confidence)
- BB Creative Co "Design Trends for 2026: Warm, Human & Just a Little Bit Clever"
- Elementor "Web Design Trends to Expect in 2026"
- Envato Elements "Cute and Cozy Fonts: The Warm Typography Trend for 2026"
- Evil Martians "5 Best Practices for Preventing Chaos in Tailwind CSS"
- Smashing Magazine "Inclusive Dark Mode"
- Jono Alderson "You're Loading Fonts Wrong"

### Tertiary (LOW confidence)
- Design Systems Collective "Retrofitting a Design System" - conceptual patterns, not ASTN-specific
- Various Medium articles on animation performance

---
*Research completed: 2026-01-19*
*Ready for roadmap: yes*
