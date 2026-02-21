import { X } from 'lucide-react'
import { Authenticated } from 'convex/react'

import { useAgentSidebar } from './AgentSidebarProvider'
import { AgentChat } from '~/components/profile/agent/AgentChat'
import { useAgentPageContext } from '~/hooks/use-agent-page-context'
import { useIsMobile } from '~/hooks/use-media-query'
import { Spinner } from '~/components/ui/spinner'
import { Button } from '~/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '~/components/ui/sheet'
import { cn } from '~/lib/utils'

function AgentSidebarInner() {
  const { isOpen, close, profileId, threadId, isReady } = useAgentSidebar()
  const pageContext = useAgentPageContext()
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent
          side="bottom"
          className="h-[85vh] max-h-[85vh] rounded-t-xl p-0"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">AI Assistant</SheetTitle>
          {/* Drag handle */}
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {isReady ? (
            <div className="flex-1 min-h-0 h-[calc(85vh-24px)]">
              <AgentChat
                profileId={profileId!}
                threadId={threadId!}
                pageContext={pageContext}
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

  // Desktop: fixed right panel
  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-full w-[400px] z-40 bg-background border-l shadow-lg',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {/* Close button overlaid on top-right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={close}
        className="absolute top-1.5 right-2 z-10 size-7"
      >
        <X className="size-3.5" />
      </Button>
      {isReady ? (
        <div className="h-full">
          <AgentChat
            profileId={profileId!}
            threadId={threadId!}
            pageContext={pageContext}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <Spinner />
        </div>
      )}
    </div>
  )
}

export function AgentSidebar() {
  return (
    <Authenticated>
      <AgentSidebarInner />
    </Authenticated>
  )
}
