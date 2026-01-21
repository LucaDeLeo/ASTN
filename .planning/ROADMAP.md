# Roadmap: ASTN v2.0 Mobile + Tauri

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-01-18)
- ✅ **v1.1 Profile Input Speedup** - Phases 7-10 (shipped 2026-01-19)
- ✅ **v1.2 Org CRM & Events** - Phases 11-16 (shipped 2026-01-19)
- ✅ **v1.3 Visual Overhaul** - Phases 17-20 (shipped 2026-01-20)
- 🚧 **v2.0 Mobile + Tauri** - Phases 21-25 (in progress)

## Overview

v2.0 transforms ASTN into a mobile-first experience with native iOS and Android apps. The approach is sequential: first making the web app fully responsive, then wrapping it with Tauri for app store distribution. Responsive web foundation ensures mobile works in browsers before adding native complexity. Desktop Tauri validates the integration before tackling mobile builds. Native features (push notifications, offline, biometrics) justify app store presence beyond a simple webview wrapper.

## Phases

- [x] **Phase 21: Responsive Foundation** - Mobile-first layouts, touch targets, form usability ✓
- [x] **Phase 22: Mobile Navigation** - Bottom tab bar, safe areas, hamburger menu ✓
- [ ] **Phase 23: Touch Interactions** - Pull-to-refresh, tap feedback, swipe gestures
- [ ] **Phase 24: Tauri Desktop Integration** - Project setup, SPA config, Convex connectivity
- [ ] **Phase 25: Tauri Mobile + Native Features** - iOS/Android builds, OAuth, push, offline, biometrics

## Phase Details

### Phase 21: Responsive Foundation

**Goal**: All routes display correctly on mobile viewports with proper touch targets and form usability
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: RESP-01, RESP-02, RESP-03, RESP-04, RESP-05, RESP-06, RESP-07
**Success Criteria** (what must be TRUE):
  1. User can browse all routes on 375px viewport without horizontal scrolling
  2. User can tap all interactive elements with thumb (44x44px minimum targets)
  3. User can complete profile forms on mobile with proper input types and labels above fields
  4. User can view opportunity tables and data-heavy views on narrow screens with adapted layout
  5. User sees skeleton loading states while lists and cards load
**Plans**: 5 plans

Plans:
- [x] 21-01-PLAN.md - Responsive foundation utilities (Skeleton, useMediaQuery, ResponsiveSheet)
- [x] 21-02-PLAN.md - Opportunity views responsive (filters, skeletons)
- [x] 21-03-PLAN.md - Profile wizard responsive (step navigation, layout)
- [x] 21-04-PLAN.md - Admin tables responsive (card lists, filters)
- [x] 21-05-PLAN.md - Touch targets and final polish (audit, transitions)

### Phase 22: Mobile Navigation

**Goal**: Users navigate the app via mobile-native patterns (bottom tabs, hamburger menu)
**Depends on**: Phase 21 (responsive layouts exist)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05
**Success Criteria** (what must be TRUE):
  1. User can switch between 5 primary destinations via persistent bottom tab bar
  2. User can access settings, admin, and logout via hamburger menu
  3. User sees active tab clearly indicated with animation
  4. App content respects safe areas on notched devices (no overlap with home indicator)
**Plans**: 4 plans

Plans:
- [x] 22-01-PLAN.md - PWA manifest and safe area CSS foundation
- [x] 22-02-PLAN.md - Bottom tab bar with 5 navigation tabs
- [x] 22-03-PLAN.md - Sheet component and hamburger menu
- [x] 22-04-PLAN.md - Mobile shell layout and route integration

### Phase 23: Touch Interactions

**Goal**: Touch interactions feel native and responsive
**Depends on**: Phase 22 (navigation system exists)
**Requirements**: TOUCH-01, TOUCH-02, TOUCH-03, TOUCH-04
**Success Criteria** (what must be TRUE):
  1. User can pull-to-refresh on opportunity and match list views
  2. User sees immediate visual feedback (<100ms) when tapping interactive elements
  3. User can swipe to perform common actions (dismiss, save)
  4. App provides haptic feedback on key interactions (native builds only)
**Plans**: 3 plans

Plans:
- [ ] 23-01-PLAN.md - Touch foundation (CSS, @use-gesture, haptic hook)
- [ ] 23-02-PLAN.md - Pull-to-refresh for matches and opportunities
- [ ] 23-03-PLAN.md - Swipeable match cards with dismiss/save

### Phase 24: Tauri Desktop Integration

**Goal**: Tauri desktop build validates web-to-native integration before mobile complexity
**Depends on**: Phase 23 (responsive web app complete)
**Requirements**: TAURI-01, TAURI-02, TAURI-03, TAURI-04, TAURI-05
**Success Criteria** (what must be TRUE):
  1. Tauri project initialized with proper structure (src-tauri/, capabilities, plugins)
  2. App builds and runs as desktop application (macOS/Windows/Linux)
  3. Convex real-time sync works correctly in Tauri WebView
  4. Platform detection correctly identifies Tauri vs browser environment
  5. SPA build produces static output suitable for WebView loading
**Plans**: TBD

### Phase 25: Tauri Mobile + Native Features

**Goal**: iOS and Android apps run with native features that justify app store presence
**Depends on**: Phase 24 (desktop Tauri validated)
**Requirements**: TAURI-06, TAURI-07, NATIVE-01, NATIVE-02, NATIVE-03, NATIVE-04, NATIVE-05
**Success Criteria** (what must be TRUE):
  1. User can install and run app on iOS simulator
  2. User can install and run app on Android emulator
  3. User can complete GitHub/Google OAuth login via deep link handling
  4. User receives push notification when matched with "great" tier opportunity
  5. User can browse previously viewed opportunities while offline
  6. User can unlock app with Face ID / Touch ID / fingerprint
  7. Auth tokens persist securely via Tauri store plugin
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 21. Responsive Foundation | v2.0 | 5/5 | Complete | 2026-01-21 |
| 22. Mobile Navigation | v2.0 | 4/4 | Complete | 2026-01-21 |
| 23. Touch Interactions | v2.0 | 0/3 | Not started | - |
| 24. Tauri Desktop Integration | v2.0 | 0/TBD | Not started | - |
| 25. Tauri Mobile + Native Features | v2.0 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-20*
*Last updated: 2026-01-21 - Phase 22 complete*
