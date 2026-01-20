# Requirements: v1.3 Visual Overhaul

**Defined:** 2026-01-19
**Core Value:** Transform ASTN from generic shadcn/ui (3.7/10) to a warm, memorable visual identity (8+/10) that says "AI safety is about people."

## v1.3 Requirements

33 requirements for visual overhaul across 5 categories. Each maps to exactly one roadmap phase.

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

### Phase 17: Foundation & Tokens (7 requirements)
| Requirement | Description | Status |
|-------------|-------------|--------|
| TYPO-01 | Custom display font (Plus Jakarta Sans Variable) | Complete |
| TYPO-02 | Body font pairing configured | Complete |
| TYPO-03 | Typographic scale with fluid type | Complete |
| TYPO-04 | Font preloading in __root.tsx | Complete |
| TYPO-05 | Optional serif accent font (Lora Variable) | Complete |
| ATMO-03 | Extended warm neutral palette in design tokens | Complete |
| MOTN-06 | Animation keyframes and easing in design tokens | Complete |

### Phase 18: Core Visual Polish (17 requirements)
| Requirement | Description | Status |
|-------------|-------------|--------|
| TYPO-06 | Typography applied consistently across pages | Pending |
| ATMO-01 | Warm off-white backgrounds | Pending |
| ATMO-02 | Coral-tinted shadows | Pending |
| ATMO-04 | Gradient system extended to other pages | Pending |
| ATMO-05 | Noise/grain texture overlay | Pending |
| ATMO-06 | Atmospheric depth on all main pages | Pending |
| COMP-01 | Consistent border-radius system | Pending |
| COMP-06 | GradientBg reusable background component | Pending |
| PAGE-01 | Home page atmosphere updated | Pending |
| PAGE-02 | Profile view page visual hierarchy | Pending |
| PAGE-03 | Profile edit page styling | Pending |
| PAGE-04 | Matches page card presentation | Pending |
| PAGE-05 | Opportunities listing with effects | Pending |
| PAGE-06 | Opportunity detail page polish | Pending |
| PAGE-07 | Admin dashboard visual consistency | Pending |
| PAGE-08 | Login/auth flow polish maintained | Pending |
| PAGE-09 | Organizations page with map polish | Pending |

### Phase 19: Motion System (6 requirements)
| Requirement | Description | Status |
|-------------|-------------|--------|
| MOTN-01 | Card hover feedback (lift + shadow) | Pending |
| MOTN-02 | Smooth transitions with organic easing | Pending |
| MOTN-03 | Staggered card entrance animations | Pending |
| MOTN-04 | Page transitions between routes | Pending |
| MOTN-05 | Button press "squish" feedback | Pending |
| COMP-05 | AnimatedCard component with stagger | Pending |

### Phase 20: Polish & Integration (3 requirements)
| Requirement | Description | Status |
|-------------|-------------|--------|
| COMP-02 | Focus state styling (:focus-visible) | Pending |
| COMP-03 | Dark mode color refinement | Pending |
| COMP-04 | Empty state visual treatments | Pending |

**Coverage:**
- v1.3 requirements: 33 total
- Phase 17: 7 requirements
- Phase 18: 17 requirements
- Phase 19: 6 requirements
- Phase 20: 3 requirements
- Mapped total: 33
- Unmapped: 0

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 - traceability updated after roadmap creation*
