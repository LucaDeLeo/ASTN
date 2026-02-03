import { Outlet, createFileRoute } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useQuery,
} from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { UnauthenticatedRedirect } from '~/components/auth/unauthenticated-redirect'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { MobileShell } from '~/components/layout/mobile-shell'
import { useIsMobile } from '~/hooks/use-media-query'
import { Spinner } from '~/components/ui/spinner'

export const Route = createFileRoute('/settings')({
  component: SettingsLayout,
})

function SettingsLayout() {
  const isMobile = useIsMobile()
  const currentUser = useQuery(api.profiles.getOrCreateProfile)
  const user = currentUser ? { name: currentUser.name || 'User' } : null

  const loadingContent = (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
      <Spinner />
    </div>
  )

  if (isMobile) {
    return (
      <GradientBg>
        <AuthLoading>
          <AuthHeader />
          {loadingContent}
        </AuthLoading>
        <Unauthenticated>
          <AuthHeader />
          <UnauthenticatedRedirect />
        </Unauthenticated>
        <Authenticated>
          <MobileShell user={user}>
            <Outlet />
          </MobileShell>
        </Authenticated>
      </GradientBg>
    )
  }

  return (
    <GradientBg>
      <AuthHeader />
      <AuthLoading>{loadingContent}</AuthLoading>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <Outlet />
      </Authenticated>
    </GradientBg>
  )
}
