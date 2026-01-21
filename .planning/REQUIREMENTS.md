# Requirements: v2.0 Mobile + Tauri

**Defined:** 2026-01-20
**Core Value:** Individuals get enough value from smart matching + recommendations that they keep profiles fresh

## v2.0 Requirements

Requirements for mobile-first responsive web + Tauri native apps.

### Responsive Layout

- [ ] **RESP-01**: All routes display correctly on mobile viewports (no horizontal scroll)
- [ ] **RESP-02**: Touch targets are minimum 44x44px on all interactive elements
- [ ] **RESP-03**: Forms are mobile-usable (labels above inputs, appropriate keyboards)
- [ ] **RESP-04**: Typography remains readable across breakpoints (fluid scale already in place)
- [ ] **RESP-05**: Tables and data-heavy views adapt to narrow screens
- [ ] **RESP-06**: Skeleton loading states for list views and cards
- [ ] **RESP-07**: Smooth layout transitions when resizing/rotating

### Mobile Navigation

- [ ] **NAV-01**: Bottom tab bar with 5 destinations (Home, Opportunities, Matches, Events, Profile)
- [ ] **NAV-02**: Safe area handling for notches and home indicators
- [ ] **NAV-03**: Secondary navigation via hamburger menu (settings, admin, logout)
- [ ] **NAV-04**: Active tab state clearly visible with animation
- [ ] **NAV-05**: Haptic feedback on tab selection (native builds only)

### Touch Interactions

- [ ] **TOUCH-01**: Pull-to-refresh on opportunity and match list views
- [ ] **TOUCH-02**: Tap feedback within 100ms on all interactive elements
- [ ] **TOUCH-03**: Swipe gestures for common actions (e.g., dismiss, save)
- [ ] **TOUCH-04**: Haptic feedback on key interactions (native builds only)

### Tauri Integration

- [ ] **TAURI-01**: Tauri project initialized with iOS and Android targets
- [ ] **TAURI-02**: SPA build configuration (vite.config.tauri.ts with prerendering)
- [ ] **TAURI-03**: Platform detection utilities (isTauri, getPlatform)
- [ ] **TAURI-04**: Convex connectivity works in Tauri WebView
- [ ] **TAURI-05**: Desktop Tauri build works (validation before mobile)
- [ ] **TAURI-06**: iOS build runs in simulator
- [ ] **TAURI-07**: Android build runs in emulator

### Native Features

- [ ] **NATIVE-01**: Deep link OAuth handling for GitHub/Google login
- [ ] **NATIVE-02**: Push notifications for new "great" tier matches
- [ ] **NATIVE-03**: Offline browsing of previously viewed opportunities
- [ ] **NATIVE-04**: Biometric authentication for quick app access
- [ ] **NATIVE-05**: Secure token storage via Tauri store plugin

## v2.1+ Requirements

Deferred to future releases.

### App Store Submission

- **STORE-01**: TestFlight release (iOS)
- **STORE-02**: Play Store beta release (Android)
- **STORE-03**: App store screenshots and metadata
- **STORE-04**: Privacy policy compliance

### Additional Native Features

- **NATIVE-06**: Badge count on app icon for unread matches
- **NATIVE-07**: Background sync for offline changes
- **NATIVE-08**: Event check-in via NFC/QR

## Out of Scope

| Feature | Reason |
|---------|--------|
| App store submission | Separate milestone after v2.0 validation |
| Desktop Tauri distribution | Focus is mobile; desktop is validation step only |
| Swipe-to-save opportunity browsing | v2.1+ polish feature |
| Widgets | v2.1+ after core mobile experience validated |
| Background sync | Complex offline strategy; defer until offline browsing validated |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RESP-01 | TBD | Pending |
| RESP-02 | TBD | Pending |
| RESP-03 | TBD | Pending |
| RESP-04 | TBD | Pending |
| RESP-05 | TBD | Pending |
| RESP-06 | TBD | Pending |
| RESP-07 | TBD | Pending |
| NAV-01 | TBD | Pending |
| NAV-02 | TBD | Pending |
| NAV-03 | TBD | Pending |
| NAV-04 | TBD | Pending |
| NAV-05 | TBD | Pending |
| TOUCH-01 | TBD | Pending |
| TOUCH-02 | TBD | Pending |
| TOUCH-03 | TBD | Pending |
| TOUCH-04 | TBD | Pending |
| TAURI-01 | TBD | Pending |
| TAURI-02 | TBD | Pending |
| TAURI-03 | TBD | Pending |
| TAURI-04 | TBD | Pending |
| TAURI-05 | TBD | Pending |
| TAURI-06 | TBD | Pending |
| TAURI-07 | TBD | Pending |
| NATIVE-01 | TBD | Pending |
| NATIVE-02 | TBD | Pending |
| NATIVE-03 | TBD | Pending |
| NATIVE-04 | TBD | Pending |
| NATIVE-05 | TBD | Pending |

**Coverage:**
- v2.0 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 (pending roadmap creation)

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after initial definition*
