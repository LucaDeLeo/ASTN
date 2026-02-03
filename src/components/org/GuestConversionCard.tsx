import { useQuery } from 'convex/react'
import { UserPlus } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

interface GuestConversionCardProps {
  spaceId: Id<'coworkingSpaces'>
}

export function GuestConversionCard({ spaceId }: GuestConversionCardProps) {
  const stats = useQuery(api.spaceBookings.admin.getGuestConversionStats, {
    spaceId,
  })

  // Loading state
  if (stats === undefined) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="size-5" />
            Guest Conversions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Spinner className="size-6" />
        </CardContent>
      </Card>
    )
  }

  // Empty state - no guests yet
  if (stats.totalGuests === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="size-5" />
            Guest Conversions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <UserPlus className="size-10 mx-auto mb-3 text-slate-300" />
            <p className="text-muted-foreground">
              No guest visits recorded yet
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="size-5" />
          Guest Conversions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main stat */}
        <div>
          <div className="text-3xl font-bold text-foreground">
            {stats.convertedGuests}{' '}
            <span className="text-lg font-normal text-muted-foreground">
              of {stats.totalGuests}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">guests became members</p>
        </div>

        {/* Conversion rate */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Conversion rate</span>
            <span className="font-semibold">{stats.conversionRate}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.conversionRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Summary text */}
        <p className="text-sm text-muted-foreground">
          {stats.conversionRate > 0
            ? `Great job! ${stats.conversionRate}% of your guests have converted to members.`
            : 'No conversions yet. Keep inviting guests to help grow your community.'}
        </p>
      </CardContent>
    </Card>
  )
}
