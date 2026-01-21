# Stack Research: v2.0 Mobile + Tauri

**Project:** ASTN (AI Safety Talent Network)
**Researched:** 2026-01-20
**Overall Confidence:** HIGH for responsive, MEDIUM for Tauri mobile

---

## Summary

ASTN can achieve mobile support through two complementary approaches:

1. **Responsive Web (Phase 1):** Leverage existing Tailwind v4 with mobile-first utilities. The current fluid typography system and shadcn/ui components are already responsive-ready. Main work is auditing layouts and adding mobile navigation patterns.

2. **Tauri Mobile Apps (Phase 2):** Tauri 2.0 (stable since October 2024) supports iOS/Android via native WebViews. The critical blocker is TanStack Start's SSR mode - Tauri requires SPA mode since there's no server in a native app. This means creating a separate Tauri build configuration that runs the app in client-only mode.

**Key Decision:** The Convex real-time backend works in Tauri (WebSocket-based, confirmed by community). Authentication needs special handling for OAuth flows in desktop/mobile contexts (deep links instead of redirects).

**Previous Research:** See `.planning/research/mobile-app-options.md` for Capacitor vs Tauri comparison and push notification ecosystem analysis. This document builds on those findings.

---

## Recommended Stack

### Core (Keep As-Is)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| TanStack Start | ^1.132.x | Routing, SSR | Keep for web; add SPA mode for Tauri |
| Convex | ^1.31.x | Real-time backend | Works in Tauri WebView unchanged |
| React 19 | ^19.2.x | UI framework | Compatible with Tauri |
| Tailwind v4 | ^4.1.x | Styling | Already mobile-first, fluid type in place |
| shadcn/ui | latest | Components | Already responsive, some need mobile patterns |

### Add for Responsive Web

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| None required | - | - | Tailwind v4 has everything needed |

**Rationale:** The existing stack already includes:
- Fluid typography via `clamp()` (already in app.css lines 39-48)
- Tailwind's mobile-first breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- tw-animate-css for animations
- shadcn/ui components built with responsive patterns

**Work Required (no new deps):**
1. Audit all layouts for mobile breakpoints
2. Add responsive navigation (hamburger menu, bottom nav)
3. Implement mobile-optimized touch targets (44px minimum)
4. Add `Sheet` component usage for mobile dialogs (replace `Dialog` on small screens)
5. Test all forms on mobile viewports

### Add for Tauri Mobile

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **@tauri-apps/cli** | ^2.1.x | Build tooling | Tauri 2.0 CLI for mobile builds |
| **@tauri-apps/api** | ^2.1.x | JS bridge | Frontend APIs for native features |
| **tauri** (Rust crate) | ^2.1.x | Core runtime | Rust backend for the app |
| **tauri-plugin-http** | ^2.x | Network requests | CSP-compliant HTTP for Convex |
| **tauri-plugin-opener** | ^2.x | External links | Open URLs in system browser |
| **tauri-plugin-notification** | ^2.x | Local notifications | Native notification support |
| **tauri-plugin-notifications** | ^0.3.x | Push notifications | FCM/APNs support (community plugin) |
| **tauri-plugin-biometric** | ^2.x | Auth (optional) | Face ID / fingerprint unlock |
| **tauri-plugin-store** | ^2.x | Local storage | Persistent key-value storage |
| **tauri-plugin-deep-link** | ^2.x | OAuth callbacks | Handle auth:// URL schemes |

**Tauri Project Structure:**
```
src-tauri/
  Cargo.toml           # Rust dependencies
  tauri.conf.json      # App config (identifier, bundle settings)
  capabilities/        # Permission definitions
    default.json       # Desktop permissions
    mobile.json        # iOS/Android permissions
  src/
    lib.rs             # Plugin initialization
    main.rs            # Desktop entry point
  gen/                 # Auto-generated (gitignored)
    android/           # Android project
    ios/               # iOS project (Xcode)
```

### Vite Configuration for Tauri

The critical change: TanStack Start must run in SPA mode for Tauri builds. Create a separate Vite config:

```typescript
// vite.config.tauri.ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart({
      spa: { enabled: true },  // Critical: SPA mode for Tauri
    }),
    viteReact({
      babel: { plugins: ['babel-plugin-react-compiler'] },
    }),
  ],
  // Tauri expects the app at localhost:1420 in dev
  server: {
    port: 1420,
    strictPort: true,
  },
  // Clear env prefix for Tauri
  envPrefix: ['VITE_', 'TAURI_'],
})
```

**Package.json Scripts (add):**
```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:android:init": "tauri android init",
    "tauri:android:dev": "tauri android dev",
    "tauri:ios:init": "tauri ios init",
    "tauri:ios:dev": "tauri ios dev"
  }
}
```

---

## Development Environment Prerequisites

### macOS (for iOS development)

```bash
# Xcode (full, not CLI tools only)
xcode-select --install  # Not sufficient, need full Xcode from App Store

# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cocoapods
brew install cocoapods

# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# iOS Rust targets
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim
```

### Android Setup (macOS/Linux/Windows)

```bash
# Install Android Studio, then via SDK Manager:
# - Android SDK Platform (latest)
# - Android SDK Platform-Tools
# - NDK (Side by side)
# - Android SDK Build-Tools
# - Android SDK Command-line Tools

# Environment variables (add to shell profile)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls $ANDROID_HOME/ndk | head -1)"

# Android Rust targets
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

---

## Tauri Plugin Matrix

| Plugin | iOS | Android | Desktop | Use Case for ASTN |
|--------|-----|---------|---------|-------------------|
| http | Yes | Yes | Yes | Convex WebSocket (via fetch polyfill) |
| opener | Yes | Yes | Yes | External links (job postings) |
| notification | Yes | Yes | Yes | Local notifications |
| notifications (community) | Yes | Yes | Yes | Push via FCM/APNs |
| biometric | Yes | Yes | No | Quick unlock |
| store | Yes | Yes | Yes | Auth token persistence |
| geolocation | Yes | Yes | No | Location-based opportunities |
| deep-link | Yes | Yes | Yes | OAuth callback handling |

**Note:** The `barcode-scanner` plugin is mobile-only but not needed for ASTN's use case.

---

## Authentication Strategy for Tauri

Convex Auth with OAuth in Tauri requires special handling:

1. **Deep Links:** Register URL scheme (e.g., `astn://auth/callback`)
2. **OAuth Flow:** Open browser for login, return via deep link
3. **Token Storage:** Use `tauri-plugin-store` for secure persistence

```typescript
// Simplified OAuth flow for Tauri
import { open } from '@tauri-apps/plugin-opener'
import { Store } from '@tauri-apps/plugin-store'

async function loginWithOAuth(provider: 'github' | 'google') {
  // 1. Get auth URL from Convex
  const authUrl = await getConvexAuthUrl(provider, 'astn://auth/callback')

  // 2. Open in system browser
  await open(authUrl)

  // 3. Deep link handler receives token (registered in Tauri config)
  // 4. Store token securely
  const store = await Store.load('auth.json')
  await store.set('token', receivedToken)
}
```

**Tauri Deep Link Configuration:**
```json
// src-tauri/tauri.conf.json
{
  "plugins": {
    "deep-link": {
      "mobile": [
        { "host": "auth.astn.app", "pathPrefix": ["/callback"] }
      ],
      "desktop": {
        "schemes": ["astn"]
      }
    }
  }
}
```

---

## Responsive Patterns for shadcn/ui

### Already Responsive (no changes needed)
- Button, Input, Label, Checkbox, Switch
- Card, Avatar, Badge, Separator
- Tooltip, Popover (need touch-friendly triggers)
- Form components

### Need Mobile Patterns

| Component | Desktop | Mobile Replacement |
|-----------|---------|-------------------|
| Dialog | Centered modal | `Sheet` (slides from bottom) |
| DropdownMenu | Click dropdown | `Sheet` with menu items OR keep but ensure 44px touch targets |
| Tabs | Horizontal tabs | Scrollable tabs or vertical accordion |
| Table | Full table | Card-based list with expandable rows |
| Sidebar | Fixed sidebar | Off-canvas `Sheet` with hamburger toggle |

### useMediaQuery Hook

```typescript
// src/hooks/use-media-query.ts
import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

// Usage
export function useIsMobile() {
  return !useMediaQuery('(min-width: 768px)')
}
```

### ResponsiveDialog Component Pattern

```typescript
// src/components/ui/responsive-dialog.tsx
import { useIsMobile } from '@/hooks/use-media-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
}

export function ResponsiveDialog({ open, onOpenChange, title, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
```

---

## Tailwind v4 Responsive Utilities

The app already uses Tailwind v4's mobile-first approach. Key utilities:

```css
/* Default breakpoints (mobile-first) */
sm: 640px   /* @media (min-width: 640px) */
md: 768px   /* @media (min-width: 768px) */
lg: 1024px  /* @media (min-width: 1024px) */
xl: 1280px  /* @media (min-width: 1280px) */
2xl: 1536px /* @media (min-width: 1536px) */
```

**Pattern for layouts:**
```html
<!-- Mobile-first: stack vertically, then row on larger screens -->
<div class="flex flex-col md:flex-row gap-4 md:gap-6">
  <div class="w-full md:w-1/2">...</div>
  <div class="w-full md:w-1/2">...</div>
</div>
```

**Container queries (Tailwind v4 native):**
```html
<!-- Respond to container size, not viewport -->
<div class="@container">
  <div class="flex flex-col @md:flex-row">...</div>
</div>
```

**Touch-friendly sizing:**
```html
<!-- Minimum 44px touch targets for mobile -->
<button class="min-h-11 min-w-11 p-3">...</button>
```

---

## Do NOT Add

| Technology | Why Avoid |
|------------|-----------|
| **React Native** | Unnecessary - Tauri 2.0 provides native mobile with web stack |
| **Capacitor** | Valid alternative but adds another tool; Tauri covers desktop too |
| **Electron** | Desktop-only, no mobile support, huge bundle size |
| **Expo** | React Native ecosystem, not applicable |
| **NativeWind** | For React Native only |
| **Mobile CSS frameworks** | Already have Tailwind v4 |
| **Tailwind plugins for responsive** | v4 has everything needed natively |
| **Custom breakpoint libraries** | Use Tailwind's built-in system |
| **State management additions** | Convex + TanStack Query sufficient |
| **PWA for mobile** | iOS push notification support still unreliable |

---

## Migration Path

### Phase 1: Responsive Web (estimate: 1-2 weeks)
1. Audit all routes for mobile layouts
2. Add responsive navigation (header + mobile menu)
3. Implement Sheet-based dialogs for mobile
4. Test on real devices / emulators
5. Add touch target sizing (min 44px)
6. Add useMediaQuery and ResponsiveDialog utilities

### Phase 2: Tauri Desktop (estimate: 1 week)
1. Initialize Tauri in project (`bun create tauri-app` or manual setup)
2. Configure SPA mode for Tauri builds (vite.config.tauri.ts)
3. Test Convex connectivity in WebView
4. Add deep link handling for auth
5. Build and test on macOS/Windows/Linux

### Phase 3: Tauri Mobile (estimate: 2-3 weeks)
1. `bun run tauri android init` and `bun run tauri ios init`
2. Configure mobile capabilities/permissions
3. Implement OAuth with deep links
4. Add push notifications (tauri-plugin-notifications)
5. Test on simulators
6. Test on real devices
7. App store preparation (signing, assets)

---

## Convex + Tauri Integration Notes

From community discussions (Discord):

1. **WebSocket Connection:** Convex client connects via WebSocket, which works in Tauri WebView without modification.

2. **CSP Configuration:** May need to allow `wss://*.convex.cloud` in Tauri's CSP:
```json
// src-tauri/tauri.conf.json
{
  "security": {
    "csp": "default-src 'self'; connect-src 'self' wss://*.convex.cloud https://*.convex.cloud"
  }
}
```

3. **Environment Variables:** Use `VITE_CONVEX_URL` as usual; Tauri respects Vite env vars.

4. **OAuth Challenges:** The main complexity is OAuth redirect handling. Deep links solve this but require custom flow (see Authentication Strategy above).

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Responsive Web | **HIGH** | Tailwind v4 + shadcn are proven; just layout work |
| Tauri 2.0 Core | **HIGH** | Stable since Oct 2024, well-documented |
| TanStack Start + Tauri | **MEDIUM** | Community template exists (kvnxiao/tauri-tanstack-start-react-template); SPA mode documented but may need testing |
| Convex + Tauri | **MEDIUM** | Community confirms it works; OAuth needs custom deep link flow |
| iOS Build | **MEDIUM** | Requires full Xcode, Apple Developer account for device testing |
| Android Build | **HIGH** | Straightforward with Android Studio + NDK |
| Push Notifications | **MEDIUM** | Community plugin (tauri-plugin-notifications) works but less battle-tested than Capacitor |
| App Store Submission | **LOW** | Not researched in depth; separate investigation needed |

---

## Sources

**Tauri Official:**
- https://v2.tauri.app/start/prerequisites/ (mobile setup)
- https://v2.tauri.app/plugin/ (plugin ecosystem)
- https://v2.tauri.app/blog/tauri-20/ (2.0 release notes)
- https://v2.tauri.app/develop/plugins/develop-mobile (mobile plugin dev)

**TanStack Start:**
- https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode (SPA mode docs)
- https://github.com/kvnxiao/tauri-tanstack-start-react-template (community template)

**Convex + Tauri:**
- https://discord-questions.convex.dev/m/1327150436502995076 (OAuth discussion)
- https://discord-questions.convex.dev/m/1213530262823116881 (Tauri example discussion)
- https://convex.dev/can-do/mobile-apps (mobile support page)

**Tailwind v4:**
- https://tailwindcss.com/docs/screens (breakpoints)
- https://tailwindcss.com/docs/responsive-design (responsive design)

**shadcn/ui:**
- https://ui.shadcn.com/docs/changelog (latest components)
- https://github.com/jiaweing/DropDrawer (responsive dropdown pattern)

**Push Notifications:**
- https://github.com/Choochmeque/tauri-plugin-notifications (community plugin)
- See also: .planning/research/mobile-app-options.md for detailed comparison

---

*Researched: 2026-01-20*
