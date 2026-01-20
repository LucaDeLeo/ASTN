# Requirements: v1.3 Visual Overhaul

**Defined:** 2026-01-19
**Core Value:** Transform ASTN from generic shadcn/ui (3.7/10) to a warm, memorable visual identity (8+/10) that says "AI safety is about people."

## v1.3 Requirements

Requirements for visual overhaul. Each maps to roadmap phases.

### Typography

- [ ] **TYPO-01**: Custom display font installed and loaded (Plus Jakarta Sans Variable)
- [ ] **TYPO-02**: Body font pairing configured for readability
- [ ] **TYPO-03**: Typographic scale defined with responsive sizing (fluid type)
- [ ] **TYPO-04**: Font preloading infrastructure in __root.tsx
- [ ] **TYPO-05**: Optional serif accent font for quotes/testimonials (Lora Variable)
- [ ] **TYPO-06**: Typography applied consistently across all pages

### Atmosphere

- [ ] **ATMO-01**: Warm off-white backgrounds replace flat gray-50 throughout
- [ ] **ATMO-02**: Coral-tinted shadows replace gray shadows
- [ ] **ATMO-03**: Extended warm neutral palette defined in design tokens
- [ ] **ATMO-04**: Gradient system extends login page treatment to other pages
- [ ] **ATMO-05**: Noise/grain texture overlay (2-4% opacity) adds tactility
- [ ] **ATMO-06**: Atmospheric depth applied to all main pages

### Motion

- [ ] **MOTN-01**: Card hover feedback (lift + shadow transition)
- [ ] **MOTN-02**: Smooth transitions (150-300ms) with organic easing curves
- [ ] **MOTN-03**: Staggered card entrance animations on list pages
- [ ] **MOTN-04**: Page transitions between routes
- [ ] **MOTN-05**: Button press "squish" feedback effect
- [ ] **MOTN-06**: Animation keyframes and easing defined in design tokens

### Components

- [ ] **COMP-01**: Consistent border-radius system (12-16px base)
- [ ] **COMP-02**: Focus state styling (:focus-visible) on all interactive elements
- [ ] **COMP-03**: Dark mode color refinement (intentional coral, not inverted)
- [ ] **COMP-04**: Empty state visual treatments with warmth
- [ ] **COMP-05**: AnimatedCard component with stagger support
- [ ] **COMP-06**: GradientBg reusable background component

### Pages

- [ ] **PAGE-01**: Home page atmosphere and layout updated
- [ ] **PAGE-02**: Profile view page visual hierarchy improved
- [ ] **PAGE-03**: Profile edit page with consistent styling
- [ ] **PAGE-04**: Matches page card presentation enhanced
- [ ] **PAGE-05**: Opportunities listing with hover effects
- [ ] **PAGE-06**: Opportunity detail page polish
- [ ] **PAGE-07**: Admin dashboard visual consistency
- [ ] **PAGE-08**: Login/auth flow polish maintained
- [ ] **PAGE-09**: Organizations page with map integration polish

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Illustrations

- **ILLU-01**: Custom spot illustrations for empty states
- **ILLU-02**: Animated backgrounds (slow-moving gradients)
- **ILLU-03**: Scroll-triggered content reveals
- **ILLU-04**: Success celebration animations (confetti)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Custom icon set | High effort, Lucide icons sufficient for v1.3 |
| Logo/wordmark redesign | Brand identity work, separate initiative |
| Mobile-specific animations | Performance concerns, web-first |
| Animated illustrations | High effort, defer to v2+ |
| Custom cursor effects | Novelty over utility |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TYPO-01 | Phase 17 | Pending |
| TYPO-02 | Phase 17 | Pending |
| TYPO-03 | Phase 17 | Pending |
| TYPO-04 | Phase 17 | Pending |
| TYPO-05 | Phase 17 | Pending |
| TYPO-06 | Phase 18 | Pending |
| ATMO-01 | Phase 18 | Pending |
| ATMO-02 | Phase 18 | Pending |
| ATMO-03 | Phase 17 | Pending |
| ATMO-04 | Phase 18 | Pending |
| ATMO-05 | Phase 18 | Pending |
| ATMO-06 | Phase 18 | Pending |
| MOTN-01 | Phase 19 | Pending |
| MOTN-02 | Phase 19 | Pending |
| MOTN-03 | Phase 19 | Pending |
| MOTN-04 | Phase 19 | Pending |
| MOTN-05 | Phase 19 | Pending |
| MOTN-06 | Phase 17 | Pending |
| COMP-01 | Phase 18 | Pending |
| COMP-02 | Phase 20 | Pending |
| COMP-03 | Phase 20 | Pending |
| COMP-04 | Phase 20 | Pending |
| COMP-05 | Phase 19 | Pending |
| COMP-06 | Phase 18 | Pending |
| PAGE-01 | Phase 18 | Pending |
| PAGE-02 | Phase 18 | Pending |
| PAGE-03 | Phase 18 | Pending |
| PAGE-04 | Phase 18 | Pending |
| PAGE-05 | Phase 18 | Pending |
| PAGE-06 | Phase 18 | Pending |
| PAGE-07 | Phase 18 | Pending |
| PAGE-08 | Phase 18 | Pending |
| PAGE-09 | Phase 18 | Pending |

**Coverage:**
- v1.3 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after initial definition*
