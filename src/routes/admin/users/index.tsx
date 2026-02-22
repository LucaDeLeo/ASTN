import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { formatDistanceToNow } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '../../../../convex/_generated/api'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'

export const Route = createFileRoute('/admin/users/')({
  component: AdminUsersPage,
})

const PAGE_SIZE = 25

function AdminUsersPage() {
  const isPlatformAdmin = useQuery(api.orgApplications.checkPlatformAdmin)

  if (isPlatformAdmin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  if (!isPlatformAdmin) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Shield className="size-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-4">
          Platform Admin Access Required
        </h1>
        <p className="text-slate-600">
          You need platform admin access to view user profiles.
        </p>
      </div>
    )
  }

  return <UserList />
}

function UserList() {
  const [page, setPage] = useState(1)
  const profiles = useQuery(api.platformAdmin.users.listAllProfiles)

  if (profiles === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(profiles.length / PAGE_SIZE))
  const paginatedProfiles = profiles.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-foreground mb-1">Users</h1>
        <p className="text-muted-foreground text-sm">
          {profiles.length} profile{profiles.length !== 1 ? 's' : ''} on the
          platform.
        </p>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="size-8 mx-auto mb-2 text-muted-foreground/50" />
            No user profiles found.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            <div className="rounded-lg border bg-background">
              <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
                <div>Name</div>
                <div>Email</div>
                <div>Location</div>
                <div>Created</div>
                <div>Completeness</div>
                <div>Chat</div>
              </div>
              {paginatedProfiles.map((profile) => (
                <Link
                  key={profile._id}
                  to="/admin/users/$userId"
                  params={{ userId: profile.userId }}
                  className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b last:border-b-0 items-center text-sm hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {profile.name || 'Unnamed'}
                    </p>
                    {profile.headline && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {profile.headline}
                      </p>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate">
                    {profile.email || '-'}
                  </div>
                  <div className="text-muted-foreground">
                    {profile.location || '-'}
                  </div>
                  <div className="text-muted-foreground">
                    {formatDistanceToNow(profile.createdAt, {
                      addSuffix: true,
                    })}
                  </div>
                  <div>
                    <Badge
                      variant={
                        profile.completenessPercentage >= 80
                          ? 'default'
                          : profile.completenessPercentage >= 40
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {profile.completenessPercentage}%
                    </Badge>
                  </div>
                  <div>
                    {profile.hasAgentThread && (
                      <MessageSquare className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile: Card list */}
          <div className="md:hidden space-y-3">
            {paginatedProfiles.map((profile) => (
              <Link
                key={profile._id}
                to="/admin/users/$userId"
                params={{ userId: profile.userId }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {profile.name || 'Unnamed'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {profile.email || 'No email'}
                        </p>
                      </div>
                      <Badge
                        variant={
                          profile.completenessPercentage >= 80
                            ? 'default'
                            : profile.completenessPercentage >= 40
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {profile.completenessPercentage}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {profile.location && <span>{profile.location}</span>}
                      <span>
                        {formatDistanceToNow(profile.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                      {profile.hasAgentThread && (
                        <MessageSquare className="size-3" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, profiles.length)} of{' '}
                {profiles.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
