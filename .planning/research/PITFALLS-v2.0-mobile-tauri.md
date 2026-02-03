# Pitfalls Research: v2.0 Mobile + Tauri

**Domain:** Responsive web retrofit + Tauri mobile apps (iOS/Android)
**Researched:** 2026-01-20

## Summary

Adding responsive support to an existing web app and shipping via Tauri to app stores involves three distinct risk categories: (1) responsive retrofit mistakes that break existing desktop experiences, (2) Tauri 2.0 mobile-specific bugs and toolchain issues, and (3) app store rejection reasons that are particularly punishing for webview-based apps.

**Key insight:** App stores (especially Apple) are actively hostile to "website wrappers." The app must demonstrate clear native value beyond what a mobile browser provides, or it will be rejected under Guideline 4.2 (minimum functionality).

---

## Responsive Pitfalls

### 1. Desktop-First Shrinking Instead of Mobile-First Expansion

**What goes wrong:** Trying to "shrink" desktop layouts to mobile creates cramped, unusable interfaces. Fixed pixel widths overflow. Complex multi-column layouts become unreadable.

**Warning signs:**

- Horizontal scrolling appears on mobile
- Touch targets are too small (< 44x44px)
- Text becomes unreadably small
- Users must pinch-zoom to use the app

**Prevention strategy:**

- Audit all layouts and start from mobile constraints
- Use relative units (`rem`, `%`, `vw`) not fixed `px` for widths
- Design mobile layouts first, then progressively enhance for larger screens
- Test on actual mobile devices, not just browser DevTools

**Phase to address:** Phase 1 (Responsive audit and foundation)

---

### 2. Hiding Content Instead of Adapting It

**What goes wrong:** Using `display: none` to hide content on mobile loses functionality. Users can't access features they need. Information hierarchy breaks.

**Warning signs:**

- Features available on desktop are missing on mobile
- Users complain "where did X go?"
- Mobile users feel like second-class citizens
- SEO suffers because content is hidden

**Prevention strategy:**

- Never hide content entirely; adapt its presentation
- Use progressive disclosure (accordions, tabs, expandable sections)
- Prioritize content hierarchy for mobile context
- If content truly isn't needed on mobile, question if it's needed at all

**Phase to address:** Phase 1-2 (Layout adaptation)

---

### 3. Touch Target Size Violations

**What goes wrong:** Interactive elements designed for mouse precision are impossible to tap accurately on touch screens. Buttons, links, and form controls are too small or too close together.

**Warning signs:**

- Users mis-tap frequently
- Rage tapping (repeated taps on same area)
- "Fat finger" complaints
- Accessibility audit failures

**Prevention strategy:**

- Minimum 44x44px touch targets (Apple HIG) / 48x48dp (Material)
- Minimum 8px spacing between touch targets
- Make entire card/row tappable, not just small link text
- Test with your actual thumb on a phone

**Phase to address:** Phase 1 (Component audit)

---

### 4. Safe Area Inset Neglect

**What goes wrong:** Content gets obscured by device notches, status bars, home indicators, and rounded corners. Bottom navigation bars overlap the iOS home indicator.

**Warning signs:**

- Content hidden behind the notch/Dynamic Island
- Bottom nav overlaps home indicator gesture area
- Status bar text unreadable over content
- Inconsistent behavior between iOS and Android

**Prevention strategy:**

- Use `env(safe-area-inset-*)` CSS variables
- Set `viewport-fit=cover` in meta viewport tag
- Add appropriate padding to header and footer areas
- Test on notched devices (iPhone X+, modern Android)

**CSS pattern:**

```css
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.header {
  padding-top: env(safe-area-inset-top, 0);
}
```

**Phase to address:** Phase 2 (Bottom tab bar implementation)

---

### 5. Fixed Positioning Chaos

**What goes wrong:** Elements with `position: fixed` behave unpredictably on mobile, especially with virtual keyboards. Modals, headers, and footers jump around or become inaccessible.

**Warning signs:**

- Fixed header disappears when keyboard opens
- Modal content unreachable on small screens
- "Bouncy" behavior when scrolling
- Z-index wars between fixed elements

**Prevention strategy:**

- Use `position: sticky` where possible instead of `position: fixed`
- Handle keyboard appearance with `visualViewport` API
- Test all fixed elements with virtual keyboard open
- Use `dvh` (dynamic viewport height) instead of `vh` for full-height layouts

**Phase to address:** Phase 1-2 (Layout system updates)

---

### 6. Navigation Pattern Mismatch

**What goes wrong:** Desktop sidebar navigation doesn't translate to mobile. Users can't find navigation. Hamburger menus bury critical functionality.

**Warning signs:**

- Users can't find how to navigate the app
- High bounce rate on mobile
- Support requests about "where is X?"
- Navigation takes too many taps to reach

**Prevention strategy:**

- Use bottom tab bar for 3-5 primary destinations (thumb-friendly)
- Keep most important actions in easy reach zone
- Don't hide critical navigation in hamburger menu
- Provide consistent back navigation

**Phase to address:** Phase 2 (Bottom tab bar implementation)

---

### 7. Form Usability Disasters

**What goes wrong:** Forms designed for keyboard/mouse are painful on mobile. Wrong input types, no autofill hints, tiny inputs, keyboard obscuring fields.

**Warning signs:**

- Number inputs show full QWERTY keyboard
- Email fields don't show @ key
- Users can't see what they're typing (keyboard covers field)
- No autocomplete/autofill suggestions

**Prevention strategy:**

- Use correct `inputmode` attributes (`email`, `tel`, `numeric`, `url`)
- Add `autocomplete` attributes for all fields
- Scroll focused field into view above keyboard
- Use larger input heights on mobile (min 48px)
- Label fields clearly (not just placeholder text)

**Phase to address:** Phase 1 (Form component updates)

---

### 8. Performance Regression on Mobile

**What goes wrong:** Desktop-acceptable performance becomes unacceptable on mobile devices with slower CPUs, limited memory, and cellular connections.

**Warning signs:**

- Janky scrolling on mobile
- Long initial load times on cellular
- Memory warnings / app crashes
- Battery drain complaints

**Prevention strategy:**

- Audit bundle size and implement code splitting
- Lazy load below-fold content and images
- Reduce JavaScript execution (especially on initial load)
- Use `IntersectionObserver` for lazy loading
- Test on mid-tier Android devices, not just flagship iPhones

**Phase to address:** Phase 3 (Performance optimization)

---

## Tauri Mobile Pitfalls

### 9. Filesystem Path Resolution Bugs

**What goes wrong:** Tauri's `appDataDir` and other path APIs resolve differently on iOS vs Android vs desktop. Code that works on desktop fails silently or crashes on mobile.

**Warning signs:**

- File operations work on desktop but fail on mobile
- Different paths returned on iOS vs Android
- Files "disappear" after app restart
- Silent failures with no error messages

**Prevention strategy:**

- Abstract all filesystem operations behind a service
- Test file operations on ALL target platforms early
- Use Tauri's recommended path APIs, not hardcoded paths
- Log actual resolved paths during development
- Handle errors gracefully; don't assume paths exist

**Phase to address:** Phase 3 (Tauri integration)

**Source:** GitHub issue #12276 (verified, affects Tauri 2.1.1)

---

### 10. Xcode Version Incompatibility

**What goes wrong:** Tauri's iOS tooling (cargo-mobile2) has hardcoded assumptions about Xcode versions and available iOS simulators. Upgrading Xcode can break builds entirely.

**Warning signs:**

- `cargo tauri ios dev` fails after Xcode update
- "Unable to find a device matching the provided destination specifier"
- Simulator targets don't match what Xcode expects
- Build failures mentioning iPhone models that don't exist

**Prevention strategy:**

- Pin Xcode version for CI/CD
- Update Tauri CLI before updating Xcode
- Check Tauri GitHub issues before major Xcode upgrades
- Have fallback to manual Xcode project building

**Phase to address:** Phase 3 (iOS build pipeline)

**Source:** GitHub issue #14233 (affects Xcode 26+)

---

### 11. iOS Entitlements Not Applied to Release Builds

**What goes wrong:** Capabilities added in Xcode (like Sign in with Apple) work in the simulator but fail on TestFlight/production because entitlements aren't properly included in the IPA.

**Warning signs:**

- Feature works in simulator, fails on TestFlight
- "Authorization failed" errors in device logs
- Capabilities visible in Xcode but not in codesigned app
- TestFlight reviewers report features not working

**Prevention strategy:**

- Verify entitlements with: `codesign -d --entitlements :- Payload/App.app`
- Check both Debug AND Release configurations in Xcode
- Use automatic signing when possible
- Test on physical device before TestFlight submission

**Phase to address:** Phase 4 (App Store submission)

**Source:** GitHub issue #11089 (verified)

---

### 12. Plugin Capabilities Not Enabled on Mobile

**What goes wrong:** Tauri plugins that work on desktop fail on mobile because mobile capabilities aren't enabled in the configuration.

**Warning signs:**

- "shell.open not allowed" or similar capability errors
- Features work on desktop, fail on mobile
- Console errors about permissions/capabilities
- Plugin functions return undefined on mobile

**Prevention strategy:**

- Review capability configuration for EACH plugin
- Test plugins on mobile early in development
- Check Tauri plugin documentation for mobile-specific setup
- Use `#[cfg(mobile)]` to handle platform differences

**Phase to address:** Phase 3 (Tauri setup)

**Source:** GitHub issue #12260

---

### 13. First Upload Must Be Manual

**What goes wrong:** Developers assume they can automate Play Store/App Store uploads from day one. First submission requires manual upload to verify signature/bundle ID.

**Warning signs:**

- CI/CD pipeline fails on first release
- "Bundle ID not registered" errors
- Signature verification failures
- Automated upload returns cryptic errors

**Prevention strategy:**

- Plan for manual first submission for both stores
- Document the manual upload process
- Set up automation only after first successful manual upload
- Keep signing credentials secure and documented

**Phase to address:** Phase 4 (App Store submission)

**Source:** Tauri official documentation

---

### 14. Android Version Code Conflicts

**What goes wrong:** Tauri auto-generates version codes using `major*1,000,000 + minor*1,000 + patch`. This can conflict with manual version codes or create issues when version jumps.

**Warning signs:**

- Play Store rejects upload due to lower version code
- Version code exceeds maximum (2100000000)
- Confusion about which version is newest
- Rollback impossible due to version code

**Prevention strategy:**

- Understand the auto-generation formula
- Override in `tauri.conf.json` if using custom versioning
- Never decrease version code
- Plan version numbering scheme before first release

**Phase to address:** Phase 4 (Release preparation)

---

### 15. Push Notification Plugin Immaturity

**What goes wrong:** Tauri lacks an official push notification plugin. Community plugins exist but are less battle-tested than Capacitor's first-party solution.

**Warning signs:**

- Token registration fails silently
- Notifications work in foreground but not background
- Inconsistent behavior between iOS and Android
- Plugin abandoned or incompatible with Tauri updates

**Prevention strategy:**

- Use `tauri-plugin-notifications` (most active, ~300 downloads)
- Test push flow end-to-end on physical devices early
- Have fallback plan (Capacitor migration or local notifications only)
- Monitor plugin repository for updates and issues

**Phase to address:** Phase 3 (Push notification integration)

**Source:** Prior research in `mobile-app-options.md`

---

## App Store Pitfalls

### 16. Apple Guideline 4.2 Rejection (Minimum Functionality)

**What goes wrong:** Apple rejects apps that are "just a website wrapper" without sufficient native functionality. This is the most common rejection reason for webview apps.

**Warning signs:**

- App provides identical experience to mobile website
- No native features (push notifications, offline mode, widgets)
- App feels like Safari with extra steps
- Review notes mention "minimum functionality"

**Prevention strategy:**

- Add genuine native value: push notifications, offline support, widgets
- Implement native navigation (bottom tab bar, gestures)
- Store data locally; don't require constant internet
- Make the app feel "app-like" not "website-like"
- Consider: "Why would a user download this instead of bookmarking the website?"

**ASTN-specific native value:**

- Push notifications for new matches (critical differentiator)
- Offline access to profile and saved matches
- Native bottom tab navigation
- Biometric authentication for quick access

**Phase to address:** Phase 2-3 (Native features)

**Source:** Apple App Store Review Guidelines 4.2, multiple developer reports

---

### 17. In-App Purchase Requirements

**What goes wrong:** Apps with subscription features accessible via webview must use Apple's In-App Purchase system. Bypassing this (even via web payments) causes rejection.

**Warning signs:**

- Webview loads payment pages
- Subscription buttons visible in app
- Links to external payment forms
- "Reader" app exemption doesn't apply

**Prevention strategy:**

- ASTN appears to be a career platform, not a paid subscription service
- If premium features are added later, implement IAP
- Remove or hide any payment-related UI in the webview
- Ensure no external purchase links are accessible

**Phase to address:** N/A for current scope (monitor if monetization is added)

**Source:** Apple Guideline 3.1.1

---

### 18. Privacy Manifest and Data Collection Declaration

**What goes wrong:** Apple requires privacy manifests declaring what data is collected. Missing or inaccurate declarations cause rejection or removal from store.

**Warning signs:**

- Rejection mentioning privacy manifest
- App removed for privacy policy violations
- Third-party SDKs requiring declarations
- Tracking transparency prompt issues

**Prevention strategy:**

- Create accurate privacy manifest
- Audit all third-party SDKs for data collection
- Declare Convex data collection appropriately
- Implement App Tracking Transparency if using tracking (ASTN likely doesn't need this)

**ASTN data collection to declare:**

- Profile data (user-provided)
- Authentication tokens (Convex Auth)
- Usage analytics (if added)
- Push notification tokens

**Phase to address:** Phase 4 (App Store submission)

---

### 19. Google Play Data Safety Form Errors

**What goes wrong:** Play Store requires accurate Data Safety declarations. Mismatches between declaration and actual behavior cause rejection or warnings.

**Warning signs:**

- Play Console warnings about data safety
- User complaints about data collection
- Policy violation notices
- App flagged for review

**Prevention strategy:**

- Audit actual data collection (Convex, analytics, auth providers)
- Fill Data Safety form accurately
- Update form when adding new features
- Document data flows for compliance

**Phase to address:** Phase 4 (Play Store submission)

---

### 20. Beta Testing Limitations (TestFlight/Play Console)

**What goes wrong:** Developers misunderstand beta testing limits and processes. TestFlight has 10,000 external tester limit. Play Console internal testing has different review requirements than production.

**Warning signs:**

- Unable to add more testers
- Confusion about internal vs external testing
- Beta crashes not being tracked
- Testers can't install updates

**Prevention strategy:**

- TestFlight: 10,000 external testers max, 90-day build expiry
- Play Console: Internal testing (100 testers, no review), Closed testing (needs review), Open testing (unlimited)
- Plan beta strategy before submission
- Use internal testing first, graduate to external

**For ASTN pilot (50-100 users):**

- TestFlight internal testing (up to 100) is sufficient for pilot
- Play Console internal testing (100 testers) matches pilot size
- No need for external testing tracks initially

**Phase to address:** Phase 4 (Beta distribution)

---

### 21. Missing App Store Assets and Metadata

**What goes wrong:** App store submissions fail due to missing screenshots, icons, descriptions, or metadata in required formats and dimensions.

**Warning signs:**

- Submission rejected for missing assets
- Screenshots don't match device requirements
- Icon missing required sizes
- Description too short or missing keywords

**Prevention strategy:**

**iOS App Store Connect:**

- 6.7" screenshots (iPhone 14 Pro Max / 15 Pro Max): 1290 x 2796
- 6.5" screenshots (iPhone 11 Pro Max / XS Max): 1242 x 2688
- 5.5" screenshots (iPhone 8 Plus / 7 Plus): 1242 x 2208
- iPad Pro 12.9" (3rd gen+): 2048 x 2732 (if supporting iPad)
- App icons: 1024 x 1024 (plus all required sizes in asset catalog)

**Google Play Console:**

- Phone screenshots: 1080 x 1920 minimum
- 7" tablet screenshots (if supporting tablets)
- 10" tablet screenshots (if supporting tablets)
- Feature graphic: 1024 x 500
- App icon: 512 x 512

**Both stores:**

- Privacy policy URL (required)
- Support URL
- Compelling descriptions with relevant keywords
- "What's New" text for each version

**Phase to address:** Phase 4 (Submission preparation)

---

## Phase-Specific Warning Summary

| Phase                         | Primary Pitfalls                                                              | Critical Watch                            |
| ----------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| Phase 1: Responsive Audit     | Fixed widths (#1), touch targets (#3), form usability (#7)                    | Test on real devices early                |
| Phase 2: Navigation/Layout    | Safe area insets (#4), nav pattern (#6), fixed positioning (#5)               | Bottom nav + notch interaction            |
| Phase 3: Tauri Integration    | Filesystem paths (#9), plugin capabilities (#12), push maturity (#15)         | Test on physical iOS/Android devices      |
| Phase 4: App Store Submission | Guideline 4.2 (#16), privacy manifest (#18), entitlements (#11), assets (#21) | Apple's "minimum functionality" rejection |

---

## Confidence Assessment

| Area                 | Confidence | Notes                                                                 |
| -------------------- | ---------- | --------------------------------------------------------------------- |
| Responsive Pitfalls  | HIGH       | Well-documented patterns, multiple authoritative sources              |
| Tauri Mobile Bugs    | MEDIUM     | Based on GitHub issues; Tauri mobile is young (stable since Oct 2024) |
| App Store Rejections | HIGH       | Apple/Google documentation + extensive developer reports              |
| Safe Area Handling   | MEDIUM     | iOS vs Android inconsistencies documented but solutions vary          |
| Push Notifications   | MEDIUM     | Community plugin exists but less proven than Capacitor                |

### Research Gaps to Address During Implementation

- Specific Tauri plugin compatibility matrix for iOS/Android (verify during phase 3)
- Deep linking / universal links setup for Tauri mobile (research when needed)
- Push notification end-to-end flow with Convex backend (prototype early in phase 3)
- Offline data sync strategy with Convex (may need separate research)

---

_Researched: 2026-01-20_

_Sources:_

- GitHub Issues: tauri-apps/tauri (#12276, #14233, #11089, #12260)
- Apple App Store Review Guidelines (4.2, 3.1.1)
- Google Play Console Help (Data Safety, Content Guidelines)
- Tauri v2 Documentation (v2.tauri.app)
- Prior ASTN research: `.planning/research/mobile-app-options.md`
- Exa web search: responsive design patterns, app store rejections 2025
