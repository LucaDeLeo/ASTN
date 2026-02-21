/** Format deadline timestamp for compact display */
export function formatDeadline(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const daysUntil = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (daysUntil < 0) return 'Closed'
  if (daysUntil === 0) return 'Closes today'
  if (daysUntil === 1) return 'Closes tomorrow'
  if (daysUntil <= 30) return `Closes in ${daysUntil} days`
  return `Closes ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

/** Returns Tailwind text color class based on deadline urgency */
export function getDeadlineUrgency(timestamp: number): string {
  const now = new Date()
  const daysUntil = Math.ceil(
    (timestamp - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (daysUntil <= 3) return 'text-red-600 dark:text-red-400'
  if (daysUntil <= 7) return 'text-amber-600 dark:text-amber-400'
  return 'text-muted-foreground'
}
