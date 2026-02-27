import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { Building2, FileText, Loader2, Mail, Save, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../../convex/_generated/dataModel'
import type { FormField } from '../../../../../../../convex/lib/formFields'
import { FormFieldsEditor } from '~/components/opportunities/FormFieldsEditor'
import { AuthHeader } from '~/components/layout/auth-header'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'

export const Route = createFileRoute('/org/$slug/admin/opportunities/$oppId/')({
  component: OpportunityEditPage,
})

type OpportunityType = 'course' | 'fellowship' | 'job' | 'other'
type OpportunityStatus = 'active' | 'closed' | 'draft'

function OpportunityEditPage() {
  const { slug, oppId } = Route.useParams()

  const org = useQuery(api.orgs.directory.getOrgBySlug, { slug })
  const membership = useQuery(
    api.orgs.membership.getMembership,
    org ? { orgId: org._id } : 'skip',
  )
  const opportunity = useQuery(api.orgOpportunities.get, {
    id: oppId as Id<'orgOpportunities'>,
  })

  const updateOpp = useMutation(api.orgOpportunities.update)

  // Form state — details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<OpportunityType>('course')
  const [status, setStatus] = useState<OpportunityStatus>('draft')
  const [deadlineStr, setDeadlineStr] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [featured, setFeatured] = useState(false)

  // Form state — form fields
  const [formFields, setFormFields] = useState<Array<FormField>>([])

  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [isSavingFields, setIsSavingFields] = useState(false)

  // Populate form when opportunity loads
  useEffect(() => {
    if (opportunity) {
      setTitle(opportunity.title)
      setDescription(opportunity.description)
      setType(opportunity.type)
      setStatus(opportunity.status)
      setDeadlineStr(
        opportunity.deadline
          ? new Date(opportunity.deadline).toISOString().split('T')[0]
          : '',
      )
      setExternalUrl(opportunity.externalUrl ?? '')
      setFeatured(opportunity.featured)
      setFormFields(
        (opportunity.formFields as Array<FormField> | undefined) ?? [],
      )
    }
  }, [opportunity])

  // Loading
  if (
    org === undefined ||
    membership === undefined ||
    opportunity === undefined
  ) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Spinner className="size-8 mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Building2 className="size-8 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-display mb-4">
              Organization Not Found
            </h1>
          </div>
        </main>
      </div>
    )
  }

  if (!membership || membership.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <Shield className="size-8 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-display mb-4">
              Admin Access Required
            </h1>
            <Button asChild>
              <Link to="/org/$slug" params={{ slug }}>
                Back to Organization
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center py-12">
            <FileText className="size-8 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-display mb-4">
              Opportunity Not Found
            </h1>
            <Button asChild>
              <Link to="/org/$slug/admin/opportunities" params={{ slug }}>
                Back to Opportunities
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const canSaveDetails = title.trim() && description.trim()

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSaveDetails || isSavingDetails) return
    setIsSavingDetails(true)
    try {
      const deadline = deadlineStr ? new Date(deadlineStr).getTime() : undefined
      await updateOpp({
        id: opportunity._id,
        title: title.trim(),
        description: description.trim(),
        type,
        status,
        deadline,
        externalUrl: externalUrl.trim() || undefined,
        featured,
      })
      toast.success('Opportunity details saved')
    } catch (err) {
      console.error('Failed to save opportunity details:', err)
      toast.error('Failed to save details')
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleSaveFields = async () => {
    setIsSavingFields(true)
    try {
      const validFields = formFields.filter((f) => f.label.trim())
      await updateOpp({
        id: opportunity._id,
        formFields: validFields.length > 0 ? validFields : undefined,
      })
      toast.success('Form fields saved')
    } catch (err) {
      console.error('Failed to save form fields:', err)
      toast.error('Failed to save form fields')
    } finally {
      setIsSavingFields(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <Link
                to="/org/$slug/admin"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                Admin
              </Link>
              <span>/</span>
              <Link
                to="/org/$slug/admin/opportunities"
                params={{ slug }}
                className="hover:text-slate-700 transition-colors"
              >
                Opportunities
              </Link>
              <span>/</span>
              <span className="text-slate-700">{opportunity.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-display font-semibold text-foreground">
                Edit Opportunity
              </h1>
              <Button variant="outline" asChild>
                <Link
                  to="/org/$slug/admin/opportunities/$oppId/email"
                  params={{ slug, oppId }}
                >
                  <Mail className="size-4 mr-2" />
                  Email Applicants
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Card 1: Opportunity Details */}
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Details</CardTitle>
                <CardDescription>
                  Basic information about this opportunity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveDetails} className="space-y-4">
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

                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={featured}
                      onCheckedChange={(checked) =>
                        setFeatured(checked === true)
                      }
                    />
                    <span className="text-sm">
                      Featured opportunity (shown on org landing page)
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={!canSaveDetails || isSavingDetails}
                  >
                    {isSavingDetails ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 mr-2" />
                        Save Details
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Card 2: Application Form Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Application Form Fields</CardTitle>
                <CardDescription>
                  Define the fields applicants will fill out. Leave empty for no
                  in-app form.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormFieldsEditor
                  fields={formFields}
                  onChange={setFormFields}
                />

                <Button
                  type="button"
                  onClick={handleSaveFields}
                  disabled={isSavingFields}
                >
                  {isSavingFields ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4 mr-2" />
                      Save Form Fields
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
