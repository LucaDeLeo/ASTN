import { Bot } from 'lucide-react'
import { useCourseSidebar } from './AISidebarProvider'
import { Button } from '~/components/ui/button'

export function AISidebarToggle() {
  const { toggle, isOpen } = useCourseSidebar()

  if (isOpen) return null

  return (
    <Button
      onClick={toggle}
      size="icon"
      variant="outline"
      className="size-9"
      title="AI Learning Partner (Cmd+Shift+.)"
    >
      <Bot className="size-4" />
    </Button>
  )
}
