import { useMutation, useQuery } from 'convex/react'
import { AlertTriangle, Clock, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { PhaseCard } from './PhaseCard'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface SessionSetupProps {
  sessionId: Id<'programSessions'>
  programId: Id<'programs'>
  onStartSession: () => void
}

export function SessionSetup({ sessionId, onStartSession }: SessionSetupProps) {
  const phases = useQuery(api.course.sessionQueries.getSessionPhases, {
    sessionId,
  })
  const liveState = useQuery(api.course.sessionQueries.getLiveState, {
    sessionId,
  })

  const createPhase = useMutation(api.course.sessionSetup.createPhase)
  const reorderPhases = useMutation(api.course.sessionSetup.reorderPhases)
  const startSession = useMutation(api.course.sessionRunner.startSession)

  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [durationMin, setDurationMin] = useState(10)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)

  const isLive = liveState?.status === 'running'

  const handleAdd = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      await createPhase({
        sessionId,
        title,
        durationMs: durationMin * 60000,
        notes: notes || undefined,
      })
      toast.success('Phase added')
      setTitle('')
      setDurationMin(10)
      setNotes('')
      setShowAddForm(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add phase')
    } finally {
      setSaving(false)
    }
  }

  const handleReorder = async (
    phaseIds: Array<Id<'sessionPhases'>>,
    direction: -1 | 1,
    index: number,
  ) => {
    const swapIndex = index + direction
    if (swapIndex < 0 || swapIndex >= phaseIds.length) return
    const newIds = [...phaseIds]
    ;[newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]]
    try {
      await reorderPhases({ sessionId, phaseIds: newIds })
    } catch (e) {
      toast.error('Failed to reorder')
    }
  }

  const handleStart = async () => {
    setStarting(true)
    try {
      await startSession({ sessionId })
      toast.success('Session started!')
      onStartSession()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to start session')
    } finally {
      setStarting(false)
    }
  }

  const allPhaseIds = (phases ?? []).map((p) => p._id)
  const totalDurationMin = (phases ?? []).reduce(
    (sum, p) => sum + Math.round(p.durationMs / 60000),
    0,
  )

  return (
    <div className="space-y-6">
      {isLive && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="text-sm">
            Session is live — phases cannot be edited
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Session Phases</h3>
          {phases && phases.length > 0 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="size-3.5" />
              {totalDurationMin} min total
            </span>
          )}
        </div>
        {!isLive && phases && phases.length > 0 && (
          <Button onClick={handleStart} disabled={starting}>
            {starting ? 'Starting...' : 'Start Session'}
          </Button>
        )}
      </div>

      {/* Phase list */}
      <div className="space-y-2">
        {phases?.map((phase, i) => (
          <PhaseCard
            key={phase._id}
            phase={phase}
            index={i}
            total={phases.length}
            isLive={isLive}
            onReorder={handleReorder}
            allPhaseIds={allPhaseIds}
          />
        ))}
      </div>

      {/* Add phase */}
      {!isLive &&
        (showAddForm ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add Phase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Welcome & Check-in"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={durationMin}
                  onChange={(e) =>
                    setDurationMin(parseInt(e.target.value) || 1)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (facilitator only, optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Talking points, reminders..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAdd} disabled={saving}>
                  {saving ? 'Adding...' : 'Add Phase'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-1"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="size-4" />
            Add Phase
          </Button>
        ))}

      {/* Empty state */}
      {phases && phases.length === 0 && !showAddForm && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No phases yet. Add phases to define the session agenda.
        </p>
      )}
    </div>
  )
}
