/**
 * Push notification utilities for Tauri mobile.
 *
 * Uses @tauri-apps/plugin-notification for local notifications.
 * Remote push (FCM/APNs) can be added later via tauri-plugin-remote-push.
 */
import { isTauri } from '~/lib/platform'

/**
 * Request push notification permission from the user.
 * Returns true if permission was granted.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isTauri()) return false

  try {
    const {
      isPermissionGranted,
      requestPermission,
    } = await import('@tauri-apps/plugin-notification')

    let granted = await isPermissionGranted()
    if (!granted) {
      const result = await requestPermission()
      granted = result === 'granted'
    }
    return granted
  } catch {
    return false
  }
}

/**
 * Send a local notification (for testing or fallback when remote push unavailable).
 */
export async function sendLocalNotification(options: {
  title: string
  body: string
  data?: Record<string, string>
}): Promise<void> {
  if (!isTauri()) return

  try {
    const { sendNotification } = await import('@tauri-apps/plugin-notification')
    sendNotification({
      title: options.title,
      body: options.body,
    })
  } catch {
    // Silent fail — notifications may not be supported/permitted
  }
}
