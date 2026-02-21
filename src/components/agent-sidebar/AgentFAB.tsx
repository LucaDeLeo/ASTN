import { Sparkles } from 'lucide-react'
import { Authenticated } from 'convex/react'

import { useAgentSidebar } from './AgentSidebarProvider'
import { Button } from '~/components/ui/button'

export function AgentFAB() {
  return (
    <Authenticated>
      <AgentFABInner />
    </Authenticated>
  )
}

function AgentFABInner() {
  const { isOpen, open } = useAgentSidebar()

  // Hidden when sidebar/sheet is open
  if (isOpen) return null

  return (
    <Button
      onClick={open}
      size="icon"
      className="fixed bottom-20 left-4 z-30 size-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
    >
      <Sparkles className="size-5" />
    </Button>
  )
}
