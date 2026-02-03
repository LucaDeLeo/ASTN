import { useQuery } from 'convex/react'
import { BarChart3, Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

interface SpaceUtilizationCardProps {
  spaceId: Id<'coworkingSpaces'>
  spaceName: string
}

// Day of week names for display
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function SpaceUtilizationCard({
  spaceId,
  spaceName,
}: SpaceUtilizationCardProps) {
  // Calculate date range (last 30 days)
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const stats = useQuery(api.spaceBookings.admin.getSpaceUtilizationStats, {
    spaceId,
    startDate: thirtyDaysAgo,
    endDate: today,
  })

  // Loading state
  if (stats === undefined) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="size-5" />
            {spaceName} Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    )
  }

  // Get top 3 peak days
  const topPeakDays = stats.peakDays.slice(0, 3)
  const maxPeakCount =
    topPeakDays.length > 0 ? Math.max(...topPeakDays.map((d) => d.count)) : 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="size-5" />
          {spaceName} Utilization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main stat */}
        <div>
          <div className="text-3xl font-bold text-foreground">
            {stats.utilizationRate}%
          </div>
          <p className="text-sm text-muted-foreground">
            utilization (last 30 days)
          </p>
        </div>

        {/* Sub-stats grid */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div>
            <p className="text-2xl font-semibold">{stats.totalBookings}</p>
            <p className="text-xs text-muted-foreground">Total bookings</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats.averageDaily}</p>
            <p className="text-xs text-muted-foreground">Daily average</p>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {stats.memberVsGuest.memberCount} /{' '}
                {stats.memberVsGuest.guestCount}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Members / Guests</p>
          </div>
        </div>

        {/* Peak days visualization */}
        {topPeakDays.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Peak Days</p>
            <div className="space-y-2">
              {topPeakDays.map((day) => {
                const percentage =
                  maxPeakCount > 0 ? (day.count / maxPeakCount) * 100 : 0
                return (
                  <div key={day.dayOfWeek}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">
                        {DAY_NAMES[day.dayOfWeek]}
                      </span>
                      <span className="font-medium">{day.count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats.totalBookings === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No bookings recorded in the last 30 days
          </p>
        )}
      </CardContent>
    </Card>
  )
}
