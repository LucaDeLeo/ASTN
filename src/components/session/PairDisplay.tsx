import { useMutation, useQuery } from 'convex/react'
import { Shuffle, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'

interface PairDisplayProps {
  sessionId: Id<'programSessions'>
  phaseId: Id<'sessionPhases'>
  isRunning: boolean
}

export function PairDisplay({
  sessionId,
  phaseId,
  isRunning,
}: PairDisplayProps) {
  const pairs = useQuery(api.course.sessionQueries.getPairAssignments, {
    sessionId,
    phaseId,
  })
  const generatePairs = useMutation(api.course.sessionPairing.generatePairs)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async (strategy: 'random' | 'complementary') => {
    setGenerating(true)
    try {
      await generatePairs({ sessionId, phaseId, strategy })
      toast.success('Pairs generated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate pairs')
    } finally {
      setGenerating(false)
    }
  }

  const latestAssignment =
    pairs && pairs.length > 0
      ? pairs.sort((a, b) => b.createdAt - a.createdAt)[0]
      : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Users className="size-4" />
          Pair Assignments
        </h4>
        {isRunning && (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleGenerate('random')}
              disabled={generating}
            >
              <Shuffle className="size-3" />
              Random
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleGenerate('complementary')}
              disabled={generating}
            >
              <Shuffle className="size-3" />
              Complementary
            </Button>
          </div>
        )}
      </div>

      {latestAssignment ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {latestAssignment.pairs.map((pair, i) => (
            <Card key={i} className="border-dashed">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Pair {i + 1}
                  </span>
                  {pair.members.length > 2 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0"
                    >
                      Trio
                    </Badge>
                  )}
                </div>
                {pair.members.map((userId) => (
                  <p key={userId} className="text-xs text-foreground truncate">
                    {userId.slice(0, 12)}...
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No pairs generated yet. Use the buttons above to create pairs.
        </p>
      )}
    </div>
  )
}
