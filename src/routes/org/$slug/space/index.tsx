import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { addMonths, endOfMonth, format, getDay, startOfMonth } from 'date-fns'
import {
  AlertCircle,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Shield,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import type { Doc } from '../../../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import {
  BookingCalendar,
  BookingCalendarLegend,
} from '~/components/space/BookingCalendar'
import { TimeRangePicker } from '~/components/space/TimeRangePicker'
import { AttendeeList } from '~/components/space/AttendeeList'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

export const Route = createFileRoute('/org/$slug/space/')({
  component: SpaceBookingPage,
})

function SpaceBookingPage() {
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

  // Loading state
  if (org === undefined || membership === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-[400px] bg-slate-100 rounded-xl" />
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
            <p className="text-slate-600 mb-6">
              This organization doesn&apos;t exist or the link is incorrect.
            </p>
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
            <p className="text-slate-600 mb-6">
              You need to be a member of {org.name} to book space.
            </p>
            <Button asChild>
              <Link
                to="/org/$slug/join"
                params={{ slug }}
                search={{ token: '' }}
              >
                Request to Join
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Loading space
  if (space === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-[400px] bg-slate-100 rounded-xl" />
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
            <p className="text-slate-600 mb-6">
              {org.name} hasn&apos;t set up a co-working space yet.
            </p>
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

  // Render the actual booking page
  return <SpaceBookingContent org={org} space={space} slug={slug} />
}

// Separate component to ensure space is non-null
interface SpaceBookingContentProps {
  org: Doc<'organizations'>
  space: Doc<'coworkingSpaces'>
  slug: string
}

function SpaceBookingContent({ org, space, slug }: SpaceBookingContentProps) {
  // Booking state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [startMinutes, setStartMinutes] = useState(540) // 9 AM default
  const [endMinutes, setEndMinutes] = useState(1020) // 5 PM default
  const [workingOn, setWorkingOn] = useState('')
  const [interestedInMeeting, setInterestedInMeeting] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [isBooking, setIsBooking] = useState(false)

  // Capacity query - covers current and next month
  const capacityStartDate = format(startOfMonth(calendarMonth), 'yyyy-MM-dd')
  const capacityEndDate = format(
    endOfMonth(addMonths(calendarMonth, 1)),
    'yyyy-MM-dd',
  )

  const capacityData = useQuery(api.spaceBookings.getCapacityForDateRange, {
    spaceId: space._id,
    startDate: capacityStartDate,
    endDate: capacityEndDate,
  })

  // Attendee query when date selected
  const selectedDateStr = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : undefined
  const attendees = useQuery(
    api.spaceBookings.getBookingAttendees,
    selectedDateStr ? { spaceId: space._id, date: selectedDateStr } : 'skip',
  )

  // Mutation
  const createBooking = useMutation(api.spaceBookings.createMemberBooking)

  // Get operating hours for selected date
  const selectedDayOfWeek = selectedDate ? getDay(selectedDate) : undefined
  const selectedDayHours =
    selectedDayOfWeek !== undefined
      ? space.operatingHours.find((h) => h.dayOfWeek === selectedDayOfWeek)
      : undefined

  // Set default times when date is selected
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const dayOfWeek = getDay(date)
      const dayHours = space.operatingHours.find(
        (h) => h.dayOfWeek === dayOfWeek,
      )
      if (dayHours && !dayHours.isClosed) {
        setStartMinutes(dayHours.openMinutes)
        setEndMinutes(dayHours.closeMinutes)
      }
    }
  }

  // Get capacity info for selected date
  const selectedDateCapacity = selectedDateStr
    ? capacityData?.dates[selectedDateStr]
    : undefined
  const currentCount = selectedDateCapacity?.count ?? 0
  const capacityStatus = selectedDateCapacity?.status ?? 'available'

  // Handle booking
  const handleBooking = async () => {
    if (!selectedDateStr || !consentChecked) return

    setIsBooking(true)
    try {
      const result = await createBooking({
        spaceId: space._id,
        date: selectedDateStr,
        startMinutes,
        endMinutes,
        workingOn: workingOn.trim() || undefined,
        interestedInMeeting: interestedInMeeting.trim() || undefined,
        consentToProfileSharing: true,
      })

      if (result.capacityWarning === 'at_capacity') {
        toast.success('Booking confirmed! Note: Space is now at capacity.')
      } else if (result.capacityWarning === 'nearing') {
        toast.success('Booking confirmed! Note: Space is filling up.')
      } else {
        toast.success('Booking confirmed!')
      }

      // Reset form
      setSelectedDate(undefined)
      setWorkingOn('')
      setInterestedInMeeting('')
      setConsentChecked(false)
    } catch (error) {
      console.error('Failed to book:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to book. Try again.',
      )
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="size-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-6 text-primary" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Link
                      to="/org/$slug"
                      params={{ slug }}
                      className="hover:text-slate-700 transition-colors"
                    >
                      {org.name}
                    </Link>
                    <span>/</span>
                    <span className="text-slate-700">Space</span>
                  </div>
                  <h1 className="text-xl font-display text-foreground">
                    <MapPin className="size-5 inline-block mr-2 -mt-0.5" />
                    {space.name}
                  </h1>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/org/$slug/space/bookings" params={{ slug }}>
                  <CalendarDays className="size-4 mr-2" />
                  My Bookings
                </Link>
              </Button>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Calendar section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5" />
                  Select a Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                  capacityData={capacityData}
                  operatingHours={space.operatingHours}
                  onMonthChange={setCalendarMonth}
                />
                <BookingCalendarLegend />
              </CardContent>
            </Card>

            {/* Booking form section */}
            <div className="space-y-6">
              {selectedDate ? (
                <>
                  {/* Date and capacity info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="size-5" />
                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Capacity indicator */}
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        <span
                          className={
                            capacityStatus === 'at_capacity'
                              ? 'text-red-600 font-medium'
                              : capacityStatus === 'nearing'
                                ? 'text-yellow-600 font-medium'
                                : 'text-muted-foreground'
                          }
                        >
                          {currentCount} /{' '}
                          {capacityData?.capacity ?? space.capacity} booked
                        </span>
                      </div>

                      {/* Capacity warning */}
                      {capacityStatus === 'at_capacity' && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
                          <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Space is at capacity</p>
                            <p>
                              You can still book, but the space may be crowded.
                            </p>
                          </div>
                        </div>
                      )}
                      {capacityStatus === 'nearing' && (
                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-start gap-2">
                          <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Space is filling up</p>
                            <p>Book soon to secure your spot!</p>
                          </div>
                        </div>
                      )}

                      {/* Time picker */}
                      <TimeRangePicker
                        startMinutes={startMinutes}
                        endMinutes={endMinutes}
                        onChange={(start, end) => {
                          setStartMinutes(start)
                          setEndMinutes(end)
                        }}
                        operatingHours={selectedDayHours}
                      />

                      {/* Working on */}
                      <div className="space-y-2">
                        <Label htmlFor="workingOn">
                          What are you working on? (optional)
                        </Label>
                        <Textarea
                          id="workingOn"
                          value={workingOn}
                          onChange={(e) =>
                            setWorkingOn(e.target.value.slice(0, 140))
                          }
                          placeholder="e.g., ML research, writing, studying..."
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          {workingOn.length}/140 characters
                        </p>
                      </div>

                      {/* Interested in meeting */}
                      <div className="space-y-2">
                        <Label htmlFor="interestedInMeeting">
                          Who would you like to meet? (optional)
                        </Label>
                        <Textarea
                          id="interestedInMeeting"
                          value={interestedInMeeting}
                          onChange={(e) =>
                            setInterestedInMeeting(e.target.value.slice(0, 140))
                          }
                          placeholder="e.g., AI safety researchers, ML engineers..."
                          rows={2}
                        />
                        <p className="text-xs text-muted-foreground">
                          {interestedInMeeting.length}/140 characters
                        </p>
                      </div>

                      {/* Consent checkbox */}
                      <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                        <Checkbox
                          id="consent"
                          checked={consentChecked}
                          onCheckedChange={(checked) =>
                            setConsentChecked(checked === true)
                          }
                        />
                        <Label
                          htmlFor="consent"
                          className="text-sm font-normal cursor-pointer leading-relaxed"
                        >
                          I agree that others booked on this day can see my
                          name, headline, and skills
                        </Label>
                      </div>

                      {/* Book button */}
                      <Button
                        onClick={handleBooking}
                        disabled={!consentChecked || isBooking}
                        className="w-full"
                      >
                        {isBooking ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="size-4 mr-2" />
                            Book This Date
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Attendees section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="size-5" />
                        Who&apos;s coming on {format(selectedDate, 'MMM d')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AttendeeList attendees={attendees ?? []} title="" />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="h-full flex items-center justify-center min-h-[300px]">
                  <div className="text-center p-6">
                    <Calendar className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      Select a date to see availability and book
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </GradientBg>
  )
}
