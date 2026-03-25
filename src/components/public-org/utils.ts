export function formatMinutes(minutes: number): string {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  return minute === 0
    ? `${hour12} ${period}`
    : `${hour12}:${String(minute).padStart(2, '0')} ${period}`
}

export function buildTimeOptions(
  openMinutes: number,
  closeMinutes: number,
  step = 30,
) {
  const options: Array<{ value: number; label: string }> = []

  for (let minutes = openMinutes; minutes <= closeMinutes; minutes += step) {
    options.push({
      value: minutes,
      label: formatMinutes(minutes),
    })
  }

  return options
}

export function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`)
}

export function getDayOfWeek(dateString: string) {
  return parseLocalDate(dateString).getDay()
}

export function formatDateLabel(
  dateString: string,
  options?: Intl.DateTimeFormatOptions,
) {
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

export function formatProgramDateRange(startDate?: number, endDate?: number) {
  if (!startDate) return null

  const start = new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  if (!endDate) return start

  const end = new Date(endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return `${start} - ${end}`
}

export function daysUntilSession(sessionDate: number) {
  const sessionDay = new Date(sessionDate)
  sessionDay.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.ceil((sessionDay.getTime() - today.getTime()) / 86400000)
}
