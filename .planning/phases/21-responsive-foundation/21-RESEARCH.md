# Phase 21: Responsive Foundation - Research

**Researched:** 2026-01-21
**Domain:** Mobile-first responsive layout with Tailwind CSS v4 and shadcn/ui
**Confidence:** HIGH

## Summary

Phase 21 focuses on making ASTN display correctly on mobile viewports (375px minimum) with proper touch targets, form usability, and adapted layouts for data-heavy views. The codebase already uses Tailwind CSS v4 with a well-structured design token system, shadcn/ui components, and has fluid typography in place via CSS clamp().

The standard approach is mobile-first CSS using Tailwind's default breakpoints (sm:640px, md:768px, lg:1024px, xl:1280px). Per CONTEXT.md decisions: sidebars become bottom sheets, tables become cards on mobile, and forms use inline editing with sticky section headings. The existing shadcn/ui Dialog component already has responsive padding patterns (`max-w-[calc(100%-2rem)]`).

**Primary recommendation:** Apply mobile-first refactoring systematically - start with layout containers, then data components (tables/cards), then forms, finishing with skeleton states. Use existing design tokens and animation primitives.

## Standard Stack

The project already has the correct stack. No new libraries needed.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4.1.13 | Utility-first CSS | Mobile-first breakpoints built-in |
| @radix-ui/* | Various | Accessible primitives | shadcn/ui foundation |
| class-variance-authority | ^0.7.1 | Component variants | Consistent variant patterns |
| lucide-react | ^0.562.0 | Icons | Consistent icon set |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tw-animate-css | ^1.4.0 | Animation utilities | Already configured for transitions |
| sonner | ^2.0.7 | Toast notifications | Already responsive |

### What NOT to Add
| Instead of | Reason |
|------------|--------|
| react-responsive | Use Tailwind breakpoints + CSS, no JS media queries needed |
| @tanstack/react-virtual | Not needed for current data volumes; simple pagination exists |
| vaul (drawer) | Dialog already has responsive patterns; use CSS-only bottom sheet |

**Installation:** None required - all needed libraries are installed.

## Architecture Patterns

### Mobile-First Breakpoint Strategy

Per CONTEXT.md decisions, use Tailwind defaults progressively:

```
Base (no prefix)  = Mobile (375px+)
sm:               = 640px+ (large phones landscape)
md:               = 768px+ (tablets - get desktop patterns per decision)
lg:               = 1024px+ (desktops)
xl:               = 1280px+ (large desktops)
```

Pattern:
```tsx
// Mobile-first: base is mobile, add complexity with breakpoints
className="
  flex flex-col      // Mobile: stack vertically
  md:flex-row        // 768px+: horizontal layout
  gap-4
  md:gap-8           // More spacing on larger screens
"
```

### Responsive Layout Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── responsive-container.tsx   // Consistent max-widths
│   │   └── mobile-sheet.tsx           // Bottom sheet for sidebars
│   ├── ui/
│   │   ├── skeleton.tsx               // Add to shadcn
│   │   └── responsive-table.tsx       // Table/card switcher
│   └── [feature]/
│       └── [component].tsx            // Apply responsive classes
└── routes/
    └── [route].tsx                    // Responsive layouts per route
```

### Pattern 1: Sidebar to Bottom Sheet

Per decision: "Sidebars become bottom sheets on mobile (slide-up drawer)"

```tsx
// Source: Credenza pattern (Dialog on desktop, Drawer on mobile)
import { useMediaQuery } from "~/hooks/use-media-query"
import { Dialog, DialogContent } from "~/components/ui/dialog"

function ResponsiveSidebar({ children, open, onOpenChange }) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <aside className="hidden md:block w-64 border-r">
        {children}
      </aside>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed bottom-0 top-auto translate-y-0 rounded-t-lg rounded-b-none max-h-[85vh] overflow-y-auto">
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

### Pattern 2: Table to Cards

Per decision: "Opportunity tables become cards on mobile"

```tsx
// Responsive data display
function DataDisplay({ data }) {
  return (
    <>
      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-4">
        {data.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4">
              {/* Card content */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block">
        <table className="w-full">
          {/* Table content */}
        </table>
      </div>
    </>
  )
}
```

### Pattern 3: Compact List for Admin Tables

Per decision: "Admin CRM tables become compact lists (avatar + name + key stat)"

```tsx
function MemberListMobile({ members }) {
  return (
    <div className="md:hidden divide-y">
      {members.map(member => (
        <div key={member.id} className="flex items-center gap-3 py-3 px-4">
          <Avatar className="size-10">
            <AvatarFallback>{member.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{member.name}</p>
            <p className="text-sm text-muted-foreground">{member.keyStat}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* Actions */}
          </DropdownMenu>
        </div>
      ))}
    </div>
  )
}
```

### Pattern 4: Form with Labels Above (Mobile)

Per decision: "labels above inputs" and "sticky section headings"

```tsx
function FormField({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="block">{label}</Label>
      {children}
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <div>
      <h3 className="sticky top-0 bg-background py-2 font-semibold border-b mb-4 z-10">
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
```

### Pattern 5: Filter Chips with Sheet

Per decision: "show active filters as chips, 'Filter' button opens full filter sheet"

```tsx
function MobileFilters({ filters, onFiltersChange }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const activeFilters = Object.entries(filters).filter(([_, v]) => v)

  return (
    <div className="md:hidden">
      {/* Active filter chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {activeFilters.map(([key, value]) => (
          <Badge
            key={key}
            variant="secondary"
            className="pr-1"
          >
            {value}
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-4 ml-1"
              onClick={() => onFiltersChange({ ...filters, [key]: undefined })}
            >
              <X className="size-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Filter button */}
      <Button variant="outline" onClick={() => setSheetOpen(true)}>
        <Filter className="size-4 mr-2" />
        Filter
      </Button>

      {/* Filter sheet */}
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogContent className="fixed bottom-0 top-auto translate-y-0 rounded-t-lg rounded-b-none">
          {/* Full filter form */}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Hiding desktop content with `display: none` everywhere:** Use CSS-only responsive instead of JS where possible
- **Fixed pixel widths:** Use `w-full max-w-*` instead of `w-[400px]`
- **Side-by-side labels on mobile:** Always stack labels above inputs on mobile
- **Tiny touch targets:** Never go below 44x44px for interactive elements
- **Nested scrollable regions:** Avoid scroll-within-scroll on mobile

## Don't Hand-Roll

Problems with existing solutions in the stack:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Media query hook | Custom window listener | CSS breakpoints + hidden/block classes | CSS-only is simpler, no hydration issues |
| Bottom sheet | Custom drawer from scratch | Dialog with position classes | Already accessible, keyboard-navigable |
| Skeleton loading | Custom animated divs | shadcn Skeleton component | Consistent with design system |
| Touch feedback | Custom tap handlers | Tailwind `active:scale-[0.97]` | Already in Button, consistent |
| Smooth transitions | Manual CSS transitions | Existing `--duration-*` tokens | Design system consistency |

**Key insight:** The existing shadcn/ui Dialog, Card, and animation utilities provide everything needed. The responsive work is applying Tailwind classes correctly, not building new components.

## Common Pitfalls

### Pitfall 1: Touch Target Size Violations
**What goes wrong:** Buttons and links are tappable but too small for thumbs
**Why it happens:** Desktop designs have smaller click targets (mouse precision)
**How to avoid:** Add `min-h-11 min-w-11` (44px) to all interactive elements on mobile
**Warning signs:** Buttons with only `h-8` or `h-9` without mobile override

```tsx
// Fix: Ensure touch targets on mobile
<Button className="h-9 md:h-9 min-h-11 md:min-h-0">
  {/* 44px on mobile, 36px on desktop */}
</Button>
```

### Pitfall 2: Horizontal Overflow from Fixed Widths
**What goes wrong:** Content overflows viewport, causes horizontal scroll
**Why it happens:** Fixed widths like `w-64` or `w-[300px]` without responsive override
**How to avoid:** Always use `w-full max-w-*` pattern or responsive widths
**Warning signs:** Any `w-[*px]` without `w-full` or responsive variant

### Pitfall 3: Form Input Zoom on iOS
**What goes wrong:** iOS zooms in when focusing form inputs
**Why it happens:** Font size below 16px triggers Safari zoom behavior
**How to avoid:** Input text should be at least 16px on mobile (already in existing Input: `text-base`)
**Warning signs:** `text-sm` on inputs without mobile override

### Pitfall 4: Sticky Headers Covering Content
**What goes wrong:** Sticky filter bars or headers cover page content
**Why it happens:** Fixed heights not accounted for in scroll containers
**How to avoid:** Use proper `scroll-margin-top` or `pt-[header-height]`
**Warning signs:** Content jumping behind sticky elements when clicking anchor links

### Pitfall 5: Non-Native Mobile Inputs
**What goes wrong:** Date pickers and selects don't use native mobile UI
**Why it happens:** Custom components instead of native HTML inputs
**How to avoid:** Per decision: "Date pickers and selects use native mobile inputs"
**Warning signs:** Custom calendar dropdowns on mobile, custom select dropdowns

```tsx
// Use native inputs on mobile
<input
  type="date"
  className="md:hidden" // Native on mobile
/>
<DatePicker className="hidden md:block" /> // Custom on desktop
```

## Code Examples

### Skeleton Component (Add to shadcn/ui)

```tsx
// Source: shadcn/ui official skeleton
// src/components/ui/skeleton.tsx
import { cn } from "~/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

### Skeleton Usage Patterns

```tsx
// Card skeleton for opportunity/match lists
function CardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex gap-4">
        <Skeleton className="size-12 rounded-sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </Card>
  )
}

// List skeleton
function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
```

### useMediaQuery Hook (if needed for JS logic)

```tsx
// src/hooks/use-media-query.ts
import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [query])

  return matches
}

// Convenience hooks
export const useIsMobile = () => !useMediaQuery("(min-width: 768px)")
export const useIsDesktop = () => useMediaQuery("(min-width: 768px)")
```

### Responsive Container Utility

```tsx
// Consistent responsive container
function ResponsiveContainer({
  children,
  className,
  size = "default"
}: {
  children: React.ReactNode
  className?: string
  size?: "sm" | "default" | "lg" | "full"
}) {
  const sizeClasses = {
    sm: "max-w-2xl",
    default: "max-w-4xl",
    lg: "max-w-6xl",
    full: "max-w-full"
  }

  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6 lg:px-8",
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  )
}
```

### Layout Transitions

The project already has transition tokens. Use them for smooth responsive changes:

```tsx
// Smooth layout transitions (already available in design system)
className="transition-all duration-[var(--duration-normal)] ease-[var(--ease-gentle)]"

// Specifically for layout changes
className="transition-[grid-template-columns,gap] duration-200"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS media query libraries | CSS-only with Tailwind | 2023+ | Simpler, no hydration issues |
| Separate mobile components | Single component with responsive classes | 2022+ | Less code duplication |
| px breakpoints | Tailwind defaults (rem-based) | Always | Accessibility for zoom |
| Fixed touch targets | Min 44px (WCAG 2.5.8) | 2023 | Accessibility compliance |

**Current best practices:**
- CSS-first responsive (use JS hooks only when truly necessary)
- Mobile-first Tailwind classes
- 44x44px minimum touch targets (WCAG 2.5.8)
- 16px minimum font on form inputs (iOS zoom prevention)
- Skeleton loading states (perceived performance)

## Open Questions

None - the CONTEXT.md provides clear decisions on all key questions:
- Sidebars: Bottom sheets (decided)
- Tables: Cards on mobile (decided)
- Forms: Labels above, sticky headings (decided)
- Breakpoints: Tailwind defaults, mobile-first (decided)

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `app.css`, component files, route files
- CONTEXT.md decisions from `/gsd:discuss-phase`
- Tailwind CSS v4 documentation (breakpoints, transitions)
- shadcn/ui official documentation (Skeleton, Dialog components)

### Secondary (MEDIUM confidence)
- Exa search: Responsive patterns for Tailwind + React 2025
- Exa search: shadcn/ui responsive table patterns
- Exa search: Mobile form best practices
- Credenza pattern (responsive Dialog/Drawer switcher)

### Tertiary (LOW confidence)
- None - all patterns verified with official sources or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against existing package.json and app.css
- Architecture patterns: HIGH - derived from CONTEXT.md decisions and existing code
- Pitfalls: HIGH - based on official accessibility guidelines (WCAG 2.5.8) and iOS behavior

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (stable patterns, 30-day validity)
