import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { useFacilitatorAgentSidebar } from './FacilitatorAgentProvider'
import { FacilitatorAgentChat } from './FacilitatorAgentChat'
import { useIsMobile, useMediaQuery } from '~/hooks/use-media-query'
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet'
import { cn } from '~/lib/utils'

export function FacilitatorAgentSidebar() {
  const {
    isOpen,
    open,
    close,
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    setIsResizing,
    agent,
    orgSlug,
    programId,
  } = useFacilitatorAgentSidebar()
  const isMobile = useIsMobile()
  const hasRoomForSidebar = useMediaQuery('(min-width: 900px)')
  const resizeRef = useRef(false)

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    resizeRef.current = true
    setIsResizing(true)

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      // Right-side sidebar: width = viewport width - mouse X
      setSidebarWidth(window.innerWidth - ev.clientX)
    }

    const handleMouseUp = () => {
      resizeRef.current = false
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(v) => !v && close()}>
        <SheetContent
          side="bottom"
          className="h-[85dvh] max-h-[85dvh] rounded-t-xl p-0 pb-[env(safe-area-inset-bottom,0px)]"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Facilitator Agent</SheetTitle>
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <div className="flex-1 min-h-0 h-[calc(85dvh-24px)]">
            <FacilitatorAgentChat
              agent={agent}
              orgSlug={orgSlug}
              programId={programId}
            />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop: fixed right panel
  return (
    <>
      {/* Backdrop overlay for narrow desktop */}
      {isOpen && !hasRoomForSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black/20 transition-opacity"
          onClick={close}
        />
      )}

      {/* Edge chevron tab -- slides with the sidebar */}
      <button
        onClick={isOpen ? close : open}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-50 flex items-center justify-center',
          'h-12 w-6 rounded-l-lg bg-background border border-r-0 shadow-md',
          'hover:bg-accent',
          !isResizing && 'transition-[right] duration-300 ease-in-out',
        )}
        style={{ right: isOpen ? sidebarWidth : 0 }}
        aria-label={
          isOpen ? 'Close facilitator agent' : 'Open facilitator agent'
        }
      >
        {isOpen ? (
          <ChevronRight className="size-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="size-4 text-muted-foreground" />
        )}
      </button>

      <div
        className={cn(
          'fixed top-0 right-0 h-full z-40 bg-background shadow-lg',
          !isResizing && 'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        style={{ width: sidebarWidth }}
      >
        <div className="h-full">
          <FacilitatorAgentChat
            agent={agent}
            orgSlug={orgSlug}
            programId={programId}
          />
        </div>

        {/* Resize handle on left edge */}
        {isOpen && (
          <div
            onMouseDown={handleResizeStart}
            className={cn(
              'absolute top-0 -left-px w-1 h-full cursor-col-resize group z-50',
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
