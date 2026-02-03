import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { addDays, format } from 'date-fns'
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock,
  History,
  Shield,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import { AdminBookingCalendar } from '~/components/org/BookingCalendar'
import { BookingHistory } from '~/components/org/BookingHistory'
import { BookingList } from '~/components/org/BookingList'
import { TodayBookings } from '~/components/org/TodayBookings'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export const Route = createFileRoute('/org/$slug/admin/bookings')({
  component: BookingsAdminPage,
})

function BookingsAdminPage() {
  const { slug } = Route.useParams()

  // Get org and check admin access
  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const space = useQuery(
    api.coworkingSpaces.getSpaceByOrg,
    org && membership?.role === 'admin' ? { orgId: org._id } : 'skip',
  )

  // Loading state
  if (org === undefined || membership === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Org not found
  if (org === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Organization Not Found
            </h1>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Not an admin
  if (!membership || membership.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Admin Access Required
            </h1>
            <p className="text-slate-600 mb-6">
              You need admin access to manage bookings.
            </p>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to Organization
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Still loading space
  if (space === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
            <Spinner />
          </div>
        </main>
      </div>
    )
  }

  // No coworking space configured
  if (space === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="size-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium">No Coworking Space</p>
                <p className="text-slate-600 mb-4">
                  Configure a coworking space first to manage bookings.
                </p>
                <Button asChild>
                  <Link to="/org/$slug/admin/space" params={{ slug }}>
                    Configure Space
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return <BookingsAdminContent org={org} space={space} slug={slug} />
}

interface BookingsAdminContentProps {
  org: { name: string }
  space: { _id: string; name: string; capacity: number }
  slug: string
}

function BookingsAdminContent({ org, space, slug }: BookingsAdminContentProps) {
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    Date | undefined
  >()

  // Date range for upcoming bookings (next 30 days)
  const today = new Date()
  const upcomingStartDate = format(today, 'yyyy-MM-dd')
  const upcomingEndDate = format(addDays(today, 30), 'yyyy-MM-dd')

  // Type assertion for space ID
  const spaceId = space._id as Id<'coworkingSpaces'>

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Link
                to="/org/$slug"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                {org.name}
              </Link>
              <span>/</span>
              <Link
                to="/org/$slug/admin"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                Admin
              </Link>
              <span>/</span>
              <span className="text-slate-700">Bookings</span>
            </div>
            <h1 className="text-2xl font-display text-foreground">
              Bookings Management
            </h1>
            <p className="text-slate-600 mt-1">
              View and manage space bookings for {space.name}
            </p>
          </div>

          <Tabs defaultValue="today">
            <TabsList>
              <TabsTrigger value="today" className="gap-2">
                <Clock className="size-4" />
                Today
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarDays className="size-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="gap-2">
                <ArrowRight className="size-4" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="size-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-6">
              <TodayBookings spaceId={spaceId} capacity={space.capacity} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="size-5" />
                      Select a Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdminBookingCalendar
                      spaceId={spaceId}
                      selectedDate={selectedCalendarDate}
                      onDateSelect={setSelectedCalendarDate}
                    />
                  </CardContent>
                </Card>

                {selectedCalendarDate ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {format(selectedCalendarDate, 'EEEE, MMMM d, yyyy')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BookingList
                        spaceId={spaceId}
                        startDate={format(selectedCalendarDate, 'yyyy-MM-dd')}
                        endDate={format(selectedCalendarDate, 'yyyy-MM-dd')}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="flex items-center justify-center min-h-[300px]">
                    <div className="text-center p-6">
                      <CalendarDays className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Select a date to view bookings
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              <BookingList
                spaceId={spaceId}
                startDate={upcomingStartDate}
                endDate={upcomingEndDate}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <BookingHistory spaceId={spaceId} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
