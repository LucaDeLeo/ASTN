import { useQuery } from 'convex/react'
import { format } from 'date-fns'
import { Calendar, Loader2, Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface BookingListProps {
  spaceId: Id<'coworkingSpaces'>
  startDate: string
  endDate: string
}

// Format time range from minutes
function formatTimeRange(startMinutes: number, endMinutes: number): string {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    return mins === 0
      ? `${displayHours} ${period}`
      : `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
  }
  return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`
}

export function BookingList({ spaceId, startDate, endDate }: BookingListProps) {
  const result = useQuery(
    api.spaceBookings.admin.getAdminBookingsForDateRange,
    {
      spaceId,
      startDate,
      endDate,
      status: 'confirmed',
      limit: 50,
    },
  )

  // Loading state
  if (result === undefined) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const { bookings } = result

  // Empty state
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="size-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600">
            No Upcoming Bookings
          </p>
          <p className="text-sm text-slate-500">
            Bookings will appear here when members or guests book
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group bookings by date using reduce
  const groupedByDate = bookings.reduce<Record<string, typeof bookings>>(
    (acc, booking) => {
      const date = booking.date
      acc[date] = acc[date] ?? []
      acc[date].push(booking)
      return acc
    },
    {},
  )

  // Sort dates (ascending for upcoming)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    a.localeCompare(b),
  )

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const dateBookings = groupedByDate[dateStr]
        const dateObj = new Date(dateStr)

        return (
          <div key={dateStr}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="size-4 text-muted-foreground" />
              <h3 className="font-medium">
                {format(dateObj, 'EEEE, MMMM d, yyyy')}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {dateBookings.length} booking
                {dateBookings.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Bookings for this date */}
            <div className="space-y-2">
              {dateBookings.map((booking) => (
                <BookingListItem key={booking._id} booking={booking} />
              ))}
            </div>
          </div>
        )
      })}

      {result.hasMore && (
        <div className="text-center pt-4">
          <Button variant="outline" disabled>
            Load More (pagination coming soon)
          </Button>
        </div>
      )}
    </div>
  )
}

interface BookingListItemProps {
  booking: {
    _id: Id<'spaceBookings'>
    startMinutes: number
    endMinutes: number
    bookingType: 'member' | 'guest'
    workingOn?: string
    interestedInMeeting?: string
    profile?: {
      name?: string
      headline?: string
      isGuest: boolean
    } | null
  }
}

function BookingListItem({ booking }: BookingListItemProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar placeholder */}
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-sm">
              {booking.profile?.name
                ? booking.profile.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : '?'}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {booking.profile?.name ?? 'Unknown'}
                </span>
                {booking.profile?.isGuest && (
                  <Badge variant="secondary" className="text-xs">
                    Guest
                  </Badge>
                )}
              </div>
              {booking.profile?.headline && (
                <p className="text-sm text-muted-foreground">
                  {booking.profile.headline}
                </p>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="size-3" />
              <span>
                {formatTimeRange(booking.startMinutes, booking.endMinutes)}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {(booking.workingOn || booking.interestedInMeeting) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {booking.workingOn && (
              <Badge variant="outline" className="text-xs font-normal">
                Working on: {booking.workingOn}
              </Badge>
            )}
            {booking.interestedInMeeting && (
              <Badge variant="outline" className="text-xs font-normal">
                Meeting: {booking.interestedInMeeting}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
