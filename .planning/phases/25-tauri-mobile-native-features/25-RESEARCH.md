# Phase 25: Tauri Mobile + Native Features - Research

**Researched:** 2026-01-22
**Domain:** Tauri v2 Mobile (iOS/Android), Native Features
**Confidence:** MEDIUM (some plugins community-maintained, OAuth flow needs prototype validation)

## Summary

Tauri v2 provides stable mobile support for iOS and Android through system WebViews (WKWebView on iOS, Android WebView on Android). The framework wraps the existing web frontend in native shells, enabling distribution through app stores while maintaining a single codebase.

The recommended approach is to create a separate Vite config (`vite.config.tauri.ts`) that builds the app as a static SPA (no SSR), since TanStack Start's current SSR setup won't work in mobile WebViews. Tauri's plugin ecosystem provides official solutions for biometrics, secure storage, and deep linking, though push notifications require a community plugin with Firebase/APNs integration.

**Primary recommendation:** Initialize Tauri in the existing project with mobile targets, create a Tauri-specific Vite config for SPA builds, implement OAuth via deep links with custom URI scheme, and use official plugins where available (biometric, store, deep-link) with community plugin for push notifications.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                   | Version | Purpose                      | Why Standard                     |
| ------------------------- | ------- | ---------------------------- | -------------------------------- |
| @tauri-apps/cli           | ^2.6.0  | CLI for init, dev, build     | Official Tauri CLI               |
| @tauri-apps/api           | ^2.0.0  | JavaScript API bindings      | Official frontend APIs           |
| tauri (Rust crate)        | ^2.0.0  | Core runtime                 | Official backend                 |
| tauri-plugin-deep-link    | ^2.4.6  | Deep link/URL handling       | Official plugin, OAuth redirects |
| tauri-plugin-biometric    | ^2.2.1  | Face ID/Touch ID/fingerprint | Official plugin                  |
| tauri-plugin-store        | ^2.0.0  | Persistent key-value storage | Official plugin, token storage   |
| tauri-plugin-notification | ^2.0.0  | Local notifications          | Official plugin                  |
| tauri-plugin-os           | ^2.0.0  | Platform detection           | Official plugin                  |

### Supporting

| Library                  | Version | Purpose                     | When to Use                     |
| ------------------------ | ------- | --------------------------- | ------------------------------- |
| tauri-plugin-remote-push | ^1.0.10 | FCM/APNs push notifications | For "great" match notifications |
| tauri-plugin-haptics     | ^2.0.0  | Haptic feedback             | Native feel on interactions     |
| tauri-plugin-http        | ^2.5.0  | HTTP requests from Rust     | If CORS issues arise            |

### Alternatives Considered

| Instead of               | Could Use                              | Tradeoff                                                                                  |
| ------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| tauri-plugin-remote-push | tauri-plugin-notification (local only) | Local-only won't support server-triggered notifications                                   |
| tauri-plugin-store       | IndexedDB                              | Store plugin provides encrypted native storage; IndexedDB works but less secure           |
| Custom URI scheme OAuth  | tauri-plugin-oauth                     | tauri-plugin-oauth spawns localhost server (desktop pattern), deep-link better for mobile |

**Installation:**

```bash
# Tauri CLI
bun add -D @tauri-apps/cli

# JavaScript packages
bun add @tauri-apps/api @tauri-apps/plugin-deep-link @tauri-apps/plugin-biometric @tauri-apps/plugin-store @tauri-apps/plugin-notification @tauri-apps/plugin-os

# Community push notifications (npm package name)
bun add tauri-plugin-remote-push-api
```

## Architecture Patterns

### Recommended Project Structure

```
src-tauri/
├── Cargo.toml           # Rust dependencies
├── tauri.conf.json      # Main Tauri config
├── capabilities/
│   ├── default.json     # Desktop permissions
│   └── mobile.json      # Mobile-specific permissions
├── src/
│   └── lib.rs           # Plugin initialization
├── gen/
│   ├── android/         # Generated Android project
│   └── apple/           # Generated iOS project
├── Info.ios.plist       # iOS plist overrides
└── icons/               # App icons (all sizes)

src/
├── lib/
│   ├── platform.ts      # isTauri(), getPlatform() utilities
│   └── tauri/
│       ├── auth.ts      # Deep link OAuth handling
│       ├── push.ts      # Push notification setup
│       ├── biometric.ts # Biometric unlock wrapper
│       └── offline.ts   # Offline cache utilities
└── ...existing routes

vite.config.tauri.ts     # SPA build config for Tauri
```

### Pattern 1: Platform Detection

**What:** Detect whether running in Tauri vs web browser, and which mobile platform
**When to use:** Conditional feature enabling, UI adjustments

```typescript
// src/lib/platform.ts
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export type Platform = 'ios' | 'android' | 'web'

export async function getPlatform(): Promise<Platform> {
  if (!isTauri()) return 'web'

  const { type } = await import('@tauri-apps/plugin-os')
  const osType = type()

  if (osType === 'ios') return 'ios'
  if (osType === 'android') return 'android'
  return 'web' // Desktop Tauri falls back to 'web' behavior
}
```

### Pattern 2: Deep Link OAuth Flow

**What:** Handle OAuth redirects via custom URI scheme instead of web redirects
**When to use:** GitHub/Google login in Tauri mobile app

```typescript
// src/lib/tauri/auth.ts
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { isTauri } from '../platform'

export async function initDeepLinkAuth(
  onAuthCallback: (code: string, state: string) => void,
) {
  if (!isTauri()) return

  // Check if app was launched via deep link
  const startUrls = await getCurrent()
  if (startUrls) {
    handleAuthUrl(startUrls[0], onAuthCallback)
  }

  // Listen for deep links while app is running
  await onOpenUrl((urls) => {
    if (urls.length > 0) {
      handleAuthUrl(urls[0], onAuthCallback)
    }
  })
}

function handleAuthUrl(
  url: string,
  onAuthCallback: (code: string, state: string) => void,
) {
  const parsed = new URL(url)
  const code = parsed.searchParams.get('code')
  const state = parsed.searchParams.get('state')

  if (code && state) {
    onAuthCallback(code, state)
  }
}
```

### Pattern 3: Conditional Service Implementation

**What:** Use different implementations based on platform
**When to use:** Storage, notifications, clipboard operations

```typescript
// src/lib/storage.ts
import { isTauri } from './platform'

export async function createStorage() {
  if (isTauri()) {
    const { load } = await import('@tauri-apps/plugin-store')
    return load('app-store.json', { autoSave: true })
  }

  // Web fallback using localStorage wrapper
  return {
    get: async (key: string) => {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    },
    set: async (key: string, value: unknown) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
    delete: async (key: string) => {
      localStorage.removeItem(key)
    },
    save: async () => {}, // No-op for localStorage
  }
}
```

### Anti-Patterns to Avoid

- **SSR in Tauri builds:** Tauri WebViews load static files, not server-rendered pages. Always build as SPA for Tauri.
- **Assuming web APIs work identically:** Some web APIs behave differently in WebViews (e.g., clipboard, notifications).
- **Hardcoding OAuth redirect URLs:** Use environment-aware redirect URLs that switch between web and deep link schemes.
- **Blocking main thread with large sync operations:** Use Tauri's async patterns, especially for store operations.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                  | Don't Build                       | Use Instead                | Why                                                    |
| ------------------------ | --------------------------------- | -------------------------- | ------------------------------------------------------ |
| Secure token storage     | localStorage/IndexedDB encryption | tauri-plugin-store         | Native encrypted storage, handles platform differences |
| Biometric authentication | WebAuthn adaptation               | tauri-plugin-biometric     | Direct access to Face ID/Touch ID APIs                 |
| Push notification tokens | Custom FCM/APNs integration       | tauri-plugin-remote-push   | Handles native registration, token refresh             |
| Deep link parsing        | Custom URL parser                 | tauri-plugin-deep-link     | Platform-specific quirks handled                       |
| Offline data caching     | Custom service worker             | IndexedDB + Convex offline | Service workers don't work in all WebViews             |

**Key insight:** Native mobile features require native code. Tauri plugins bridge JavaScript to platform APIs; trying to implement these in pure web code leads to broken or inconsistent behavior.

## Common Pitfalls

### Pitfall 1: OAuth Redirect Loop in WebView

**What goes wrong:** OAuth provider redirects to web URL, WebView catches it, never returns to app
**Why it happens:** GitHub/Google OAuth expects web redirects by default
**How to avoid:**

1. Register custom URI scheme (e.g., `astn://auth/callback`)
2. Configure OAuth providers with this scheme as allowed redirect
3. Use deep-link plugin to capture the redirect
   **Warning signs:** Login works in simulator browser but not in-app

### Pitfall 2: Convex Auth State Not Persisting

**What goes wrong:** User logged out after app restart
**Why it happens:** Convex auth stores tokens in memory/session storage by default
**How to avoid:**

1. Use tauri-plugin-store for token persistence
2. Implement custom storage adapter for @convex-dev/auth
3. Restore tokens on app launch before Convex client init
   **Warning signs:** Auth works in session, fails on cold start

### Pitfall 3: Push Notifications Not Received

**What goes wrong:** Device registers successfully but notifications never arrive
**Why it happens:** Missing entitlements, wrong certificate, or backend misconfiguration
**How to avoid:**

1. iOS: Enable Push Notifications capability in Xcode
2. Android: Verify google-services.json is correct
3. Test with Firebase Console direct send first
   **Warning signs:** Token generated successfully, no errors, but no notifications

### Pitfall 4: Biometric Prompt Shows Generic Error

**What goes wrong:** `authenticate()` fails with unhelpful error
**Why it happens:** Missing Info.plist entries or manifest permissions
**How to avoid:**

1. iOS: Add `NSFaceIDUsageDescription` to Info.ios.plist
2. Android: Add `USE_BIOMETRIC` permission to manifest
3. Always check `checkStatus()` before `authenticate()`
   **Warning signs:** Works on some devices, fails on others

### Pitfall 5: Build Fails with "Signing Certificate" Error

**What goes wrong:** `tauri ios build` or `tauri android build` fails at signing step
**Why it happens:** Code signing not configured for release builds
**How to avoid:**

1. iOS: Set up provisioning profile and certificate in Apple Developer portal
2. Android: Generate keystore and configure in `build.gradle`
3. Use environment variables for CI/CD
   **Warning signs:** Dev builds work, release builds fail

## Code Examples

Verified patterns from official sources:

### Tauri Configuration for Mobile

```json
// src-tauri/tauri.conf.json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "ASTN",
  "version": "2.0.0",
  "identifier": "ai.astn.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "bun run dev:web",
    "beforeBuildCommand": "bun run build:tauri"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "ASTN",
        "width": 390,
        "height": 844,
        "resizable": true
      }
    ]
  },
  "plugins": {
    "deep-link": {
      "mobile": [
        {
          "scheme": ["astn"],
          "appLink": false
        }
      ]
    }
  },
  "bundle": {
    "active": true,
    "iOS": {
      "developmentTeam": "TEAM_ID_HERE"
    }
  }
}
```

### Vite Config for Tauri SPA Build

```typescript
// vite.config.tauri.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    // SPA: single index.html handles all routes
    rollupOptions: {
      input: 'index.html',
    },
  },
  // Required for Tauri to resolve paths correctly
  base: './',
})
```

### Plugin Initialization in Rust

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        #[cfg(mobile)]
        .plugin(tauri_plugin_biometric::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Biometric Authentication

```typescript
// Source: https://v2.tauri.app/plugin/biometric/
import { checkStatus, authenticate } from '@tauri-apps/plugin-biometric'

export async function unlockWithBiometrics(): Promise<boolean> {
  const status = await checkStatus()

  if (!status.isAvailable) {
    console.log('Biometrics not available:', status.error)
    return false
  }

  try {
    await authenticate('Unlock ASTN', {
      allowDeviceCredential: true, // Fallback to PIN/password
      title: 'Authenticate',
      subtitle: 'Verify your identity to access ASTN',
    })
    return true
  } catch (error) {
    console.error('Biometric auth failed:', error)
    return false
  }
}
```

### Store Plugin for Token Persistence

```typescript
// Source: https://v2.tauri.app/plugin/store/
import { load } from '@tauri-apps/plugin-store'

const AUTH_STORE = 'auth.json'

export async function saveAuthTokens(tokens: {
  accessToken: string
  refreshToken: string
}) {
  const store = await load(AUTH_STORE, { autoSave: false })
  await store.set('tokens', tokens)
  await store.save()
}

export async function getAuthTokens(): Promise<{
  accessToken: string
  refreshToken: string
} | null> {
  const store = await load(AUTH_STORE)
  return await store.get('tokens')
}

export async function clearAuthTokens() {
  const store = await load(AUTH_STORE)
  await store.delete('tokens')
  await store.save()
}
```

### iOS Info.plist Configuration

```xml
<!-- src-tauri/Info.ios.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSFaceIDUsageDescription</key>
    <string>Use Face ID to quickly unlock ASTN</string>
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
    </array>
</dict>
</plist>
```

## State of the Art

| Old Approach                        | Current Approach          | When Changed      | Impact                                |
| ----------------------------------- | ------------------------- | ----------------- | ------------------------------------- |
| Tauri v1 (desktop only)             | Tauri v2 (mobile stable)  | October 2024      | Full iOS/Android support              |
| Cordova/Capacitor for web-to-mobile | Tauri for Rust + Web apps | 2024-2025         | Smaller binaries, better security     |
| Service workers for offline         | IndexedDB + native cache  | Ongoing           | WebView service worker support varies |
| Localhost OAuth redirect            | Deep link OAuth           | Always for mobile | Required for app store apps           |

**Deprecated/outdated:**

- `@tauri-apps/api` v1 patterns (window.**TAURI** vs **TAURI_INTERNALS**)
- Manual Xcode/Android Studio project management (use `tauri ios init` / `tauri android init`)

## Open Questions

Things that couldn't be fully resolved:

1. **Convex OAuth Callback in WebView**
   - What we know: @convex-dev/auth uses web redirects by default
   - What's unclear: Exact integration point to intercept OAuth and use deep links
   - Recommendation: Prototype early; may need custom auth flow that bypasses @convex-dev/auth for OAuth, keeping it for password auth only

2. **Push Notification Backend Integration**
   - What we know: tauri-plugin-remote-push handles device registration
   - What's unclear: How to trigger push from Convex backend (needs server-side FCM/APNs integration)
   - Recommendation: Research Convex action that calls FCM/APNs APIs when "great" match created

3. **Offline Sync Strategy**
   - What we know: Convex has no built-in offline mode; IndexedDB works in WebViews
   - What's unclear: Best pattern for caching viewed opportunities and syncing when online
   - Recommendation: Use IndexedDB for read cache, show cached data when offline, mark as "offline mode"

## Sources

### Primary (HIGH confidence)

- Tauri v2 Official Documentation - https://v2.tauri.app/
- tauri-plugin-deep-link v2.4.6 - https://v2.tauri.app/plugin/deep-linking/
- tauri-plugin-biometric v2.2.1 - https://v2.tauri.app/plugin/biometric/
- tauri-plugin-store v2.0.0 - https://v2.tauri.app/plugin/store/
- tauri-plugin-notification v2.0.0 - https://v2.tauri.app/plugin/notification/

### Secondary (MEDIUM confidence)

- tauri-plugin-remote-push v1.0.10 - https://lib.rs/crates/tauri-plugin-remote-push (community plugin, 10 versions, active maintenance)
- Tauri mobile architecture overview - https://deepwiki.com/tauri-apps/tauri/8.1-mobile-architecture-overview
- Medium article on Supabase OAuth with Tauri deep links - https://medium.com/@nathancovey/

### Tertiary (LOW confidence)

- Convex Auth Discord discussions - need prototype validation
- WebView offline capabilities vary by OS version - test on target devices

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Official Tauri plugins well-documented
- Architecture: MEDIUM - Patterns derived from official docs + community examples
- OAuth flow: LOW - Convex + Tauri combo needs prototype validation
- Push notifications: MEDIUM - Community plugin, but established pattern
- Offline strategy: LOW - No official Convex offline support, needs custom solution

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - Tauri ecosystem relatively stable post v2.0)

## Recommended Plan Breakdown

Based on research, Phase 25 should be split into approximately 5-6 plans:

1. **Tauri Project Initialization** (TAURI-01, TAURI-02, TAURI-03)
   - Initialize Tauri with mobile targets
   - Create vite.config.tauri.ts for SPA builds
   - Set up platform detection utilities
   - Configure basic tauri.conf.json

2. **iOS Build Setup** (TAURI-06)
   - Run `tauri ios init`
   - Configure Info.ios.plist
   - Set up development team/signing
   - Verify build runs in simulator

3. **Android Build Setup** (TAURI-07)
   - Run `tauri android init`
   - Configure environment variables
   - Set up signing keystore (dev)
   - Verify build runs in emulator

4. **OAuth Deep Link Integration** (NATIVE-01, TAURI-04)
   - Configure deep-link plugin
   - Implement custom auth flow for OAuth providers
   - Test Convex connectivity in WebView
   - Integrate with existing auth UI

5. **Secure Storage + Biometrics** (NATIVE-04, NATIVE-05)
   - Implement token persistence with store plugin
   - Add biometric unlock flow
   - Configure iOS/Android permissions

6. **Push Notifications + Offline** (NATIVE-02, NATIVE-03)
   - Set up tauri-plugin-remote-push
   - Configure FCM/APNs credentials
   - Implement offline cache for opportunities
   - Create Convex action for push trigger

**Risk mitigation notes:**

- OAuth prototype should happen early (Plan 4) to validate approach
- Push notification plugin is community-maintained; test thoroughly in Plan 6
- Consider parallel work on iOS (Plan 2) and Android (Plan 3) if multiple developers available
