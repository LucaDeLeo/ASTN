# Mobile App Options for ASTN

This document evaluates approaches for building native mobile apps for ASTN, with a focus on push notifications for match alerts.

## Requirements

- Push notifications for new matches (the critical feature)
- Wrap existing web app (React + Vite + TanStack)
- iOS and Android support
- Minimal native code maintenance

## Options Overview

| Approach             | Effort | Native Feel | Push Maturity    |
| -------------------- | ------ | ----------- | ---------------- |
| Responsive Web / PWA | Low    | Web         | Limited (no iOS) |
| Capacitor            | Medium | Hybrid      | Excellent        |
| Tauri 2.0            | Medium | Hybrid      | Community plugin |
| React Native / Expo  | High   | Native      | Excellent        |

PWA is ruled out because iOS Safari doesn't support web push notifications reliably. React Native would require rewriting the entire UI layer. This leaves **Capacitor** and **Tauri** as the practical options.

---

## Capacitor vs Tauri: Deep Comparison

### Push Notification Support

**Capacitor**

- Official plugin: `@capacitor/push-notifications`
- Battle-tested, handles FCM (Android) and APNs (iOS)
- Token registration, foreground/background handling built-in
- Straightforward setup with Firebase project
- Used in production by major apps (Burger King, Popeyes, etc.)

**Tauri**

- No official push notification plugin yet (tracked in [issue #11651](https://github.com/tauri-apps/tauri/issues/11651))
- Community plugins available (see below)
- Less battle-tested for push specifically

### Integration with Current Stack

**Capacitor**

- Works with Vite out of the box
- Point it at build output, no code changes needed
- React/TanStack code unchanged
- Convex client works as-is
- All JavaScript/TypeScript tooling

**Tauri**

- Also works natively with Vite (first-class support)
- Requires Rust toolchain installed
- Mobile builds still need Android Studio + Xcode
- Convex client works as-is
- Adds Rust as a dependency

### Build & Bundle Size

| Metric      | Capacitor       | Tauri          |
| ----------- | --------------- | -------------- |
| Android APK | 5-10 MB         | 1-3 MB         |
| iOS IPA     | 3-6 MB          | 1-2 MB         |
| Runtime     | Bundled WebView | System WebView |

Tauri uses the system WebView, resulting in smaller bundles. For a talent network app, users won't notice the difference.

### Developer Experience

**Capacitor Setup**

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios android
npx cap sync
npx cap open ios
```

- All JavaScript/TypeScript
- Hot reload with `npx cap run`
- Debugging via Safari/Chrome DevTools

**Tauri Setup**

```bash
cargo install tauri-cli
bun create tauri-app  # or integrate into existing
bun run tauri ios init
bun run tauri android init
bun run tauri ios dev
```

- Requires Rust toolchain (`rustup`)
- Similar debugging experience
- Rust compiler updates occasionally cause friction

### Maturity

| Aspect          | Capacitor   | Tauri                |
| --------------- | ----------- | -------------------- |
| Mobile since    | 2019        | 2024 (v2)            |
| Current version | v6 (stable) | v2 (stable Oct 2024) |
| Production apps | Many        | Growing              |
| Community size  | Large       | Medium, growing fast |

---

## Tauri 2.0 Push Notification Ecosystem

Since Tauri doesn't have an official push plugin, here's the community landscape:

### Available Plugins

| Plugin                                | Author         | FCM | APNs | Status            | Downloads |
| ------------------------------------- | -------------- | --- | ---- | ----------------- | --------- |
| `tauri-plugin-notifications`          | Choochmeque    | Yes | Yes  | Active (Dec 2025) | ~300      |
| `tauri-plugin-remote-push`            | patrickjquinn  | Yes | Yes  | Active (Jun 2025) | ~400      |
| `tauri-plugin-push-notifications`     | sgammon        | Yes | Yes  | Minimal           | ~50       |
| `tauri-plugin-fcm-push-notifications` | guillemcordoba | Yes | No   | Stale (2023)      | ~100      |

### Recommended: `tauri-plugin-notifications`

The most complete option. From the documentation:

> A Tauri v2 plugin for sending notifications on desktop and mobile platforms. Send toast notifications with support for rich content, scheduling, actions, channels, and push delivery via FCM and APNs.

**Features:**

- Local and remote push notifications in one plugin
- FCM (Android) and APNs (iOS) support
- Notification channels (Android)
- Scheduled notifications
- Interactive notifications with actions

**Installation:**

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = "2.0"
tauri-plugin-notifications = "0.3"
```

```typescript
// Frontend usage
import {
  isPermissionGranted,
  requestPermission,
  registerForPushNotifications,
} from 'tauri-plugin-notifications-api'

async function setupPush() {
  let granted = await isPermissionGranted()
  if (!granted) {
    const permission = await requestPermission()
    granted = permission === 'granted'
  }

  if (granted) {
    const token = await registerForPushNotifications()
    // Send token to Convex backend
    await convexMutation(api.pushTokens.register, { token })
  }
}
```

### Backend Integration

From Convex, you'd send pushes via a node action:

```typescript
// convex/push.ts
'use node'

import { action } from './_generated/server'
import admin from 'firebase-admin'

export const sendMatchNotification = action({
  args: { userId: v.string(), matchTitle: v.string() },
  handler: async (ctx, { userId, matchTitle }) => {
    // Get user's push token from database
    const token = await ctx.runQuery(internal.pushTokens.getToken, { userId })

    await admin.messaging().send({
      token,
      notification: {
        title: 'New Match!',
        body: `You matched with: ${matchTitle}`,
      },
    })
  },
})
```

---

## Risk Assessment

### Capacitor Risks

- **Low**: Well-established, first-party push support
- Minor native project maintenance for OS updates
- Larger bundle size (negligible for this use case)

### Tauri Risks

- **Medium**: Push notifications depend on community plugin
- Plugin has ~300 total downloads (early adopter territory)
- If plugin breaks, requires reading Kotlin/Swift bridge code
- Rust toolchain adds complexity

### Tauri Risk Mitigations

- Plugin is actively maintained (releases in Dec 2025)
- Open source - can fork and fix if needed
- Rust knowledge helps debug native bridges
- Can fallback to Capacitor if Tauri push proves unreliable

---

## Recommendation

### If minimizing risk: **Capacitor**

- First-party push notification support
- Larger community, more Stack Overflow answers
- Team stays in JS/TS entirely
- Proven at scale

### If you prefer Rust and accept early-adopter tradeoffs: **Tauri**

- Smaller bundles
- Rust toolchain already familiar
- Growing ecosystem with strong momentum
- Desktop support included if ever needed
- Community push plugin is viable but less proven

### For ASTN Pilot (50-100 users)

Either approach works. The pilot scale is small enough that early-adopter risks with Tauri are manageable. If push delivery issues arise, they'd be caught quickly with a small user base.

**Suggested approach:**

1. Start with responsive web for the workshop pilot
2. Add Tauri mobile after validating the core matching loop works
3. If Tauri push proves problematic, switching to Capacitor is straightforward (same web codebase)

---

## References

- [Tauri 2.0 Documentation](https://v2.tauri.app/)
- [Tauri Mobile Guide](https://v2.tauri.app/develop/)
- [tauri-plugin-notifications](https://github.com/Choochmeque/tauri-plugin-notifications)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Tauri Push Notifications Feature Request](https://github.com/tauri-apps/tauri/issues/11651)
