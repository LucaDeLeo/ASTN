import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ClipboardList } from 'lucide-react'
import { api } from '../../../../../../convex/_generated/api'
import { GradientBg } from '~/components/layout/GradientBg'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/org/$slug/survey/$surveyToken/')({
  loader: async ({ context, params }) => {
    const surveyData = await context.queryClient.ensureQueryData(
      convexQuery(api.feedbackSurveys.getSurveyByToken, {
        accessToken: params.surveyToken,
      }),
    )
    return { surveyData }
  },
  component: SurveyFallbackPage,
})

function SurveyFallbackPage() {
  const { surveyToken, slug } = Route.useParams()

  const { data: surveyData } = useSuspenseQuery(
    convexQuery(api.feedbackSurveys.getSurveyByToken, {
      accessToken: surveyToken,
    }),
  )

  return (
    <GradientBg>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto text-center py-12">
          <ClipboardList className="size-8 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-display text-foreground mb-4">
            {surveyData ? surveyData.survey.title : 'Feedback Survey'}
          </h1>
          <p className="text-muted-foreground mb-6">
            This survey uses individual links. Please check your email for your
            personal survey link, or contact the organizer.
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
