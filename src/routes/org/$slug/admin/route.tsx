import { Outlet, createFileRoute } from '@tanstack/react-router'

import { AdminAgentProvider } from '~/components/admin-agent/AdminAgentProvider'
import { AdminAgentSidebar } from '~/components/admin-agent/AdminAgentSidebar'
import { AdminSidebarAwareWrapper } from '~/components/admin-agent/AdminSidebarAwareWrapper'

export const Route = createFileRoute('/org/$slug/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const { slug } = Route.useParams()

  return (
    <AdminAgentProvider orgSlug={slug}>
      <AdminSidebarAwareWrapper>
        <Outlet />
      </AdminSidebarAwareWrapper>
      <AdminAgentSidebar />
    </AdminAgentProvider>
  )
}
