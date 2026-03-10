/**
 * Platform detection utilities for Capacitor native app vs web.
 */

/** Returns true when running inside a Capacitor WebView shell. */
export function isNativeApp(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.() === true
  )
}

/** Detected runtime platform. */
export type Platform = 'ios' | 'android' | 'web'

/** Returns the current platform synchronously. */
export function getPlatform(): Platform {
  if (!isNativeApp()) return 'web'
  const platform = (window as any).Capacitor?.getPlatform?.()
  if (platform === 'ios') return 'ios'
  if (platform === 'android') return 'android'
  return 'web'
}
