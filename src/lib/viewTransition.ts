/**
 * Defensive wrapper around `document.startViewTransition`.
 *
 * Four classes of errors surface in prod when callers invoke view transitions
 * during normal user navigation (tracked in Sentry issues
 * SAFETYTALENTORG-R/E/F/C):
 *
 *   - InvalidStateError: "Skipped ViewTransition due to document being hidden"
 *   - InvalidStateError: "Transition was aborted because of invalid state"
 *   - AbortError:        "Old view transition aborted by new view transition"
 *   - AbortError:        "Transition was skipped"
 *
 * None of these are real bugs — they are expected outcomes of the browser's
 * view-transition algorithm when the user navigates quickly or backgrounds the
 * tab. This helper:
 *
 *   1. Skips the transition entirely when `document.hidden` is true, so the
 *      update still runs but no transition is attempted.
 *   2. Catches the transition's `ready`/`finished` promise rejections and
 *      swallows AbortError / InvalidStateError so they don't bubble up as
 *      unhandled rejections.
 *   3. Returns a boolean indicating whether a transition was actually started,
 *      so callers can fall back to an immediate update if needed.
 *
 * The update callback is always invoked exactly once, even on the fallback
 * path, so callers can rely on it to apply DOM changes.
 */
export function safeStartViewTransition(
  update: () => void | Promise<void>,
): boolean {
  if (typeof document === 'undefined') {
    void update()
    return false
  }

  // Browser doesn't support view transitions at all — just run the update.
  const start = (
    document as Document & {
      startViewTransition?: (cb: () => void | Promise<void>) => {
        ready: Promise<void>
        finished: Promise<void>
        updateCallbackDone: Promise<void>
      }
    }
  ).startViewTransition

  if (typeof start !== 'function' || document.hidden) {
    void update()
    return false
  }

  try {
    const transition = start.call(document, update)
    // These promises can reject with AbortError or InvalidStateError when the
    // user navigates again mid-transition or the tab is hidden. Swallow them.
    transition.ready.catch(swallowExpectedTransitionError)
    transition.finished.catch(swallowExpectedTransitionError)
    return true
  } catch (err) {
    if (!isExpectedTransitionError(err)) throw err
    // Ensure the update still runs on the synchronous-throw path.
    void update()
    return false
  }
}

function isExpectedTransitionError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const name = (err as { name?: unknown }).name
  const message = (err as { message?: unknown }).message
  if (name === 'AbortError' || name === 'InvalidStateError') return true
  if (typeof message === 'string') {
    return (
      message.includes('ViewTransition') ||
      message.includes('view transition') ||
      message.includes('Transition was aborted') ||
      message.includes('Transition was skipped')
    )
  }
  return false
}

function swallowExpectedTransitionError(err: unknown): void {
  if (!isExpectedTransitionError(err)) throw err
}
