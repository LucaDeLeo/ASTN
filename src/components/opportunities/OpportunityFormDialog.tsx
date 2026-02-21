import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { FormFieldsEditor } from './FormFieldsEditor'
import type { Id } from '../../../convex/_generated/dataModel'
import type { FormField } from '../../../convex/lib/formFields'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

type OpportunityType = 'course' | 'fellowship' | 'job' | 'other'
type OpportunityStatus = 'active' | 'closed' | 'draft'

interface OpportunityData {
  _id?: Id<'orgOpportunities'>
  title: string
  description: string
  type: OpportunityType
  status: OpportunityStatus
  deadline?: number
  externalUrl?: string
  featured: boolean
  formFields?: Array<FormField>
}

interface OpportunityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: Id<'organizations'>
  opportunity?: OpportunityData | null
}

export function OpportunityFormDialog({
  open,
  onOpenChange,
  orgId,
  opportunity,
}: OpportunityFormDialogProps) {
  const isEditing = !!opportunity?._id
  const createOpp = useMutation(api.orgOpportunities.create)
  const updateOpp = useMutation(api.orgOpportunities.update)

  const [title, setTitle] = useState(opportunity?.title ?? '')
  const [description, setDescription] = useState(opportunity?.description ?? '')
  const [type, setType] = useState<OpportunityType>(
    opportunity?.type ?? 'course',
  )
  const [status, setStatus] = useState<OpportunityStatus>(
    opportunity?.status ?? 'draft',
  )
  const [deadlineStr, setDeadlineStr] = useState(
    opportunity?.deadline
      ? new Date(opportunity.deadline).toISOString().split('T')[0]
      : '',
  )
  const [externalUrl, setExternalUrl] = useState(opportunity?.externalUrl ?? '')
  const [featured, setFeatured] = useState(opportunity?.featured ?? false)
  const [formFields, setFormFields] = useState<Array<FormField>>(
    opportunity?.formFields ?? [],
  )
  const [isSaving, setIsSaving] = useState(false)

  const canSave = title.trim() && description.trim()

  const handleSave = async () => {
    if (!canSave || isSaving) return
    setIsSaving(true)
    try {
      const deadline = deadlineStr ? new Date(deadlineStr).getTime() : undefined

      if (isEditing && opportunity._id) {
        await updateOpp({
          id: opportunity._id,
          title: title.trim(),
          description: description.trim(),
          type,
          status,
          deadline,
          externalUrl: externalUrl.trim() || undefined,
          featured,
          formFields: formFields.length > 0 ? formFields : undefined,
        })
      } else {
        await createOpp({
          orgId,
          title: title.trim(),
          description: description.trim(),
          type,
          status,
          deadline,
          externalUrl: externalUrl.trim() || undefined,
          featured,
          formFields: formFields.length > 0 ? formFields : undefined,
        })
      }
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save opportunity:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Opportunity' : 'New Opportunity'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the opportunity details and application form.'
              : 'Create a new opportunity with a custom application form.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="opp-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="opp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Technical AI Safety Course"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="opp-desc">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="opp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description shown on the apply page"
            />
          </div>

          {/* Type + Status row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as OpportunityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="fellowship">Fellowship</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as OpportunityStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline + External URL */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="opp-deadline">Deadline (optional)</Label>
              <Input
                id="opp-deadline"
                type="date"
                value={deadlineStr}
                onChange={(e) => setDeadlineStr(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="opp-url">External URL (optional)</Label>
              <Input
                id="opp-url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={featured}
              onCheckedChange={(checked) => setFeatured(checked === true)}
            />
            <span className="text-sm">
              Featured opportunity (shown on org landing page)
            </span>
          </label>

          {/* Form Fields */}
          <div className="space-y-2 pt-2 border-t">
            <div>
              <Label className="text-base font-semibold">
                Application Form Fields
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Define the fields applicants will fill out. Leave empty for no
                in-app form.
              </p>
            </div>
            <FormFieldsEditor fields={formFields} onChange={setFormFields} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Create Opportunity'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
