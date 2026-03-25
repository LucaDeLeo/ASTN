import type { Handle, HandleServerError } from '@sveltejs/kit'
import { PUBLIC_SENTRY_DSN } from '$env/static/public'

const sentry = PUBLIC_SENTRY_DSN
  ? await import('@sentry/sveltekit')
  : null

if (sentry) {
  sentry.init({
    dsn: PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
  })
}

export const handle: Handle = sentry
  ? sentry.sentryHandle()
  : ({ event, resolve }) => resolve(event)

export const handleError: HandleServerError = sentry
  ? sentry.handleErrorWithSentry()
  : ({ error }) => {
      console.error(error)
    }
