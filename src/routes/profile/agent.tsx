import { createFileRoute } from '@tanstack/react-router'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react'
import { useEffect, useRef } from 'react'
import { api } from '../../../convex/_generated/api'
import { UnauthenticatedRedirect } from '~/components/auth/unauthenticated-redirect'
import { AuthHeader } from '~/components/layout/auth-header'
import { GradientBg } from '~/components/layout/GradientBg'
import { MobileShell } from '~/components/layout/mobile-shell'
import { AgentProfileBuilder } from '~/components/profile/agent/AgentProfileBuilder'
import { useIsMobile } from '~/hooks/use-media-query'
import { Spinner } from '~/components/ui/spinner'

export const Route = createFileRoute('/profile/agent')({
  component: AgentProfilePage,
})

function AgentProfilePage() {
  const isMobile = useIsMobile()
  const currentUser = useQuery(api.profiles.getOrCreateProfile)
  const user = currentUser ? { name: currentUser.name || 'User' } : null

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
        <AgentProfileContent />
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
    <GradientBg variant="subtle" className="h-screen !min-h-0 overflow-hidden">
      <AuthHeader />
      {pageContent}
    </GradientBg>
  )
}

function AgentProfileContent() {
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const createProfile = useMutation(api.profiles.create)
  const createThread = useMutation(api.agent.threadOps.createAgentThread)
  const threadCreating = useRef(false)

  // Create profile if needed, then create thread if needed
  useEffect(() => {
    if (profile === undefined) return // Loading
    if (threadCreating.current) return // Already creating

    const setup = async () => {
      threadCreating.current = true
      try {
        let profileId = profile?._id
        if (!profileId) {
          profileId = await createProfile()
        }
        if (profileId && !profile?.agentThreadId) {
          await createThread({ profileId })
        }
      } finally {
        threadCreating.current = false
      }
    }

    if (!profile || !profile.agentThreadId) {
      setup()
    }
  }, [profile, createProfile, createThread])

  if (profile === undefined || !profile?.agentThreadId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <Spinner />
      </div>
    )
  }

  return (
    <AgentProfileBuilder
      profileId={profile._id}
      threadId={profile.agentThreadId}
    />
  )
}
