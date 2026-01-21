# Project Research Summary: v2.0 Mobile + Tauri

**Project:** AI Safety Talent Network (ASTN) - Milestone v2.0
**Domain:** Mobile responsive web + Tauri native apps (iOS/Android)
**Researched:** 2026-01-20
**Confidence:** MEDIUM-HIGH

## Executive Summary

ASTN v2.0 requires a two-stage transformation: first making the existing web app fully responsive with mobile-native navigation patterns, then wrapping it with Tauri 2.0 for iOS/Android app store distribution. The existing stack (TanStack Start, Convex, Tailwind v4, shadcn/ui) is well-suited for this work. No major technology additions are needed for responsive web - Tailwind v4 already has mobile-first utilities. For Tauri, the critical architectural decision is switching from SSR to SPA/prerender mode since Tauri has no Node.js runtime.

The recommended approach is sequential: **responsive web first, then Tauri integration**. This ensures the mobile experience works correctly in browsers before adding native wrapper complexity. The responsive foundation (bottom tab bar, touch targets, safe areas) will directly benefit the Tauri app since it renders the same web content. Key risks center on Apple's Guideline 4.2 ("minimum functionality") rejection for webview apps - ASTN must demonstrate genuine native value through push notifications, offline capability, and native navigation patterns.

Research confidence is HIGH for responsive patterns (well-documented, mature ecosystem) and MEDIUM for Tauri mobile (stable since October 2024 but younger ecosystem, some edge cases documented in GitHub issues). The biggest gaps are Convex OAuth flow testing in Tauri WebView and push notification reliability with community plugins.

## Key Findings

### Recommended Stack

The existing ASTN stack requires no changes for responsive web. For Tauri integration, add the Tauri CLI, API bridge, and selected plugins.

**Keep (no changes):**
- **TanStack Start:** Keep SSR for web; add SPA mode build config for Tauri
- **Convex:** Real-time backend works unchanged in Tauri WebView (WebSocket-based)
- **Tailwind v4:** Already mobile-first with fluid typography in place
- **shadcn/ui:** Components are responsive-ready; need mobile dialog patterns

**Add for Tauri:**
- **@tauri-apps/cli + api:** Core Tauri tooling (v2.1.x)
- **tauri-plugin-http:** Convex API access
- **tauri-plugin-deep-link:** OAuth callback handling
- **tauri-plugin-store:** Secure token persistence
- **tauri-plugin-notifications:** Push notifications (community plugin, ~300 downloads)

**Critical configuration:** Create `vite.config.tauri.ts` with prerendering enabled and SPA mode for static output. Tauri loads static files into WebView - no server functions.

### Expected Features

**Must have (table stakes):**
- Responsive layouts across all routes (no horizontal scroll, 44px touch targets)
- Bottom tab bar navigation (Home, Opportunities, Matches, Events, Profile)
- Safe area handling for notches/home indicators
- <3 second initial load time
- Touch-friendly interactions (pull-to-refresh, swipe gestures)
- App Store compliance (privacy policy, screenshots, metadata)

**Should have (differentiators):**
- Push notifications for new matches (critical for app store approval)
- Offline opportunity browsing (demonstrates native value)
- Haptic feedback on key actions
- Biometric authentication for quick access

**Defer (v2.1+):**
- Swipe-to-save opportunity browsing
- Background sync
- Event check-in / peer discovery
- Widgets

### Architecture Approach

The architecture follows a **dual-build strategy**: SSR for web deployment, prerendering for Tauri. A new `ResponsiveShell` component handles layout switching between desktop (current header nav) and mobile (bottom tab bar). Platform detection via `window.__TAURI__` enables conditional behavior.

**Major components:**
1. **ResponsiveShell:** Layout wrapper that renders DesktopNav or MobileBottomNav based on breakpoint
2. **MobileBottomNav:** Fixed bottom tab bar with 5 primary destinations, safe-area-aware
3. **MobileTopBar:** Simplified header with hamburger menu for secondary nav
4. **Platform utilities:** `isTauri()`, `getPlatform()` for conditional feature enabling

**Structural changes:**
- Refactor `auth-header.tsx` to `DesktopNav.tsx`
- Add `useMediaQuery` hook for breakpoint detection
- Create `vite.config.tauri.ts` for static builds
- Add `src-tauri/` directory with Rust project structure

### Critical Pitfalls

1. **Apple Guideline 4.2 Rejection** — Apps that are "just website wrappers" get rejected. Must demonstrate native value: push notifications, offline mode, native navigation. This is the most likely rejection reason.

2. **Server Function Incompatibility** — `createServerFn` calls fail in Tauri (no Node.js). Current `getThemeFromCookie` in `__root.tsx` needs conditional handling - use localStorage fallback in Tauri builds.

3. **Safe Area Inset Neglect** — Bottom nav overlapping iOS home indicator is a common mistake. Use `env(safe-area-inset-bottom)` CSS and test on notched devices.

4. **Touch Target Violations** — Desktop-sized buttons are frustrating on mobile. Enforce minimum 44x44px on all interactive elements. Test with actual thumb.

5. **Push Notification Plugin Immaturity** — Tauri lacks official push plugin. Community `tauri-plugin-notifications` works but is less proven than Capacitor. Test end-to-end on physical devices early.

## Implications for Roadmap

Based on research, the recommended phase structure is:

### Phase 1: Responsive Foundation
**Rationale:** Must work in browsers before wrapping with Tauri. Responsive CSS directly benefits Tauri since it renders the same web content.
**Delivers:** Mobile-first responsive layouts, useMediaQuery hook, component audit
**Addresses:** Fluid layouts, touch targets, form usability, performance baseline
**Avoids:** Desktop-first shrinking (#1), touch target violations (#3), form disasters (#7)

### Phase 2: Mobile Navigation System
**Rationale:** Navigation architecture is prerequisite for native-feeling mobile experience. Must be complete before Tauri integration.
**Delivers:** ResponsiveShell, MobileBottomNav, MobileTopBar, safe area CSS
**Addresses:** Bottom tab bar, hamburger secondary nav, safe areas
**Avoids:** Safe area neglect (#4), navigation pattern mismatch (#6), fixed positioning chaos (#5)

### Phase 3: Tauri Desktop Integration
**Rationale:** Validate Tauri integration on desktop before adding mobile complexity. Desktop has simpler build chain and faster iteration.
**Delivers:** Tauri project setup, SPA build config, Convex connectivity, platform detection
**Uses:** @tauri-apps/cli, vite.config.tauri.ts, platform.ts utilities
**Avoids:** Server function incompatibility (#2), plugin capability issues (#12)

### Phase 4: Tauri Mobile + Native Features
**Rationale:** Mobile targets (iOS/Android) after desktop Tauri works. Add native features that justify app store presence.
**Delivers:** iOS/Android builds, deep link auth, push notifications, offline support
**Addresses:** Push notifications (differentiator), biometric auth, offline browsing
**Avoids:** Guideline 4.2 rejection (#16), plugin incompatibility (#12), filesystem bugs (#9)

### Phase 5: App Store Submission
**Rationale:** Separate submission phase because it requires manual first upload, specific assets, and compliance checks.
**Delivers:** TestFlight/Play Store beta releases, store assets, privacy manifests
**Addresses:** App Store requirements (iOS + Android), beta testing (50-100 pilot users)
**Avoids:** Entitlements not applied (#11), first upload manual requirement (#13), missing assets (#21)

### Phase Ordering Rationale

- **Responsive before Tauri:** The same HTML/CSS runs in Tauri WebView. Getting responsive right in browsers ensures it works in the native wrapper.
- **Desktop Tauri before Mobile Tauri:** Desktop has simpler build chain (no Xcode/Android Studio). Validates Convex connectivity and auth flow before mobile complexity.
- **Native features in Phase 4:** Push notifications and offline support are required for app store approval. Building them after basic Tauri integration reduces debugging complexity.
- **Submission as separate phase:** App store submission is administrative work (assets, metadata, compliance) distinct from code development. Requires manual first upload.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4:** OAuth flow in Tauri WebView needs prototype testing. Push notification plugin end-to-end flow needs validation on physical devices. Offline sync strategy with Convex may need separate research.
- **Phase 5:** App signing, provisioning profiles, and store listing requirements are documented but complex. May need domain-specific research.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Responsive web patterns are well-documented. Tailwind v4 docs sufficient.
- **Phase 2:** Bottom tab bar and safe areas are standard mobile patterns. No research needed.
- **Phase 3:** Tauri desktop integration is straightforward. Community template exists.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack is validated; Tauri additions are documented |
| Features | HIGH | Mobile responsive and app store requirements are well-documented |
| Architecture | MEDIUM-HIGH | Dual-build strategy is logical; Convex+Tauri integration tested by community |
| Pitfalls | HIGH | GitHub issues verified; app store rejections well-documented |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Convex OAuth in Tauri WebView:** GitHub/Google OAuth redirect flow needs testing early in Phase 3. May need deep link configuration.
- **Push notification reliability:** Community plugin works but less battle-tested. Prototype in Phase 4 before committing to full implementation.
- **Offline sync with Convex:** Convex requires network. Offline UX needs product decision (cache-only browsing vs. queueing updates).
- **iOS/Android store submission specifics:** Research was high-level. Detailed submission guides needed in Phase 5.

## Open Questions for Requirements

1. **Push notification content:** What triggers push notifications? New matches only, or also opportunity updates, event reminders?
2. **Offline scope:** Cache-only browsing of previously viewed content, or queue updates for sync?
3. **Desktop app priority:** Ship Tauri desktop (macOS/Windows) alongside mobile, or mobile-only?
4. **Beta testing approach:** TestFlight internal (100 users) sufficient for BAISH pilot, or need external track?

## Sources

### Primary (HIGH confidence)
- Tauri v2 Official Docs (v2.tauri.app) — mobile setup, plugins, configuration
- TanStack Start Docs (tanstack.com/start) — SPA mode documentation
- Apple Human Interface Guidelines — tab bars, touch targets, safe areas
- Google Material Design Guidelines — navigation, data safety
- Tailwind CSS v4 Docs — responsive utilities, container queries

### Secondary (MEDIUM confidence)
- kvnxiao/tauri-tanstack-start-react-template — community template for TanStack Start + Tauri
- Convex Discord — Tauri integration discussions, OAuth considerations
- GitHub Issues (tauri-apps/tauri) — #12276 (filesystem), #14233 (Xcode), #11089 (entitlements), #12260 (capabilities)
- tauri-plugin-notifications (GitHub) — community push notification plugin

### Tertiary (needs validation)
- Convex + Tauri OAuth flow — community reports it works but needs testing
- Push notification end-to-end reliability — limited production usage data

---
*Research completed: 2026-01-20*
*Ready for roadmap: yes*
