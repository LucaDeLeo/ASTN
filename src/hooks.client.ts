import type { HandleClientError } from '@sveltejs/kit'
import { PUBLIC_SENTRY_DSN } from '$env/static/public'

const sentry = PUBLIC_SENTRY_DSN
  ? await import('@sentry/sveltekit')
  : null

/**
 * View-transition race errors that are expected outcomes of the browser's
 * view-transition algorithm — not real bugs. Tracked in Sentry issues
 * SAFETYTALENTORG-R/E/F/C. They fire when:
 *   - The user navigates twice quickly (old transition aborted by new one)
 *   - The tab is hidden when a transition would otherwise start
 *   - A transition is skipped mid-flight
 * See src/lib/viewTransition.ts for the defensive wrapper used going forward.
 */
const VIEW_TRANSITION_NOISE = [
  /Skipped ViewTransition due to document being hidden/i,
  /Old view transition aborted by new view transition/i,
  /Transition was aborted because of invalid state/i,
  /Transition was skipped/i,
]

if (sentry) {
  sentry.init({
    dsn: PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    tunnel: '/tunnel',
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: VIEW_TRANSITION_NOISE,
    beforeSend(event, hint) {
      const err = hint?.originalException
      if (isExpectedViewTransitionError(err)) return null
      // Some events arrive as plain messages (no originalException) — check
      // the event payload too so we catch raw strings and synthetic errors.
      const values = event.exception?.values ?? []
      for (const v of values) {
        if (
          typeof v.value === 'string' &&
          VIEW_TRANSITION_NOISE.some((re) => re.test(v.value as string))
        ) {
          return null
        }
      }
      if (
        typeof event.message === 'string' &&
        VIEW_TRANSITION_NOISE.some((re) => re.test(event.message as string))
      ) {
        return null
      }
      return event
    },
  })
}

function isExpectedViewTransitionError(err: unknown): boolean {
  if (!err) return false
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'InvalidStateError') {
      if (VIEW_TRANSITION_NOISE.some((re) => re.test(err.message))) return true
    }
    return VIEW_TRANSITION_NOISE.some((re) => re.test(err.message))
  }
  if (typeof err === 'string') {
    return VIEW_TRANSITION_NOISE.some((re) => re.test(err))
  }
  return false
}

export const handleError: HandleClientError = sentry
  ? sentry.handleErrorWithSentry()
  : ({ error }) => {
      console.error(error)
    }
