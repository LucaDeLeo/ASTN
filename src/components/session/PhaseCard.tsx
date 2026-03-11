import { useMutation } from 'convex/react'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  Pencil,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface PhaseData {
  _id: Id<'sessionPhases'>
  title: string
  durationMs: number
  notes?: string
  promptIds?: Array<Id<'coursePrompts'>>
  pairConfig?: {
    strategy: 'random' | 'complementary' | 'manual'
  }
  orderIndex: number
}

interface PhaseCardProps {
  phase: PhaseData
  index: number
  total: number
  isLive: boolean
  onReorder: (
    phaseIds: Array<Id<'sessionPhases'>>,
    direction: -1 | 1,
    index: number,
  ) => void
  allPhaseIds: Array<Id<'sessionPhases'>>
}

export function PhaseCard({
  phase,
  index,
  total,
  isLive,
  onReorder,
  allPhaseIds,
}: PhaseCardProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(phase.title)
  const [durationMin, setDurationMin] = useState(
    Math.round(phase.durationMs / 60000),
  )
  const [notes, setNotes] = useState(phase.notes ?? '')
  const [saving, setSaving] = useState(false)

  const updatePhase = useMutation(api.course.sessionSetup.updatePhase)
  const deletePhase = useMutation(api.course.sessionSetup.deletePhase)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePhase({
        phaseId: phase._id,
        title,
        durationMs: durationMin * 60000,
        notes: notes || undefined,
      })
      toast.success('Phase updated')
      setEditing(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update phase')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete phase "${phase.title}"?`)) return
    try {
      await deletePhase({ phaseId: phase._id })
      toast.success('Phase deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete phase')
    }
  }

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min={1}
              value={durationMin}
              onChange={(e) => setDurationMin(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes (facilitator only)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{phase.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Clock className="size-3" />
                {Math.round(phase.durationMs / 60000)} min
              </span>
              {(phase.promptIds?.length ?? 0) > 0 && (
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="size-3" />
                  {phase.promptIds!.length}
                </span>
              )}
              {phase.pairConfig && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  <Users className="size-2.5 mr-0.5" />
                  {phase.pairConfig.strategy}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {!isLive && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              onClick={() => onReorder(allPhaseIds, -1, index)}
              disabled={index === 0}
            >
              <ChevronUp className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              onClick={() => onReorder(allPhaseIds, 1, index)}
              disabled={index === total - 1}
            >
              <ChevronDown className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0 text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
