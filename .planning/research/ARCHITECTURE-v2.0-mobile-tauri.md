# Architecture Research: v2.0 Mobile + Tauri

## Summary

Tauri v2 can wrap TanStack Start applications for iOS/Android deployment, but requires careful architectural decisions around SSR vs. static builds. The current ASTN architecture uses server-side features (`createServerFn`) that are incompatible with Tauri's runtime (no Node.js). The recommended approach is a **dual-build strategy**: keep SSR for web, use prerendering for Tauri.

Responsive design should be implemented **before** Tauri integration using Tailwind v4's mobile-first breakpoints. Mobile navigation requires a custom bottom tab bar component since TanStack Router doesn't provide one natively.

**Key architectural decision:** Build responsive web first, then wrap with Tauri. This ensures the mobile experience works correctly in browsers before introducing native wrapper complexity.

## Tauri + TanStack Start Integration

### How Tauri Wraps TanStack Start

Tauri v2 renders web applications in a native WebView. The integration works as follows:

1. **Build Time**: TanStack Start generates static HTML/CSS/JS files via prerendering
2. **Runtime**: Tauri loads these files from the filesystem into a WebView
3. **IPC Bridge**: Tauri injects `window.__TAURI_INTERNALS__` for Rust-to-JS communication

**Critical Constraint:** Tauri has no Node.js runtime. Server functions (`createServerFn`) will fail. The current ASTN `__root.tsx` uses `getThemeFromCookie` server function which must be handled differently for Tauri builds.

### Reference Implementation

A community template exists: `kvnxiao/tauri-tanstack-start-react-template`. Key patterns:
- Uses prerendering to generate static HTML at build time
- Tauri loads static files directly into WebView
- IPC via `window.__TAURI_INTERNALS__` and `invoke` function

### Recommended Configuration

```typescript
// vite.config.tauri.ts (separate config for Tauri builds)
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      // Enable prerendering for static output
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoSubfolderIndex: true,
      },
    }),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})
```

### Platform Detection

Create a utility to detect runtime environment:

```typescript
// src/lib/platform.ts
export type Platform = 'web' | 'tauri-desktop' | 'tauri-ios' | 'tauri-android'

export function getPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'
  if (!('__TAURI__' in window)) return 'web'

  // Tauri v2 provides OS info via @tauri-apps/plugin-os
  // For build-time detection, use conditional compilation
  return 'tauri-desktop' // Refined at runtime with plugin
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

export function isMobileApp(): boolean {
  const platform = getPlatform()
  return platform === 'tauri-ios' || platform === 'tauri-android'
}
```

### Server Function Compatibility

Handle SSR features conditionally in `__root.tsx`:

```typescript
// Pattern: Conditional server function usage
import { isTauri } from '~/lib/platform'

// In __root.tsx beforeLoad:
beforeLoad: async () => {
  // Tauri builds won't have server functions - use localStorage/defaults
  if (typeof window !== 'undefined' && isTauri()) {
    const theme = localStorage.getItem('astn-theme') || 'system'
    return { initialTheme: theme as 'dark' | 'light' | 'system' }
  }

  // Web: use server function for SSR
  const initialTheme = await getThemeFromCookie()
  return { initialTheme }
}
```

### Tauri Project Structure

```
src-tauri/
  Cargo.toml           # Rust dependencies
  tauri.conf.json      # Tauri configuration
  capabilities/        # Permission capabilities for mobile
  src/
    lib.rs             # Tauri plugin initialization
    main.rs            # Entry point
  gen/
    android/           # Generated Android project (after tauri android init)
    apple/             # Generated iOS project (after tauri ios init)
```

### Tauri Configuration

```json
// src-tauri/tauri.conf.json
{
  "productName": "ASTN",
  "identifier": "network.aisafety.talent",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:3000"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [{
      "title": "AI Safety Talent Network",
      "width": 1200,
      "height": 800,
      "resizable": true,
      "fullscreen": false
    }]
  },
  "plugins": {
    "http": {
      "enabled": true,
      "scope": ["https://api.convex.dev/*", "https://*.convex.cloud/*"]
    }
  }
}
```

### Tauri Mobile Development

Commands for mobile development:

```bash
# Initialize mobile targets
bun tauri ios init
bun tauri android init

# Development
bun tauri ios dev           # Runs on simulator
bun tauri android dev       # Runs on emulator

# For physical iOS device, set TAURI_DEV_HOST
TAURI_DEV_HOST=192.168.1.100 bun tauri ios dev

# Production builds
bun tauri ios build
bun tauri android build --apk
```

## Responsive Layout Patterns

### Component Structure

Create a responsive shell that handles layout switching:

```
src/components/layout/
  ResponsiveShell.tsx      # Main layout wrapper
  DesktopNav.tsx           # Current AuthHeader refactored
  MobileBottomNav.tsx      # Bottom tab bar for mobile
  MobileTopBar.tsx         # Simplified top bar for mobile
  MobileSheet.tsx          # Slide-out menu for secondary nav
```

### ResponsiveShell Pattern

```typescript
// src/components/layout/ResponsiveShell.tsx
import { useMediaQuery } from '~/hooks/useMediaQuery'
import { DesktopNav } from './DesktopNav'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileTopBar } from './MobileTopBar'

interface ResponsiveShellProps {
  children: React.ReactNode
}

export function ResponsiveShell({ children }: ResponsiveShellProps) {
  // md breakpoint = 768px (Tailwind default)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <div className="min-h-screen">
        <DesktopNav />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16"> {/* Bottom nav height offset */}
      <MobileTopBar />
      <main className="px-4 py-4">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
```

### useMediaQuery Hook

```typescript
// src/hooks/useMediaQuery.ts
import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}
```

### Tailwind v4 Responsive Classes

Use mobile-first approach consistently:

```tsx
// Mobile-first pattern
<div className="
  px-4 py-4           // Mobile default
  md:px-6 md:py-6     // Tablet+
  lg:px-8             // Desktop+
">

// Grid layouts
<div className="
  grid grid-cols-1    // Mobile: single column
  md:grid-cols-2      // Tablet: 2 columns
  lg:grid-cols-3      // Desktop: 3 columns
  gap-4 md:gap-6
">

// Hide/show based on breakpoint
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>
```

### Container Queries (for component-level responsiveness)

Tailwind v4 supports container queries natively:

```tsx
// Card that responds to its container, not viewport
<div className="@container">
  <div className="
    flex flex-col      // Default: stack
    @md:flex-row       // When container >= 28rem: row
    @md:items-center
  ">
    <Avatar />
    <div className="@md:ml-4">Content</div>
  </div>
</div>
```

## Mobile Navigation Architecture

### Bottom Tab Bar Design

Primary navigation tabs (max 5 items per iOS/Android guidelines):

| Tab | Icon | Route | Auth Required |
|-----|------|-------|---------------|
| Home | `Home` | `/` | No |
| Opportunities | `Briefcase` | `/opportunities` | No |
| Matches | `Target` | `/matches` | Yes |
| Profile | `User` | `/profile` | Yes |

Secondary navigation (in hamburger/sheet menu):
- Settings
- Organizations
- Admin (if applicable)
- Logout

### MobileBottomNav Component

```typescript
// src/components/layout/MobileBottomNav.tsx
import { Link, useMatchRoute } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { Home, Briefcase, Target, User, LogIn } from 'lucide-react'
import { cn } from '~/lib/utils'

const tabs = [
  { to: '/', icon: Home, label: 'Home', auth: false },
  { to: '/opportunities', icon: Briefcase, label: 'Jobs', auth: false },
  { to: '/matches', icon: Target, label: 'Matches', auth: true },
  { to: '/profile', icon: User, label: 'Profile', auth: true },
] as const

export function MobileBottomNav() {
  const matchRoute = useMatchRoute()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = matchRoute({ to: tab.to, fuzzy: true })
          const Icon = tab.icon

          // Auth-required tabs
          if (tab.auth) {
            return (
              <Authenticated key={tab.to}>
                <NavTab
                  to={tab.to}
                  icon={Icon}
                  label={tab.label}
                  isActive={!!isActive}
                />
              </Authenticated>
            )
          }

          return (
            <NavTab
              key={tab.to}
              to={tab.to}
              icon={Icon}
              label={tab.label}
              isActive={!!isActive}
            />
          )
        })}

        {/* Show login button for unauthenticated users */}
        <Unauthenticated>
          <NavTab to="/login" icon={LogIn} label="Sign In" isActive={false} />
        </Unauthenticated>
      </div>
    </nav>
  )
}

function NavTab({
  to,
  icon: Icon,
  label,
  isActive
}: {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  isActive: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center flex-1 h-full",
        "text-muted-foreground transition-colors",
        isActive && "text-primary"
      )}
    >
      <Icon className={cn("size-5", isActive && "text-primary")} />
      <span className="text-xs mt-1">{label}</span>
    </Link>
  )
}
```

### Safe Area Handling

For iOS notch/home indicator and Android navigation bar:

```css
/* In app.css */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.safe-area-pt {
  padding-top: env(safe-area-inset-top, 0px);
}

.safe-area-inset {
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
}
```

### MobileTopBar Component

```typescript
// src/components/layout/MobileTopBar.tsx
import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { NotificationBell } from '~/components/notifications'
import { ThemeToggle } from '~/components/theme/theme-toggle'
import { Button } from '~/components/ui/button'
import { Sheet, SheetTrigger, SheetContent } from '~/components/ui/sheet'
import { Authenticated } from 'convex/react'

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background safe-area-pt">
      <div className="flex items-center justify-between h-14 px-4">
        <Link to="/" className="font-semibold text-foreground font-mono text-sm">
          ASTN
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Authenticated>
            <NotificationBell />
          </Authenticated>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        {/* Secondary navigation items */}
        <nav className="flex flex-col gap-2 mt-6">
          <Authenticated>
            <Link to="/settings" className="...">Settings</Link>
            <Link to="/orgs" className="...">Organizations</Link>
          </Authenticated>
          {/* Logout button, etc. */}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

## Build Order

**Phase 1: Responsive Foundation** (do first)

1. Add `useMediaQuery` hook
2. Create `ResponsiveShell` layout component
3. Create `MobileBottomNav` component
4. Create `MobileTopBar` component
5. Update route layouts to use `ResponsiveShell`
6. Add mobile-first responsive classes to key components:
   - Opportunity cards/list
   - Match cards
   - Profile sections
   - Forms

**Phase 2: Component Polish**

1. Ensure all shadcn/ui components work on touch devices
2. Add touch-friendly hit targets (min 44px)
3. Test responsive behavior across breakpoints
4. Add safe-area CSS utilities

**Phase 3: Tauri Integration**

1. Initialize Tauri project: `bun tauri init` (or manual setup)
2. Create `vite.config.tauri.ts` for static builds
3. Add platform detection utilities
4. Handle server function fallbacks for Tauri builds
5. Configure Tauri permissions for Convex API access
6. Add Tauri HTTP plugin for Convex API calls

**Phase 4: Tauri Mobile**

1. Initialize iOS: `bun tauri ios init`
2. Initialize Android: `bun tauri android init`
3. Configure `TAURI_DEV_HOST` for physical device testing
4. Test on simulators/emulators
5. Handle platform-specific features (haptics, safe areas, etc.)
6. Add push notification plugin (see `mobile-app-options.md` for details)

## Structural Changes

### Changes to Existing Code

| File | Change | Reason |
|------|--------|--------|
| `src/routes/__root.tsx` | Add conditional SSR logic for Tauri | Tauri compatibility |
| `src/components/layout/auth-header.tsx` | Refactor to `DesktopNav.tsx` | Clarity for responsive system |
| Route layouts | Wrap with `ResponsiveShell` | Consistent responsive layout |
| `vite.config.ts` | Keep as-is for web | Web SSR builds |
| New: `vite.config.tauri.ts` | Create | Tauri prerender builds |
| `package.json` | Add Tauri scripts | Build automation |

### New Files to Create

```
src/
  components/
    layout/
      ResponsiveShell.tsx
      MobileBottomNav.tsx
      MobileTopBar.tsx
      DesktopNav.tsx (refactored from auth-header.tsx)
  hooks/
    useMediaQuery.ts
  lib/
    platform.ts

src-tauri/
  Cargo.toml
  tauri.conf.json
  capabilities/
    default.json
  src/
    lib.rs
    main.rs

vite.config.tauri.ts
```

### Package Dependencies

For Tauri integration:
```bash
# Tauri CLI and core
bun add -D @tauri-apps/cli@latest
bun add @tauri-apps/api

# Tauri plugins (as needed)
bun add @tauri-apps/plugin-os       # Platform detection
bun add @tauri-apps/plugin-http     # HTTP requests (for Convex)
bun add @tauri-apps/plugin-haptics  # Mobile haptic feedback (optional)
```

For responsive components:
```bash
# shadcn/ui Sheet (if not already present)
bunx --bun shadcn@latest add sheet
```

### Script Updates

```json
// package.json additions
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:ios:dev": "tauri ios dev",
    "tauri:ios:build": "tauri ios build",
    "tauri:android:dev": "tauri android dev",
    "tauri:android:build": "tauri android build"
  }
}
```

## Convex Compatibility Notes

### Authentication in Tauri

Convex auth uses `@convex-dev/auth` which relies on HTTP-only cookies for web sessions. In Tauri:

1. **Option A: Keep Cookie-based Auth**
   - Tauri's WebView supports cookies
   - Should work for most cases
   - Test OAuth flows (GitHub, Google) in WebView

2. **Option B: Token-based Auth for Mobile**
   - Store JWT in secure storage (Tauri plugin)
   - Send as Authorization header
   - More control, but requires backend changes

**Recommendation:** Start with cookie-based (Option A), switch to token-based if issues arise.

### API Calls

Convex client uses WebSocket for real-time sync and HTTP for actions. Both work in Tauri WebView, but need HTTP plugin scope configuration:

```json
// tauri.conf.json
{
  "plugins": {
    "http": {
      "scope": [
        "https://*.convex.cloud/*",
        "https://api.convex.dev/*"
      ]
    }
  }
}
```

## Confidence

| Area | Level | Notes |
|------|-------|-------|
| Tauri + TanStack Start pattern | MEDIUM | Based on community template (kvnxiao/tauri-tanstack-start-react-template) and official docs. Pattern exists but isn't widely battle-tested. |
| Prerendering requirement | HIGH | Official Tauri docs confirm no Node.js runtime - prerendering is the documented solution. |
| Responsive patterns | HIGH | Standard Tailwind v4 patterns, well-documented. |
| Mobile navigation architecture | MEDIUM | TanStack Router has no native bottom tabs - pattern is custom but follows common React Native/mobile web practices. |
| Build order recommendation | HIGH | Logical dependency chain: responsive CSS must work before wrapping with native container. |
| Convex compatibility with Tauri | MEDIUM | Convex uses WebSocket/HTTP which Tauri supports, but needs HTTP plugin. OAuth flow in WebView needs testing. |

### Open Questions for Phase-Specific Research

1. **Convex auth + Tauri OAuth**: Does GitHub/Google OAuth redirect correctly in Tauri WebView?
2. **Push notifications**: See `mobile-app-options.md` for community plugin analysis.
3. **iOS/Android store deployment**: App signing, provisioning, store listing requirements.
4. **Offline support**: Tauri can bundle static files, but Convex requires network - consider offline UX.

---
*Researched: 2026-01-20*
*Sources: Tauri v2 official docs (v2.tauri.app), TanStack Start docs (tanstack.com/start), kvnxiao/tauri-tanstack-start-react-template (GitHub), Tailwind CSS v4 docs, Exa code search*
