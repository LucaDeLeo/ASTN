// src/lib/platform.ts
// Platform detection utilities for Tauri mobile apps

/**
 * Check if running inside Tauri WebView
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export type Platform = 'ios' | 'android' | 'web'

/**
 * Get current platform (async - requires Tauri plugin)
 */
export async function getPlatform(): Promise<Platform> {
  if (!isTauri()) return 'web'

  try {
    const { type } = await import('@tauri-apps/plugin-os')
    const osType = type()

    if (osType === 'ios') return 'ios'
    if (osType === 'android') return 'android'
    return 'web' // Desktop Tauri falls back to web behavior
  } catch {
    return 'web'
  }
}

/**
 * Check if running on mobile (iOS or Android)
 */
export async function isMobile(): Promise<boolean> {
  const platform = await getPlatform()
  return platform === 'ios' || platform === 'android'
}
