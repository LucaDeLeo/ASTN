import { useState } from 'react'
import { useMutation } from 'convex/react'
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
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'

interface CreateProgramDialogProps {
  orgId: Id<'organizations'>
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function CreateProgramDialog({
  orgId,
  trigger,
  onSuccess,
}: CreateProgramDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<
    | 'reading_group'
    | 'fellowship'
    | 'mentorship'
    | 'cohort'
    | 'workshop_series'
    | 'custom'
  >('reading_group')
  const [enrollmentMethod, setEnrollmentMethod] = useState<
    'admin_only' | 'self_enroll' | 'approval_required'
  >('admin_only')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [completionType, setCompletionType] = useState<
    'none' | 'attendance_count' | 'attendance_percentage' | 'manual'
  >('none')
  const [requiredCount, setRequiredCount] = useState('')
  const [requiredPercentage, setRequiredPercentage] = useState('')

  const createProgram = useMutation(api.programs.createProgram)

  const resetForm = () => {
    setName('')
    setDescription('')
    setType('reading_group')
    setEnrollmentMethod('admin_only')
    setMaxParticipants('')
    setCompletionType('none')
    setRequiredCount('')
    setRequiredPercentage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Program name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const completionCriteria =
        completionType !== 'none'
          ? {
              type: completionType,
              requiredCount:
                completionType === 'attendance_count'
                  ? Number(requiredCount)
                  : undefined,
              requiredPercentage:
                completionType === 'attendance_percentage'
                  ? Number(requiredPercentage)
                  : undefined,
            }
          : undefined

      await createProgram({
        orgId,
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        enrollmentMethod,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        completionCriteria,
      })

      toast.success('Program created')
      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create program')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Program</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="name">Program Name *</FieldLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AGISF Reading Group - Spring 2026"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the program..."
              rows={2}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Program Type</FieldLabel>
              <Select
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading_group">Reading Group</SelectItem>
                  <SelectItem value="fellowship">Fellowship</SelectItem>
                  <SelectItem value="mentorship">Mentorship</SelectItem>
                  <SelectItem value="cohort">Cohort</SelectItem>
                  <SelectItem value="workshop_series">
                    Workshop Series
                  </SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Enrollment Method</FieldLabel>
              <Select
                value={enrollmentMethod}
                onValueChange={(v) =>
                  setEnrollmentMethod(v as typeof enrollmentMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_only">Admin Only</SelectItem>
                  <SelectItem value="self_enroll">Self Enroll</SelectItem>
                  <SelectItem value="approval_required">
                    Approval Required
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="maxParticipants">
              Max Participants (optional)
            </FieldLabel>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="Leave empty for unlimited"
            />
            <FieldDescription>
              Leave empty for unlimited participants
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Completion Criteria</FieldLabel>
            <Select
              value={completionType}
              onValueChange={(v) =>
                setCompletionType(v as typeof completionType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (no auto-completion)</SelectItem>
                <SelectItem value="attendance_count">
                  Attendance Count
                </SelectItem>
                <SelectItem value="attendance_percentage">
                  Attendance Percentage
                </SelectItem>
                <SelectItem value="manual">Manual Only</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {completionType === 'attendance_count' && (
            <Field>
              <FieldLabel htmlFor="requiredCount">Required Sessions</FieldLabel>
              <Input
                id="requiredCount"
                type="number"
                min="1"
                value={requiredCount}
                onChange={(e) => setRequiredCount(e.target.value)}
                placeholder="e.g., 5"
              />
            </Field>
          )}

          {completionType === 'attendance_percentage' && (
            <Field>
              <FieldLabel htmlFor="requiredPercentage">
                Required Percentage
              </FieldLabel>
              <Input
                id="requiredPercentage"
                type="number"
                min="1"
                max="100"
                value={requiredPercentage}
                onChange={(e) => setRequiredPercentage(e.target.value)}
                placeholder="e.g., 80"
              />
            </Field>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="size-4 mr-2" /> : null}
              Create Program
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
