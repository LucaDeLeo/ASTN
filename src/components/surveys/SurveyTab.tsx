import { useMutation, useQuery } from 'convex/react'
import {
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { FormField } from '../../../convex/lib/formFields'
import { FormFieldsEditor } from '~/components/opportunities/FormFieldsEditor'
import { SurveyResultsTable } from '~/components/surveys/SurveyResultsTable'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface SurveyTabProps {
  opportunityId: Id<'orgOpportunities'>
  slug: string
}

export function SurveyTab({ opportunityId, slug }: SurveyTabProps) {
  const survey = useQuery(api.feedbackSurveys.getSurveyByOpportunity, {
    opportunityId,
  })

  if (survey === undefined) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading survey...
      </div>
    )
  }

  if (!survey) {
    return <CreateSurveyForm opportunityId={opportunityId} />
  }

  return (
    <SurveyManagement
      surveyId={survey._id}
      slug={slug}
      accessToken={survey.accessToken}
    />
  )
}

function CreateSurveyForm({
  opportunityId,
}: {
  opportunityId: Id<'orgOpportunities'>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formFields, setFormFields] = useState<Array<FormField>>([])
  const [isCreating, setIsCreating] = useState(false)

  const createSurvey = useMutation(api.feedbackSurveys.createSurvey)

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    const validFields = formFields.filter((f) => f.label.trim())
    if (validFields.length === 0) {
      toast.error('Add at least one form field')
      return
    }
    setIsCreating(true)
    try {
      await createSurvey({
        opportunityId,
        title: title.trim(),
        description: description.trim() || undefined,
        formFields: validFields,
      })
      toast.success('Feedback survey created')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create survey'
      toast.error(msg)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Feedback Survey</CardTitle>
          <CardDescription>
            Set up a survey that participants can fill in via a unique link (no
            login required).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="survey-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="survey-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Course Feedback Survey"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="survey-desc">Description (optional)</Label>
            <Textarea
              id="survey-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Intro text shown to respondents before the form"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Survey Questions</CardTitle>
          <CardDescription>
            Build the form fields for your survey. Supports text, ratings, NPS,
            and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormFieldsEditor fields={formFields} onChange={setFormFields} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={isCreating} size="lg">
          {isCreating ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="size-4 mr-2" />
              Create Survey
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function SurveyManagement({
  surveyId,
  slug,
  accessToken,
}: {
  surveyId: Id<'feedbackSurveys'>
  slug: string
  accessToken: string
}) {
  const results = useQuery(api.feedbackSurveys.getSurveyResults, { surveyId })
  const updateSurvey = useMutation(api.feedbackSurveys.updateSurvey)
  const deleteSurvey = useMutation(api.feedbackSurveys.deleteSurvey)
  const backfill = useMutation(api.feedbackSurveys.backfillRespondents)

  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBackfilling, setIsBackfilling] = useState(false)

  if (!results) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading results...
      </div>
    )
  }

  const { survey, respondents, responseCount, totalRespondents } = results
  const isOpen = survey.status === 'open'
  const genericLink = `${window.location.origin}/org/${slug}/survey/${accessToken}`

  const handleToggleStatus = async () => {
    setIsToggling(true)
    try {
      await updateSurvey({
        surveyId,
        status: isOpen ? 'closed' : 'open',
      })
      toast.success(isOpen ? 'Survey closed' : 'Survey reopened')
    } catch (err) {
      toast.error('Failed to update survey status')
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSurvey({ surveyId })
      toast.success('Survey deleted')
    } catch (err) {
      toast.error('Failed to delete survey')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBackfill = async () => {
    setIsBackfilling(true)
    try {
      const added = await backfill({ surveyId })
      if (added > 0) {
        toast.success(`Added ${added} new respondent${added !== 1 ? 's' : ''}`)
      } else {
        toast.info('No new applicants to add')
      }
    } catch (err) {
      toast.error('Failed to backfill respondents')
    } finally {
      setIsBackfilling(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(genericLink)
    toast.success('Link copied')
  }

  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{survey.title}</CardTitle>
              {survey.description && (
                <CardDescription className="mt-1">
                  {survey.description}
                </CardDescription>
              )}
            </div>
            <Badge variant={isOpen ? 'default' : 'secondary'}>
              {isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
            <span>
              <strong className="text-foreground">{responseCount}</strong> of{' '}
              {totalRespondents} responded
            </span>
            <span>
              Created {new Date(survey.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}>
              <ClipboardCopy className="size-4 mr-1" />
              Copy Link
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={isToggling}
            >
              {isToggling ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : isOpen ? (
                <Lock className="size-4 mr-1" />
              ) : (
                <LockOpen className="size-4 mr-1" />
              )}
              {isOpen ? 'Close Survey' : 'Reopen Survey'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleBackfill}
              disabled={isBackfilling}
            >
              {isBackfilling ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4 mr-1" />
              )}
              Add New Applicants
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600">
                  <Trash2 className="size-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete survey?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the survey and all{' '}
                    {responseCount} response{responseCount !== 1 ? 's' : ''}.
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <SurveyResultsTable
        formFields={survey.formFields}
        respondents={respondents}
        surveyTitle={survey.title}
      />
    </div>
  )
}
