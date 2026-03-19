import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Authenticated, Unauthenticated } from 'convex/react'
import { useEffect } from 'react'
import { UnauthenticatedRedirect } from '~/components/auth/unauthenticated-redirect'
import { useAgentSidebar } from '~/components/agent-sidebar/AgentSidebarProvider'

export const Route = createFileRoute('/profile/agent')({
  component: AgentRedirectPage,
})

/**
 * Legacy route — the agent chat now lives in the persistent sidebar.
 * Redirect to /profile and open the sidebar.
 */
function AgentRedirectPage() {
  return (
    <>
      <Unauthenticated>
        <UnauthenticatedRedirect />
      </Unauthenticated>
      <Authenticated>
        <RedirectAndOpenSidebar />
      </Authenticated>
    </>
  )
}

function RedirectAndOpenSidebar() {
  const navigate = useNavigate()
  const { open } = useAgentSidebar()

  useEffect(() => {
    open()
    void navigate({ to: '/profile' })
  }, [open, navigate])

  return null
}
