import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
import { api } from '../../../../../../convex/_generated/api'
import { GradientBg } from '~/components/layout/GradientBg'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/org/$slug/poll/$pollToken/')({
  loader: async ({ context, params }) => {
    const pollData = await context.queryClient.ensureQueryData(
      convexQuery(api.availabilityPolls.getPollByToken, {
        accessToken: params.pollToken,
      }),
    )
    return { pollData }
  },
  component: PollFallbackPage,
})

function PollFallbackPage() {
  const { pollToken, slug } = Route.useParams()

  const { data: pollData } = useSuspenseQuery(
    convexQuery(api.availabilityPolls.getPollByToken, {
      accessToken: pollToken,
    }),
  )

  return (
    <GradientBg>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto text-center py-12">
          <Clock className="size-8 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-display text-foreground mb-4">
            {pollData ? pollData.poll.title : 'Availability Poll'}
          </h1>
          <p className="text-muted-foreground mb-6">
            This poll uses individual links. Please check your email for your
            personal poll link, or contact the organizer.
          </p>
          <Button asChild variant="outline">
            <Link to="/org/$slug" params={{ slug }}>
              Visit Organization
            </Link>
          </Button>
        </div>
      </main>
    </GradientBg>
  )
}
