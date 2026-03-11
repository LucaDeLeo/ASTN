import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface AdHocPromptDialogProps {
  sessionId: Id<'programSessions'>
  onCreated?: () => void
}

export function AdHocPromptDialog({
  sessionId,
  onCreated,
}: AdHocPromptDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [fieldLabel, setFieldLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const createAdHoc = useMutation(api.course.sessionRunner.createAdHocPrompt)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!fieldLabel.trim()) {
      toast.error('Field label is required')
      return
    }

    setSaving(true)
    try {
      await createAdHoc({
        sessionId,
        title,
        body: body || undefined,
        fields: [
          {
            id: `adhoc_${Date.now()}`,
            type: 'text',
            label: fieldLabel,
            required: false,
            placeholder: 'Type your response...',
          },
        ],
      })
      toast.success('Ad-hoc prompt created')
      setTitle('')
      setBody('')
      setFieldLabel('')
      setOpen(false)
      onCreated?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create prompt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="size-3.5" />
          Ad-Hoc Prompt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Ad-Hoc Prompt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adhoc-title">Title</Label>
            <Input
              id="adhoc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quick poll, discussion question..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adhoc-body">Instructions (optional)</Label>
            <Textarea
              id="adhoc-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Markdown instructions for participants..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adhoc-field">Question</Label>
            <Input
              id="adhoc-field"
              value={fieldLabel}
              onChange={(e) => setFieldLabel(e.target.value)}
              placeholder="What is your response?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create & Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
