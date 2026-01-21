# Requirements: v1.3 Visual Overhaul

**Defined:** 2026-01-19
**Core Value:** Transform ASTN from generic shadcn/ui (3.7/10) to a warm, memorable visual identity (8+/10) that says "AI safety is about people."

## v1.3 Requirements

33 requirements for visual overhaul across 5 categories. Each maps to exactly one roadmap phase.

### Typography

- [x] **TYPO-01**: Custom display font installed and loaded (Plus Jakarta Sans Variable)
- [x] **TYPO-02**: Body font pairing configured for readability
- [x] **TYPO-03**: Typographic scale defined with responsive sizing (fluid type)
- [x] **TYPO-04**: Font preloading infrastructure in __root.tsx
- [x] **TYPO-05**: Optional serif accent font for quotes/testimonials (Lora Variable)
- [x] **TYPO-06**: Typography applied consistently across all pages

### Atmosphere

- [x] **ATMO-01**: Warm off-white backgrounds replace flat gray-50 throughout
- [x] **ATMO-02**: Coral-tinted shadows replace gray shadows
- [x] **ATMO-03**: Extended warm neutral palette defined in design tokens
- [x] **ATMO-04**: Gradient system extends login page treatment to other pages
- [x] **ATMO-05**: Noise/grain texture overlay (2-4% opacity) adds tactility
- [x] **ATMO-06**: Atmospheric depth applied to all main pages

### Motion

- [x] **MOTN-01**: Card hover feedback (lift + shadow transition)
- [x] **MOTN-02**: Smooth transitions (150-300ms) with organic easing curves
- [x] **MOTN-03**: Staggered card entrance animations on list pages
- [x] **MOTN-04**: Page transitions between routes
- [x] **MOTN-05**: Button press "squish" feedback effect
- [x] **MOTN-06**: Animation keyframes and easing defined in design tokens

### Components

- [x] **COMP-01**: Consistent border-radius system (12-16px base)
- [x] **COMP-02**: Focus state styling (:focus-visible) on all interactive elements
- [x] **COMP-03**: Dark mode color refinement (intentional coral, not inverted)
- [x] **COMP-04**: Empty state visual treatments with warmth
- [x] **COMP-05**: AnimatedCard component with stagger support
- [x] **COMP-06**: GradientBg reusable background component

### Pages

- [x] **PAGE-01**: Home page atmosphere and layout updated
- [x] **PAGE-02**: Profile view page visual hierarchy improved
- [x] **PAGE-03**: Profile edit page with consistent styling
- [x] **PAGE-04**: Matches page card presentation enhanced
- [x] **PAGE-05**: Opportunities listing with hover effects
- [x] **PAGE-06**: Opportunity detail page polish
- [x] **PAGE-07**: Admin dashboard visual consistency
- [x] **PAGE-08**: Login/auth flow polish maintained
- [x] **PAGE-09**: Organizations page with map integration polish

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
| TYPO-06 | Typography applied consistently across pages | Complete |
| ATMO-01 | Warm off-white backgrounds | Complete |
| ATMO-02 | Coral-tinted shadows | Complete |
| ATMO-04 | Gradient system extended to other pages | Complete |
| ATMO-05 | Noise/grain texture overlay | Complete |
| ATMO-06 | Atmospheric depth on all main pages | Complete |
| COMP-01 | Consistent border-radius system | Complete |
| COMP-06 | GradientBg reusable background component | Complete |
| PAGE-01 | Home page atmosphere updated | Complete |
| PAGE-02 | Profile view page visual hierarchy | Complete |
| PAGE-03 | Profile edit page styling | Complete |
| PAGE-04 | Matches page card presentation | Complete |
| PAGE-05 | Opportunities listing with effects | Complete |
| PAGE-06 | Opportunity detail page polish | Complete |
| PAGE-07 | Admin dashboard visual consistency | Complete |
| PAGE-08 | Login/auth flow polish maintained | Complete |
| PAGE-09 | Organizations page with map polish | Complete |

### Phase 19: Motion System (6 requirements)
| Requirement | Description | Status |
|-------------|-------------|--------|
| MOTN-01 | Card hover feedback (lift + shadow) | Complete |
| MOTN-02 | Smooth transitions with organic easing | Complete |
| MOTN-03 | Staggered card entrance animations | Complete |
| MOTN-04 | Page transitions between routes | Complete |
| MOTN-05 | Button press "squish" feedback | Complete |
| COMP-05 | AnimatedCard component with stagger | Complete |

### Phase 20: Polish & Integration (3 requirements)
| Requirement | Description | Status |
|-------------|-------------|--------|
| COMP-02 | Focus state styling (:focus-visible) | Complete |
| COMP-03 | Dark mode color refinement | Complete |
| COMP-04 | Empty state visual treatments | Complete |

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
*Last updated: 2026-01-20 - All v1.3 requirements complete (33/33)*
