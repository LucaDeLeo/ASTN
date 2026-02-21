import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useQuery,
} from 'convex/react'
import { format } from 'date-fns'
import { CalendarCheck, ChevronRight } from 'lucide-react'
import { z } from 'zod'
import { api } from '../../../convex/_generated/api'
import { OnboardingGuard } from '~/components/auth/onboarding-guard'
import { UnauthenticatedRedirect } from '~/components/auth/unauthenticated-redirect'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { MobileShell } from '~/components/layout/mobile-shell'
import { UnifiedProfile } from '~/components/profile/UnifiedProfile'
import { useIsMobile } from '~/hooks/use-media-query'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Spinner } from '~/components/ui/spinner'

const searchSchema = z.object({
  section: z
    .enum([
      'basic',
      'education',
      'work',
      'goals',
      'skills',
      'preferences',
      'privacy',
    ])
    .optional(),
})

export const Route = createFileRoute('/profile/')({
  validateSearch: searchSchema,
  component: ProfilePage,
})

function ProfilePage() {
  const isMobile = useIsMobile()
  const currentUser = useQuery(api.profiles.getOrCreateProfile)
  const user = currentUser ? { name: currentUser.name || 'User' } : null
  const { section } = Route.useSearch()

  const loadingContent = (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <Spinner />
    </div>
  )

  const pageContent = (
    <>
      <AuthLoading>{loadingContent}</AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <OnboardingGuard>
          <main className="container mx-auto px-4 py-8">
            <UnifiedProfile initialSection={section} />

            {/* Event Attendance section */}
            <div className="flex flex-col md:flex-row md:gap-8">
              <div className="hidden md:block w-64 shrink-0" />
              <div className="flex-1 md:min-w-0 mt-4">
                <AttendanceSection />
              </div>
            </div>
          </main>
        </OnboardingGuard>
      </Authenticated>
    </>
  )

  if (isMobile) {
    return (
      <MobileShell user={user}>
        <GradientBg variant="subtle">{pageContent}</GradientBg>
      </MobileShell>
    )
  }

  return (
    <GradientBg variant="subtle">
      <AuthHeader />
      {pageContent}
    </GradientBg>
  )
}

function AttendanceSection() {
  const attendanceSummary = useQuery(
    api.attendance.queries.getMyAttendanceSummary,
  )

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="size-5 text-coral-400" />
        <h2 className="text-lg font-display font-semibold text-foreground">
          Event Attendance
        </h2>
      </div>
      {attendanceSummary === undefined ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : !attendanceSummary || attendanceSummary.total === 0 ? (
        <div>
          <p className="text-slate-400 italic mb-4">No events attended yet</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/orgs">Browse Organizations</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-slate-600">
            {attendanceSummary.attended} event
            {attendanceSummary.attended !== 1 ? 's' : ''} attended
          </p>

          {attendanceSummary.recent.length > 0 && (
            <div className="space-y-2">
              {attendanceSummary.recent.map((record) => (
                <div
                  key={record._id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {record.event.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {record.org?.name} &middot;{' '}
                      {format(record.event.startAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <AttendanceStatusBadge status={record.status} />
                </div>
              ))}
            </div>
          )}

          <Link
            to="/profile/attendance"
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            View full history
            <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </Card>
  )
}

function AttendanceStatusBadge({
  status,
}: {
  status: 'attended' | 'partial' | 'not_attended' | 'unknown'
}) {
  switch (status) {
    case 'attended':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
          Attended
        </Badge>
      )
    case 'partial':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
          Partial
        </Badge>
      )
    case 'not_attended':
      return (
        <Badge variant="secondary" className="text-slate-500 text-xs">
          No
        </Badge>
      )
    case 'unknown':
      return (
        <Badge variant="outline" className="text-slate-400 text-xs">
          Unknown
        </Badge>
      )
  }
}
