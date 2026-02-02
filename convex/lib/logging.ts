/**
 * Structured logging for Convex server functions.
 * Outputs JSON to stdout/stderr which Convex dashboard captures.
 */
export function log(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>,
) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}
