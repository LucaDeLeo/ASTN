import { useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Authenticated } from 'convex/react'

import { useAgentSidebar } from './AgentSidebarProvider'
import { AgentChat } from '~/components/profile/agent/AgentChat'
import { useAgentPageContext } from '~/hooks/use-agent-page-context'
import { useIsMobile, useMediaQuery } from '~/hooks/use-media-query'
import { Spinner } from '~/components/ui/spinner'
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet'
import { cn } from '~/lib/utils'

function AgentSidebarInner() {
  const {
    isOpen,
    open,
    close,
    profileId,
    threadId,
    isReady,
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    setIsResizing,
  } = useAgentSidebar()
  const pageContext = useAgentPageContext()
  const isMobile = useIsMobile()
  const hasRoomForSidebar = useMediaQuery('(min-width: 900px)')
  const resizeRef = useRef(false)

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      resizeRef.current = true
      setIsResizing(true)

      const handleMouseMove = (e: MouseEvent) => {
        if (!resizeRef.current) return
        setSidebarWidth(e.clientX)
      }

      const handleMouseUp = () => {
        resizeRef.current = false
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [setSidebarWidth, setIsResizing],
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent
          side="bottom"
          className="h-[85dvh] max-h-[85dvh] rounded-t-xl p-0"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">AI Assistant</SheetTitle>
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {isReady ? (
            <div className="flex-1 min-h-0 h-[calc(85dvh-24px)]">
              <AgentChat
                profileId={profileId!}
                threadId={threadId!}
                pageContext={pageContext}
                isOpen={isOpen}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: fixed left panel
  return (
    <>
      {/* Backdrop overlay for narrow desktop */}
      {isOpen && !hasRoomForSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/20 transition-opacity"
          onClick={close}
        />
      )}

      {/* Edge chevron tab — slides with the sidebar */}
      <button
        onClick={isOpen ? close : open}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-50 flex items-center justify-center',
          'h-12 w-6 rounded-r-lg bg-background border border-l-0 shadow-md',
          'hover:bg-accent',
          !isResizing && 'transition-[left] duration-300 ease-in-out',
        )}
        style={{ left: isOpen ? sidebarWidth : 0 }}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? (
          <ChevronLeft className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </button>

      <div
        className={cn(
          'fixed top-0 left-0 h-full z-40 bg-background shadow-lg',
          !isResizing && 'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ width: sidebarWidth }}
      >
        {isReady ? (
          <div className="h-full">
            <AgentChat
              profileId={profileId!}
              threadId={threadId!}
              pageContext={pageContext}
              isOpen={isOpen}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        )}

        {/* Resize handle on right edge */}
        {isOpen && (
          <div
            onMouseDown={handleResizeStart}
            className={cn(
              'absolute top-0 -right-px w-1 h-full cursor-col-resize group z-50',
              'hover:bg-primary/30 active:bg-primary/50',
              isResizing && 'bg-primary/50',
            )}
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
          </div>
        )}
      </div>
    </>
  )
}

export function AgentSidebar() {
  return (
    <Authenticated>
      <AgentSidebarInner />
    </Authenticated>
  )
}
