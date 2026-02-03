/**
 * Shared booking time validation logic.
 * Used by member bookings, guest bookings, and admin bookings.
 */

interface OperatingHoursDay {
  dayOfWeek: number
  openMinutes: number
  closeMinutes: number
  isClosed: boolean
}

type ValidationResult = { valid: true } | { valid: false; reason: string }

/**
 * Get today's date in a specific timezone as YYYY-MM-DD string.
 */
export function getTodayInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())
}

/**
 * Get day of week (0-6, Sunday-Saturday) from a date string.
 * Uses UTC noon to avoid DST edge cases.
 */
export function getDayOfWeekFromDateString(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return d.getUTCDay()
}

/**
 * Validate a booking against space operating hours.
 *
 * Checks:
 * 1. Date is not in the past (relative to space timezone)
 * 2. Day is not marked as closed
 * 3. Start and end times are within operating hours
 */
export function validateBookingTime(
  date: string,
  startMinutes: number,
  endMinutes: number,
  operatingHours: Array<OperatingHoursDay>,
  timezone: string,
): ValidationResult {
  // 1. Check if date is in the past
  const today = getTodayInTimezone(timezone)
  if (date < today) {
    return { valid: false, reason: 'Cannot book a date in the past' }
  }

  // 2. Get operating hours for the booking day
  const dayOfWeek = getDayOfWeekFromDateString(date)
  const dayHours = operatingHours.find((h) => h.dayOfWeek === dayOfWeek)

  if (!dayHours) {
    return {
      valid: false,
      reason: 'Operating hours not configured for this day',
    }
  }

  // 3. Check if day is closed
  if (dayHours.isClosed) {
    return { valid: false, reason: 'The space is closed on this day' }
  }

  // 4. Check if times are within operating hours
  if (startMinutes < dayHours.openMinutes) {
    const openTime = formatMinutes(dayHours.openMinutes)
    return {
      valid: false,
      reason: `Booking cannot start before opening time (${openTime})`,
    }
  }

  if (endMinutes > dayHours.closeMinutes) {
    const closeTime = formatMinutes(dayHours.closeMinutes)
    return {
      valid: false,
      reason: `Booking cannot end after closing time (${closeTime})`,
    }
  }

  return { valid: true }
}

/**
 * Format minutes from midnight as HH:MM (24-hour format).
 */
function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Validate ISO date string format (YYYY-MM-DD).
 * Checks both regex format and that the date is parseable.
 */
export function isValidDateString(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) return false
  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}
