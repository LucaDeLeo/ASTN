# Phase 22: Mobile Navigation - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Mobile navigation system: bottom tab bar for 5 primary destinations, hamburger menu for secondary access (admin, help, logout), safe area handling for notched devices. Users navigate the app via mobile-native patterns.

</domain>

<decisions>
## Implementation Decisions

### Tab bar design
- 5 tabs: Home, Opportunities, Matches, Profile, Settings
- Icons + labels always visible (not icons-only)
- Active tab indicated by brand color tint + bold label, inactive tabs muted gray
- Tab bar always visible — does not hide on scroll
- Tapping active tab scrolls to top + resets to root view

### Hamburger menu
- Contains: Admin, Help, Logout only — primary nav is in tabs
- Trigger: top-right header (hamburger icon)
- Animation: slide from right edge
- Shows user avatar + name at top — tapping goes to profile

### Navigation transitions
- Tab switches: instant, no animation (snappy iOS default)
- Push to detail views: slide from right (standard mobile pattern)
- Edge swipe to go back enabled (iOS-style, left edge only)
- Same-tab tap: scroll to top + reset nested navigation to root

### Safe area handling
- Use `env(safe-area-inset-*)` CSS for notch/Dynamic Island
- Tab bar background extends to screen edge, content padded above home indicator
- Standalone display mode (no browser chrome) — PWA manifest configured
- Status bar style: default (follows system light/dark automatically)

### Claude's Discretion
- Exact tab bar height and icon sizes
- Animation timing/easing for transitions
- Hamburger menu item icons
- Header component implementation details

</decisions>

<specifics>
## Specific Ideas

- Tab bar should feel like native iOS/Android — standard patterns users expect
- Edge swipe gesture should not conflict with horizontal scroll content

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-mobile-navigation*
*Context gathered: 2026-01-21*
