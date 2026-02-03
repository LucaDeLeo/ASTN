import { Link, createFileRoute } from '@tanstack/react-router'
import { AuthLoading, Authenticated, useQuery } from 'convex/react'
import { Building2, Calendar, Settings, Users } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { MemberDirectory } from '~/components/org/MemberDirectory'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'

export const Route = createFileRoute('/org/$slug/')({
  component: OrgDirectoryPage,
})

function OrgDirectoryPage() {
  const { slug } = Route.useParams()
  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })

  if (org === undefined) {
    return (
      <GradientBg>
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-24 bg-slate-100 rounded-xl" />
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
            <h1 className="text-2xl font-bold text-foreground mb-4">
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

  return (
    <GradientBg>
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <OrgHeader org={org} />
          <MemberDirectory orgId={org._id} />
        </div>
      </main>
    </GradientBg>
  )
}

interface OrgHeaderProps {
  org: {
    _id: Id<'organizations'>
    name: string
    slug?: string
    logoUrl?: string
    lumaCalendarUrl?: string
  }
}

function OrgHeader({ org }: OrgHeaderProps) {
  const memberCount = useQuery(api.orgs.directory.getMemberCount, {
    orgId: org._id,
  })

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name}
              className="size-12 sm:size-16 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="size-12 sm:size-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="size-6 sm:size-8 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {org.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
              <Users className="size-4 shrink-0" />
              <span>
                {memberCount === undefined
                  ? '...'
                  : `${memberCount} member${memberCount === 1 ? '' : 's'}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {org.lumaCalendarUrl && org.slug && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/org/$slug/events" params={{ slug: org.slug }}>
                <Calendar className="size-4 mr-1" />
                Events
              </Link>
            </Button>
          )}

          <AuthLoading>
            <Spinner className="size-5" />
          </AuthLoading>

          <Authenticated>
            <MembershipStatus orgId={org._id} orgSlug={org.slug} />
          </Authenticated>
        </div>
      </div>
    </Card>
  )
}

interface MembershipStatusProps {
  orgId: Id<'organizations'>
  orgSlug?: string
}

function MembershipStatus({ orgId, orgSlug }: MembershipStatusProps) {
  const membership = useQuery(api.orgs.membership.getMembership, { orgId })

  if (membership === undefined) {
    return <Spinner className="size-5" />
  }

  if (membership === null) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">Member</Badge>
      {membership.role === 'admin' && orgSlug && (
        <Button variant="outline" size="sm" asChild>
          <Link to="/org/$slug/admin" params={{ slug: orgSlug }}>
            <Settings className="size-4 mr-1" />
            Admin
          </Link>
        </Button>
      )}
    </div>
  )
}
