import { useMutation, useQuery } from 'convex/react'
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Pause,
  SkipForward,
  Square,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { AdHocPromptDialog } from './AdHocPromptDialog'
import { LiveTimer } from './LiveTimer'
import { PairDisplay } from './PairDisplay'
import { PresenceIndicator } from './PresenceIndicator'
import type { Id } from '../../../convex/_generated/dataModel'
import { PromptResponseViewer } from '~/components/course/PromptResponseViewer'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

interface SessionRunnerProps {
  sessionId: Id<'programSessions'>
  programId: Id<'programs'>
}

export function SessionRunner({ sessionId }: SessionRunnerProps) {
  const liveState = useQuery(api.course.sessionQueries.getLiveState, {
    sessionId,
  })
  const phases = useQuery(api.course.sessionQueries.getSessionPhases, {
    sessionId,
  })
  const phaseResults = useQuery(api.course.sessionQueries.getPhaseResults, {
    sessionId,
  })

  const advancePhase = useMutation(api.course.sessionRunner.advancePhase)
  const extendPhase = useMutation(api.course.sessionRunner.extendPhase)
  const skipPhase = useMutation(api.course.sessionRunner.skipPhase)
  const endSession = useMutation(api.course.sessionRunner.endSession)

  const [mutating, setMutating] = useState(false)

  const currentPhase = useMemo(
    () => phases?.find((p) => p._id === liveState?.currentPhaseId),
    [phases, liveState?.currentPhaseId],
  )

  const currentIdx = useMemo(
    () => phases?.findIndex((p) => p._id === liveState?.currentPhaseId) ?? -1,
    [phases, liveState?.currentPhaseId],
  )

  const phaseResultMap = useMemo(() => {
    const map = new Map<string, number>()
    if (phaseResults) {
      for (const r of phaseResults) {
        map.set(r.phaseId, r.actualDurationMs)
      }
    }
    return map
  }, [phaseResults])

  const runMutation = async (fn: () => Promise<unknown>) => {
    setMutating(true)
    try {
      await fn()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setMutating(false)
    }
  }

  if (!liveState || !phases) return null

  const isCompleted = liveState.status === 'completed'
  const isRunning = liveState.status === 'running'

  if (isCompleted) {
    const totalDuration = liveState.completedAt
      ? liveState.completedAt - liveState.startedAt
      : 0
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="size-5" />
            Session Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-700">
          <p>Total duration: {Math.round(totalDuration / 60000)} minutes</p>
          <p>
            Phases completed: {phaseResults?.length ?? 0} / {phases.length}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Current phase header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-green-500 hover:bg-green-500 text-white gap-1">
                    <span className="size-2 rounded-full bg-white animate-pulse" />
                    Live
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Phase {currentIdx + 1} of {phases.length}
                  </span>
                </div>
                <CardTitle className="text-xl">
                  {currentPhase?.title ?? 'Unknown phase'}
                </CardTitle>
              </div>
              {isRunning && (
                <LiveTimer
                  startedAt={liveState.phaseStartedAt}
                  durationMs={liveState.phaseDurationMs}
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Facilitator notes */}
            {currentPhase?.notes && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Facilitator Notes
                </p>
                {currentPhase.notes}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => runMutation(() => advancePhase({ sessionId }))}
                disabled={mutating}
                className="gap-1"
              >
                <ChevronRight className="size-4" />
                Next Phase
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  runMutation(() =>
                    extendPhase({ sessionId, additionalMs: 60000 }),
                  )
                }
                disabled={mutating}
              >
                +1 min
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  runMutation(() =>
                    extendPhase({ sessionId, additionalMs: 300000 }),
                  )
                }
                disabled={mutating}
              >
                +5 min
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1"
                onClick={() => runMutation(() => skipPhase({ sessionId }))}
                disabled={mutating}
              >
                <SkipForward className="size-3.5" />
                Skip
              </Button>
              <AdHocPromptDialog sessionId={sessionId} />
              <Button
                variant="destructive"
                size="sm"
                className="gap-1 ml-auto"
                onClick={() => {
                  if (confirm('End this session?')) {
                    void runMutation(() => endSession({ sessionId }))
                  }
                }}
                disabled={mutating}
              >
                <Square className="size-3.5" />
                End Session
              </Button>
            </div>

            {/* Presence */}
            <PresenceIndicator sessionId={sessionId} />
          </CardContent>
        </Card>

        {/* Active prompts */}
        {liveState.activePromptIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {liveState.activePromptIds.map((promptId) => (
                <PromptResponseViewer key={promptId} promptId={promptId} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pair display */}
        {currentPhase?.pairConfig && liveState.currentPhaseId && (
          <Card>
            <CardContent className="pt-6">
              <PairDisplay
                sessionId={sessionId}
                phaseId={liveState.currentPhaseId}
                isRunning={isRunning}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Phase timeline sidebar */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Phase Timeline</h3>
        <div className="space-y-1">
          {phases.map((phase) => {
            const isCurrent = phase._id === liveState.currentPhaseId
            const phaseCompleted = phaseResultMap.has(phase._id)
            const actualMs = phaseResultMap.get(phase._id)

            return (
              <div
                key={phase._id}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  isCurrent && 'ring-2 ring-primary bg-primary/5',
                  phaseCompleted && !isCurrent && 'opacity-60',
                  !isCurrent && !phaseCompleted && 'text-muted-foreground',
                )}
              >
                <span className="w-5 text-center shrink-0">
                  {phaseCompleted ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : isCurrent ? (
                    <Pause className="size-4 text-primary" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                </span>
                <span className="flex-1 truncate">{phase.title}</span>
                <span className="text-xs shrink-0 tabular-nums">
                  {actualMs
                    ? `${Math.round(actualMs / 60000)}m`
                    : `${Math.round(phase.durationMs / 60000)}m`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
