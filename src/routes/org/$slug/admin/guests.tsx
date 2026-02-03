import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Building2, CalendarDays, History, Shield, Users } from 'lucide-react'
import { api } from '../../../../../convex/_generated/api'
import { AuthHeader } from '~/components/layout/auth-header'
import { GuestApplicationQueue } from '~/components/org/GuestApplicationQueue'
import { GuestVisitHistory } from '~/components/org/GuestVisitHistory'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

export const Route = createFileRoute('/org/$slug/admin/guests')({
  component: GuestsAdminPage,
})

function GuestsAdminPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()

  // Get org and check admin access
  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const space = useQuery(
    api.coworkingSpaces.getSpaceByOrg,
    org && membership?.role === 'admin' ? { orgId: org._id } : 'skip',
  )

  // Loading state
  if (org === undefined || membership === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Org not found
  if (org === null) {
    return (
      <div className="min-h-screen bg-slate-50">
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
      </div>
    )
  }

  // Not an admin
  if (!membership || membership.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-8 text-slate-400" />
            </div>
            <h1 className="text-2xl font-display text-foreground mb-4">
              Admin Access Required
            </h1>
            <p className="text-slate-600 mb-6">
              You need admin access to manage guests.
            </p>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to Organization
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Still loading space
  if (space === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
            <Spinner />
          </div>
        </main>
      </div>
    )
  }

  // No coworking space configured
  if (space === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="size-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium">No Coworking Space</p>
                <p className="text-slate-600 mb-4">
                  Configure a coworking space first to enable guest visits.
                </p>
                <Button
                  onClick={() =>
                    navigate({ to: '/org/$slug/admin/space', params: { slug } })
                  }
                >
                  Configure Space
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Guest access disabled
  if (!space.guestAccessEnabled) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="size-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium">Guest Access Disabled</p>
                <p className="text-slate-600 mb-4">
                  Enable guest access in space settings to start receiving visit
                  applications.
                </p>
                <Button
                  onClick={() =>
                    navigate({ to: '/org/$slug/admin/space', params: { slug } })
                  }
                >
                  Space Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
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
                to="/org/$slug/admin"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                Admin
              </Link>
              <span>/</span>
              <span className="text-slate-700">Guests</span>
            </div>
            <h1 className="text-2xl font-display text-foreground">
              Guest Management
            </h1>
            <p className="text-slate-600 mt-1">
              Review visit applications and manage guest access to {space.name}
            </p>
          </div>

          <Tabs defaultValue="queue">
            <TabsList>
              <TabsTrigger value="queue" className="gap-2">
                <Users className="size-4" />
                Pending Applications
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="size-4" />
                Visit History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-6">
              <GuestApplicationQueue
                spaceId={space._id}
                customFields={space.customVisitFields ?? []}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <GuestVisitHistory spaceId={space._id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
