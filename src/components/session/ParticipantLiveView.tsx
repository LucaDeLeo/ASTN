import { useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useMemo } from 'react'
import { api } from '../../../convex/_generated/api'
import { LiveTimer } from './LiveTimer'
import { ParticipantPairView } from './ParticipantPairView'
import type { Id } from '../../../convex/_generated/dataModel'
import { PromptRenderer } from '~/components/course/PromptRenderer'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader } from '~/components/ui/card'

interface ParticipantLiveViewProps {
  sessions: Array<{ _id: Id<'programSessions'> }>
}

export function ParticipantLiveView({ sessions }: ParticipantLiveViewProps) {
  // Find a running session by checking each session's live state
  // At BAISH scale (~6 sessions), this is acceptable
  const sessionIds = useMemo(() => sessions.map((s) => s._id), [sessions])

  // We'll query liveState for each session to find the running one
  // Use a single component per session to avoid conditional hooks
  return (
    <>
      {sessionIds.map((sid) => (
        <LiveSessionBanner key={sid} sessionId={sid} />
      ))}
    </>
  )
}

function LiveSessionBanner({
  sessionId,
}: {
  sessionId: Id<'programSessions'>
}) {
  const liveState = useQuery(api.course.sessionQueries.getLiveState, {
    sessionId,
  })
  const phases = useQuery(
    api.course.sessionQueries.getSessionPhases,
    liveState?.status === 'running' ? { sessionId } : 'skip',
  )

  const updatePresence = useMutation(api.course.sessionRunner.updatePresence)

  const currentPhase = useMemo(
    () => phases?.find((p) => p._id === liveState?.currentPhaseId),
    [phases, liveState?.currentPhaseId],
  )

  const currentIdx = useMemo(
    () => phases?.findIndex((p) => p._id === liveState?.currentPhaseId) ?? -1,
    [phases, liveState?.currentPhaseId],
  )

  // Presence heartbeat — send every 10s while live session is active
  const phaseId = liveState?.currentPhaseId
  const sendHeartbeat = useCallback(async () => {
    if (!phaseId) return
    try {
      await updatePresence({
        sessionId,
        phaseId,
        status: 'idle',
      })
    } catch {
      // Silent failure for heartbeats
    }
  }, [sessionId, phaseId, updatePresence])

  useEffect(() => {
    if (!phaseId) return
    void sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 10000)
    return () => clearInterval(interval)
  }, [phaseId, sendHeartbeat])

  // Only render for running sessions
  if (!liveState || liveState.status !== 'running') return null

  return (
    <Card className="mb-6 border-l-4 border-l-green-500 bg-green-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500 hover:bg-green-500 text-white gap-1">
              <span className="size-2 rounded-full bg-white animate-pulse" />
              LIVE
            </Badge>
            <div>
              <p className="font-semibold text-lg">
                {currentPhase?.title ?? 'Session in progress'}
              </p>
              {phases && (
                <p className="text-xs text-muted-foreground">
                  Phase {currentIdx + 1} of {phases.length}
                </p>
              )}
            </div>
          </div>
          <LiveTimer
            startedAt={liveState.phaseStartedAt}
            durationMs={liveState.phaseDurationMs}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active prompts */}
        {liveState.activePromptIds.length > 0 && (
          <div
            className="space-y-3"
            onFocus={() => {
              if (phaseId) {
                updatePresence({
                  sessionId,
                  phaseId,
                  status: 'typing',
                }).catch(() => {})
              }
            }}
            onBlur={() => {
              if (phaseId) {
                updatePresence({
                  sessionId,
                  phaseId,
                  status: 'idle',
                }).catch(() => {})
              }
            }}
          >
            {liveState.activePromptIds.map((promptId) => (
              <PromptRenderer
                key={promptId}
                promptId={promptId}
                mode="participate"
              />
            ))}
          </div>
        )}

        {/* Pair assignment */}
        {phaseId && (
          <ParticipantPairView sessionId={sessionId} phaseId={phaseId} />
        )}
      </CardContent>
    </Card>
  )
}
