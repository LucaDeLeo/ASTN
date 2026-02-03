import { useId, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
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

const ROLE_TYPES = [
  { value: 'research', label: 'Research' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'operations', label: 'Operations' },
  { value: 'policy', label: 'Policy' },
  { value: 'other', label: 'Other' },
]

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Principal' },
]

type OpportunityData = {
  _id?: Id<'opportunities'>
  title: string
  organization: string
  organizationLogoUrl?: string
  location: string
  isRemote: boolean
  roleType: string
  experienceLevel?: string
  description: string
  requirements?: Array<string>
  salaryRange?: string
  deadline?: number
  sourceUrl: string
}

export function OpportunityForm({
  initialData,
  mode,
}: {
  initialData?: OpportunityData
  mode: 'create' | 'edit'
}) {
  const navigate = useNavigate()
  const id = useId()
  const requirementsHelpId = `${id}-requirements-help`

  const createMutationFn = useConvexMutation(api.admin.createOpportunity)
  const { mutateAsync: createOpportunity, isPending: isCreating } = useMutation(
    {
      mutationFn: createMutationFn,
    },
  )

  const updateMutationFn = useConvexMutation(api.admin.updateOpportunity)
  const { mutateAsync: updateOpportunity, isPending: isUpdating } = useMutation(
    {
      mutationFn: updateMutationFn,
    },
  )

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    organization: initialData?.organization || '',
    organizationLogoUrl: initialData?.organizationLogoUrl || '',
    location: initialData?.location || '',
    isRemote: initialData?.isRemote || false,
    roleType: initialData?.roleType || 'research',
    experienceLevel: initialData?.experienceLevel || '',
    description: initialData?.description || '',
    requirementsText: initialData?.requirements?.join('\n') || '',
    salaryRange: initialData?.salaryRange || '',
    deadlineStr: initialData?.deadline
      ? new Date(initialData.deadline).toISOString().split('T')[0]
      : '',
    sourceUrl: initialData?.sourceUrl || '',
  })

  const isSubmitting = isCreating || isUpdating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const requirements = formData.requirementsText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)

      const deadline = formData.deadlineStr
        ? new Date(formData.deadlineStr).getTime()
        : undefined

      const data = {
        title: formData.title,
        organization: formData.organization,
        organizationLogoUrl: formData.organizationLogoUrl || undefined,
        location: formData.location,
        isRemote: formData.isRemote,
        roleType: formData.roleType,
        experienceLevel: formData.experienceLevel || undefined,
        description: formData.description,
        requirements: requirements.length > 0 ? requirements : undefined,
        salaryRange: formData.salaryRange || undefined,
        deadline,
        sourceUrl: formData.sourceUrl,
      }

      if (mode === 'create') {
        await createOpportunity(data)
      } else if (initialData?._id) {
        await updateOpportunity({ id: initialData._id, ...data })
      }

      navigate({ to: '/admin/opportunities' })
    } catch (error) {
      console.error('Error saving opportunity:', error)
      toast.error('Failed to save opportunity', { duration: Infinity })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Research Engineer - AI Safety"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="organization">Organization *</Label>
          <Input
            id="organization"
            value={formData.organization}
            onChange={(e) =>
              setFormData({ ...formData, organization: e.target.value })
            }
            placeholder="Anthropic"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organizationLogoUrl">Logo URL</Label>
          <Input
            id="organizationLogoUrl"
            value={formData.organizationLogoUrl}
            onChange={(e) =>
              setFormData({ ...formData, organizationLogoUrl: e.target.value })
            }
            placeholder="https://cdn.brandfetch.io/..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="San Francisco, CA"
            required
          />
        </div>
        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="isRemote"
            checked={formData.isRemote}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isRemote: checked === true })
            }
          />
          <Label htmlFor="isRemote">Remote friendly</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roleType">Role Type *</Label>
          <Select
            value={formData.roleType}
            onValueChange={(value) =>
              setFormData({ ...formData, roleType: value })
            }
          >
            <SelectTrigger aria-label="Role Type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience Level</Label>
          <Select
            value={formData.experienceLevel}
            onValueChange={(value) =>
              setFormData({ ...formData, experienceLevel: value })
            }
          >
            <SelectTrigger aria-label="Experience Level">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Full job description..."
          rows={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="requirements">Requirements (one per line)</Label>
        <Textarea
          id="requirements"
          value={formData.requirementsText}
          onChange={(e) =>
            setFormData({ ...formData, requirementsText: e.target.value })
          }
          placeholder={
            'PhD in ML or equivalent\n3+ years experience\nStrong communication skills'
          }
          rows={4}
          aria-describedby={requirementsHelpId}
        />
        <p id={requirementsHelpId} className="text-xs text-muted-foreground">
          Enter each requirement on a separate line
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salaryRange">Salary Range</Label>
          <Input
            id="salaryRange"
            value={formData.salaryRange}
            onChange={(e) =>
              setFormData({ ...formData, salaryRange: e.target.value })
            }
            placeholder="$150,000 - $200,000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Application Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadlineStr}
            onChange={(e) =>
              setFormData({ ...formData, deadlineStr: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceUrl">Application URL *</Label>
        <Input
          id="sourceUrl"
          type="url"
          value={formData.sourceUrl}
          onChange={(e) =>
            setFormData({ ...formData, sourceUrl: e.target.value })
          }
          placeholder="https://company.com/careers/job-123"
          required
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Opportunity'
              : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/admin/opportunities' })}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
