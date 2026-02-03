# Phase 22: Mobile Navigation - Research

**Researched:** 2026-01-21
**Domain:** Mobile web navigation patterns, safe areas, PWA
**Confidence:** HIGH

## Summary

Mobile navigation for this phase requires implementing a bottom tab bar for 5 primary destinations and a hamburger menu for secondary navigation. The project already has the foundation needed: TanStack Router with `activeProps` support for active link styling, Radix UI Dialog/Sheet components for the hamburger menu, and Tailwind v4 for CSS.

The key technical considerations are:

1. Safe area handling via CSS `env(safe-area-inset-*)` with `viewport-fit=cover`
2. TanStack Router's `activeProps` and `activeOptions` for tab active states
3. shadcn Sheet component (side="right") for the hamburger menu slide animation
4. PWA manifest already exists but needs `name`, `short_name`, and correct status bar config

**Primary recommendation:** Build a mobile shell layout component that wraps authenticated routes, containing the bottom tab bar and header with hamburger trigger. Use existing Radix/shadcn patterns for the slide-out menu.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)

| Library                | Version  | Purpose                      | Why Standard                              |
| ---------------------- | -------- | ---------------------------- | ----------------------------------------- |
| TanStack Router        | ^1.132.2 | Routing with `activeProps`   | Already used, native active state support |
| @radix-ui/react-dialog | ^1.1.15  | Accessible modal/sheet base  | Already used for dialogs                  |
| lucide-react           | ^0.562.0 | Tab bar icons                | Already used throughout                   |
| Tailwind CSS           | ^4.1.13  | Styling including safe areas | Already configured                        |

### Supporting (May Need to Add)

| Library                         | Version | Purpose                  | When to Use                                                                |
| ------------------------------- | ------- | ------------------------ | -------------------------------------------------------------------------- |
| @radix-ui/react-navigation-menu | latest  | Accessible nav structure | Only if complex nav menus needed; bottom tabs can use simpler Link pattern |

**Note:** No new libraries needed. The existing stack fully supports mobile navigation requirements.

### Alternatives Considered

| Instead of        | Could Use                                    | Tradeoff                                                              |
| ----------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| Custom sheet      | `@radix-ui/react-dialog` with custom styling | Dialog already in project; Sheet is just Dialog with side positioning |
| Manual safe areas | `capacitor` / `@ionic/react`                 | Massive overkill; CSS `env()` handles this natively                   |
| Custom animations | `framer-motion`                              | Unnecessary complexity; CSS transforms + Radix animations sufficient  |

**Installation:**
No new packages required. All capabilities exist in current dependencies.

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   └── layout/
│       ├── mobile-shell.tsx        # Main wrapper with tab bar + hamburger
│       ├── bottom-tab-bar.tsx      # 5-tab navigation component
│       ├── hamburger-menu.tsx      # Slide-from-right menu (uses Sheet)
│       └── mobile-header.tsx       # Header with hamburger trigger
├── hooks/
│   └── use-media-query.ts          # EXISTING - useIsMobile hook
└── routes/
    └── __root.tsx                  # Add viewport-fit=cover meta tag
```

### Pattern 1: Conditional Mobile Shell

**What:** Wrap authenticated routes in a mobile shell only on mobile viewports
**When to use:** Render tab bar on mobile, standard header on desktop
**Example:**

```typescript
// Source: TanStack Router + existing useIsMobile hook
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileShell>
        {children}
      </MobileShell>
    );
  }

  return (
    <>
      <AuthHeader />
      {children}
    </>
  );
}
```

### Pattern 2: TanStack Router Active State for Tabs

**What:** Use `activeProps` and `activeOptions` for tab highlighting
**When to use:** Bottom tab bar links that need active state indication
**Example:**

```typescript
// Source: TanStack Router docs + existing admin/route.tsx pattern
<Link
  to="/opportunities"
  activeProps={{
    className: "text-primary font-semibold"
  }}
  activeOptions={{
    exact: false,  // Match /opportunities and /opportunities/123
    includeSearch: false
  }}
  className="text-muted-foreground"
>
  <Briefcase className="size-5" />
  <span className="text-xs">Opportunities</span>
</Link>
```

### Pattern 3: Safe Area Tab Bar

**What:** Tab bar that extends to screen edge with content padded for home indicator
**When to use:** Bottom fixed navigation on notched devices
**Example:**

```css
/* Tab bar extends to bottom edge, content is padded */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* Background extends to screen edge */
  padding-bottom: env(safe-area-inset-bottom, 0);
  /* Content area above safe zone */
  padding-top: 0.5rem;
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}

/* Main content needs bottom padding to not be hidden by tab bar */
.main-content-mobile {
  padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0));
}
```

### Pattern 4: Sheet for Hamburger Menu

**What:** Use shadcn Sheet component with `side="right"` for slide-out menu
**When to use:** Hamburger menu that slides from right edge
**Example:**

```typescript
// Source: shadcn/ui Sheet docs
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";

function HamburgerMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        {/* Menu content */}
      </SheetContent>
    </Sheet>
  );
}
```

### Anti-Patterns to Avoid

- **Using JS for safe area calculations:** CSS `env()` handles this natively and responds to device changes
- **Hiding tab bar on scroll:** User decision: "Tab bar always visible - does not hide on scroll"
- **Icons-only tabs:** User decision: "Icons + labels always visible"
- **Edge swipe conflicting with horizontal content:** Use `touch-action: pan-y` on horizontal scroll areas

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                 | Don't Build                   | Use Instead                         | Why                                              |
| ----------------------- | ----------------------------- | ----------------------------------- | ------------------------------------------------ |
| Safe area detection     | JavaScript to measure notch   | CSS `env(safe-area-inset-*)`        | Native, no JS, responds to rotation              |
| Slide animation         | Custom CSS transitions        | shadcn Sheet component              | Already has enter/exit animations, accessibility |
| Active link state       | Manual route comparison       | TanStack Router `activeProps`       | Built-in, handles nested routes                  |
| Modal/overlay backdrop  | Custom div with click handler | Radix Dialog overlay                | Handles focus trap, click-outside, escape key    |
| Tab highlight animation | Complex keyframe animations   | CSS transition on color/font-weight | Instant tab switch per user decision             |

**Key insight:** The project already has all the primitives needed. The work is composition and configuration, not building new patterns.

## Common Pitfalls

### Pitfall 1: Forgetting viewport-fit=cover

**What goes wrong:** Safe area insets return 0 on notched devices
**Why it happens:** Without `viewport-fit=cover`, browser doesn't report safe area values
**How to avoid:** Add to viewport meta tag in `__root.tsx`:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover"
/>
```

**Warning signs:** Tab bar content hidden behind home indicator in iOS PWA

### Pitfall 2: Not Padding Main Content

**What goes wrong:** Page content hidden behind fixed tab bar
**Why it happens:** Fixed positioning removes element from flow
**How to avoid:** Add bottom padding to main content equal to tab bar height + safe area
**Warning signs:** Last items in lists unreachable

### Pitfall 3: Edge Swipe Conflicts

**What goes wrong:** Left-edge swipe triggers both back navigation AND horizontal scroll
**Why it happens:** Both gestures start from left edge
**How to avoid:**

- Use `touch-action: pan-y` on horizontal scroll containers
- Use `overscroll-behavior-x: contain` to prevent scroll chaining
  **Warning signs:** Erratic behavior when swiping from left edge on carousels

### Pitfall 4: Tab Re-tap Not Scrolling to Top

**What goes wrong:** Tapping active tab does nothing
**Why it happens:** Link to same route is a no-op by default
**How to avoid:** Add onClick handler that checks if already active, then scrolls to top:

```typescript
onClick={() => {
  if (isActive) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // If nested, also reset to root view via router.navigate()
  }
}}
```

**Warning signs:** Users stuck at bottom of long lists

### Pitfall 5: Haptic Feedback on Non-Supporting Browsers

**What goes wrong:** `navigator.vibrate()` throws or returns false
**Why it happens:** Safari doesn't support Vibration API
**How to avoid:** Always check: `if ('vibrate' in navigator) { navigator.vibrate(10); }`
**Warning signs:** JavaScript errors in Safari console

### Pitfall 6: PWA Status Bar Color

**What goes wrong:** Status bar clashes with app theme or shows wrong color
**Why it happens:** Missing or wrong `apple-mobile-web-app-status-bar-style` meta tag
**How to avoid:** For "follows system" behavior:

```html
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

**Warning signs:** Black status bar in light mode or vice versa

## Code Examples

Verified patterns from official sources and existing codebase:

### Safe Area CSS Variables

```css
/* Source: MDN env() docs + CSS-Tricks notch article */
:root {
  --tab-bar-height: 4rem; /* 64px base height */
}

.tab-bar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--background);
  border-top: 1px solid var(--border);

  /* Extend background to screen edge */
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-left: env(safe-area-inset-left, 0);
  padding-right: env(safe-area-inset-right, 0);
}

.tab-bar-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: var(--tab-bar-height);
}

/* Content area padding */
.mobile-main-content {
  padding-bottom: calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0));
}
```

### TanStack Router Tab Link

```typescript
// Source: TanStack Router docs + existing admin/route.tsx
import { Link, useRouterState } from "@tanstack/react-router";

interface TabProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function Tab({ to, icon, label }: TabProps) {
  const router = useRouterState();
  const isActive = router.location.pathname.startsWith(to);

  const handleClick = () => {
    if (isActive) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      activeOptions={{ exact: to === '/', includeSearch: false }}
      className="flex flex-col items-center gap-1 py-2 px-3 text-muted-foreground touch-target"
      activeProps={{
        className: "flex flex-col items-center gap-1 py-2 px-3 text-primary font-semibold touch-target"
      }}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
```

### Viewport Meta Tag Update

```typescript
// Source: MDN viewport-fit + Apple PWA docs
// In __root.tsx head() function
{
  name: 'viewport',
  content: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
},
{
  name: 'apple-mobile-web-app-capable',
  content: 'yes',
},
{
  name: 'apple-mobile-web-app-status-bar-style',
  content: 'default',  // Follows system light/dark
},
```

### PWA Manifest Update

```json
{
  "name": "AI Safety Talent Network",
  "short_name": "ASTN",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Hamburger Menu with Sheet

```typescript
// Source: shadcn Sheet docs + Radix Dialog patterns
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { useAuthActions } from "@convex-dev/auth/react";
import { Link } from "@tanstack/react-router";

function HamburgerMenu({ user }: { user: { name: string; avatarUrl?: string } }) {
  const { signOut } = useAuthActions();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="touch-target">
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        {/* User info header */}
        <SheetHeader className="pb-4 border-b">
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3"
          >
            <Avatar>
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <SheetTitle className="text-left">{user.name}</SheetTitle>
          </Link>
        </SheetHeader>

        {/* Menu items */}
        <nav className="py-4 space-y-1">
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
          >
            <Shield className="size-4" />
            Admin
          </Link>
          <Link
            to="/help"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent"
          >
            <HelpCircle className="size-4" />
            Help
          </Link>
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-destructive"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

### Haptic Feedback Utility

```typescript
// Source: MDN Navigator.vibrate() + Safari limitation
export function hapticFeedback(pattern: number | number[] = 10) {
  // Check for support - Safari doesn't support vibrate API
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

// Usage in tab click
function handleTabClick() {
  hapticFeedback(10) // Short 10ms pulse
}
```

## State of the Art

| Old Approach                | Current Approach              | When Changed    | Impact                                   |
| --------------------------- | ----------------------------- | --------------- | ---------------------------------------- |
| `constant(safe-area-*)`     | `env(safe-area-*)`            | iOS 11.2 (2017) | Use `env()` only                         |
| Separate mobile routing     | Responsive components         | Always          | Single route tree, conditional rendering |
| Custom bottom nav libraries | Native CSS + Radix primitives | 2023+           | Less dependencies, more control          |
| Capacitor for safe areas    | CSS `env()` + PWA manifest    | 2020+           | No native wrapper needed for web apps    |

**Deprecated/outdated:**

- `constant()` CSS function: Replaced by `env()`, no longer needed
- Mobile-specific route files: Use responsive components instead
- iOS viewport-fit="auto": Use "cover" for edge-to-edge

## Open Questions

Things that couldn't be fully resolved:

1. **Edge swipe gesture detection**
   - What we know: CSS `touch-action` and `overscroll-behavior` control gestures
   - What's unclear: Exact threshold/zone for left-edge swipe vs content scroll
   - Recommendation: Test on physical iOS device; may need to restrict horizontal scroll areas from left 20px edge

2. **Tab count validation**
   - What we know: CONTEXT.md says 5 tabs: Home, Opportunities, Matches, Profile, Settings
   - What's unclear: Original requirement NAV-01 lists Events but CONTEXT.md has Settings
   - Recommendation: Follow CONTEXT.md (user decision) - 5 tabs including Settings

3. **Haptic feedback timing**
   - What we know: `navigator.vibrate()` works on Android Chrome, not Safari
   - What's unclear: Optimal duration for "click" feel (5ms? 10ms? 20ms?)
   - Recommendation: Start with 10ms, test on device; requirement is "native builds only" so may be future native feature

## Sources

### Primary (HIGH confidence)

- MDN env() documentation - Safe area CSS implementation
- MDN touch-action - Touch gesture control
- MDN overscroll-behavior - Scroll chaining control
- TanStack Router docs - Link activeProps and activeOptions
- shadcn/ui Sheet docs - Slide-out panel component
- Existing codebase - `admin/route.tsx` shows activeProps pattern

### Secondary (MEDIUM confidence)

- CSS-Tricks notch article - viewport-fit=cover implementation
- MDN Navigator.vibrate() - Haptic feedback API and limitations
- Radix Dialog/Navigation Menu - Accessibility patterns

### Tertiary (LOW confidence)

- Apple HIG tab bar specs - 49pt height recommendation (couldn't access full docs)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already in project, patterns verified
- Architecture: HIGH - Patterns match existing codebase conventions
- Safe areas: HIGH - MDN documentation is authoritative
- Pitfalls: MEDIUM - Based on common web patterns, may need device testing
- Haptic feedback: LOW - Browser support limited, requirement scoped to "native builds"

**Research date:** 2026-01-21
**Valid until:** 2026-03-21 (stable web platform features)

---

## Tab Icon Reference (Lucide)

Per CONTEXT.md decision: 5 tabs with icons + labels

| Tab           | Route            | Icon          | Lucide Name       |
| ------------- | ---------------- | ------------- | ----------------- |
| Home          | `/`              | House         | `house` or `home` |
| Opportunities | `/opportunities` | Briefcase     | `briefcase`       |
| Matches       | `/matches`       | Target        | `target`          |
| Profile       | `/profile`       | User          | `user`            |
| Settings      | `/settings`      | Settings gear | `settings`        |

Hamburger menu icons:

- Admin: `shield` or `shield-check`
- Help: `help-circle`
- Logout: `log-out`
