# Roadmap: ASTN v1.3 Visual Overhaul

## Overview

Transform ASTN from generic shadcn/ui (3.7/10) to a warm, memorable visual identity (8+/10). The "Warm & Human" aesthetic communicates that AI safety is about people. Build order: Foundation/Tokens first (everything depends on them), then Visual Polish (apply tokens consistently), then Motion (requires stable layout), then Polish/Integration (reveals edge cases).

## Milestones

- v1.0 MVP - Phases 1-6, 21 plans - shipped 2026-01-18
- v1.1 Profile Input Speedup - Phases 7-10, 13 plans - shipped 2026-01-19
- v1.2 Org CRM & Events - Phases 11-16, 20 plans - shipped 2026-01-19
- **v1.3 Visual Overhaul** - Phases 17-20 (in progress)

## Phases

- [x] **Phase 17: Foundation & Tokens** - Design tokens, font installation, CSS architecture
- [ ] **Phase 18: Core Visual Polish** - Warm backgrounds, shadows, typography across all pages
- [ ] **Phase 19: Motion System** - Animations, hover effects, page transitions
- [ ] **Phase 20: Polish & Integration** - Dark mode, focus states, accessibility, performance

## Phase Details

### Phase 17: Foundation & Tokens
**Goal**: Establish the design system foundation - tokens, fonts, and CSS architecture that all other phases depend on
**Depends on**: Nothing (first phase of milestone)
**Requirements**: TYPO-01, TYPO-02, TYPO-03, TYPO-04, TYPO-05, ATMO-03, MOTN-06
**Success Criteria** (what must be TRUE):
  1. Plus Jakarta Sans and Lora fonts load without FOIT/FOUT (font-display: swap, preloaded)
  2. Design tokens for colors, typography, and animation are accessible as CSS custom properties
  3. Typographic scale produces appropriate sizes at all viewport widths (fluid type)
  4. Tailwind v4 @theme directive integrates tokens as utilities
  5. Animation keyframes and easing functions are defined and reusable
**Plans**: 2 plans

Plans:
- [x] 17-01-PLAN.md - Install fonts and define color/typography tokens
- [x] 17-02-PLAN.md - Animation tokens and font preloading infrastructure

### Phase 18: Core Visual Polish
**Goal**: Apply warm visual treatment consistently across all pages - backgrounds, shadows, typography, and layout
**Depends on**: Phase 17 (tokens must be stable)
**Requirements**: TYPO-06, ATMO-01, ATMO-02, ATMO-04, ATMO-05, ATMO-06, COMP-01, COMP-06, PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, PAGE-09
**Success Criteria** (what must be TRUE):
  1. All pages use warm off-white backgrounds instead of flat gray-50
  2. Shadows throughout the app use coral tint instead of gray
  3. Typography uses Plus Jakarta Sans for headings and body with proper hierarchy
  4. GradientBg component provides reusable warm atmospheric backgrounds
  5. All 9 main pages display with consistent visual treatment
**Plans**: TBD

Plans:
- [ ] 18-01: TBD
- [ ] 18-02: TBD
- [ ] 18-03: TBD
- [ ] 18-04: TBD

### Phase 19: Motion System
**Goal**: Add purposeful animation that reinforces warmth - entrance animations, hover feedback, page transitions
**Depends on**: Phase 18 (layout must be stable before animating)
**Requirements**: MOTN-01, MOTN-02, MOTN-03, MOTN-04, MOTN-05, COMP-05
**Success Criteria** (what must be TRUE):
  1. Cards lift and shadow-shift on hover (150-300ms, organic easing)
  2. List pages show staggered card entrance animations (max 8-10 items)
  3. Page transitions provide continuity when navigating between routes
  4. Buttons have press "squish" feedback effect
  5. AnimatedCard component enables consistent stagger behavior across list pages
**Plans**: TBD

Plans:
- [ ] 19-01: TBD
- [ ] 19-02: TBD
- [ ] 19-03: TBD

### Phase 20: Polish & Integration
**Goal**: Finalize dark mode, accessibility, and performance - ensure visual system works for all users
**Depends on**: Phase 19 (motion reveals edge cases)
**Requirements**: COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. Dark mode uses intentional coral-based palette (not just inverted colors)
  2. All interactive elements have visible :focus-visible states
  3. Empty states display with warm visual treatment
  4. Core Web Vitals remain acceptable (LCP < 2.5s, CLS < 0.1)
**Plans**: TBD

Plans:
- [ ] 20-01: TBD
- [ ] 20-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 17 -> 18 -> 19 -> 20

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 17. Foundation & Tokens | 2/2 | ✓ Complete | 2026-01-19 |
| 18. Core Visual Polish | 0/TBD | Not started | - |
| 19. Motion System | 0/TBD | Not started | - |
| 20. Polish & Integration | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-19*
*Milestone: v1.3 Visual Overhaul*
