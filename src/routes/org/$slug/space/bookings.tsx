import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { format, isBefore, startOfDay } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  Edit2,
  Loader2,
  MapPin,
  Save,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import type { Doc } from '../../../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'

export const Route = createFileRoute('/org/$slug/space/bookings')({
  component: MyBookingsPage,
})

function MyBookingsPage() {
  const { slug } = Route.useParams()

  // Three-query cascade: org -> membership -> space
  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const space = useQuery(
    api.coworkingSpaces.getSpaceByOrgPublic,
    org && membership ? { orgId: org._id } : 'skip',
  )
  const bookings = useQuery(
    api.spaceBookings.getMyBookings,
    space ? { spaceId: space._id } : 'skip',
  )

  // Loading state
  if (org === undefined || membership === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Org not found
  if (org === null) {
    return (
      <GradientBg>
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
      </GradientBg>
    )
  }

  // Not a member
  if (!membership) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Membership Required
            </h1>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to Organization
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Loading space/bookings
  if (space === undefined || bookings === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </GradientBg>
    )
  }

  // No space configured
  if (space === null) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <MapPin className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              No Co-working Space
            </h1>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to Organization
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Render the bookings page
  return (
    <MyBookingsContent
      org={org}
      space={space}
      slug={slug}
      bookings={bookings}
    />
  )
}

// Separate component to ensure types are non-null
interface MyBookingsContentProps {
  org: Doc<'organizations'>
  space: Doc<'coworkingSpaces'>
  slug: string
  bookings: Array<Doc<'spaceBookings'>>
}

function MyBookingsContent({
  org,
  space,
  slug,
  bookings,
}: MyBookingsContentProps) {
  const today = startOfDay(new Date())

  // Split bookings into upcoming and past
  const upcomingBookings = bookings.filter(
    (b) => !isBefore(new Date(b.date), today),
  )
  const pastBookings = bookings.filter((b) => isBefore(new Date(b.date), today))

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
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
                to="/org/$slug/space"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                {space.name}
              </Link>
              <span>/</span>
              <span className="text-slate-700">My Bookings</span>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-2xl font-display text-foreground">
                <CalendarDays className="size-6 inline-block mr-2 -mt-1" />
                My Bookings
              </h1>
              <Button variant="outline" asChild>
                <Link to="/org/$slug/space" params={{ slug }}>
                  <ArrowLeft className="size-4 mr-2" />
                  Book a Spot
                </Link>
              </Button>
            </div>
          </div>

          {/* Upcoming bookings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Upcoming Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="size-10 mx-auto mb-3 opacity-50" />
                  <p className="mb-4">You have no upcoming bookings</p>
                  <Button asChild>
                    <Link to="/org/$slug/space" params={{ slug }}>
                      Book a Spot
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      showActions
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past bookings */}
          {pastBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-5" />
                  Past Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      showActions={false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </GradientBg>
  )
}

// Format minutes to display time
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
}

interface BookingCardProps {
  booking: Doc<'spaceBookings'>
  showActions: boolean
}

function BookingCard({ booking, showActions }: BookingCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [workingOn, setWorkingOn] = useState(booking.workingOn ?? '')
  const [interestedInMeeting, setInterestedInMeeting] = useState(
    booking.interestedInMeeting ?? '',
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const updateTags = useMutation(api.spaceBookings.updateBookingTags)
  const cancelBooking = useMutation(api.spaceBookings.cancelBooking)

  const handleSaveTags = async () => {
    setIsSaving(true)
    try {
      await updateTags({
        bookingId: booking._id,
        workingOn: workingOn.trim() || undefined,
        interestedInMeeting: interestedInMeeting.trim() || undefined,
      })
      toast.success('Tags updated')
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update tags:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to update tags',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await cancelBooking({ bookingId: booking._id })
      toast.success('Booking cancelled')
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel booking',
      )
    } finally {
      setIsCancelling(false)
    }
  }

  const dateObj = new Date(booking.date)

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2 flex-1">
          {/* Date and time */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">
              {format(dateObj, 'EEEE, MMMM d, yyyy')}
            </span>
            <span className="text-muted-foreground">
              {formatTime(booking.startMinutes)} -{' '}
              {formatTime(booking.endMinutes)}
            </span>
          </div>

          {/* Tags display or edit */}
          {isEditing ? (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor={`workingOn-${booking._id}`} className="text-xs">
                  Working on
                </Label>
                <Textarea
                  id={`workingOn-${booking._id}`}
                  value={workingOn}
                  onChange={(e) => setWorkingOn(e.target.value.slice(0, 140))}
                  placeholder="What are you working on?"
                  rows={2}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {workingOn.length}/140
                </p>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor={`interestedInMeeting-${booking._id}`}
                  className="text-xs"
                >
                  Interested in meeting
                </Label>
                <Textarea
                  id={`interestedInMeeting-${booking._id}`}
                  value={interestedInMeeting}
                  onChange={(e) =>
                    setInterestedInMeeting(e.target.value.slice(0, 140))
                  }
                  placeholder="Who would you like to meet?"
                  rows={2}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {interestedInMeeting.length}/140
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveTags} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="size-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="size-3 mr-1" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setWorkingOn(booking.workingOn ?? '')
                    setInterestedInMeeting(booking.interestedInMeeting ?? '')
                  }}
                >
                  <X className="size-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {(booking.workingOn || booking.interestedInMeeting) && (
                <div className="text-sm space-y-1 text-muted-foreground">
                  {booking.workingOn && (
                    <p>
                      <span className="text-foreground">Working on:</span>{' '}
                      {booking.workingOn}
                    </p>
                  )}
                  {booking.interestedInMeeting && (
                    <p>
                      <span className="text-foreground">
                        Interested in meeting:
                      </span>{' '}
                      {booking.interestedInMeeting}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {showActions && !isEditing && (
          <div className="flex gap-2 sm:flex-col">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="size-3 mr-1" />
              Edit Tags
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="size-3 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="size-3 mr-1" />
                  )}
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your booking for{' '}
                    {format(dateObj, 'MMMM d, yyyy')}? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Cancel Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  )
}
