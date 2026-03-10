import { api } from '../../convex/_generated/api'
import type { ConvexReactClient } from 'convex/react'
import { getPlatform } from '~/lib/platform'

/**
 * Initialize push notifications for native apps.
 * Requests permission, registers the FCM token with the Convex backend,
 * and listens for token refreshes.
 *
 * No-op on web.
 */
export async function initPushNotifications(
  convexClient: ConvexReactClient,
): Promise<void> {
  const platform = getPlatform()
  if (platform === 'web') return

  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging')

    const permResult = await FirebaseMessaging.requestPermissions()
    if (permResult.receive !== 'granted') return

    const { token } = await FirebaseMessaging.getToken()
    await convexClient.mutation(api.pushTokens.registerToken, {
      token,
      platform,
    })

    // Re-register on token refresh
    await FirebaseMessaging.addListener('tokenReceived', async (event) => {
      await convexClient.mutation(api.pushTokens.registerToken, {
        token: event.token,
        platform,
      })
    })

    // Handle notification tap — navigate to URL if present
    await FirebaseMessaging.addListener(
      'notificationActionPerformed',
      (event) => {
        const data = event.notification.data as Record<string, unknown>
        const url = data.url as string | undefined
        if (url) {
          try {
            const pathname = new URL(url).pathname
            window.location.href = pathname
          } catch {
            // Invalid URL, ignore
          }
        }
      },
    )
  } catch (err) {
    console.warn('Push notification init failed:', err)
  }
}
