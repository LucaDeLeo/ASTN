# Phase 20: Polish & Integration - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Finalize dark mode, accessibility, and performance — ensure the visual system works for all users. This includes dark mode with the warm coral palette, focus states for accessibility, empty state treatment, and performance validation.

</domain>

<decisions>
## Implementation Decisions

### Dark mode palette

- Soft dark base (#1a1a1a) — charcoal gray, easier on eyes for long reading
- Keep exact coral accent color — it pops well on dark backgrounds
- System + manual toggle — respect OS preference by default, let user override in settings

### Focus states

- Coral ring with soft glow — matches shadow aesthetic from light mode
- Always visible focus — shows on both keyboard and mouse focus (not just :focus-visible)
- 2px coral ring plus subtle coral glow effect

### Empty states

- Playful tone — "Nothing here yet... but great things take time" style
- Custom SVG illustrations — bespoke, personality-forward visuals
- CTA only when actionable — guide user to next action when there is one

### Performance

- Performance first — disable or simplify animations if they hurt Core Web Vitals
- Respect prefers-reduced-motion — disable animations for users with this OS preference
- Target LCP < 1.5s — aim higher than Google's "good" threshold

### Claude's Discretion

- Dark mode shadow treatment (coral glow vs neutral vs removed)
- Focus state adaptation in dark mode (same coral vs brighter)
- Font loading assessment and improvements if needed

</decisions>

<specifics>
## Specific Ideas

- Dark mode should feel like "soft dark" not OLED black — charcoal is easier for long reading sessions
- Empty state illustrations should be simple line art with personality, not heavy graphics
- Focus glow should echo the coral-tinted shadows used throughout light mode

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 20-polish-integration_
_Context gathered: 2026-01-20_
