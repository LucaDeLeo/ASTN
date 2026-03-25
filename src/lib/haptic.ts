export type HapticPattern = number | Array<number>

export function vibrate(pattern: HapticPattern) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return

  try {
    navigator.vibrate(pattern)
  } catch {
    // Silently ignore platform/browser vibration restrictions.
  }
}

export function createHapticFeedback() {
  return {
    tap: () => vibrate(10),
    success: () => vibrate([10, 50, 10]),
    error: () => vibrate([50, 30, 50, 30, 50]),
    warning: () => vibrate([30, 20, 30]),
    custom: vibrate,
  }
}

export function useHaptic() {
  return createHapticFeedback()
}

export const createHaptic = createHapticFeedback
