import { format, getDay, isBefore, startOfDay } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import type { DayButtonProps } from 'react-day-picker'
import { cn } from '~/lib/utils'

interface CapacityData {
  capacity: number
  dates: Record<
    string,
    { count: number; status: 'available' | 'nearing' | 'at_capacity' }
  >
}

interface OperatingHours {
  dayOfWeek: number
  openMinutes: number
  closeMinutes: number
  isClosed: boolean
}

interface BookingCalendarProps {
  selectedDate: Date | undefined
  onSelectDate: (date: Date | undefined) => void
  capacityData: CapacityData | undefined
  operatingHours: Array<OperatingHours>
  onMonthChange?: (month: Date) => void
}

export function BookingCalendar({
  selectedDate,
  onSelectDate,
  capacityData,
  operatingHours,
  onMonthChange,
}: BookingCalendarProps) {
  const today = startOfDay(new Date())

  // Get closed days of week (0 = Sunday, 6 = Saturday)
  const closedDays = operatingHours
    .filter((h) => h.isClosed)
    .map((h) => h.dayOfWeek)

  // Custom matcher for closed days and past dates
  const isDisabled = (date: Date) => {
    // Past dates
    if (isBefore(date, today)) return true
    // Closed days
    return closedDays.includes(getDay(date))
  }

  // Custom DayButton with capacity indicators
  function CustomDayButton(props: DayButtonProps) {
    const { day, modifiers, ...buttonProps } = props
    const date = day.date
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = capacityData?.dates[dateStr]

    // Determine dot color and aria-label based on status
    let dotColor = 'bg-green-500' // default available
    let ariaLabel = 'Available'
    if (dayData) {
      // If dayData exists, capacityData must exist (from optional chain)
      if (dayData.status === 'at_capacity') {
        dotColor = 'bg-red-500'
      } else if (dayData.status === 'nearing') {
        dotColor = 'bg-yellow-500'
      }
      // capacityData is non-null when dayData is truthy (from optional chain)

      ariaLabel = `${dayData.count} of ${capacityData.capacity} booked`
    }

    // Don't show dot for disabled days
    const isDisabledDay = modifiers.disabled

    return (
      <button
        {...buttonProps}
        className={cn(
          'size-9 p-0 font-normal relative',
          'inline-flex flex-col items-center justify-center rounded-md',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          modifiers.selected &&
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          modifiers.today &&
            !modifiers.selected &&
            'bg-accent text-accent-foreground',
          modifiers.disabled &&
            'text-muted-foreground opacity-50 cursor-not-allowed',
        )}
      >
        <span>{date.getDate()}</span>
        {!isDisabledDay && (
          <span
            className={cn('absolute bottom-1 size-1.5 rounded-full', dotColor)}
            aria-label={ariaLabel}
          />
        )}
      </button>
    )
  }

  return (
    <DayPicker
      mode="single"
      selected={selectedDate}
      onSelect={onSelectDate}
      disabled={isDisabled}
      onMonthChange={onMonthChange}
      showOutsideDays={false}
      components={{
        DayButton: CustomDayButton,
      }}
      classNames={{
        root: 'p-3',
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        button_previous:
          'absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground',
        button_next:
          'absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: cn(
          'size-9 text-center text-sm p-0 relative',
          'focus-within:relative focus-within:z-20',
        ),
        selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
        today: 'bg-accent text-accent-foreground rounded-md',
        outside:
          'text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        disabled: 'text-muted-foreground opacity-50 cursor-not-allowed',
        hidden: 'invisible',
      }}
    />
  )
}

// Legend component for the calendar
export function BookingCalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground px-3 pb-2">
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-green-500" />
        <span>Available</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-yellow-500" />
        <span>Filling up</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-red-500" />
        <span>At capacity</span>
      </div>
    </div>
  )
}
