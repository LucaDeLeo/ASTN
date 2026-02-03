# Phase 20: Polish & Integration - Research

**Researched:** 2026-01-20
**Domain:** Dark mode theming, accessibility focus states, empty state design, performance
**Confidence:** HIGH

## Summary

This phase finalizes the visual system by implementing intentional dark mode with coral accent preservation, consistent focus states for accessibility, warm empty state treatments, and performance validation. The research covers three distinct domains that require coordinated implementation.

The codebase currently has:

- Dark mode tokens defined in `.dark` class (but using default gray palette, not coral-based)
- Focus states using `focus-visible:ring-ring/50` pattern across shadcn/ui components
- A basic `Empty` component in `src/components/ui/empty.tsx` with gray styling
- No theme provider or toggle mechanism in place

**Primary recommendation:** Create a ThemeProvider with system preference detection and manual override, update dark mode CSS variables to use coral-tinted palette, standardize focus states to use coral ring with glow, and enhance Empty component with warm illustrations and playful copy.

## Standard Stack

### Core (Already Installed)

| Library      | Version | Purpose                            | Why Standard                                    |
| ------------ | ------- | ---------------------------------- | ----------------------------------------------- |
| Tailwind v4  | ^4.1.13 | CSS framework with `@theme inline` | Already configured with OKLCH tokens            |
| Radix UI     | various | Accessible component primitives    | Already used throughout UI components           |
| Lucide React | latest  | Icon library                       | Already installed, can be used for empty states |

### Supporting (Needs Implementation)

| Library       | Purpose                      | When to Use                      |
| ------------- | ---------------------------- | -------------------------------- |
| React Context | Theme state management       | Built-in, no installation needed |
| localStorage  | Theme preference persistence | Browser API, no installation     |
| matchMedia    | System preference detection  | Browser API, no installation     |

### Alternatives Considered

| Instead of           | Could Use         | Tradeoff                                                                   |
| -------------------- | ----------------- | -------------------------------------------------------------------------- |
| Custom ThemeProvider | next-themes       | next-themes is Next.js-specific; custom provider works with TanStack Start |
| SVG illustrations    | Lottie animations | Lottie adds bundle size; simple SVGs match "line art" requirement          |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── theme/
│   │   ├── theme-provider.tsx    # NEW: Context + Provider
│   │   ├── theme-toggle.tsx      # NEW: Toggle component
│   │   └── use-theme.ts          # NEW: Hook export
│   └── ui/
│       └── empty.tsx             # UPDATE: Warm styling + illustrations
├── styles/
│   └── app.css                   # UPDATE: Coral-based dark mode tokens
└── routes/
    └── __root.tsx                # UPDATE: Wrap with ThemeProvider
```

### Pattern 1: ThemeProvider with System Preference

**What:** React Context provider that manages theme state with localStorage persistence and system preference detection.
**When to use:** Wrap the app root to provide theme context to all components.

```tsx
// Source: shadcn/ui Vite dark mode guide + TanStack Router integration
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

const ThemeProviderContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({
  theme: 'system',
  setTheme: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'astn-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
```

### Pattern 2: Coral-Based Dark Mode Palette

**What:** Dark mode tokens that preserve coral accent instead of inverting to neutral gray.
**When to use:** Replace current `.dark` block in app.css.

Per CONTEXT.md decisions:

- Soft dark base (#1a1a1a / `oklch(0.13 0 0)`) - charcoal gray, easier on eyes
- Keep exact coral accent color - pops well on dark backgrounds
- Warm-shifted neutrals instead of pure grays

```css
/* Source: CONTEXT.md decisions + OKLCH color theory */
.dark {
  /* Base backgrounds - soft charcoal, not OLED black */
  --background: oklch(0.13 0.005 30); /* Subtle warm undertone */
  --foreground: oklch(0.93 0.01 90); /* Warm off-white */

  /* Card/popover - slightly elevated from background */
  --card: oklch(0.17 0.005 30);
  --card-foreground: oklch(0.93 0.01 90);
  --popover: oklch(0.17 0.005 30);
  --popover-foreground: oklch(0.93 0.01 90);

  /* Primary - KEEP coral accent (same as light mode) */
  --primary: oklch(0.7 0.16 30); /* Exact coral from light mode */
  --primary-foreground: oklch(0.13 0.005 30);

  /* Secondary - warm dark gray */
  --secondary: oklch(0.22 0.01 30);
  --secondary-foreground: oklch(0.93 0.01 90);

  /* Muted - for subtle backgrounds */
  --muted: oklch(0.22 0.01 30);
  --muted-foreground: oklch(0.65 0.02 90);

  /* Accent - coral-tinted for hover states */
  --accent: oklch(0.25 0.03 30);
  --accent-foreground: oklch(0.93 0.01 90);

  /* Destructive - brighter in dark mode for visibility */
  --destructive: oklch(0.65 0.2 25);

  /* Borders - subtle warm tint */
  --border: oklch(0.28 0.01 30);
  --input: oklch(0.22 0.01 30);

  /* Ring - coral for focus states */
  --ring: oklch(0.7 0.16 30);

  /* Sidebar - consistent with card */
  --sidebar: oklch(0.15 0.005 30);
  --sidebar-foreground: oklch(0.93 0.01 90);
  --sidebar-primary: oklch(0.7 0.16 30);
  --sidebar-primary-foreground: oklch(0.13 0.005 30);
  --sidebar-accent: oklch(0.22 0.01 30);
  --sidebar-accent-foreground: oklch(0.93 0.01 90);
  --sidebar-border: oklch(0.28 0.01 30);
  --sidebar-ring: oklch(0.7 0.16 30);
}
```

### Pattern 3: Coral Focus Ring with Glow

**What:** Consistent focus-visible styling using coral ring with subtle glow effect.
**When to use:** All interactive elements (buttons, inputs, links, checkboxes, etc.).

Per CONTEXT.md decisions:

- Coral ring with soft glow - matches shadow aesthetic
- Always visible focus - shows on keyboard navigation
- 2px coral ring plus subtle coral glow effect

```css
/* Focus ring token - add to :root */
:root {
  --focus-ring:
    0 0 0 2px oklch(0.7 0.16 30), 0 0 0 4px oklch(0.7 0.16 30 / 0.3);
}

.dark {
  /* Brighter ring in dark mode for contrast */
  --focus-ring:
    0 0 0 2px oklch(0.75 0.18 30), 0 0 0 4px oklch(0.75 0.18 30 / 0.4);
}
```

**Component pattern:**

```tsx
// Update focus-visible classes
// Before:
'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// After:
'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
```

### Pattern 4: Warm Empty State Component

**What:** Enhanced Empty component with warm styling, custom SVG illustrations, and playful copy.
**When to use:** Replace current slate-colored empty states.

Per CONTEXT.md decisions:

- Playful tone - "Nothing here yet... but great things take time"
- Custom SVG illustrations - bespoke, personality-forward
- CTA only when actionable

```tsx
// Source: Design pattern research + CONTEXT.md requirements
interface EmptyProps {
  variant?: 'no-data' | 'no-results' | 'error' | 'success'
  title?: string
  description?: string
  action?: React.ReactNode
}

function Empty({
  variant = 'no-data',
  title,
  description,
  action,
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 text-coral-400">
        <EmptyIllustration variant={variant} />
      </div>
      <h3 className="font-display text-lg font-medium text-foreground">
        {title || defaultTitles[variant]}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description || defaultDescriptions[variant]}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

const defaultTitles = {
  'no-data': 'Nothing here yet',
  'no-results': 'No matches found',
  error: 'Something went wrong',
  success: 'All done!',
}

const defaultDescriptions = {
  'no-data': 'Great things take time. Check back soon!',
  'no-results': 'Try adjusting your filters or search terms.',
  error: "We're looking into it. Please try again.",
  success: "You're all caught up.",
}
```

### Anti-Patterns to Avoid

- **Inverting colors naively:** Don't just flip light to dark; design intentional dark palette with preserved accent
- **Removing focus outlines:** Never use `outline: none` without providing alternative visible indicator
- **Generic empty states:** Avoid "No data" without personality; use friendly copy and illustrations
- **Blocking animations:** Don't animate properties that trigger layout (width, height, margin)

## Don't Hand-Roll

| Problem                   | Don't Build                  | Use Instead                                | Why                                 |
| ------------------------- | ---------------------------- | ------------------------------------------ | ----------------------------------- |
| System theme detection    | Manual `matchMedia` polling  | Single `matchMedia` check + event listener | Browser handles preference changes  |
| Theme persistence         | Complex state management     | localStorage + React Context               | Simple, SSR-safe pattern            |
| Focus ring styling        | Custom outline per component | Shared CSS custom property                 | Consistency, single source of truth |
| Empty state illustrations | Complex SVG generation       | Simple line-art SVGs with `currentColor`   | Adapts to theme automatically       |

**Key insight:** The theme system is well-solved by the shadcn/ui pattern. The coral-specific dark mode requires only updating CSS variables, not rebuilding infrastructure.

## Common Pitfalls

### Pitfall 1: Flash of Incorrect Theme (FOIT)

**What goes wrong:** Page loads with light theme, then flashes to dark
**Why it happens:** Theme state initializes after hydration
**How to avoid:**

- Add inline script in `<head>` to set theme class before first paint
- Read localStorage synchronously before React hydration
  **Warning signs:** Visible flash on page load in dark mode

```html
<!-- Add to __root.tsx head -->
<script>
  ;(function () {
    const theme = localStorage.getItem('astn-theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (theme === 'dark' || (!theme && systemDark)) {
      document.documentElement.classList.add('dark')
    }
  })()
</script>
```

### Pitfall 2: Focus Ring Inconsistency

**What goes wrong:** Some components show coral ring, others show browser default
**Why it happens:** Not updating all shadcn/ui components
**How to avoid:**

- Audit all interactive components (button, input, select, checkbox, switch, tabs, etc.)
- Use find-and-replace for focus-visible patterns
- Test with keyboard navigation through entire app
  **Warning signs:** Blue browser outline appearing on some elements

### Pitfall 3: Empty State Duplication

**What goes wrong:** Multiple inline empty states with inconsistent styling
**Why it happens:** Empty states added ad-hoc in different files
**How to avoid:**

- Centralize in `Empty` component with variants
- Search codebase for existing empty state patterns to migrate
  **Warning signs:** Different styling for "no data" messages across pages

### Pitfall 4: Dark Mode Shadow Issues

**What goes wrong:** Coral shadows invisible or harsh in dark mode
**Why it happens:** Same shadow values don't work in both themes
**How to avoid:**

- Define separate shadow tokens for dark mode
- Consider subtle glow effect instead of drop shadow
  **Warning signs:** Cards look flat or have jarring colored glow in dark mode

### Pitfall 5: CLS from Theme Toggle

**What goes wrong:** Layout shifts when switching themes
**Why it happens:** Different font rendering or element sizing between themes
**How to avoid:**

- Ensure consistent dimensions regardless of theme
- Test theme switching in Lighthouse/DevTools
  **Warning signs:** CLS > 0.1 in Core Web Vitals

## Code Examples

### Example 1: Theme Toggle Component

```tsx
// src/components/theme/theme-toggle.tsx
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Example 2: Empty State SVG Illustration

```tsx
// Simple line-art illustration that uses currentColor
function NoDataIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn('h-24 w-24', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Simple inbox/folder illustration */}
      <rect x="20" y="40" width="80" height="60" rx="4" />
      <path d="M20 55 L60 75 L100 55" />
      <circle cx="60" cy="25" r="8" />
      <path d="M55 25 L65 25" />
    </svg>
  )
}
```

### Example 3: Focus State Update Pattern

```tsx
// Before (standard shadcn)
const buttonVariants = cva(
  '... focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ...',
)

// After (coral with glow)
const buttonVariants = cva(
  '... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ...',
)
```

### Example 4: Dark Mode Shadow Tokens

```css
/* app.css - add to :root */
:root {
  --shadow-warm-sm: 0 1px 2px oklch(0.7 0.04 30 / 0.06);
  --shadow-warm: 0 4px 12px oklch(0.7 0.06 30 / 0.08);
  --shadow-warm-md: 0 8px 24px oklch(0.7 0.08 30 / 0.12);
  --shadow-warm-lg: 0 12px 40px oklch(0.7 0.08 30 / 0.15);
}

.dark {
  /* Subtle glow effect in dark mode - Claude's discretion */
  --shadow-warm-sm:
    0 1px 3px oklch(0 0 0 / 0.3), 0 0 8px oklch(0.7 0.08 30 / 0.05);
  --shadow-warm:
    0 4px 12px oklch(0 0 0 / 0.4), 0 0 16px oklch(0.7 0.08 30 / 0.08);
  --shadow-warm-md:
    0 8px 24px oklch(0 0 0 / 0.5), 0 0 24px oklch(0.7 0.08 30 / 0.1);
  --shadow-warm-lg:
    0 12px 40px oklch(0 0 0 / 0.6), 0 0 32px oklch(0.7 0.08 30 / 0.12);
}
```

## State of the Art

| Old Approach      | Current Approach                | When Changed         | Impact                    |
| ----------------- | ------------------------------- | -------------------- | ------------------------- |
| `:focus` for all  | `:focus-visible` for keyboard   | Browser support 2022 | Better UX for mouse users |
| HSL/RGB colors    | OKLCH perceptual colors         | Tailwind v4 2024     | More consistent dark mode |
| `outline: none`   | Custom focus ring               | WCAG 2.4.7 awareness | Accessibility compliance  |
| Generic "No data" | Personality-driven empty states | UX research 2023+    | Better user engagement    |

**Current best practices:**

- Use `:focus-visible` not `:focus` for keyboard-only indicators
- OKLCH provides perceptually uniform color adjustments for dark mode
- Empty states should guide users, not just inform them

## Open Questions

1. **Dark mode shadow treatment**
   - What we know: Light shadows don't work on dark backgrounds
   - Options: Coral glow, neutral shadow, or no shadow
   - Recommendation: Subtle coral glow (implemented in code example)

2. **Focus state in dark mode**
   - What we know: Same coral may need brightness adjustment
   - Options: Same coral vs slightly brighter
   - Recommendation: Increase lightness from 0.70 to 0.75 in dark mode

3. **Theme toggle placement**
   - What we know: Needs to be accessible but not prominent
   - Options: Header, settings page, or both
   - Recommendation: Header (user's request for "settings" suggests header access)

## Performance Considerations

Per CONTEXT.md: "Performance first - disable or simplify animations if they hurt Core Web Vitals"

**LCP Impact:**

- Theme detection script should be minimal (<1KB)
- No impact on font loading (already preloaded)
- Empty state illustrations should be inline SVG (no network request)

**CLS Prevention:**

- Theme class applied before first paint prevents flash
- `scrollbar-gutter: stable` already in place
- No layout changes between themes

**Animation Performance:**

- Focus ring transitions use `transform` and `opacity` only
- Theme toggle animation is CSS-only
- Reduced motion respected via existing `@media (prefers-reduced-motion)` rules

**Targets:**

- LCP < 1.5s (CONTEXT.md target, stricter than 2.5s requirement)
- CLS < 0.1 (maintain current)

## Sources

### Primary (HIGH confidence)

- shadcn/ui v4 dark mode documentation - Theme provider pattern
- MDN `:focus-visible` documentation - Accessibility best practices
- Tailwind v4 `@custom-variant dark` - Dark mode implementation
- WCAG 2.4.7 Focus Visible guidelines - Accessibility requirements

### Secondary (MEDIUM confidence)

- TanStack Router dark mode integration guide - Context pattern
- CSS-Tricks focus-visible article - Implementation patterns

### Tertiary (LOW confidence)

- Various design system empty state patterns (Pluralsight, Semi Design)

## Metadata

**Confidence breakdown:**

- Dark mode implementation: HIGH - shadcn/ui pattern is well-documented
- Focus states: HIGH - WCAG guidelines are clear, `:focus-visible` is stable
- Empty states: MEDIUM - Design is subjective, but patterns are established
- Performance: HIGH - Core Web Vitals metrics are well-defined

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable domain, CSS standards)

---

_Phase: 20-polish-integration_
_Researcher: Claude (gsd-researcher)_
