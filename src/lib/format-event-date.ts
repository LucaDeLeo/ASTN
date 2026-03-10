export function formatEventDate(
  startAt: number,
  endAt?: number,
  timezone?: string,
) {
  const start = new Date(startAt)
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  }
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }

  const dateStr = start.toLocaleDateString('en-US', dateOpts)
  const timeStr = start.toLocaleTimeString('en-US', timeOpts)

  if (endAt) {
    const end = new Date(endAt)
    const endTimeStr = end.toLocaleTimeString('en-US', timeOpts)
    return `${dateStr} · ${timeStr} – ${endTimeStr}`
  }

  return `${dateStr} · ${timeStr}`
}
