import { useCallback } from "react";

/**
 * Haptic feedback patterns using the Vibration API.
 * Gracefully degrades on unsupported browsers (Safari/iOS).
 *
 * Per TOUCH-04: haptics are for native builds only, but this hook
 * provides the foundation for when running in Tauri.
 */
export function useHaptic() {
  const vibrate = useCallback((pattern: number | Array<number>) => {
    // Feature detection - Safari doesn't support Vibration API
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently fail if vibration blocked by browser policy
      }
    }
    // Silent no-op on unsupported browsers
  }, []);

  return {
    /** Light tap feedback - 10ms */
    tap: useCallback(() => vibrate(10), [vibrate]),

    /** Success feedback - double pulse */
    success: useCallback(() => vibrate([10, 50, 10]), [vibrate]),

    /** Error feedback - longer pattern */
    error: useCallback(() => vibrate([50, 30, 50, 30, 50]), [vibrate]),

    /** Warning feedback - medium pattern */
    warning: useCallback(() => vibrate([30, 20, 30]), [vibrate]),

    /** Custom pattern - array of on/off durations in ms */
    custom: vibrate,
  };
}
