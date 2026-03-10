import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Building2, GraduationCap } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { programStatusColors, programTypeLabels } from '~/lib/program-constants'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'

export const Route = createFileRoute('/org/$slug/programs')({
  component: MyProgramsPage,
})

function MyProgramsPage() {
  const { slug } = Route.useParams()
  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const myPrograms = useQuery(
    api.programs.getMyPrograms,
    org ? { orgId: org._id } : 'skip',
  )

  if (org === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </GradientBg>
    )
  }

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

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="p-6 mb-6">
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
              <div className="flex-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Link
                    to="/org/$slug"
                    params={{ slug }}
                    className="hover:text-slate-700 transition-colors"
                  >
                    {org.name}
                  </Link>
                  <span>/</span>
                  <span className="text-slate-700">My Programs</span>
                </div>
                <h1 className="text-xl font-display text-foreground">
                  <GraduationCap className="size-5 inline-block mr-2 -mt-0.5" />
                  My Programs
                </h1>
              </div>
            </div>
          </Card>

          {/* Programs list */}
          {myPrograms === undefined ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-slate-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : myPrograms.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="size-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                No Programs Yet
              </h2>
              <p className="text-slate-600">
                You&apos;re not enrolled in any programs yet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myPrograms.map((prog) => (
                <Link
                  key={prog._id}
                  to="/org/$slug/program/$programSlug"
                  params={{ slug, programSlug: prog.slug }}
                  className="block group"
                >
                  <Card className="p-5 hover:shadow-md transition-shadow h-full">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {prog.name}
                      </h3>
                      <Badge className={programStatusColors[prog.status]}>
                        {prog.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">
                      {programTypeLabels[prog.type]}
                    </p>
                    {prog.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {prog.description}
                      </p>
                    )}
                    {prog.participationStatus === 'completed' && (
                      <Badge className="mt-3 bg-blue-50 text-blue-700 border-blue-200">
                        Completed
                      </Badge>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </GradientBg>
  )
}
