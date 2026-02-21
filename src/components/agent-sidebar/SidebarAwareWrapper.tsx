import { useAgentSidebar } from './AgentSidebarProvider'
import { useMediaQuery } from '~/hooks/use-media-query'
import { cn } from '~/lib/utils'

export function SidebarAwareWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen, sidebarWidth, isResizing } = useAgentSidebar()
  // Only push content when there's enough room
  // Below 900px, the sidebar overlays content instead
  const hasRoomForSidebar = useMediaQuery('(min-width: 900px)')
  const shouldPush = isOpen && hasRoomForSidebar

  return (
    <div
      className={cn(
        !isResizing && 'transition-[margin-left] duration-300 ease-in-out',
      )}
      style={{ marginLeft: shouldPush ? sidebarWidth : 0 }}
    >
      {children}
    </div>
  )
}
