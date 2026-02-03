# Phase 17: Foundation & Tokens - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the design system foundation — tokens, fonts, and CSS architecture that all visual phases depend on. Install fonts, define design tokens (colors, typography, spacing, animation), integrate with Tailwind v4, and set up CSS custom properties. No visual changes to pages yet — that's Phase 18.

</domain>

<decisions>
## Implementation Decisions

### Color palette & warmth

- Coral intensity: Subtle blush — barely-there warmth, mostly in shadows and tints, refined and almost neutral
- Backgrounds: Cream paper — warm ivory like aged stationery with soft yellow undertone
- Dark mode: Warm dark — deep charcoal with coral undertones (dark chocolate, not black coffee)
- Secondary accent: Complementary muted teal or slate blue for contrast moments
- Semantic colors: Warm-shifted — sage-green success, amber warning, brick-red error
- Gradients: Subtle atmospheric — very soft gradient backgrounds for depth, like soft light hitting paper
- Reference: Linear/Notion aesthetic — clean, minimal, warmth is subtle and professional

### Typography personality

- Font pairing: Split personality — Lora (serif) for all headings, Plus Jakarta Sans for body text
- Heading weight: Regular (400) — elegant and refined, let the serif shapes do the work
- Body text: Balanced — comfortable reading with 1.5-1.6 line-height, 400 weight
- Typographic scale: Clear hierarchy — obvious jumps between levels for easy scanning

### Token organization

- Naming convention: Hybrid — raw scales as primitives (--coral-500), semantic tokens built on top (--color-accent)
- Component tokens: Yes, explicit — named tokens per component type (--card-radius, --card-shadow, --button-padding)

### Animation foundations

- Motion personality: Gentle & organic — soft easing, slightly slower, like natural materials settling
- Default easing: Custom spring — slight overshoot and settle, organic with a playful edge
- Duration range: 200-400ms — slightly leisurely, lets you appreciate the movement
- Hover effects: Clear feedback — obvious lift with shadow growth, satisfying but not dramatic
- Button press: Both scale (0.97-0.98 shrink) and shadow reduction for satisfying tactile click
- Entrance animations: Yes, staggered — elements fade/slide in with staggered timing on page load
- Reduced motion: Simplified — fade only, no movement, still has some polish

### Claude's Discretion

- Shadow warmth intensity (how visible the coral tint is)
- Tailwind integration scope (which tokens become utilities)
- Spacing scale granularity (standard vs extended)
- Stagger animation limit (how many items animate before rest appears)

</decisions>

<specifics>
## Specific Ideas

- "Linear/Notion — clean, minimal, warmth is subtle and professional"
- Spring easing should feel organic, not bouncy — slight overshoot like natural materials settling
- Cream paper backgrounds like aged stationery, not stark white

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 17-foundation-tokens_
_Context gathered: 2026-01-19_
