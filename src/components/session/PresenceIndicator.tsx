import { useQuery } from 'convex/react'
import { CheckCircle2, Circle, PencilLine } from 'lucide-react'
import { useMemo } from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'

interface PresenceIndicatorProps {
  sessionId: Id<'programSessions'>
}

export function PresenceIndicator({ sessionId }: PresenceIndicatorProps) {
  const presence = useQuery(api.course.sessionQueries.getPresence, {
    sessionId,
  })

  const groups = useMemo(() => {
    if (!presence) return { submitted: 0, typing: 0, idle: 0 }
    let submitted = 0
    let typing = 0
    let idle = 0
    for (const p of presence) {
      if (p.status === 'submitted') submitted++
      else if (p.status === 'typing') typing++
      else idle++
    }
    return { submitted, typing, idle }
  }, [presence])

  if (!presence) return null

  const total = presence.length

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">{total} online</span>
      {groups.submitted > 0 && (
        <Badge
          variant="outline"
          className="gap-1 text-green-600 border-green-200"
        >
          <CheckCircle2 className="size-3" />
          {groups.submitted} submitted
        </Badge>
      )}
      {groups.typing > 0 && (
        <Badge
          variant="outline"
          className="gap-1 text-amber-600 border-amber-200"
        >
          <PencilLine className="size-3" />
          {groups.typing} typing
        </Badge>
      )}
      {groups.idle > 0 && (
        <Badge variant="outline" className="gap-1 text-muted-foreground">
          <Circle className="size-3" />
          {groups.idle} idle
        </Badge>
      )}
    </div>
  )
}
