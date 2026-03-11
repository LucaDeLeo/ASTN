import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { MessageSquare, Star } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { FacilitatorCommentDisplay } from './FacilitatorCommentDisplay'
import { ProposalCard } from './ProposalCard'
import { PromptRevealControl } from './PromptRevealControl'
import { SpotlightBadge } from './SpotlightBadge'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Textarea } from '~/components/ui/textarea'

interface PromptResponseViewerProps {
  promptId: Id<'coursePrompts'>
}

function ResponseProposals({ responseId }: { responseId: string }) {
  const proposals = useQuery(api.course.proposals.getProposalsByTarget, {
    targetId: responseId,
  })

  if (!proposals || proposals.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      {proposals.map(
        (proposal: {
          _id: Id<'agentProposals'>
          type: string
          content: string
          status: string
          editedContent?: string
          createdAt: number
        }) => (
          <ProposalCard key={proposal._id} proposal={proposal} />
        ),
      )}
    </div>
  )
}

function ManualCommentForm({
  responseId,
}: {
  responseId: Id<'coursePromptResponses'>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const addComment = useMutation(
    api.course.facilitatorComments.addManualComment,
  )

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 h-7 gap-1 text-xs text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="size-3" />
        Add Comment
      </Button>
    )
  }

  async function handleSubmit() {
    if (!content.trim()) return
    try {
      await addComment({
        promptResponseId: responseId,
        content: content.trim(),
      })
      setContent('')
      setIsOpen(false)
      toast.success('Comment added')
    } catch {
      toast.error('Failed to add comment')
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="min-h-16 text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
          Post
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsOpen(false)
            setContent('')
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function PromptResponseViewer({ promptId }: PromptResponseViewerProps) {
  const prompt = useQuery(api.course.prompts.get, { promptId })
  const responses = useQuery(api.course.responses.getPromptResponses, {
    promptId,
  })
  const toggleSpotlight = useMutation(api.course.responses.toggleSpotlight)

  if (!prompt || responses === undefined) {
    return <p className="text-muted-foreground text-sm">Loading...</p>
  }

  const handleToggleSpotlight = async (
    responseId: Id<'coursePromptResponses'>,
  ) => {
    try {
      await toggleSpotlight({ responseId })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to toggle spotlight')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{prompt.title}</h3>
        <span className="text-muted-foreground text-sm">
          {responses.length} responses
        </span>
      </div>

      <PromptRevealControl
        promptId={promptId}
        revealMode={prompt.revealMode}
        revealedAt={prompt.revealedAt}
      />

      {responses.length === 0 && (
        <p className="text-muted-foreground text-sm">No responses yet</p>
      )}

      {responses.map((response) => (
        <Card key={response._id}>
          <CardContent className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-mono">
                  {response.userId.slice(0, 12)}...
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    response.status === 'submitted'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {response.status === 'submitted' ? 'Submitted' : 'Draft'}
                </span>
                {response.spotlighted && <SpotlightBadge />}
              </div>
              <div className="flex items-center gap-2">
                {response.submittedAt && (
                  <span className="text-muted-foreground text-xs">
                    {new Date(response.submittedAt).toLocaleString()}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() =>
                    handleToggleSpotlight(
                      response._id as Id<'coursePromptResponses'>,
                    )
                  }
                >
                  <Star
                    className={`h-4 w-4 ${
                      response.spotlighted
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </Button>
              </div>
            </div>

            {prompt.fields.map((field) => {
              const fr = response.fieldResponses.find(
                (r) => r.fieldId === field.id,
              )
              if (!fr) return null
              return (
                <div key={field.id} className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">{field.label}</p>
                  {field.type === 'text' && (
                    <p className="text-sm">{fr.textValue || '—'}</p>
                  )}
                  {field.type === 'choice' && (
                    <p className="text-sm">
                      {field.options?.find(
                        (o) => o.id === fr.selectedOptionIds?.[0],
                      )?.label || '—'}
                    </p>
                  )}
                  {field.type === 'multiple_choice' && (
                    <div className="flex flex-wrap gap-1">
                      {fr.selectedOptionIds?.map((optId) => (
                        <span
                          key={optId}
                          className="bg-muted rounded px-1.5 py-0.5 text-xs"
                        >
                          {field.options?.find((o) => o.id === optId)?.label ??
                            optId}
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

            {/* Agent proposals targeting this response */}
            <ResponseProposals responseId={response._id} />

            {/* Facilitator comments (visible to all users) */}
            <FacilitatorCommentDisplay
              promptResponseId={response._id as Id<'coursePromptResponses'>}
            />

            {/* Manual comment form for admins */}
            <ManualCommentForm
              responseId={response._id as Id<'coursePromptResponses'>}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
