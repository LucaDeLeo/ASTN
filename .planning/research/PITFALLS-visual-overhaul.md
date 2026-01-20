# Visual Design Overhaul Pitfalls

**Project:** ASTN Visual Overhaul (v1.3)
**Domain:** React/Tailwind/shadcn visual refresh
**Researched:** 2026-01-19
**Confidence:** HIGH (verified with official docs and multiple sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken UX, or abandoned overhauls.

### Pitfall 1: "Big Bang" Redesign Instead of Incremental Migration

**What goes wrong:** Team attempts to overhaul all pages at once, resulting in a prolonged period where the app is "half-finished" with inconsistent styling. The project stalls, never reaching completion.

**Why it happens:**
- Excitement about fresh design leads to underestimating scope
- Belief that "it will be easier to do it all at once"
- Fear of "frankenstein" states during transition

**Consequences:**
- 50%+ of visual overhauls never complete
- Users experience jarring inconsistencies
- Team loses momentum and motivation
- Technical debt compounds as new features ship with old patterns

**Warning signs:**
- No clear page-by-page migration plan
- Estimates don't account for testing each page
- Team discusses "flipping the switch" to new design

**Prevention:**
1. Create a page-by-page migration order (start with highest-traffic pages)
2. Build a "bridge" layer - shared tokens/variables that work in both old and new
3. Ship incrementally - one page or component family at a time
4. Accept temporary visual inconsistency as the cost of sustainable progress

**Which phase should address:** Phase 1 (Foundation) - establish migration strategy before any visual work begins.

---

### Pitfall 2: Typography Performance Disasters (FOIT/FOUT)

**What goes wrong:** Adding custom fonts causes Flash of Invisible Text (text disappears for 1-3s) or Flash of Unstyled Text (jarring font swap), degrading perceived performance and causing layout shift.

**Why it happens:**
- Fonts load from external CDNs (Google Fonts, Adobe Fonts)
- No font-display strategy defined
- Fonts not preloaded
- Fallback fonts don't match custom font metrics
- Loading too many font weights/styles

**Consequences:**
- Cumulative Layout Shift (CLS) penalties hurt Core Web Vitals
- Users see "broken" pages during font swap
- Text readability suffers during FOIT period
- Mobile users on slow connections get worst experience

**Warning signs:**
- Using `<link>` tags to Google Fonts in `<head>` without `font-display`
- Loading 4+ font weights
- No `size-adjust` or `ascent-override` on fallback fonts
- Fonts not self-hosted

**Prevention:**
1. Self-host fonts using WOFF2 format (or use Fontsource)
2. Preload critical fonts: `<link rel="preload" as="font" type="font/woff2" crossorigin>`
3. Use `font-display: optional` for non-critical fonts, `swap` for critical
4. Define fallback fonts with matching metrics using `size-adjust`, `ascent-override`
5. Limit to 2 font families max, 3-4 weights total
6. Use variable fonts when available (1 file, multiple weights)

**Example safe font loading:**
```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap;
  font-weight: 100 900; /* Variable font range */
}

/* Fallback with matching metrics */
@font-face {
  font-family: 'CustomFont-Fallback';
  src: local('Arial');
  size-adjust: 105%;
  ascent-override: 95%;
}
```

**Which phase should address:** Phase 1 (Typography) - get font loading right before adding any custom fonts.

---

### Pitfall 3: Animation Performance Jank

**What goes wrong:** Animations stutter, skip frames, or cause the entire page to feel sluggish. Users report the app feels "broken" or "slow."

**Why it happens:**
- Animating properties that trigger layout (width, height, margin, padding, top/left)
- Using JavaScript/React state for animations instead of CSS/GPU
- Animation code running on main thread, blocking UI
- Animating too many elements simultaneously
- Not using `will-change` or compositor-friendly properties

**Consequences:**
- Animations drop below 60fps (16ms frame budget)
- Battery drain on mobile devices
- Perceived performance is worse than before overhaul
- Users disable animations or leave

**Warning signs:**
- Using `animate()` with React state updates
- CSS animating `width`, `height`, `top`, `left`, `margin`, `padding`
- Staggered animations with 20+ items
- Motion library used for simple hover states
- No performance testing on mobile/low-end devices

**Prevention:**
1. **ONLY animate compositor-friendly properties:** `transform`, `opacity`
2. Use CSS animations for micro-interactions (hover, focus)
3. Use `will-change: transform` sparingly for complex animations
4. Limit staggered animations to 8-10 items max
5. Test on mobile devices / throttled CPU in DevTools
6. For complex animations, use Motion library with `layoutId` for FLIP animations
7. Avoid animating during scroll (use `scroll-timeline` CSS instead of JS)

**GPU-safe vs Layout-triggering:**
```css
/* BAD - triggers layout */
.card:hover {
  width: 110%;
  margin-top: -10px;
}

/* GOOD - GPU accelerated */
.card:hover {
  transform: scale(1.05) translateY(-4px);
}
```

**Which phase should address:** Phase 2 (Motion System) - establish animation patterns and constraints early.

---

### Pitfall 4: Scope Creep Disguised as "Polish"

**What goes wrong:** Visual overhaul expands to include new features, restructured navigation, new pages, or "while we're at it" refactors. The project balloons from 2 weeks to 2 months.

**Why it happens:**
- Design review surfaces UX issues that "need fixing"
- Stakeholders see refresh as opportunity to add features
- Developers notice code they want to refactor
- "We might as well" mentality

**Consequences:**
- Timeline doubles or triples
- Original visual goals get deprioritized
- Team burnout
- Launch keeps slipping, morale drops

**Warning signs:**
- Requirements include "and also..." additions
- Design mockups include new features
- Sprint scope increases after each review
- "While we're touching this file..." refactors

**Prevention:**
1. Define explicit scope: "Visual ONLY - no new features"
2. Create a "parking lot" for good ideas discovered during overhaul
3. Require separate tickets for anything beyond styling
4. Set hard deadline and cut scope to meet it
5. Treat functional changes as separate milestone (v1.4)
6. Daily standup question: "Is this visual or functional?"

**Which phase should address:** Pre-planning phase - scope definition before any design work.

---

### Pitfall 5: Breaking shadcn Component Patterns

**What goes wrong:** Team customizes shadcn components in ways that break future updates, accessibility, or internal consistency. Components become "snowflakes" that can't be maintained.

**Why it happens:**
- Not understanding shadcn's extension model
- Overriding styles with `!important` or inline styles
- Modifying component internals instead of using variants
- Not using CSS variables for customization
- Mixing customization approaches (some in globals, some inline)

**Consequences:**
- Can't update shadcn components without breaking custom styles
- Accessibility features (focus states, ARIA) get overwritten
- Design inconsistency across components
- Debugging becomes difficult

**Warning signs:**
- Using `!important` anywhere in component styles
- Inline `style={{}}` props on shadcn components
- Components with 15+ Tailwind classes
- Multiple approaches to the same customization
- Components that don't match the design system in edge cases

**Prevention:**
1. **Customize at the theme level first** - CSS variables in `app.css`
2. **Use cva variants** for component-level customization
3. **Never override** - extend via composition
4. Keep customizations in one place (theme or component file, not both)
5. Document any custom variants for team reference
6. Run accessibility tests after any component changes

**Proper customization hierarchy:**
```
1. CSS Variables (--primary, --radius) - affects all components
2. Theme extensions (@theme inline) - Tailwind-level tokens
3. Component variants (cva) - predefined style combinations
4. Composition - wrapper components with additional styling
5. NEVER: inline styles, !important, direct class overrides
```

**Which phase should address:** Phase 1 (Foundation) - establish customization patterns before touching any components.

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or rework.

### Pitfall 6: Inconsistent Design Token Application

**What goes wrong:** Different developers apply tokens inconsistently - one uses `text-primary`, another uses `oklch(0.70 0.16 30)`, another uses `#E07A5F`. Colors drift, the "design system" becomes a suggestion.

**Why it happens:**
- No single source of truth documented
- Copy-pasting from different files
- Token naming is unclear
- No linting/enforcement

**Warning signs:**
- Same color defined multiple ways in codebase
- Hardcoded values in components
- Team asks "which token should I use for this?"
- Colors that are "almost but not quite" the same

**Prevention:**
1. Document all tokens in a single reference file
2. Use Tailwind IntelliSense to surface available tokens
3. Add ESLint rule to ban hardcoded color values
4. Create a visual token reference (Storybook page or documentation)
5. Regular "token drift" audits during code review

**Which phase should address:** Phase 1 (Foundation) - document tokens before anyone writes new styles.

---

### Pitfall 7: Dark Mode as Afterthought

**What goes wrong:** Team builds beautiful light theme, then scrambles to add dark mode. Dark mode has poor contrast, broken states, or missing implementations. Some users get a broken experience.

**Why it happens:**
- "We'll add dark mode later"
- Testing only in light mode during development
- Dark mode colors not designed, just inverted
- Forgetting to test images, shadows, borders in dark mode

**Consequences:**
- Dark mode users see invisible text, broken contrast
- Shadows look wrong (white/gray shadows on dark)
- Images with transparent backgrounds look terrible
- Accessibility failures (contrast ratios)
- Users with astigmatism cannot read light-on-dark text

**Warning signs:**
- Dark mode colors are just "inverted" light colors
- No dark mode designs from designer
- Testing happens 90% in light mode
- Shadows, borders hardcoded instead of using theme tokens

**Prevention:**
1. Design dark mode colors intentionally (not just inverted)
2. Test EVERY component in dark mode during development
3. Use theme-aware shadows: `shadow-black/10 dark:shadow-black/50`
4. Verify contrast ratios in both modes (4.5:1 minimum)
5. Consider dark mode first for users with astigmatism - but give choice
6. Test images with transparent backgrounds

**ASTN-specific note:** Current dark mode variables exist but primary color loses warmth. Dark mode needs intentional coral palette, not gray.

**Which phase should address:** Every phase - but dark mode variables should be finalized in Phase 1 (Foundation).

---

### Pitfall 8: Background/Atmosphere Without Performance Budget

**What goes wrong:** Beautiful gradients, noise textures, and blur effects are added. Performance tanks. Mobile users see stuttering scroll, battery drain.

**Why it happens:**
- Designers love atmospheric backgrounds
- Effects look fine on M3 MacBooks
- No performance testing on real devices
- Overuse of `backdrop-filter: blur()`
- Large noise texture images

**Warning signs:**
- Multiple `backdrop-blur` elements visible simultaneously
- Noise textures are PNG instead of SVG or CSS
- Full-page gradient meshes
- Effects applied to scrolling containers
- No `will-change` strategy

**Prevention:**
1. Budget: 1-2 blur effects visible at a time maximum
2. Use CSS `filter: url(#noise)` with inline SVG instead of image textures
3. Apply backgrounds to fixed containers, not scrolling content
4. Test on mobile Safari (worst blur performance)
5. Use `@media (prefers-reduced-motion)` to simplify effects
6. Consider static images for complex gradients (generated once)

**Which phase should address:** Phase 3 (Backgrounds/Atmosphere) - establish performance constraints first.

---

### Pitfall 9: Forgetting Responsive Typography

**What goes wrong:** Typography looks beautiful on desktop, but on mobile text is either too large (cramped) or too small (unreadable). Line lengths exceed readable limits.

**Why it happens:**
- Design mockups only show desktop
- Not using fluid/responsive type scales
- Copy-pasting desktop text sizes to mobile
- No max-width on text containers

**Warning signs:**
- Text sizes hardcoded without responsive variants
- Line lengths exceed 75 characters on desktop
- Body text below 14px on mobile
- No `clamp()` or responsive utilities used

**Prevention:**
1. Use fluid typography: `clamp(1rem, 2.5vw, 1.25rem)`
2. Set `max-w-prose` (65ch) on text containers
3. Test typography at 320px, 768px, 1440px breakpoints
4. Mobile body text minimum 16px (iOS zoom prevention)
5. Create responsive type scale in theme

**Example fluid type scale:**
```css
--text-sm: clamp(0.8rem, 0.17vw + 0.76rem, 0.89rem);
--text-base: clamp(1rem, 0.34vw + 0.91rem, 1.19rem);
--text-lg: clamp(1.25rem, 0.61vw + 1.1rem, 1.58rem);
--text-xl: clamp(1.56rem, 1vw + 1.31rem, 2.11rem);
--text-2xl: clamp(1.95rem, 1.56vw + 1.56rem, 2.81rem);
```

**Which phase should address:** Phase 1 (Typography) - establish responsive scale from the start.

---

### Pitfall 10: Lost Focus States and Accessibility

**What goes wrong:** Beautiful hover states are added, but keyboard focus states are removed or invisible. Users navigating with keyboard or screen readers cannot see where they are.

**Why it happens:**
- Focus rings considered "ugly"
- `outline: none` applied globally
- Custom hover states don't include focus equivalents
- Dark mode focus states not tested

**Warning signs:**
- Global `outline: none` or `outline: 0` in CSS
- Hover effects without matching `:focus-visible` effects
- Focus only visible on some interactive elements
- Tab navigation "disappears" in some components

**Prevention:**
1. Never remove focus outlines without replacement
2. Use `:focus-visible` (not `:focus`) for styled focus states
3. Test full keyboard navigation on every page
4. Ensure focus contrast of 3:1 against background
5. Match focus ring to brand (coral ring for ASTN)
6. Test focus states in both light and dark modes

**Note:** ASTN currently has `.using-mouse * { outline: none !important; }` - this is actually a good pattern (hides outline for mouse users, shows for keyboard).

**Which phase should address:** Phase 2 (Component Polish) - audit all interactive elements.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 11: Inconsistent Border Radii

**What goes wrong:** Some cards have `rounded-lg`, others `rounded-xl`, buttons use different radius than inputs. The design feels unpolished.

**Prevention:**
1. Define radius scale in theme (ASTN has `--radius: 0.625rem`)
2. Use calculated variants consistently: `--radius-sm`, `--radius-md`, `--radius-lg`
3. Document which radius for which component type
4. Audit existing components before adding new patterns

**Which phase should address:** Phase 1 (Foundation) - document radius usage.

---

### Pitfall 12: Shadow Inconsistency

**What goes wrong:** Mix of Tailwind default shadows and custom shadows. Some shadows have color tint, others don't. Elevation hierarchy is unclear.

**Prevention:**
1. Define shadow scale in theme (elevation-1, elevation-2, elevation-3)
2. Include brand color in shadows for warmth: `shadow-primary/10`
3. Document shadow usage: cards=elevation-1, modals=elevation-3
4. Audit and standardize existing shadows

**Which phase should address:** Phase 1 (Foundation) - establish shadow system.

---

### Pitfall 13: Transition Timing Inconsistency

**What goes wrong:** Some transitions are 150ms, others 300ms, others 200ms. Some use ease-in-out, others linear. The app feels janky.

**Prevention:**
1. Define timing scale: `--duration-fast: 150ms`, `--duration-normal: 200ms`, `--duration-slow: 300ms`
2. Use consistent easing: `ease-out` for entrances, `ease-in` for exits
3. Document when to use each duration
4. Create Tailwind utilities: `transition-fast`, `transition-normal`

**Which phase should address:** Phase 2 (Motion System) - establish timing tokens.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Typography | FOIT/FOUT, performance | Self-host fonts, preload, test on slow 3G |
| Color/Theme | Token drift, dark mode contrast | Document tokens, test both modes every PR |
| Motion | Jank, layout thrash | Only animate transform/opacity, test mobile |
| Backgrounds | Performance, blur overuse | Budget blur effects, test mobile Safari |
| Components | Breaking shadcn patterns | Use CSS vars and cva, never !important |
| Layout | Scope creep into features | Strict "visual only" boundary |
| Integration | Inconsistent application | Code review checklist, visual regression tests |

---

## Quick Reference Checklist

Before starting visual overhaul:
- [ ] Explicit scope defined (visual only, no features)
- [ ] Migration order established (page by page)
- [ ] Token documentation exists
- [ ] Font loading strategy defined
- [ ] Animation constraints documented
- [ ] Dark mode designed (not just inverted)
- [ ] Performance budget set (blur count, animation count)
- [ ] Accessibility audit scheduled

During visual overhaul:
- [ ] Testing in both light and dark modes
- [ ] Testing on mobile devices
- [ ] Testing keyboard navigation
- [ ] Using GPU-safe animation properties only
- [ ] Using CSS variables, not hardcoded values
- [ ] Scope creep going to parking lot, not sprint

After visual overhaul:
- [ ] Visual regression tests added
- [ ] Performance audit (Core Web Vitals)
- [ ] Accessibility audit (contrast, focus states)
- [ ] Token drift audit
- [ ] Documentation updated

---

## Sources

- [Smashing Magazine: Inclusive Dark Mode](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [Paul Serban: 5 Critical shadcn/ui Pitfalls](https://www.paulserban.eu/blog/post/5-critical-shadcnui-pitfalls-that-break-production-apps-and-how-to-avoid-them/)
- [Evil Martians: 5 Best Practices for Tailwind CSS](https://evilmartians.com/chronicles/5-best-practices-for-preventing-chaos-in-tailwind-css)
- [Jono Alderson: You're Loading Fonts Wrong](https://www.jonoalderson.com/performance/youre-loading-fonts-wrong/)
- [Talent500: FOIT vs FOUT](https://talent500.com/blog/optimizing-fonts-foit-fout-font-display-strategies/)
- [Medium: Why React Animations Feel Janky](https://medium.com/@rahul.dinkar/why-your-react-animations-feel-janky-and-how-to-fix-it-without-rewriting-ui-08326dec3ba0)
- [Design Systems Collective: Retrofitting a Design System](https://www.designsystemscollective.com/retrofitting-a-design-system-into-an-existing-product-a9ebfe3d7d30)
- [Medium: You're Using ShadCN Wrong](https://medium.com/@vanshchaurasiya1557/youre-using-shadcn-wrong-here-s-the-right-way-to-customize-it-d35b33498304)
- [Atomic Object: Tailwind CSS Anti-Patterns](https://spin.atomicobject.com/tailwind-css-anti-patterns)
- [Stephanie Walter: Dark Mode Accessibility Myth](https://stephaniewalter.design/blog/dark-mode-accessibility-myth-debunked/)
- [H Locke: Why Dark Mode Causes Accessibility Issues](https://medium.com/@h_locke/why-dark-mode-causes-more-accessibility-issues-than-it-solves-54cddf6466f5)
- [CSS-Tricks: Fighting FOIT and FOUT](https://css-tricks.com/fighting-foit-and-fout-together/)
- Frontend Design Skill guidelines (Claude Code)
