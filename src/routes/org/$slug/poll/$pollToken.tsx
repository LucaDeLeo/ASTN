import { useUser } from '@clerk/clerk-react'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { CheckCircle2, Clock, Loader2, Lock, LogIn } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import { AvailabilityGrid } from '~/components/availability/AvailabilityGrid'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/org/$slug/poll/$pollToken')({
  loader: async ({ context, params }) => {
    const pollData = await context.queryClient.ensureQueryData(
      convexQuery(api.availabilityPolls.getPollByToken, {
        accessToken: params.pollToken,
      }),
    )
    return { pollData }
  },
  head: ({ loaderData }) => {
    const pollData = loaderData?.pollData
    const title = pollData
      ? `${pollData.poll.title} — ${pollData.org.name}`
      : 'Availability Poll'
    return {
      meta: [
        { title },
        {
          name: 'description',
          content: 'Share your availability for scheduling.',
        },
      ],
    }
  },
  component: PollPage,
})

type SlotStatus = 'available' | 'maybe'

function PollPage() {
  const { pollToken } = Route.useParams()
  const { isAuthenticated } = useConvexAuth()
  const { user } = useUser()
  const navigate = useNavigate()

  const { data: pollData } = useSuspenseQuery(
    convexQuery(api.availabilityPolls.getPollByToken, {
      accessToken: pollToken,
    }),
  )

  // Auth user's existing response
  const myResponse = useQuery(
    api.availabilityPolls.getMyResponse,
    isAuthenticated && pollData ? { pollId: pollData.poll._id } : 'skip',
  )

  const submitResponse = useMutation(api.availabilityPolls.submitResponse)

  const [slots, setSlots] = useState<Record<string, SlotStatus>>({})
  const [slotsInitialized, setSlotsInitialized] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Pre-populate slots from existing response
  if (!slotsInitialized) {
    if (isAuthenticated && myResponse) {
      setSlots(myResponse.slots as Record<string, SlotStatus>)
      setSlotsInitialized(true)
    } else if (isAuthenticated && myResponse === null) {
      setSlotsInitialized(true)
    }
  }

  if (!pollData) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Clock className="size-8 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-display text-foreground mb-4">
              Poll Not Found
            </h1>
            <p className="text-muted-foreground">
              This poll link may be invalid or expired.
            </p>
          </div>
        </main>
      </GradientBg>
    )
  }

  const { poll, opportunity, org } = pollData

  // Finalized state
  if (poll.status === 'finalized' && poll.finalizedSlot) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">{org.name}</p>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                {poll.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {opportunity.title}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="size-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  Time Finalized
                </span>
              </div>
              <p className="text-blue-800">
                {poll.finalizedSlot.date} at{' '}
                {formatTime(poll.finalizedSlot.startMinutes)} –{' '}
                {formatTime(poll.finalizedSlot.endMinutes)} ({poll.timezone})
              </p>
            </div>

            <AvailabilityGrid
              startDate={poll.startDate}
              endDate={poll.endDate}
              startMinutes={poll.startMinutes}
              endMinutes={poll.endMinutes}
              slotDurationMinutes={poll.slotDurationMinutes}
              timezone={poll.timezone}
              slots={slots}
              onSlotsChange={() => {}}
              readOnly
              finalizedSlot={poll.finalizedSlot}
            />
          </div>
        </main>
      </GradientBg>
    )
  }

  // Closed state
  if (poll.status === 'closed') {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Lock className="size-8 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-display text-foreground mb-4">
              Poll Closed
            </h1>
            <p className="text-muted-foreground">
              This availability poll is no longer accepting responses.
            </p>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Submitted success
  if (submitted) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Availability Saved
            </h1>
            <p className="text-muted-foreground mb-6">
              Your availability for <strong>{poll.title}</strong> has been
              recorded. You can revisit this link to update your response.
            </p>
            <Button asChild variant="outline">
              <Link to="/org/$slug" params={{ slug: org.slug ?? '' }}>
                Visit {org.name}
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Login wall for unauthenticated users
  if (!isAuthenticated) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">{org.name}</p>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                {poll.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {opportunity.title}
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm text-center">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <LogIn className="size-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                Sign in to continue
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Sign in or create an account to share your availability.
              </p>
              <Button
                className="w-full"
                onClick={() => navigate({ to: '/login' })}
              >
                Sign In
              </Button>
            </div>
          </div>
        </main>
      </GradientBg>
    )
  }

  // Main grid view (authenticated)
  const respondentName = user?.fullName ?? user?.firstName ?? 'Anonymous'

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await submitResponse({
        pollId: poll._id,
        accessToken: pollToken,
        slots,
        respondentName,
      })
      setSubmitted(true)
      toast.success('Availability saved')
    } catch (err) {
      console.error('Failed to save availability:', err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to save availability',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">{org.name}</p>
            <h1 className="text-2xl font-display font-semibold text-foreground">
              {poll.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {opportunity.title} · Timezone: {poll.timezone.replace(/_/g, ' ')}
            </p>
          </div>

          <AvailabilityGrid
            startDate={poll.startDate}
            endDate={poll.endDate}
            startMinutes={poll.startMinutes}
            endMinutes={poll.endMinutes}
            slotDurationMinutes={poll.slotDurationMinutes}
            timezone={poll.timezone}
            slots={slots}
            onSlotsChange={setSlots}
          />

          <div className="flex items-center justify-end mt-6 pb-8">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(slots).length === 0}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save My Availability'
              )}
            </Button>
          </div>
        </div>
      </main>
    </GradientBg>
  )
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0
    ? `${h12}:00 ${period}`
    : `${h12}:${String(m).padStart(2, '0')} ${period}`
}
