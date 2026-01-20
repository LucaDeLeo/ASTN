# Phase 18: Core Visual Polish - Research

**Researched:** 2026-01-19
**Domain:** Visual Design System Application (CSS, Tailwind v4, React Components)
**Confidence:** HIGH

## Summary

This phase applies the design tokens established in Phase 17 across all pages and components to transform the app from generic shadcn/ui styling to a warm, memorable visual identity. The research focused on understanding what exists (tokens, pages, components) and what needs to change.

Phase 17 successfully established:
- Warm color palette: cream (4 steps), coral (10 steps), teal accent (2 steps)
- Typography: Plus Jakarta Sans (body), Lora (headings), fluid type scale
- Animation tokens: 4 keyframes, 6 easing functions, 4 durations
- Tailwind v4 integration via `@theme inline`

The current state shows most pages use `bg-slate-50` backgrounds, gray shadows, and minimal use of the new tokens. The login page is the only page with warm treatment (gradient background, coral-tinted shadow).

**Primary recommendation:** Create a GradientBg component and warm shadow utilities, then systematically apply them across all 9 main pages, starting with the highest-traffic pages (home, opportunities, matches).

## Current State Analysis

### Design Tokens Available (from Phase 17)

| Token Category | Values | Tailwind Class |
|----------------|--------|----------------|
| Cream colors | cream-50, cream-100, cream-200, cream-300 | `bg-cream-50`, etc. |
| Coral colors | coral-50 through coral-900 | `bg-coral-500`, etc. |
| Teal accent | teal-500, teal-600 | `bg-teal-500`, etc. |
| Font display | Lora Variable | `font-display` |
| Font body | Plus Jakarta Sans Variable | `font-body` |
| Animations | fade-in, slide-up, slide-down, scale-in | `animate-fade-in`, etc. |
| Easing | spring, gentle, in, out, in-out | `ease-spring`, etc. |

### Pages Requiring Visual Polish

| Page | File | Current Background | Shadows | Typography |
|------|------|-------------------|---------|------------|
| Home | `src/routes/index.tsx` | `bg-background` | Gray (via Card) | `font-mono` headers |
| Login | `src/routes/login.tsx` | Warm gradient (already done) | Coral-tinted | `font-mono` |
| Profile View | `src/routes/profile/index.tsx` | `bg-slate-50` | Gray | `font-bold` |
| Profile Edit | `src/routes/profile/edit.tsx` | `bg-slate-50` | Gray | `font-bold` |
| Matches List | `src/routes/matches/index.tsx` | `bg-slate-50` | Gray | `font-bold` |
| Match Detail | `src/routes/matches/$id.tsx` | `bg-slate-50` | Gray | `font-bold` |
| Opportunities List | `src/routes/opportunities/index.tsx` | `bg-slate-50` | Gray | `font-bold` |
| Opportunity Detail | `src/routes/opportunities/$id.tsx` | `bg-slate-50` | Gray | `font-mono` |
| Admin Dashboard | `src/routes/admin/index.tsx` | `bg-slate-50` (via route.tsx) | Gray | `font-bold` |
| Organizations | `src/routes/orgs/index.tsx` | `bg-slate-50` | Gray | `font-bold` |

### Current Shadow Pattern (to replace)

The Card component uses shadcn default shadow:
```tsx
// Current: Generic gray shadow
className="shadow-sm"
```

The login card already has warm shadow:
```tsx
// Target: Coral-tinted shadow
className="shadow-[0_8px_30px_oklch(0.70_0.08_30/0.15)]"
```

### Current Background Pattern (to replace)

Most pages use:
```tsx
// Current: Flat gray
className="min-h-screen bg-slate-50"
```

Login page already has gradient:
```tsx
// Target: Warm gradient with noise texture
style={{
  background: `radial-gradient(ellipse at center, oklch(0.98 0 0) 0%, oklch(0.96 0.02 30) 70%, oklch(0.94 0.04 30) 100%)`,
  backgroundImage: `/* gradient + noise SVG */`
}}
```

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── GradientBg.tsx        # NEW: Reusable warm background
│   │   ├── PageContainer.tsx     # NEW: Standard page wrapper
│   │   └── auth-header.tsx       # Update with warm styling
│   └── ui/
│       └── card.tsx              # Update shadow to coral-tinted
```

### Pattern 1: GradientBg Component (COMP-06)

**What:** Reusable background component that provides warm gradient + noise texture
**When to use:** Full-page backgrounds, hero sections, prominent containers
**Recommended Implementation:**

```tsx
// Source: Based on existing login.tsx pattern
interface GradientBgProps {
  variant?: 'radial' | 'linear' | 'subtle';
  children: React.ReactNode;
  className?: string;
}

export function GradientBg({
  variant = 'radial',
  children,
  className
}: GradientBgProps) {
  const gradientStyle = {
    radial: `radial-gradient(ellipse at center,
      oklch(0.98 0 0) 0%,
      oklch(0.96 0.02 30) 70%,
      oklch(0.94 0.04 30) 100%)`,
    linear: `linear-gradient(135deg,
      oklch(0.98 0.01 90) 0%,
      oklch(0.96 0.02 30) 100%)`,
    subtle: `linear-gradient(180deg,
      oklch(0.99 0.01 90) 0%,
      oklch(0.97 0.015 85) 100%)`
  };

  // Noise texture SVG (2-4% opacity per ATMO-05)
  const noise = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`;

  return (
    <div
      className={cn("min-h-screen", className)}
      style={{
        background: gradientStyle[variant],
        backgroundImage: `${gradientStyle[variant]}, ${noise}`,
      }}
    >
      {children}
    </div>
  );
}
```

### Pattern 2: Warm Shadows

**What:** Replace gray shadows with coral-tinted shadows
**Implementation options:**

Option A: CSS custom property (recommended for global consistency):
```css
/* In app.css */
--shadow-warm-sm: 0 1px 2px oklch(0.70 0.04 30 / 0.06);
--shadow-warm: 0 4px 12px oklch(0.70 0.06 30 / 0.08);
--shadow-warm-md: 0 8px 24px oklch(0.70 0.08 30 / 0.12);
--shadow-warm-lg: 0 12px 40px oklch(0.70 0.08 30 / 0.15);
```

Option B: Tailwind arbitrary value (per-component):
```tsx
className="shadow-[0_4px_12px_oklch(0.70_0.06_30/0.08)]"
```

### Pattern 3: Page Background Hierarchy

Per CONTEXT.md decisions:
- **List pages:** Warm cards on light cream background
- **Detail pages:** Claude's discretion for header prominence
- **Admin pages:** Dot grid pattern for visual differentiation

```tsx
// List page pattern (opportunities, matches, orgs)
<GradientBg variant="subtle">
  <main className="container mx-auto">
    <Card className="bg-cream-50 shadow-warm">
      {/* Content */}
    </Card>
  </main>
</GradientBg>

// Admin page pattern
<div
  className="min-h-screen"
  style={{
    backgroundImage: `
      radial-gradient(circle, oklch(0.7 0.05 30 / 0.1) 1px, transparent 1px)
    `,
    backgroundSize: '20px 20px',
    backgroundColor: 'oklch(0.98 0.01 90)'
  }}
>
  {/* Admin content */}
</div>
```

### Pattern 4: Typography Application (TYPO-06)

**Heading hierarchy:**
```tsx
// Page titles - Lora, larger
<h1 className="font-display text-3xl font-semibold text-foreground">

// Section titles - Lora, medium
<h2 className="font-display text-xl font-medium text-foreground">

// Card titles - Plus Jakarta Sans, medium weight
<h3 className="font-body text-lg font-semibold text-slate-900">

// Body text - Plus Jakarta Sans
<p className="font-body text-base text-slate-600">
```

### Pattern 5: Compact & Dense Layout

Per CONTEXT.md: "Compact & dense - information-forward, minimal wasted space"

```tsx
// Card spacing - tighter than default shadcn
<Card className="p-4"> // Instead of p-6

// Related fields close together
<div className="space-y-3"> // Instead of space-y-6

// Container width - medium (900-1100px)
<main className="container mx-auto max-w-5xl px-4">
```

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Noise texture | Canvas-based generator | SVG data URL inline | Better performance, no JS, works with SSR |
| Gradient backgrounds | Multiple div layers | CSS background-image with multiple values | Single DOM element, proper stacking |
| Warm shadows | Filter-based color shift | OKLCH color in box-shadow | Direct color control, no filter overhead |
| Font loading | Manual fetch/inject | @fontsource-variable packages | Already set up in Phase 17, handles FOIT/FOUT |

## Common Pitfalls

### Pitfall 1: Inconsistent Token Usage
**What goes wrong:** Mixing old slate-* colors with new cream-* tokens
**Why it happens:** Copying existing code that uses slate palette
**How to avoid:** Search-and-replace slate-50 with cream-50, slate-100 with cream-100
**Warning signs:** Visual inconsistency between pages, some warm some gray

### Pitfall 2: Shadow Color Space Issues
**What goes wrong:** Coral tint looks different across browsers
**Why it happens:** Using HSL or RGB instead of OKLCH
**How to avoid:** Use OKLCH for all coral shadow colors (already established in tokens)
**Warning signs:** Safari showing different shadow tint than Chrome

### Pitfall 3: Breaking Card Component Consumers
**What goes wrong:** Changing Card defaults breaks existing layouts
**Why it happens:** Components rely on current shadow/padding
**How to avoid:** Add new shadow as variant or additional class, don't replace default immediately
**Warning signs:** Spacing/shadow changes in unexpected places

### Pitfall 4: Noise Texture Performance
**What goes wrong:** Page feels slow, especially on resize
**Why it happens:** Using CSS filter instead of static SVG
**How to avoid:** Use inline SVG data URL (as in login.tsx), not filter
**Warning signs:** DevTools shows repaint on scroll

### Pitfall 5: Typography Font Loading Regression
**What goes wrong:** FOIT returns (text invisible during load)
**Why it happens:** Adding font-display classes without verifying preload still works
**How to avoid:** Phase 17 already handles this; don't change __root.tsx preload config
**Warning signs:** Flash of invisible text on first load

## Code Examples

### Example 1: Converting a Page Background

**Before:**
```tsx
function MatchesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      {/* ... */}
    </div>
  );
}
```

**After:**
```tsx
import { GradientBg } from "~/components/layout/GradientBg";

function MatchesPage() {
  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      {/* ... */}
    </GradientBg>
  );
}
```

### Example 2: Applying Warm Shadow to Cards

**Before:**
```tsx
<Card className="p-4 hover:shadow-md transition-shadow">
```

**After:**
```tsx
<Card className="p-4 shadow-warm hover:shadow-warm-md transition-shadow">
```

### Example 3: Typography Hierarchy

**Before:**
```tsx
<h1 className="text-2xl font-bold text-slate-900">Your Matches</h1>
<p className="text-slate-500 mt-1">Opportunities matched to your profile</p>
```

**After:**
```tsx
<h1 className="font-display text-2xl font-semibold text-foreground">Your Matches</h1>
<p className="font-body text-muted-foreground mt-1">Opportunities matched to your profile</p>
```

### Example 4: Admin Dot Grid Pattern

```tsx
function AdminLayout() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `radial-gradient(circle, oklch(0.7 0.05 30 / 0.15) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        backgroundColor: 'var(--cream-50)'
      }}
    >
      {/* Admin content */}
    </div>
  );
}
```

## Files to Modify

### High Priority (Core Infrastructure)

| File | Changes |
|------|---------|
| `src/styles/app.css` | Add warm shadow tokens to `:root` |
| `src/components/layout/GradientBg.tsx` | **CREATE** - Reusable background component |
| `src/components/ui/card.tsx` | Add warm shadow variant |

### Medium Priority (Main Pages)

| File | Changes |
|------|---------|
| `src/routes/index.tsx` | Apply GradientBg, update typography |
| `src/routes/profile/index.tsx` | bg-slate-50 -> GradientBg, typography |
| `src/routes/profile/edit.tsx` | bg-slate-50 -> GradientBg, typography |
| `src/routes/matches/index.tsx` | bg-slate-50 -> GradientBg, card shadows |
| `src/routes/matches/$id.tsx` | bg-slate-50 -> GradientBg, typography |
| `src/routes/opportunities/index.tsx` | bg-slate-50 -> GradientBg |
| `src/routes/opportunities/$id.tsx` | bg-slate-50 -> GradientBg, typography |
| `src/routes/orgs/index.tsx` | bg-slate-50 -> GradientBg |
| `src/routes/admin/route.tsx` | Apply dot grid pattern |
| `src/routes/admin/index.tsx` | Update card shadows |

### Lower Priority (Components)

| File | Changes |
|------|---------|
| `src/components/layout/auth-header.tsx` | Warm styling for header |
| `src/components/matches/MatchCard.tsx` | Warm shadow, typography |
| `src/components/opportunities/opportunity-card.tsx` | Warm shadow, remove font-mono |
| `src/components/opportunities/opportunity-detail.tsx` | Typography updates |
| `src/components/org/OrgCard.tsx` | Warm shadow |

## Border Radius System (COMP-01)

Current tokens in app.css:
```css
--radius: 0.625rem;  /* 10px base */
--radius-lg: var(--radius);  /* 10px */
--radius-xl: calc(var(--radius) + 4px);  /* 14px */
--radius-2xl: calc(var(--radius) + 8px);  /* 18px */
```

Recommendation: Use 12-16px as base for cards per requirement:
- Cards: `rounded-xl` (14px) or `rounded-2xl` (18px)
- Buttons: `rounded-lg` (10px) - keep current
- Badges: `rounded-md` or `rounded-lg`
- Inputs: `rounded-lg`

## Open Questions

1. **Header background treatment**
   - What we know: Header is currently white with bottom border
   - What's unclear: Should it get subtle cream tint or stay white for contrast?
   - Recommendation: Keep white for now, creates visual anchor

2. **Card background color**
   - What we know: Cards are currently bg-card (white)
   - What's unclear: Should cards be cream-50 or stay white?
   - Recommendation: Keep cards white, use cream in page backgrounds for layering effect

## Sources

### Primary (HIGH confidence)
- `src/styles/app.css` - All Phase 17 tokens verified present
- `src/routes/login.tsx` - Reference implementation for warm treatment
- `.planning/phases/17-foundation-tokens/17-VERIFICATION.md` - Token verification

### Secondary (MEDIUM confidence)
- `.planning/phases/18-core-visual-polish/18-CONTEXT.md` - User decisions locked

## Metadata

**Confidence breakdown:**
- Token availability: HIGH - Verified in app.css
- Pattern recommendations: HIGH - Based on existing login.tsx implementation
- Page modifications: HIGH - All pages read and analyzed
- Pitfalls: MEDIUM - Based on general CSS/React patterns

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (tokens stable, no external dependencies)

---
*Phase: 18-core-visual-polish*
*Researcher: Claude (gsd-researcher)*
