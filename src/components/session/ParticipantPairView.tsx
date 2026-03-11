import { useQuery } from 'convex/react'
import { Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '~/components/ui/card'

interface ParticipantPairViewProps {
  sessionId: Id<'programSessions'>
  phaseId: Id<'sessionPhases'>
}

export function ParticipantPairView({
  sessionId,
  phaseId,
}: ParticipantPairViewProps) {
  const partners = useQuery(api.course.sessionQueries.getMyPairs, {
    sessionId,
    phaseId,
  })

  if (!partners || partners.length === 0) return null

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 flex items-center gap-3">
        <Users className="size-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium">
            {partners.length > 1 ? 'Your group' : 'Your pair'}
          </p>
          <p className="text-xs text-muted-foreground">
            {partners.map((id) => id.slice(0, 12) + '...').join(', ')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
