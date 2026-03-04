import { useAdminAgentSidebar } from './AdminAgentProvider'
import { useMediaQuery } from '~/hooks/use-media-query'
import { cn } from '~/lib/utils'

export function AdminSidebarAwareWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen, sidebarWidth, isResizing } = useAdminAgentSidebar()
  // Only push content when there's enough room
  // Below 900px, the sidebar overlays content instead
  const hasRoomForSidebar = useMediaQuery('(min-width: 900px)')
  const shouldPush = isOpen && hasRoomForSidebar

  return (
    <div
      className={cn(
        !isResizing && 'transition-[margin-right] duration-300 ease-in-out',
      )}
      style={{ marginRight: shouldPush ? sidebarWidth : 0 }}
    >
      {children}
    </div>
  )
}
