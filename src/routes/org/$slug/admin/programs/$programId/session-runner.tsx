import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { ArrowLeft } from 'lucide-react'
import { api } from '../../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../../convex/_generated/dataModel'
import { SessionRunner } from '~/components/session/SessionRunner'
import { SessionSetup } from '~/components/session/SessionSetup'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'

export const Route = createFileRoute(
  '/org/$slug/admin/programs/$programId/session-runner',
)({
  validateSearch: (search: Record<string, unknown>) => ({
    sessionId: search.sessionId as string,
  }),
  component: SessionRunnerPage,
})

function SessionRunnerPage() {
  const { slug, programId } = Route.useParams()
  const { sessionId } = Route.useSearch()
  const typedSessionId = sessionId as Id<'programSessions'>

  const program = useQuery(api.programs.getProgram, {
    programId: programId as Id<'programs'>,
  })
  const session = useQuery(api.programs.getProgramSessions, {
    programId: programId as Id<'programs'>,
  })
  const liveState = useQuery(api.course.sessionQueries.getLiveState, {
    sessionId: typedSessionId,
  })

  const currentSession = session?.find((s) => s._id === typedSessionId)

  if (!program || !session) {
    return (
      <>
        <AuthHeader />
        <GradientBg className="min-h-screen">
          <div className="flex justify-center py-16">
            <Spinner className="size-8" />
          </div>
        </GradientBg>
      </>
    )
  }

  const isLive = liveState?.status === 'running'
  const isCompleted = liveState?.status === 'completed'

  return (
    <>
      <AuthHeader />
      <GradientBg className="min-h-screen">
        <main className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              to="/org/$slug/admin/programs/$programId"
              params={{ slug, programId }}
            >
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{program.name}</h1>
              <p className="text-sm text-muted-foreground">
                {currentSession
                  ? `Day ${currentSession.dayNumber}: ${currentSession.title}`
                  : 'Session Runner'}
              </p>
            </div>
          </div>

          {/* Content */}
          {isLive || isCompleted ? (
            <SessionRunner
              sessionId={typedSessionId}
              programId={programId as Id<'programs'>}
            />
          ) : (
            <SessionSetup
              sessionId={typedSessionId}
              programId={programId as Id<'programs'>}
              onStartSession={() => {
                // Session started — component will re-render when liveState changes
              }}
            />
          )}
        </main>
      </GradientBg>
    </>
  )
}
