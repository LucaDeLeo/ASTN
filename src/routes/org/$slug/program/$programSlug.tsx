import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Lock,
  MapPin,
} from 'lucide-react'
import { api } from '../../../../../convex/_generated/api'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { MaterialIcon } from '~/components/programs/MaterialIcon'
import { formatEventDate } from '~/lib/format-event-date'
import { programTypeLabels } from '~/lib/program-constants'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'

export const Route = createFileRoute('/org/$slug/program/$programSlug')({
  component: ProgramPage,
})

function ProgramPage() {
  const { slug, programSlug } = Route.useParams()
  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const data = useQuery(
    api.programs.getProgramBySlug,
    org ? { orgId: org._id, programSlug } : 'skip',
  )

  if (org === undefined || data === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-24 bg-slate-100 rounded-xl" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </GradientBg>
    )
  }

  if (org === null || data === null) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              {org === null ? 'Organization Not Found' : 'Program Not Found'}
            </h1>
            <p className="text-slate-600 mb-6">
              {org === null
                ? "This organization doesn't exist."
                : "This program doesn't exist or you don't have access."}
            </p>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to {org?.name ?? 'Organization'}
              </Link>
            </Button>
          </div>
        </main>
      </GradientBg>
    )
  }

  const { program, participation, modules, events } = data

  const visibleModules = modules.filter(
    (m) => m.status === 'available' || m.status === 'completed',
  )
  const lockedModules = modules.filter((m) => m.status === 'locked')

  const now = Date.now()
  const upcomingEvents = events.filter((e) => e.startAt > now)
  const pastEvents = events.filter((e) => e.startAt <= now)

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
              <Link
                to="/org/$slug"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                {org.name}
              </Link>
              <span>/</span>
              <Link
                to="/org/$slug/programs"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                Programs
              </Link>
              <span>/</span>
              <span className="text-slate-700">{program.name}</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-display text-foreground">
                    {program.name}
                  </h1>
                  <Badge className="bg-green-100 text-green-700">
                    {program.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>{programTypeLabels[program.type]}</span>
                  {program.startDate && (
                    <>
                      <span>·</span>
                      <span>
                        {new Date(program.startDate).toLocaleDateString(
                          'en-US',
                          { month: 'short', day: 'numeric' },
                        )}
                        {program.endDate &&
                          ` – ${new Date(program.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {participation && (
                <Badge
                  className={
                    participation.status === 'completed'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }
                >
                  {participation.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="size-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    'Enrolled'
                  )}
                </Badge>
              )}
            </div>

            {program.description && (
              <p className="text-slate-600 mt-4">{program.description}</p>
            )}
          </Card>

          {/* Upcoming Sessions */}
          {upcomingEvents.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="size-5" />
                Upcoming Sessions
              </h2>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Card key={event._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {event.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                          <Clock className="size-3.5 shrink-0" />
                          <span>
                            {formatEventDate(
                              event.startAt,
                              event.endAt,
                              event.timezone,
                            )}
                          </span>
                        </div>
                        {event.location && (
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <MapPin className="size-3.5 shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      <a
                        href={`https://lu.ma/${event.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="size-3.5 mr-1" />
                          Open in Luma
                        </Button>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Curriculum */}
          {(visibleModules.length > 0 || lockedModules.length > 0) && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <GraduationCap className="size-5" />
                Curriculum
              </h2>
              <div className="space-y-3">
                {visibleModules.map((mod) => (
                  <Card key={mod._id} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            Week {mod.weekNumber}
                          </span>
                          {mod.status === 'completed' && (
                            <CheckCircle2 className="size-4 text-green-600" />
                          )}
                        </div>
                        <h3 className="font-medium text-foreground mt-1">
                          {mod.title}
                        </h3>
                      </div>
                    </div>
                    {mod.description && (
                      <p className="text-sm text-slate-600 mb-3">
                        {mod.description}
                      </p>
                    )}
                    {mod.materials && mod.materials.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {mod.materials.map((mat, i) => (
                          <a
                            key={i}
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <MaterialIcon type={mat.type} className="size-4" />
                            {mat.label}
                            <ExternalLink className="size-3 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}

                {lockedModules.length > 0 && (
                  <Card className="p-4 bg-slate-50 border-dashed">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Lock className="size-4" />
                      <span className="text-sm">
                        {lockedModules.length} more module
                        {lockedModules.length > 1 ? 's' : ''} coming soon
                      </span>
                    </div>
                  </Card>
                )}
              </div>
            </section>
          )}

          {/* Past Sessions */}
          {pastEvents.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-semibold text-slate-500 mb-3">
                Past Sessions
              </h2>
              <div className="space-y-3 opacity-75">
                {pastEvents.map((event) => (
                  <Card key={event._id} className="p-4">
                    <h3 className="font-medium text-foreground">
                      {event.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock className="size-3.5 shrink-0" />
                      <span>
                        {formatEventDate(
                          event.startAt,
                          event.endAt,
                          event.timezone,
                        )}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* My Progress */}
          {participation && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                My Progress
              </h2>
              <Card className="p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Status</p>
                    <Badge
                      className={
                        participation.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }
                    >
                      {participation.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      Sessions Attended
                    </p>
                    <p className="text-foreground font-medium">
                      {participation.manualAttendanceCount ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Enrolled</p>
                    <p className="text-foreground">
                      {new Date(participation.enrolledAt).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric', year: 'numeric' },
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          )}
        </div>
      </main>
    </GradientBg>
  )
}
