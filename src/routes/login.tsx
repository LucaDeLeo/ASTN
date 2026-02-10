import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useQuery,
} from 'convex/react'
import { SignIn } from '@clerk/clerk-react'
import { useEffect } from 'react'
import { api } from '../../convex/_generated/api'
import { GradientBg } from '~/components/layout/GradientBg'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <GradientBg className="flex items-center justify-center p-4">
      <AuthLoading>
        <div className="flex items-center justify-center">
          <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <SignIn routing="hash" />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
    </GradientBg>
  )
}

function AuthenticatedRedirect() {
  const navigate = useNavigate()
  const profile = useQuery(api.profiles.getOrCreateProfile)

  useEffect(() => {
    if (profile === undefined) return // still loading
    if (profile === null || profile.hasEnrichmentConversation !== true) {
      navigate({ to: '/profile/edit' })
    } else {
      navigate({ to: '/' })
    }
  }, [profile, navigate])

  return (
    <div className="flex items-center justify-center">
      <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
