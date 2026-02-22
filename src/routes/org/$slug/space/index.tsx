import { Link, createFileRoute } from '@tanstack/react-router'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { addMonths, endOfMonth, format, getDay, startOfMonth } from 'date-fns'
import {
  AlertCircle,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coffee,
  Loader2,
  LogIn,
  MapPin,
  Monitor,
  Printer,
  ScrollText,
  ShowerHead,
  Sparkles,
  Users,
  Wifi,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
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
  component: SpaceLandingPage,
})

// Map known amenity names to lucide icons
const AMENITY_ICONS: Record<string, React.ElementType> = {
  WiFi: Wifi,
  'External Monitors': Monitor,
  'Coffee/Tea': Coffee,
  Printer: Printer,
  Showers: ShowerHead,
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0
    ? `${hour12} ${period}`
    : `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function SpaceLandingPage() {
  const { slug } = Route.useParams()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()

  // Public query — no auth required
  const spaceLanding = useQuery(api.coworkingSpaces.getSpaceLanding, { slug })

  // Membership query — only if authenticated and we have an orgId
  const membership = useQuery(
    api.orgs.membership.getMembership,
    isAuthenticated && spaceLanding ? { orgId: spaceLanding.orgId } : 'skip',
  )

  // Loading
  if (spaceLanding === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-64 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-40 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Not found
  if (spaceLanding === null) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Space Not Found
            </h1>
            <p className="text-slate-600 mb-6">
              This organization doesn&apos;t have a co-working space, or the
              link is incorrect.
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

  const isMember = membership !== null && membership !== undefined

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero / Cover Image */}
          {spaceLanding.coverImageUrl ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={spaceLanding.coverImageUrl}
                alt={spaceLanding.spaceName}
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <SpaceTitle landing={spaceLanding} light />
              </div>
            </div>
          ) : (
            <Card className="p-6">
              <SpaceTitle landing={spaceLanding} />
            </Card>
          )}

          {/* Description */}
          {spaceLanding.description && (
            <section>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {spaceLanding.description}
              </p>
            </section>
          )}

          {/* Amenities */}
          {spaceLanding.amenities && spaceLanding.amenities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {spaceLanding.amenities.map((amenity) => {
                  const Icon = AMENITY_ICONS[amenity] ?? Sparkles
                  return (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-sm text-slate-700"
                    >
                      <Icon className="size-4" />
                      {amenity}
                    </span>
                  )
                })}
              </div>
            </section>
          )}

          {/* House Rules */}
          {spaceLanding.houseRules && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ScrollText className="size-5" />
                House Rules
              </h2>
              <ul className="space-y-1.5 text-muted-foreground">
                {spaceLanding.houseRules
                  .split('\n')
                  .filter((r) => r.trim())
                  .map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">&#8226;</span>
                      {rule.trim()}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* Operating Hours */}
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="size-5" />
              Operating Hours
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {spaceLanding.operatingHours
                .slice()
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((h) => (
                  <div
                    key={h.dayOfWeek}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      h.isClosed
                        ? 'bg-slate-50 text-muted-foreground'
                        : 'bg-background'
                    }`}
                  >
                    <div className="font-medium">{DAY_NAMES[h.dayOfWeek]}</div>
                    <div className="text-muted-foreground">
                      {h.isClosed
                        ? 'Closed'
                        : `${formatMinutes(h.openMinutes)} - ${formatMinutes(h.closeMinutes)}`}
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* Divider */}
          <hr className="border-slate-200" />

          {/* Booking Section (gated) */}
          <BookingSection
            spaceLanding={spaceLanding}
            isMember={isMember}
            isAuthenticated={isAuthenticated}
            authLoading={authLoading}
            slug={slug}
          />
        </div>
      </main>
    </GradientBg>
  )
}

interface SpaceLandingData {
  spaceId: Id<'coworkingSpaces'>
  spaceName: string
  orgId: Id<'organizations'>
  orgName: string
  orgSlug?: string
  orgLogoUrl?: string
  capacity: number
  timezone: string
  operatingHours: Array<{
    dayOfWeek: number
    openMinutes: number
    closeMinutes: number
    isClosed: boolean
  }>
  guestAccessEnabled: boolean
  description?: string
  address?: string
  addressNote?: string
  coverImageUrl?: string
  amenities?: Array<string>
  houseRules?: string
}

function SpaceTitle({
  landing,
  light,
}: {
  landing: SpaceLandingData
  light?: boolean
}) {
  return (
    <div className="flex items-center gap-4">
      {landing.orgLogoUrl ? (
        <img
          src={landing.orgLogoUrl}
          alt={landing.orgName}
          className="size-12 rounded-lg object-cover"
        />
      ) : (
        <div
          className={`size-12 rounded-lg flex items-center justify-center ${
            light ? 'bg-white/20' : 'bg-primary/10'
          }`}
        >
          <Building2
            className={`size-6 ${light ? 'text-white' : 'text-primary'}`}
          />
        </div>
      )}
      <div>
        <div
          className={`flex items-center gap-2 text-sm mb-0.5 ${
            light ? 'text-white/80' : 'text-muted-foreground'
          }`}
        >
          <Link
            to="/org/$slug"
            params={{ slug: landing.orgSlug || '' }}
            className={`hover:underline ${light ? 'text-white/80' : ''}`}
          >
            {landing.orgName}
          </Link>
          <span>/</span>
          <span>Space</span>
        </div>
        <h1
          className={`text-xl font-display ${
            light ? 'text-white' : 'text-foreground'
          }`}
        >
          <MapPin className="size-5 inline-block mr-1.5 -mt-0.5" />
          {landing.spaceName}
        </h1>
        {landing.address && (
          <p
            className={`text-sm mt-0.5 ${
              light ? 'text-white/70' : 'text-muted-foreground'
            }`}
          >
            {landing.address}
            {landing.addressNote && ` — ${landing.addressNote}`}
          </p>
        )}
      </div>
    </div>
  )
}

function BookingSection({
  spaceLanding,
  isMember,
  isAuthenticated,
  authLoading,
  slug,
}: {
  spaceLanding: SpaceLandingData
  isMember: boolean
  isAuthenticated: boolean
  authLoading: boolean
  slug: string
}) {
  // If authenticated member, show booking form
  if (isAuthenticated && isMember) {
    return (
      <MemberBookingForm
        spaceId={spaceLanding.spaceId}
        spaceLanding={spaceLanding}
        slug={slug}
      />
    )
  }

  // CTA for non-members / unauthenticated
  return (
    <Card className="text-center p-8">
      <div className="max-w-md mx-auto space-y-4">
        <Calendar className="size-12 mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-display">Book a Spot</h2>
        {authLoading ? (
          <Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" />
        ) : !isAuthenticated ? (
          <>
            <p className="text-muted-foreground">
              Sign in to book a spot at this space.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild>
                <Link to="/login">
                  <LogIn className="size-4 mr-2" />
                  Sign In to Book
                </Link>
              </Button>
              {spaceLanding.guestAccessEnabled && (
                <Button variant="outline" asChild>
                  <Link to="/org/$slug/visit" params={{ slug }}>
                    Request a Visit
                  </Link>
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              Join {spaceLanding.orgName} to book a spot.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild>
                <Link
                  to="/org/$slug/join"
                  params={{ slug }}
                  search={{ token: '' }}
                >
                  Join to Book
                </Link>
              </Button>
              {spaceLanding.guestAccessEnabled && (
                <Button variant="outline" asChild>
                  <Link to="/org/$slug/visit" params={{ slug }}>
                    Request a Visit
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

function MemberBookingForm({
  spaceId,
  spaceLanding,
  slug,
}: {
  spaceId: Id<'coworkingSpaces'>
  spaceLanding: SpaceLandingData
  slug: string
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [startMinutes, setStartMinutes] = useState(540)
  const [endMinutes, setEndMinutes] = useState(1020)
  const [workingOn, setWorkingOn] = useState('')
  const [interestedInMeeting, setInterestedInMeeting] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [isBooking, setIsBooking] = useState(false)

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

  const selectedDateStr = selectedDate
    ? format(selectedDate, 'yyyy-MM-dd')
    : undefined
  const attendees = useQuery(
    api.spaceBookings.getBookingAttendees,
    selectedDateStr ? { spaceId, date: selectedDateStr } : 'skip',
  )

  const createBooking = useMutation(api.spaceBookings.createMemberBooking)

  const selectedDayOfWeek = selectedDate ? getDay(selectedDate) : undefined
  const selectedDayHours =
    selectedDayOfWeek !== undefined
      ? spaceLanding.operatingHours.find(
          (h) => h.dayOfWeek === selectedDayOfWeek,
        )
      : undefined

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const dayOfWeek = getDay(date)
      const dayHours = spaceLanding.operatingHours.find(
        (h) => h.dayOfWeek === dayOfWeek,
      )
      if (dayHours && !dayHours.isClosed) {
        setStartMinutes(dayHours.openMinutes)
        setEndMinutes(dayHours.closeMinutes)
      }
    }
  }

  const selectedDateCapacity = selectedDateStr
    ? capacityData?.dates[selectedDateStr]
    : undefined
  const currentCount = selectedDateCapacity?.count ?? 0
  const capacityStatus = selectedDateCapacity?.status ?? 'available'

  const handleBooking = async () => {
    if (!selectedDateStr || !consentChecked) return

    setIsBooking(true)
    try {
      const result = await createBooking({
        spaceId,
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
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Book a Spot</h2>
        <Button variant="outline" size="sm" asChild>
          <Link to="/org/$slug/space/bookings" params={{ slug }}>
            <CalendarDays className="size-4 mr-2" />
            My Bookings
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
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
              operatingHours={spaceLanding.operatingHours}
              onMonthChange={setCalendarMonth}
            />
            <BookingCalendarLegend />
          </CardContent>
        </Card>

        {/* Booking form */}
        <div className="space-y-6">
          {selectedDate ? (
            <>
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
                      {capacityData?.capacity ?? spaceLanding.capacity} booked
                    </span>
                  </div>

                  {capacityStatus === 'at_capacity' && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
                      <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Space is at capacity</p>
                        <p>You can still book, but the space may be crowded.</p>
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

                  <TimeRangePicker
                    startMinutes={startMinutes}
                    endMinutes={endMinutes}
                    onChange={(start, end) => {
                      setStartMinutes(start)
                      setEndMinutes(end)
                    }}
                    operatingHours={selectedDayHours}
                  />

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
                      I agree that others booked on this day can see my name,
                      headline, and skills
                    </Label>
                  </div>

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
    </section>
  )
}
