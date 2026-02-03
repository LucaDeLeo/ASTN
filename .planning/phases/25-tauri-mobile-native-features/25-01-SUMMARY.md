---
phase: 25-tauri-mobile-native-features
plan: 01
subsystem: infra
tags: [tauri, mobile, ios, android, spa, vite]

# Dependency graph
requires:
  - phase: 21-responsive-mobile
    provides: Mobile-first CSS and touch targets
provides:
  - Tauri v2 project structure with mobile plugins
  - SPA Vite config for WebView builds
  - Platform detection utilities (isTauri, getPlatform, isMobile)
  - Deep link scheme (astn://) for OAuth
affects: [25-02 (iOS), 25-03 (Android), 25-04 (OAuth deep links)]

# Tech tracking
tech-stack:
  added:
    - '@tauri-apps/cli ^2.9.6'
    - '@tauri-apps/api ^2.9.1'
    - '@tauri-apps/plugin-deep-link ^2.4.6'
    - '@tauri-apps/plugin-biometric ^2.3.2'
    - '@tauri-apps/plugin-store ^2.4.2'
    - '@tauri-apps/plugin-notification ^2.3.3'
    - '@tauri-apps/plugin-os ^2.3.2'
    - 'tauri-plugin-deep-link (Rust)'
    - 'tauri-plugin-store (Rust)'
    - 'tauri-plugin-os (Rust)'
    - 'tauri-plugin-notification (Rust)'
    - 'tauri-plugin-biometric (Rust, mobile-only)'
  patterns:
    - Separate vite.config.tauri.ts for SPA builds (no SSR)
    - Platform detection via __TAURI_INTERNALS__ window property
    - Tauri plugins initialized in src-tauri/src/lib.rs
    - Capabilities defined in src-tauri/capabilities/default.json

key-files:
  created:
    - src-tauri/Cargo.toml
    - src-tauri/tauri.conf.json
    - src-tauri/src/lib.rs
    - src-tauri/capabilities/default.json
    - vite.config.tauri.ts
    - src/lib/platform.ts
    - index.html
    - src/tauri-entry.tsx
  modified:
    - package.json

key-decisions:
  - 'Use ai.astn.app as bundle identifier for iOS/Android'
  - 'astn:// deep link scheme for OAuth callbacks'
  - 'Separate SPA entry point (tauri-entry.tsx) to avoid TanStack Start SSR dependencies'
  - 'Window size 390x844 matches iPhone viewport for dev testing'

patterns-established:
  - 'Tauri builds use vite.config.tauri.ts (SPA mode, no SSR)'
  - 'Platform detection via isTauri() before using Tauri APIs'
  - 'Mobile-only plugins wrapped in #[cfg(mobile)] in Rust'

# Metrics
duration: 5min
completed: 2026-01-22
---

# Phase 25 Plan 01: Tauri Project Initialization Summary

**Tauri v2 project initialized with mobile plugins (deep-link, biometric, store, notification, os) and SPA Vite config producing static WebView-compatible builds**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-22T14:56:53Z
- **Completed:** 2026-01-22T15:02:01Z
- **Tasks:** 3
- **Files modified:** 9 (plus 22 generated icons/configs)

## Accomplishments

- Tauri CLI v2.9.6 installed with all plugin packages
- src-tauri/ project structure with Rust plugin initialization
- SPA build producing static dist/ for WebView embedding
- Platform detection utilities ready for conditional mobile features

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Tauri CLI and JavaScript packages** - `41e3c8e` (chore)
2. **Task 2: Initialize Tauri project with mobile configuration** - `0f569b7` (feat)
3. **Task 3: Create SPA Vite config and platform utilities** - `a012136` (feat)

## Files Created/Modified

### Created

- `src-tauri/Cargo.toml` - Rust dependencies with mobile plugins
- `src-tauri/tauri.conf.json` - App config with ai.astn.app identifier
- `src-tauri/src/lib.rs` - Plugin initialization with mobile_entry_point
- `src-tauri/capabilities/default.json` - Permissions for all plugins
- `vite.config.tauri.ts` - SPA build config (no TanStack Start)
- `src/lib/platform.ts` - isTauri(), getPlatform(), isMobile() utilities
- `index.html` - HTML entry point for Tauri WebView
- `src/tauri-entry.tsx` - Client-only React entry (no SSR)

### Modified

- `package.json` - Tauri CLI, plugins, and build scripts

## Decisions Made

1. **ai.astn.app bundle identifier** - Matches domain convention, ready for App Store
2. **astn:// deep link scheme** - Simple scheme for OAuth, not using Universal Links yet
3. **Separate SPA entry point** - TanStack Start routes use server functions incompatible with pure SPA; created minimal entry that will be expanded in Plan 25-04
4. **390x844 window size** - iPhone 14/15 viewport for realistic dev testing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created minimal SPA entry point**

- **Found during:** Task 3 (SPA Vite config verification)
- **Issue:** Existing routes use TanStack Start `createServerFn` which fails in pure SPA build
- **Fix:** Created `tauri-entry.tsx` with minimal Convex-connected app (placeholder UI)
- **Files modified:** src/tauri-entry.tsx, index.html
- **Verification:** `bun run build:tauri` produces valid dist/ with 150 modules
- **Committed in:** a012136 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Required for build to work. Full route integration deferred to Plan 25-04 (OAuth Deep Link Integration) where SPA-compatible routes will be created.

## Issues Encountered

- TanStack Start routes cannot be used directly in SPA builds due to server function dependencies
- Workaround: Created minimal entry point; full route integration planned for 25-04

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Tauri CLI installed and functional
- src-tauri/ ready for `tauri ios init` and `tauri android init`
- SPA build produces valid dist/ for WebView embedding
- Platform detection utilities available for conditional features

**Next steps:**

- Plan 25-02: iOS Build Setup (`tauri ios init`)
- Plan 25-03: Android Build Setup (`tauri android init`)
- Plan 25-04: OAuth Deep Link Integration (full route integration)

---

_Phase: 25-tauri-mobile-native-features_
_Completed: 2026-01-22_
