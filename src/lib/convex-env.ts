import { dev } from '$app/environment'
import {
  PUBLIC_CONVEX_SITE_URL,
  PUBLIC_CONVEX_URL,
} from '$env/static/public'

const localConvexUrl = import.meta.env.PUBLIC_CONVEX_URL
const localConvexSiteUrl = import.meta.env.PUBLIC_CONVEX_SITE_URL

/**
 * Validate a Convex deployment URL so we fail loudly at startup instead of
 * crashing deep inside the Convex client with the cryptic
 *   "SyntaxError: Failed to construct 'WebSocket': the provided URL is invalid"
 *
 * Convex builds its WebSocket URI by swapping `https://` for `wss://` on the
 * configured deployment URL. If the env var is missing, empty, or malformed,
 * that swap produces an invalid WS URI and the browser throws a DOMException
 * (code 12 / SyntaxError) when the client tries to connect. See Sentry issues:
 *   - https://baish.sentry.io/issues/104267243/
 *   - https://baish.sentry.io/issues/104305353/
 */
const validateConvexUrl = (value: string | undefined, name: string): string => {
  if (!value || value.trim() === '') {
    throw new Error(
      `[convex-env] ${name} is not set. ` +
        `Set it in your environment (see .env.example) — the Convex client ` +
        `cannot construct a WebSocket without a valid deployment URL.`,
    )
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(
      `[convex-env] ${name}="${value}" is not a valid URL. ` +
        `Expected something like https://<deployment>.convex.cloud.`,
    )
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(
      `[convex-env] ${name}="${value}" must use http(s) — got ` +
        `"${parsed.protocol}". The Convex client derives its WebSocket URI ` +
        `from this value and only understands http(s) inputs.`,
    )
  }

  // Trim trailing slashes so the derived ws(s):// URI stays clean.
  return value.replace(/\/+$/, '')
}

const resolvedConvexUrl =
  dev && localConvexUrl ? localConvexUrl : PUBLIC_CONVEX_URL
const resolvedConvexSiteUrl =
  dev && localConvexSiteUrl ? localConvexSiteUrl : PUBLIC_CONVEX_SITE_URL

export const CONVEX_URL = validateConvexUrl(
  resolvedConvexUrl,
  'PUBLIC_CONVEX_URL',
)
export const CONVEX_SITE_URL = validateConvexUrl(
  resolvedConvexSiteUrl,
  'PUBLIC_CONVEX_SITE_URL',
)
