import { useQuery } from 'convex/react'
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns'
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { api } from '../../../convex/_generated/api'
import type { DayButtonProps } from 'react-day-picker'
import type { Id } from '../../../convex/_generated/dataModel'
import { cn } from '~/lib/utils'

interface AdminBookingCalendarProps {
  spaceId: Id<'coworkingSpaces'>
  onDateSelect: (date: Date) => void
  selectedDate?: Date
}

export function AdminBookingCalendar({
  spaceId,
  onDateSelect,
  selectedDate,
}: AdminBookingCalendarProps) {
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Capacity query - covers current and next month
  const capacityStartDate = format(startOfMonth(calendarMonth), 'yyyy-MM-dd')
  const capacityEndDate = format(
    endOfMonth(addMonths(calendarMonth, 1)),
    'yyyy-MM-dd',
  )

  const capacityData = useQuery(api.spaceBookings.getCapacityForDateRange, {
    spaceId,
    startDate: capacityStartDate,
    endDate: capacityEndDate,
  })

  // Custom DayButton with capacity indicators
  function CustomDayButton(props: DayButtonProps) {
    const { day, modifiers, ...buttonProps } = props
    const date = day.date
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = capacityData?.dates[dateStr]

    // Determine dot color based on status
    let dotColor = 'bg-slate-300' // default no bookings
    let ariaLabel = 'No bookings'

    if (capacityData && dayData && dayData.count > 0) {
      const capacity = capacityData.capacity
      if (dayData.status === 'at_capacity') {
        dotColor = 'bg-red-500'
        ariaLabel = `${dayData.count} of ${capacity} booked - at capacity`
      } else if (dayData.status === 'nearing') {
        dotColor = 'bg-yellow-500'
        ariaLabel = `${dayData.count} of ${capacity} booked - filling up`
      } else {
        dotColor = 'bg-green-500'
        ariaLabel = `${dayData.count} of ${capacity} booked`
      }
    }

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
        {dayData && dayData.count > 0 && (
          <span
            className={cn('absolute bottom-1 size-1.5 rounded-full', dotColor)}
            aria-label={ariaLabel}
          />
        )}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        onMonthChange={setCalendarMonth}
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

      {/* Legend */}
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
    </div>
  )
}
