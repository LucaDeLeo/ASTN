/**
 * Tauri-specific OAuth fallback using system browser + deep links.
 *
 * Used when Clerk's hash-based OAuth doesn't work in WebView
 * (e.g., Google blocks embedded WebView OAuth).
 *
 * Flow:
 * 1. Open OAuth URL in system browser via @tauri-apps/plugin-opener
 * 2. User authenticates in system browser
 * 3. OAuth redirects to astn://auth/callback deep link
 * 4. Tauri intercepts deep link and completes auth
 */
import { isTauri } from '~/lib/platform'

/**
 * Opens an OAuth URL in the system browser for Tauri native auth flow.
 * Falls back to window.open for web.
 */
export async function openOAuthInSystemBrowser(url: string): Promise<void> {
  if (!isTauri()) {
    window.open(url, '_blank')
    return
  }

  const { openUrl } = await import('@tauri-apps/plugin-opener')
  await openUrl(url)
}

/**
 * Listens for deep link auth callbacks (astn://auth/callback).
 * Returns a cleanup function.
 */
export async function listenForAuthCallback(
  onCallback: (url: string) => void,
): Promise<() => void> {
  if (!isTauri()) {
    return () => {}
  }

  const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link')
  const unlisten = await onOpenUrl((urls) => {
    for (const url of urls) {
      if (url.startsWith('astn://auth/callback')) {
        onCallback(url)
      }
    }
  })

  return unlisten
}

/**
 * Extracts auth parameters from a deep link callback URL.
 */
export function parseAuthCallback(url: string): Record<string, string> {
  const parsed = new URL(url)
  const params: Record<string, string> = {}
  for (const [key, value] of parsed.searchParams) {
    params[key] = value
  }
  return params
}
