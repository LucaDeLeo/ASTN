import { useMutation } from 'convex/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
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
import { Spinner } from '~/components/ui/spinner'

interface SessionFormDialogProps {
  programId: Id<'programs'>
  session?: {
    _id: Id<'programSessions'>
    dayNumber: number
    title: string
    date: number
    morningStartTime: string
    afternoonStartTime: string
    lumaUrl?: string
  }
  onSuccess?: () => void
  trigger?: React.ReactNode
}

function toDateInputValue(timestamp: number): string {
  const d = new Date(timestamp)
  // Use local date parts to avoid UTC offset shifting the day
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function SessionFormDialog({
  programId,
  session,
  onSuccess,
  trigger,
}: SessionFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dayNumber, setDayNumber] = useState(
    session?.dayNumber.toString() ?? '1',
  )
  const [title, setTitle] = useState(session?.title ?? '')
  const [dateStr, setDateStr] = useState(
    session ? toDateInputValue(session.date) : '',
  )
  const [morningStartTime, setMorningStartTime] = useState(
    session?.morningStartTime ?? '10:00',
  )
  const [afternoonStartTime, setAfternoonStartTime] = useState(
    session?.afternoonStartTime ?? '17:30',
  )
  const [lumaUrl, setLumaUrl] = useState(session?.lumaUrl ?? '')

  const createSession = useMutation(api.programs.createSession)
  const updateSession = useMutation(api.programs.updateSession)

  const isEditing = Boolean(session)

  const resetForm = () => {
    if (!isEditing) {
      setDayNumber('1')
      setTitle('')
      setDateStr('')
      setMorningStartTime('10:00')
      setAfternoonStartTime('17:30')
      setLumaUrl('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !dateStr) return

    setIsSubmitting(true)
    try {
      const dateTimestamp = new Date(dateStr + 'T00:00:00').getTime()

      if (session) {
        await updateSession({
          sessionId: session._id,
          dayNumber: parseInt(dayNumber),
          title: title.trim(),
          date: dateTimestamp,
          morningStartTime,
          afternoonStartTime,
          lumaUrl: lumaUrl.trim() || undefined,
        })
        toast.success('Session updated')
      } else {
        await createSession({
          programId,
          dayNumber: parseInt(dayNumber),
          title: title.trim(),
          date: dateTimestamp,
          morningStartTime,
          afternoonStartTime,
          lumaUrl: lumaUrl.trim() || undefined,
        })
        toast.success('Session created')
        resetForm()
      }
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        isEditing ? 'Failed to update session' : 'Failed to create session',
      )
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v && session) {
          setDayNumber(session.dayNumber.toString())
          setTitle(session.title)
          setDateStr(toDateInputValue(session.date))
          setMorningStartTime(session.morningStartTime)
          setAfternoonStartTime(session.afternoonStartTime)
          setLumaUrl(session.lumaUrl ?? '')
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4 mr-1" />
            Add Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Session' : 'Add Session'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Day Number
              </label>
              <Input
                type="number"
                min="1"
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Date
              </label>
              <Input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Session 1: Introduction"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Morning Slot
              </label>
              <Input
                type="time"
                value={morningStartTime}
                onChange={(e) => setMorningStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Afternoon Slot
              </label>
              <Input
                type="time"
                value={afternoonStartTime}
                onChange={(e) => setAfternoonStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">
              Luma URL (optional)
            </label>
            <Input
              value={lumaUrl}
              onChange={(e) => setLumaUrl(e.target.value)}
              placeholder="https://lu.ma/..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !dateStr}
            >
              {isSubmitting ? <Spinner className="size-4 mr-1" /> : null}
              {isEditing ? 'Save Changes' : 'Create Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
