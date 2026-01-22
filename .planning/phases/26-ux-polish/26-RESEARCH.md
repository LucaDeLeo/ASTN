# Phase 26: UX Polish - Research

**Researched:** 2026-01-22
**Domain:** UI/UX Design System, Typography, Color Palette, Component Polish
**Confidence:** HIGH

## Summary

This research investigates how to transform ASTN from functional-but-generic to memorable-and-distinctive, addressing all issues identified in the UX review. The codebase already has a solid foundation with Tailwind v4, shadcn/ui components, OKLCH color system, and @fontsource variable fonts (Plus Jakarta Sans + Lora).

The current design uses coral/cream palette which the UX review correctly identifies as "soft and generic" for an AI Safety platform. The research identifies typography upgrades, a more serious color direction, and specific component fixes needed.

**Primary recommendation:** Evolve the existing design system incrementally - replace display font, shift color palette toward navy/slate with coral accents, and fix the 5 high-priority polish issues (location formatting, salary display, clickable cards, nav active states, empty state variety).

## Standard Stack

The project already uses the correct technologies. No new libraries required for this phase.

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| tailwindcss | ^4.1.13 | CSS framework with OKLCH support | In use |
| @fontsource-variable/plus-jakarta-sans | ^5.2.8 | Body font | In use |
| @fontsource-variable/lora | ^5.2.8 | Display font (serif) | In use, may replace |
| tw-animate-css | ^1.4.0 | Animation utilities | In use |

### Typography Options (Research Finding)
| Font | Source | Characteristics | Availability |
|------|--------|-----------------|--------------|
| Clash Display | FontShare | Bold, geometric, modern display | NOT on Fontsource - requires manual hosting |
| General Sans | FontShare | Clean, versatile, professional | NOT on Fontsource - requires manual hosting |
| Cabinet Grotesk | FontShare | Contemporary, distinctive | NOT on Fontsource - requires manual hosting |
| Space Grotesk | Google/Fontsource | Geometric, technical feel | `@fontsource-variable/space-grotesk` |
| Host Grotesk | Google/Fontsource | Modern, professional | `@fontsource/host-grotesk` |
| Schibsted Grotesk | Google/Fontsource | Clean, Scandinavian | `@fontsource-variable/schibsted-grotesk` |

**Recommendation:** Use **Space Grotesk** for headings - it's available on Fontsource, has a technical/serious feel appropriate for AI Safety, and pairs well with Plus Jakarta Sans for body text. This avoids complexity of self-hosting FontShare fonts.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Space Grotesk | Clash Display | Clash Display is more distinctive but requires manual font hosting (download from FontShare, convert to woff2, add @font-face) |
| Plus Jakarta Sans (body) | Inter | Inter is ubiquitous; Plus Jakarta Sans is already distinctive enough |

## Architecture Patterns

### Current Typography Structure
```
src/styles/app.css
├── @import "@fontsource-variable/plus-jakarta-sans"
├── @import "@fontsource-variable/lora"
├── @theme inline { --font-display, --font-body }
└── Font preloads in __root.tsx
```

### Pattern 1: Font Replacement (Fontsource)
**What:** Replace Lora with Space Grotesk for display headings
**When to use:** When new font is available on Fontsource

```typescript
// 1. Install: bun add @fontsource-variable/space-grotesk

// 2. Update src/styles/app.css
@import "@fontsource-variable/space-grotesk";
// Remove: @import "@fontsource-variable/lora";

@theme inline {
  --font-display: "Space Grotesk Variable", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans Variable", system-ui, sans-serif;
}

// 3. Update __root.tsx preload
import spaceGroteskWoff2 from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url'
```

### Pattern 2: Color Palette Evolution (OKLCH)
**What:** Shift from coral/cream to navy/slate with coral accents
**When to use:** To convey seriousness while retaining brand warmth

```css
/* Current coral primary: oklch(0.70 0.16 30) */
/* New approach: Navy base with coral accent */

:root {
  /* Navy/slate base - professional, serious */
  --navy-900: oklch(0.20 0.03 250);  /* Deep navy */
  --navy-800: oklch(0.25 0.03 250);
  --navy-700: oklch(0.30 0.03 250);
  --slate-600: oklch(0.45 0.02 250);
  --slate-500: oklch(0.55 0.02 250);

  /* Keep coral as accent, not primary */
  --coral-accent: oklch(0.70 0.16 30);

  /* Update semantic tokens */
  --primary: var(--navy-800);
  --primary-foreground: oklch(0.98 0.01 90);
  --accent: var(--coral-accent);
}
```

### Pattern 3: TanStack Router Active States
**What:** Style navigation links based on active route
**When to use:** Desktop header navigation

```typescript
// Source: TanStack Router docs - activeProps pattern
<Link
  to="/opportunities"
  className="text-sm text-muted-foreground hover:text-foreground"
  activeProps={{
    className: "text-sm text-foreground font-medium border-b-2 border-primary"
  }}
>
  Opportunities
</Link>

// Or using render prop for complex states:
<Link to="/matches">
  {({ isActive }) => (
    <span className={cn(
      "text-sm transition-colors",
      isActive
        ? "text-foreground font-medium"
        : "text-muted-foreground hover:text-foreground"
    )}>
      Matches
    </span>
  )}
</Link>
```

### Pattern 4: Fully Clickable Card
**What:** Wrap entire card in Link, handle internal actions with stopPropagation
**When to use:** MatchCard, OpportunityCard

```typescript
// Current MatchCard: Only title is clickable via nested <Link>
// Fix: Wrap entire card in Link

export function MatchCard({ match }: MatchCardProps) {
  return (
    <Link
      to="/matches/$id"
      params={{ id: match._id }}
      viewTransition
      className="block"
    >
      <Card className="p-4 transition-shadow hover:shadow-md cursor-pointer">
        {/* Card content - no nested Link needed */}
        <h3 className="font-semibold">{match.opportunity.title}</h3>

        {/* For internal actions like Unsave button: */}
        {isSaved && onUnsave && (
          <button
            onClick={(e) => {
              e.preventDefault();  // Prevent Link navigation
              e.stopPropagation(); // Stop event bubbling
              onUnsave();
            }}
          >
            Unsave
          </button>
        )}
      </Card>
    </Link>
  );
}
```

### Anti-Patterns to Avoid
- **Nested Links:** Never nest `<Link>` inside `<Link>` - causes HTML validation errors
- **Hard-coded colors:** Always use CSS variables for colors to maintain dark mode support
- **FontShare self-hosting without fallbacks:** Always provide system font fallback stack

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading optimization | Manual @font-face with preload logic | @fontsource packages + Vite import | Handles subsetting, formats, and caching automatically |
| Color palette generation | Manual OKLCH calculations | Existing OKLCH primitives in app.css | Already has proper lightness/chroma relationships |
| Active link detection | Manual pathname matching | TanStack Router `activeProps` or `useMatchRoute` | Built-in, handles nested routes correctly |
| Empty state illustrations | Custom SVG per context | Extend existing `Empty` component variants | Already has themed SVG illustrations |

## Common Pitfalls

### Pitfall 1: Font Flash (FOIT/FOUT)
**What goes wrong:** Unstyled or invisible text during font load
**Why it happens:** Font file not preloaded, or loaded after critical CSS
**How to avoid:**
1. Keep font preloads BEFORE stylesheet in `<head>`
2. Use `font-display: swap` (Fontsource default)
3. Test on throttled network
**Warning signs:** Text appears/changes style after page load

### Pitfall 2: Dark Mode Color Contrast
**What goes wrong:** Text becomes unreadable in dark mode
**Why it happens:** Using light mode colors without dark mode overrides
**How to avoid:**
1. Always use semantic tokens (`--foreground`, `--muted-foreground`)
2. Test both modes when changing any color
3. Verify contrast ratio >= 4.5:1 for body text
**Warning signs:** Squinting at dark mode screens

### Pitfall 3: Breaking View Transitions
**What goes wrong:** Title morph animations stop working after refactoring
**Why it happens:** `view-transition-name` must be unique and present on both source and destination
**How to avoid:**
1. When making cards clickable, preserve the view-transition-name logic
2. The `sessionStorage` pattern for `ACTIVE_MATCH_KEY` must remain
3. Test navigation animations after any card restructuring
**Warning signs:** Instant page changes instead of smooth morphs

### Pitfall 4: Location String "Not Found" Source
**What goes wrong:** "Not Found" appears for salary when data missing
**Why it happens:** The data comes from 80K Hours API - `salaryRange` field may be missing
**How to avoid:**
1. Already handled correctly in opportunity-card.tsx (conditional render)
2. Check where "Not Found" string originates - likely in opportunity-detail.tsx or backend
3. Use conditional rendering: `{opportunity.salaryRange && <span>...</span>}`
**Warning signs:** Literal "Not Found" text visible to users

### Pitfall 5: Hardcoded slate-600 Colors
**What goes wrong:** Text doesn't adapt to dark mode
**Why it happens:** Using Tailwind color classes like `text-slate-600` instead of semantic tokens
**How to avoid:**
1. Replace `text-slate-600` with `text-muted-foreground`
2. Replace `bg-slate-100` with `bg-muted`
3. Search codebase for hardcoded Tailwind colors
**Warning signs:** Elements that look wrong in dark mode only

## Code Examples

### Location String Formatting Fix
```typescript
// Source: Codebase analysis - location comes from aggregation APIs
// Current: "San Francisco Bay Area.USA" (period instead of comma)

// Fix in convex/aggregation/eightyK.ts or normalize on display:
function formatLocation(location: string): string {
  // Normalize various separators
  return location
    .replace(/\.\s*/g, ', ')  // Period to comma
    .replace(/,\s*,/g, ',')   // Remove double commas
    .replace(/,\s*$/, '')     // Remove trailing comma
    .trim();
}

// Usage in component:
<span>{formatLocation(opportunity.location)}</span>
```

### Salary Display Fix
```typescript
// Source: opportunity-card.tsx analysis
// Current pattern (correct):
{opportunity.salaryRange && (
  <span className="flex items-center gap-1">
    <Banknote className="w-3.5 h-3.5" />
    {opportunity.salaryRange}
  </span>
)}

// If "Not Found" appears, check if it's the actual value from API
// Fix at source (aggregation) to use undefined instead of "Not Found":
salaryRange: hit.salary_range && hit.salary_range !== "Not Found"
  ? hit.salary_range
  : undefined,
```

### Empty State Variety
```typescript
// Source: src/components/ui/empty.tsx - already supports variants
// Current variants: 'no-data' | 'no-results' | 'error' | 'success'

// Add contextual variants:
type EmptyVariant =
  | 'no-data'
  | 'no-results'
  | 'error'
  | 'success'
  | 'no-matches'      // For matches page
  | 'no-opportunities' // For opportunities page
  | 'no-events'       // For events page
  | 'profile-incomplete' // For profile prompts

// With contextual messages and illustrations
const defaultTitles: Record<EmptyVariant, string> = {
  'no-matches': "No matches yet",
  'no-opportunities': "No opportunities found",
  'no-events': "No upcoming events",
  'profile-incomplete': "Complete your profile",
  // ... existing
};
```

### Navigation Active State (Desktop Header)
```typescript
// Source: src/components/layout/auth-header.tsx
// Current: Uses [&.active] CSS selector

// Improved with clearer visual indicator:
<Link
  to="/opportunities"
  className={cn(
    "text-sm transition-colors relative py-2",
    "text-muted-foreground hover:text-foreground"
  )}
  activeProps={{
    className: cn(
      "text-sm transition-colors relative py-2",
      "text-foreground font-medium",
      "after:absolute after:bottom-0 after:left-0 after:right-0",
      "after:h-0.5 after:bg-primary after:rounded-full"
    )
  }}
>
  Opportunities
</Link>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HSL colors | OKLCH colors | 2024 | Perceptually uniform, better dark mode |
| Static fonts | Variable fonts | 2023 | Single file, all weights, smaller bundle |
| Coral primary everywhere | Navy primary with coral accent | Recommendation | More serious, professional feel |
| Serif display font (Lora) | Geometric sans display (Space Grotesk) | Recommendation | More technical, modern feel |

**Current in codebase:**
- OKLCH color system (good)
- Variable fonts via Fontsource (good)
- CSS custom properties for theming (good)
- View transitions for navigation (good)

**Deprecated/outdated patterns to avoid:**
- HSL color functions (use OKLCH instead)
- Multiple font weight files (use variable fonts)
- JavaScript-based theme detection (use CSS media queries + SSR)

## Open Questions

1. **Typography Final Selection**
   - What we know: Space Grotesk available on Fontsource, good technical feel
   - What's unclear: Whether stakeholders prefer the bolder Clash Display (requires self-hosting)
   - Recommendation: Start with Space Grotesk, evaluate Clash Display as stretch goal

2. **Color Palette Exact Values**
   - What we know: Need to shift toward navy/slate for seriousness
   - What's unclear: Exact OKLCH values that work with existing coral accent
   - Recommendation: Create a color exploration task, test with real content

3. **Logo/Brand Mark**
   - What we know: Lower priority item from UX review
   - What's unclear: Whether design assets exist or need creation
   - Recommendation: Defer to separate phase or use text mark initially

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/styles/app.css`, `src/components/layout/`, `src/components/matches/MatchCard.tsx`
- TanStack Router docs: activeProps, Link component patterns
- Fontsource: Font availability verification

### Secondary (MEDIUM confidence)
- FontShare.com: Clash Display, General Sans availability (not on Fontsource)
- Exa search: Font pairing best practices 2025-2026
- Exa search: Corporate/professional color palettes

### Tertiary (LOW confidence)
- General web search: AI Safety visual design patterns (limited results, niche domain)

## Metadata

**Confidence breakdown:**
- Typography implementation: HIGH - Clear path using Fontsource
- Color palette direction: MEDIUM - General direction clear, exact values need iteration
- Component fixes: HIGH - Issues identified, patterns documented
- Active states: HIGH - TanStack Router patterns well documented

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable technologies, no rapid changes expected)
