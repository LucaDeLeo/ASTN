import { useQuery } from 'convex/react'
import { CalendarDays, Clock, Loader2, Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface TodayBookingsProps {
  spaceId: Id<'coworkingSpaces'>
  capacity: number
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

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TodayBookings({ spaceId, capacity }: TodayBookingsProps) {
  const bookings = useQuery(api.spaceBookings.admin.getTodaysBookings, {
    spaceId,
  })

  // Loading state
  if (bookings === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Today's Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  const count = bookings.length
  const utilizationPercent = capacity > 0 ? (count / capacity) * 100 : 0

  // Determine status color
  let statusColor = 'text-green-600'
  let bgColor = 'bg-green-50'
  if (utilizationPercent >= 100) {
    statusColor = 'text-red-600'
    bgColor = 'bg-red-50'
  } else if (utilizationPercent >= 80) {
    statusColor = 'text-yellow-600'
    bgColor = 'bg-yellow-50'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-5" />
          Today's Bookings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity indicator */}
        <div
          className={cn(
            'p-3 rounded-lg flex items-center justify-between',
            bgColor,
          )}
        >
          <div className="flex items-center gap-2">
            <Users className="size-4" />
            <span className={cn('font-medium', statusColor)}>
              {count} / {capacity}
            </span>
            <span className="text-muted-foreground text-sm">capacity</span>
          </div>
          <span className={cn('text-sm font-medium', statusColor)}>
            {Math.round(utilizationPercent)}%
          </span>
        </div>

        {/* Empty state */}
        {count === 0 && (
          <div className="text-center py-6">
            <Clock className="size-10 mx-auto mb-3 text-slate-300" />
            <p className="text-muted-foreground">No bookings for today</p>
          </div>
        )}

        {/* Booking list */}
        {count > 0 && (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                {/* Avatar */}
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-sm">
                  {booking.profile?.name
                    ? getInitials(booking.profile.name)
                    : '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {booking.profile?.name ?? 'Unknown'}
                    </span>
                    {booking.profile?.isGuest && (
                      <Badge variant="secondary" className="text-xs">
                        Guest
                      </Badge>
                    )}
                  </div>
                  {booking.profile?.headline && (
                    <p className="text-sm text-muted-foreground truncate">
                      {booking.profile.headline}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>
                      {formatTimeRange(
                        booking.startMinutes,
                        booking.endMinutes,
                      )}
                    </span>
                  </div>

                  {/* Tags */}
                  {(booking.workingOn || booking.interestedInMeeting) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {booking.workingOn && (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          Working on: {booking.workingOn}
                        </Badge>
                      )}
                      {booking.interestedInMeeting && (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          Meeting: {booking.interestedInMeeting}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
