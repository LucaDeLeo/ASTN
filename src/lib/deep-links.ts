import { isNativeApp } from '~/lib/platform'

/**
 * Initialize deep link handling for native apps.
 * Listens for appUrlOpen events and navigates the WebView to the path.
 *
 * No-op on web.
 */
export async function initDeepLinks(): Promise<void> {
  if (!isNativeApp()) return

  try {
    const { App } = await import('@capacitor/app')

    await App.addListener('appUrlOpen', (event) => {
      try {
        const url = new URL(event.url)
        // Only handle safetytalent.org URLs
        if (url.hostname === 'safetytalent.org') {
          window.location.href = url.pathname + url.search + url.hash
        }
      } catch {
        // Invalid URL, ignore
      }
    })
  } catch (err) {
    console.warn('Deep link init failed:', err)
  }
}
