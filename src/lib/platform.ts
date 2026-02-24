/**
 * Platform detection utilities for Tauri native app vs web.
 */

/** Returns true when running inside a Tauri WebView shell. */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/** Detected runtime platform. */
export type Platform = 'ios' | 'android' | 'web'

/**
 * Returns the current platform.
 * Uses @tauri-apps/plugin-os at runtime; falls back to 'web'.
 */
let _cachedPlatform: Platform | null = null

export async function getPlatform(): Promise<Platform> {
  if (_cachedPlatform) return _cachedPlatform

  if (!isTauri()) {
    _cachedPlatform = 'web'
    return 'web'
  }

  try {
    const { type } = await import('@tauri-apps/plugin-os')
    const osType = type()
    if (osType === 'ios') _cachedPlatform = 'ios'
    else if (osType === 'android') _cachedPlatform = 'android'
    else _cachedPlatform = 'web'
  } catch {
    _cachedPlatform = 'web'
  }

  return _cachedPlatform
}
