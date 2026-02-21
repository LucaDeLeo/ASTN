import { useAgentSidebar } from './AgentSidebarProvider'
import { useIsDesktop } from '~/hooks/use-media-query'
import { cn } from '~/lib/utils'

export function SidebarAwareWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen } = useAgentSidebar()
  const isDesktop = useIsDesktop()

  return (
    <div
      className={cn(
        'transition-[margin-right] duration-300 ease-in-out',
        isOpen && isDesktop && 'mr-[400px]',
      )}
    >
      {children}
    </div>
  )
}
