# Features Research: v2.0 Mobile + Tauri

**Domain:** Career command center for AI safety talent - mobile-first responsive web + native mobile apps
**Researched:** 2026-01-20
**Overall Confidence:** HIGH

## Summary

Mobile-first responsive design and native-feeling mobile apps have well-established patterns in 2025-2026. The feature landscape for ASTN v2.0 is clearly defined: users expect instant load times (<3 seconds), thumb-friendly navigation via bottom tab bars, and smooth touch interactions. For a career/job search app specifically, quick access to opportunities, profile management, and match notifications are critical.

Key insights:
- **Bottom tab bar navigation** is the dominant pattern for apps with 3-5 primary sections (perfect for ASTN's Home/Opportunities/Matches/Events/Profile structure)
- **55%+ of web traffic is mobile** - mobile-first isn't optional, it's the default
- **53% of users abandon apps that take >3 seconds to load**
- **Tauri 2.0** supports iOS and Android with ~95% smaller bundle sizes than Electron
- **Offline-first patterns** are increasingly expected, especially for content browsing

---

## Table Stakes

Features users **expect** as baseline. Missing these = app feels broken or incomplete.

### Responsive Layout

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Fluid grid system** | Content must adapt to any screen width (320px-2560px+) | Low | Tailwind's responsive utilities handle this well |
| **Touch-friendly tap targets** | Minimum 44x44px (iOS) / 48x48dp (Android) for all interactive elements | Low | Critical for buttons, links, form inputs |
| **Readable typography** | 16px minimum base font, 1.5+ line height for body text | Low | Prevents zoom on iOS form inputs |
| **No horizontal scroll** | Content contained within viewport | Low | Common breakage point on mobile |
| **Responsive images** | Appropriately sized images for device/connection | Medium | Use `srcset`, lazy loading, and modern formats (WebP/AVIF) |
| **Safe area handling** | Content respects notches, home indicators, rounded corners | Low | CSS `env(safe-area-inset-*)` |
| **Viewport meta tag** | Proper mobile viewport configuration | Low | `width=device-width, initial-scale=1` |

### Mobile Navigation

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Bottom tab bar** | Primary navigation for 3-5 sections, always visible | Medium | ASTN: Home, Opportunities, Matches, Events, Profile |
| **Active state indicators** | Clear visual feedback for current section | Low | Icon fill/color change + label highlight |
| **Icon + label combination** | Text labels improve discoverability by 75%+ | Low | Never icons-only for primary nav |
| **Thumb zone optimization** | Primary actions reachable with one-handed use | Medium | Bottom 1/3 of screen is "easy reach" zone |
| **Consistent back navigation** | Predictable back behavior matching platform conventions | Low | iOS: edge swipe, Android: system back button |
| **Hamburger for secondary nav** | Overflow/settings items not in bottom bar | Low | Profile settings, help, logout |
| **Sticky headers** | Context maintained while scrolling content | Low | Page title, search, filters |

### Touch Interactions

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Tap feedback** | Visual/haptic response within 100ms | Low | Active states, ripple effects |
| **Pull-to-refresh** | Refresh content on list views | Medium | Standard on opportunity/match lists |
| **Swipe gestures** | Horizontal swipe for actions (archive, save) | Medium | On opportunity cards, match cards |
| **Scroll momentum** | iOS-style inertial scrolling | Low | Native in WebKit, ensure not blocked |
| **Pinch-to-zoom** | On images, job descriptions where useful | Low | But disable on forms/navigation |
| **Long-press menus** | Context actions on list items | Medium | Save opportunity, share, report |
| **Gesture cancelability** | Users can abort gestures mid-action | Low | Critical for preventing accidental actions |

### Performance

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **<3 second initial load** | 53% abandon after 3 seconds | High | Critical - code splitting, lazy loading |
| **<100ms tap response** | Perceived as "instant" | Medium | Optimistic UI, no blocking renders |
| **60fps scrolling** | No janky animations | Medium | Virtualized lists for opportunity/match feeds |
| **Skeleton loading states** | Visual feedback during data fetch | Low | Prefer over blank screens or spinners |
| **Minimal bundle size** | Fast download, especially on 3G/4G | Medium | Tree shaking, dynamic imports |
| **Image optimization** | Lazy load, proper sizing, modern formats | Medium | Significant impact on perceived speed |

### App Store Requirements (iOS)

| Requirement | Why Required | Complexity | Notes |
|-------------|--------------|------------|-------|
| **Apple Developer enrollment** | Required for App Store distribution | Low | $99/year |
| **Code signing** | All iOS apps must be signed | Medium | Tauri handles via Xcode integration |
| **Privacy policy URL** | Required in App Store listing | Low | Must be publicly accessible |
| **Age rating** | Content rating declaration | Low | Likely 4+ for job search app |
| **App icon (all sizes)** | Required asset bundle | Low | Tauri CLI generates from single source |
| **Launch screen** | Required for iOS apps | Low | Storyboard or static image |
| **No test/placeholder content** | Apps rejected with "lorem ipsum" or test data | Low | Ensure production data in submission |
| **Functional demo account** | Reviewers need to test login-gated features | Medium | Create demo@astn.ai test account |
| **Native iOS experience** | Not just a web wrapper - must use platform appropriately | Medium | Add value beyond website |

### App Store Requirements (Android/Google Play)

| Requirement | Why Required | Complexity | Notes |
|-------------|--------------|------------|-------|
| **Google Play Developer account** | Required for Play Store distribution | Low | $25 one-time fee |
| **Target API level 35** | Required as of August 2025 for new apps | Medium | Tauri handles via Android project config |
| **App signing** | Play App Signing required | Medium | Upload key + signing key workflow |
| **Privacy policy** | Required for apps accessing personal data | Low | Same URL as iOS |
| **12+ testers for 14 days** | Required before production access (closed testing) | Medium | Plan for beta period |
| **Content rating questionnaire** | IARC rating required | Low | Complete in Play Console |
| **Data safety section** | Declare data collection/sharing practices | Low | Profile data, analytics disclosure |
| **High-quality screenshots** | Store listing assets | Low | Multiple device sizes |

---

## Differentiators

Features that would make ASTN stand out. Not expected, but valued when present.

### Native-Feel Enhancements

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Haptic feedback** | Tactile confirmation on key actions (save, match) | Medium | Tauri plugin for native haptics |
| **Smooth page transitions** | Animated navigation between views | Medium | React transitions or Framer Motion |
| **Offline opportunity browsing** | View saved/cached opportunities without connection | High | Service worker + IndexedDB caching |
| **Background sync** | Queue profile updates when offline, sync when connected | High | Background Sync API |
| **Smart loading** | Prefetch likely-next content | Medium | Prefetch match details on hover/focus |
| **Adaptive themes** | Auto dark/light based on system preference + time | Low | Already have dark mode infrastructure |

### Job Search Specific

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Quick apply flow** | One-tap expression of interest for opportunities | Medium | Pre-filled from profile |
| **Save for later** | Bookmark opportunities to review later | Low | Sync across devices |
| **Search/filter persistence** | Remember last search criteria | Low | Local storage + profile sync |
| **Match notifications** | Push notifications for new high-tier matches | High | Requires notification permission, backend |
| **Opportunity freshness indicators** | "New" badges, "Posted 2 days ago" | Low | Visual hierarchy for recency |
| **Swipe-to-save** | Tinder-style opportunity browsing | Medium | Could be differentiating UX |

### Onboarding & Engagement

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Progressive profile building** | Don't require full profile upfront | Medium | Core flow exists, optimize for mobile |
| **Profile completeness gamification** | Progress bars, completion rewards | Low | Visual motivation to complete profile |
| **Contextual tips** | First-time feature hints | Low | Coach marks for new users |
| **Skip-able onboarding** | Respect user time, allow skip | Low | Can revisit later |

### Workshop Integration (BAISH Specific)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **QR code profile sharing** | Share profile URL at workshops | Low | Generate shareable link/QR |
| **Event check-in** | Mark attendance at BAISH events | Medium | Potential future integration |
| **Peer discovery** | Find other attendees at events | High | Would require real-time features |

---

## Anti-Features

Things to deliberately NOT build. Common mistakes in this domain.

### Navigation Anti-Patterns

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Hamburger-only navigation** | Hides primary nav, reduces discoverability by 50%+ | Use bottom tab bar for primary sections |
| **Too many tabs (>5)** | Cramped, hard to tap, cognitive overload | Stick to 5 tabs max, overflow to hamburger |
| **Tab scrolling** | Confusing, unpredictable | Fixed tabs only |
| **Gesture-only navigation** | Inaccessible, no discoverability | Always provide visible tap alternatives |
| **Inconsistent back behavior** | Frustrating, breaks mental model | Follow platform conventions strictly |

### Performance Anti-Patterns

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full-page loaders** | Blocks all interaction, feels slow | Skeleton screens, progressive loading |
| **Blocking modals on load** | Interrupts user before value shown | Defer non-critical prompts |
| **Unoptimized images** | Largest cause of slow mobile pages | Lazy load, proper sizing, modern formats |
| **Synchronous data fetching** | Blocks render | Optimistic UI, parallel fetches |
| **Infinite scroll without virtualization** | Memory issues, janky scrolling | Virtual lists for long feeds |

### UX Anti-Patterns

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Aggressive push notification prompts** | Instant denial, negative perception | Ask after demonstrated value, explain benefit |
| **Mandatory account creation upfront** | 86% bounce rate | Allow exploration first, prompt when needed |
| **Long forms on mobile** | High abandonment, error-prone | Break into steps, save progress, smart defaults |
| **Tiny touch targets** | Frustrating, accessibility failure | Minimum 44x44px always |
| **Desktop-first responsive** | Mobile experience feels like afterthought | Design mobile-first, enhance for desktop |
| **Popup/modal abuse** | Disruptive, feels spammy | Use inline UI, sheets, or toasts instead |
| **Auto-playing video/audio** | Battery drain, data usage, annoying | User-initiated media only |

### App Store Anti-Patterns

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Web wrapper with no native features** | Apple rejects "apps that are simply web pages" | Add genuine native functionality |
| **Requiring login before any content** | Reviewers can't test, users can't evaluate | Show value before requiring auth |
| **External payment links (iOS)** | Violates App Store guidelines | Use in-app purchase if monetizing |
| **Misleading screenshots** | Rejection + trust damage | Show actual app experience |
| **Requesting unnecessary permissions** | Rejection + user distrust | Request only what's needed, when needed |

### Career App Specific Anti-Patterns

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Auto-applying to jobs** | Spam, damages user reputation | User-initiated applications only |
| **Excessive notifications** | Leads to notification disable | Batch, prioritize, respect frequency |
| **Profile data harvesting UI** | Feels invasive, reduces completion | Progressive disclosure, explain why needed |
| **Showing expired opportunities** | Wastes user time, damages trust | Filter or clearly label |
| **Complex match explanations** | Users want quick decisions | Show tier + quick summary, details on demand |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Responsive Layout | HIGH | Well-established patterns, official docs available |
| Mobile Navigation | HIGH | Bottom tab bar is standard, Apple/Google HIG documented |
| Touch Interactions | HIGH | Platform conventions are clear |
| Performance Metrics | HIGH | Industry benchmarks well-documented |
| iOS App Store | HIGH | Official Apple guidelines current |
| Google Play Store | HIGH | Official Google documentation, 2025 API requirements verified |
| Tauri Mobile | MEDIUM | Tauri 2.0 docs verified, but mobile support is newer - may encounter edge cases |
| Career App UX | MEDIUM | Based on competitor analysis (LinkedIn, Indeed), may need user validation |
| Offline Features | MEDIUM | Technical feasibility clear, but scope/priority needs product decision |

---

## Sources

### Official Documentation
- Apple Human Interface Guidelines: Tab Bars
- Google Material Design: Navigation
- Tauri v2 Documentation: Mobile Development, App Store Distribution (https://v2.tauri.app/)
- MDN: Progressive Web Apps - Offline and Background Operation
- Google Play: Target API Level Requirements (August 2025)
- Apple: App Store Review Guidelines (November 2025)

### Industry Research (WebSearch - verified with multiple sources)
- UXPin: Mobile Navigation Patterns (October 2025)
- Webflow: Responsive Web Design Best Practices (April 2025)
- NextNative: Responsive Design Best Practices (August 2025)
- UX World: Bottom Tab Bar Navigation Design Best Practices (January 2025)
- LogRocket: Offline-first Frontend Apps in 2025

### Performance Benchmarks
- 53% users abandon apps taking >3 seconds to load (multiple sources)
- 55%+ global web traffic from mobile devices (Webstacks, January 2025)
- Sub-100ms target for UI interaction response (mobile performance guides)
- 60fps target for smooth scrolling/animations (industry standard)

---

*Researched: 2026-01-20*
*Researcher: Claude (GSD Research Agent)*
