import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { PromptFieldChoice } from './PromptFieldChoice'
import { PromptFieldMultiChoice } from './PromptFieldMultiChoice'
import { PromptFieldText } from './PromptFieldText'
import { PromptMarkdownBody } from './PromptMarkdownBody'
import { SpotlightBadge } from './SpotlightBadge'
import type { Id } from '../../../convex/_generated/dataModel'
import { Skeleton } from '~/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'

interface PromptRendererProps {
  promptId: Id<'coursePrompts'>
  mode: 'participate' | 'review'
}

type FieldValue = { textValue?: string; selectedOptionIds?: Array<string> }
type FieldValues = Partial<Record<string, FieldValue>>

export function PromptRenderer({ promptId, mode }: PromptRendererProps) {
  const prompt = useQuery(api.course.prompts.get, { promptId })
  const myResponse = useQuery(
    api.course.responses.getMyResponse,
    mode === 'participate' ? { promptId } : 'skip',
  )
  const allResponses = useQuery(api.course.responses.getPromptResponses, {
    promptId,
  })
  const saveResponse = useMutation(api.course.responses.saveResponse)

  const [fieldValues, setFieldValues] = useState<FieldValues>({})
  const [isSaving, setIsSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const isSubmitted = myResponse?.status === 'submitted'

  // Initialize field values from existing response
  useEffect(() => {
    if (myResponse && !initialized) {
      const values: FieldValues = {}
      for (const fr of myResponse.fieldResponses) {
        values[fr.fieldId] = {
          textValue: fr.textValue,
          selectedOptionIds: fr.selectedOptionIds,
        }
      }
      setFieldValues(values)
      setInitialized(true)
    }
  }, [myResponse, initialized])

  if (prompt === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (prompt === null) {
    return null
  }

  const buildFieldResponses = () =>
    prompt.fields.map((field) => ({
      fieldId: field.id,
      textValue: fieldValues[field.id]?.textValue,
      selectedOptionIds: fieldValues[field.id]?.selectedOptionIds,
    }))

  const handleSave = async (submit: boolean) => {
    setIsSaving(true)
    try {
      await saveResponse({
        promptId,
        fieldResponses: buildFieldResponses(),
        submit,
      })
      toast.success(submit ? 'Response submitted' : 'Draft saved')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save response')
    } finally {
      setIsSaving(false)
    }
  }

  const updateFieldValue = (
    fieldId: string,
    update: Partial<{ textValue: string; selectedOptionIds: Array<string> }>,
  ) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], ...update },
    }))
  }

  // Participate mode
  if (mode === 'participate') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{prompt.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {prompt.body && <PromptMarkdownBody content={prompt.body} />}

          {/* Visibility banners */}
          {prompt.revealMode === 'write_then_reveal' && !prompt.revealedAt && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Your response will be visible to others after the facilitator
              reveals all responses
            </div>
          )}
          {prompt.revealMode === 'facilitator_only' && (
            <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              Only the facilitator can see responses
            </div>
          )}

          {/* Fields */}
          {prompt.fields.map((field) => {
            const val = fieldValues[field.id]
            switch (field.type) {
              case 'text':
                return (
                  <PromptFieldText
                    key={field.id}
                    field={field}
                    value={val?.textValue ?? ''}
                    onChange={(v) =>
                      updateFieldValue(field.id, { textValue: v })
                    }
                    disabled={isSubmitted}
                  />
                )
              case 'choice':
                return (
                  <PromptFieldChoice
                    key={field.id}
                    field={field}
                    value={val?.selectedOptionIds?.[0]}
                    onChange={(optionId) =>
                      updateFieldValue(field.id, {
                        selectedOptionIds: [optionId],
                      })
                    }
                    disabled={isSubmitted}
                  />
                )
              case 'multiple_choice':
                return (
                  <PromptFieldMultiChoice
                    key={field.id}
                    field={field}
                    value={val?.selectedOptionIds ?? []}
                    onChange={(optionIds) =>
                      updateFieldValue(field.id, {
                        selectedOptionIds: optionIds,
                      })
                    }
                    disabled={isSubmitted}
                  />
                )
            }
          })}

          {/* Status + actions */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-muted-foreground text-sm">
              {isSubmitted && myResponse.submittedAt
                ? `Submitted ${new Date(myResponse.submittedAt).toLocaleString()}`
                : myResponse?.savedAt
                  ? `Draft saved ${new Date(myResponse.savedAt).toLocaleString()}`
                  : ''}
            </p>
            {!isSubmitted && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                >
                  {isSaving && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                >
                  {isSaving && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  Submit
                </Button>
              </div>
            )}
          </div>

          {/* After reveal: show other responses */}
          {prompt.revealMode === 'write_then_reveal' &&
            prompt.revealedAt &&
            allResponses && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <h4 className="text-sm font-medium">All Responses</h4>
                {allResponses
                  .filter((r) => r.userId !== myResponse?.userId)
                  .map((r) => (
                    <ResponseCard key={r._id} response={r} prompt={prompt} />
                  ))}
              </div>
            )}

          {/* Immediate mode: show other submitted responses */}
          {prompt.revealMode === 'immediate' && allResponses && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <h4 className="text-sm font-medium">
                Other Responses (
                {
                  allResponses.filter(
                    (r) =>
                      r.userId !== myResponse?.userId &&
                      r.status === 'submitted',
                  ).length
                }
                )
              </h4>
              {allResponses
                .filter(
                  (r) =>
                    r.userId !== myResponse?.userId && r.status === 'submitted',
                )
                .map((r) => (
                  <ResponseCard key={r._id} response={r} prompt={prompt} />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Review mode
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{prompt.title}</CardTitle>
          <span className="text-muted-foreground text-sm">
            {allResponses?.length ?? 0} responses
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {prompt.body && <PromptMarkdownBody content={prompt.body} />}
        {allResponses?.length === 0 && (
          <p className="text-muted-foreground text-sm">No responses yet</p>
        )}
        {allResponses?.map((r) => (
          <ResponseCard key={r._id} response={r} prompt={prompt} showStatus />
        ))}
      </CardContent>
    </Card>
  )
}

// Shared response card for displaying a single response
function ResponseCard({
  response,
  prompt,
  showStatus,
}: {
  response: {
    _id: string
    userId: string
    fieldResponses: Array<{
      fieldId: string
      textValue?: string
      selectedOptionIds?: Array<string>
    }>
    status: 'draft' | 'submitted'
    spotlighted?: boolean
    submittedAt?: number
  }
  prompt: {
    fields: Array<{
      id: string
      type: 'text' | 'choice' | 'multiple_choice'
      label: string
      options?: Array<{ id: string; label: string }>
    }>
  }
  showStatus?: boolean
}) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-mono">
          {response.userId.slice(0, 12)}...
        </span>
        <div className="flex items-center gap-2">
          {response.spotlighted && <SpotlightBadge />}
          {showStatus && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                response.status === 'submitted'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {response.status === 'submitted' ? 'Submitted' : 'Draft'}
            </span>
          )}
        </div>
      </div>
      {prompt.fields.map((field) => {
        const fr = response.fieldResponses.find((r) => r.fieldId === field.id)
        if (!fr) return null
        return (
          <div key={field.id} className="space-y-0.5">
            <p className="text-muted-foreground text-xs">{field.label}</p>
            {field.type === 'text' && (
              <p className="text-sm">{fr.textValue || '—'}</p>
            )}
            {field.type === 'choice' && (
              <p className="text-sm">
                {field.options?.find((o) => o.id === fr.selectedOptionIds?.[0])
                  ?.label || '—'}
              </p>
            )}
            {field.type === 'multiple_choice' && (
              <div className="flex flex-wrap gap-1">
                {fr.selectedOptionIds?.map((optId) => (
                  <span
                    key={optId}
                    className="bg-muted rounded px-1.5 py-0.5 text-xs"
                  >
                    {field.options?.find((o) => o.id === optId)?.label ?? optId}
                  </span>
                ))}
                {(!fr.selectedOptionIds ||
                  fr.selectedOptionIds.length === 0) && (
                  <span className="text-sm">—</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
