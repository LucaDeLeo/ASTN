import { useLocation } from '@tanstack/react-router'
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
  const { pathname } = useLocation()

  // Hidden when sidebar/sheet is open
  if (isOpen) return null

  // Hidden on program pages (course sidebar replaces the profile FAB)
  if (/\/org\/[^/]+\/program\//.test(pathname)) return null

  return (
    <Button
      onClick={open}
      size="icon"
      className="fixed z-30 size-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 left-4"
      style={{
        bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <Sparkles className="size-5" />
    </Button>
  )
}
