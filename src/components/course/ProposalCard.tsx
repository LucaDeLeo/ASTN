import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Bot, Check, Copy, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'

interface ProposalCardProps {
  proposal: {
    _id: Id<'agentProposals'>
    type: string
    content: string
    status: string
    editedContent?: string
    createdAt: number
  }
}

const typeLabels: Record<string, string> = {
  comment: 'Comment',
  message: 'Message',
  pair_suggestion: 'Pair Suggestion',
  summary: 'Summary',
  pattern_flag: 'Pattern Flag',
  prompt: 'Prompt',
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(proposal.content)

  const approveProposal = useMutation(api.course.proposals.approveProposal)
  const dismissProposal = useMutation(api.course.proposals.dismissProposal)
  const editAndApproveProposal = useMutation(
    api.course.proposals.editAndApproveProposal,
  )

  const typeLabel = typeLabels[proposal.type] ?? proposal.type

  const borderClass = cn(
    proposal.status === 'proposed' && 'border-amber-300 dark:border-amber-700',
    proposal.status === 'approved' && 'border-green-300 dark:border-green-700',
    proposal.status === 'edited' && 'border-blue-300 dark:border-blue-700',
    proposal.status === 'dismissed' && 'border-muted',
  )

  async function handleApprove() {
    try {
      await approveProposal({ proposalId: proposal._id })
      toast.success('Proposal approved')
    } catch {
      toast.error('Failed to approve proposal')
    }
  }

  async function handleDismiss() {
    try {
      await dismissProposal({ proposalId: proposal._id })
      toast.success('Proposal dismissed')
    } catch {
      toast.error('Failed to dismiss proposal')
    }
  }

  async function handleEditAndApprove() {
    try {
      await editAndApproveProposal({
        proposalId: proposal._id,
        editedContent,
      })
      setIsEditing(false)
      toast.success('Proposal edited and approved')
    } catch {
      toast.error('Failed to save proposal')
    }
  }

  function handleCopyToClipboard() {
    const text = proposal.editedContent ?? proposal.content
    void navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const displayContent =
    proposal.status === 'edited' && proposal.editedContent
      ? proposal.editedContent
      : proposal.content

  return (
    <Card
      className={cn(
        borderClass,
        proposal.status === 'dismissed' && 'opacity-50',
      )}
    >
      <CardContent className="relative">
        {/* AI Draft badge */}
        <div className="absolute top-0 right-0">
          <Badge
            variant="secondary"
            className="gap-1 text-xs text-muted-foreground"
          >
            <Bot className="size-3" />
            AI Draft
          </Badge>
        </div>

        {/* Type label and timestamp */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {typeLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(proposal.createdAt)}
          </span>
        </div>

        {/* Status badges for non-proposed states */}
        {proposal.status === 'approved' && (
          <Badge className="mb-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Approved
          </Badge>
        )}
        {proposal.status === 'edited' && (
          <Badge className="mb-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            Edited & Approved
          </Badge>
        )}
        {proposal.status === 'dismissed' && (
          <Badge variant="secondary" className="mb-2">
            Dismissed
          </Badge>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-24"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEditAndApprove}>
                Save & Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false)
                  setEditedContent(proposal.content)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm">{displayContent}</p>
        )}

        {/* Action buttons for proposed status */}
        {proposal.status === 'proposed' && !isEditing && (
          <div className="mt-3 flex gap-2">
            <Button
              size="xs"
              variant="ghost"
              className="text-green-600 hover:text-green-700 dark:text-green-400"
              onClick={handleApprove}
            >
              <Check className="size-3" />
              Approve
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3" />
              Edit & Approve
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="text-destructive"
              onClick={handleDismiss}
            >
              <X className="size-3" />
              Dismiss
            </Button>
          </div>
        )}

        {/* Copy to clipboard for approved messages */}
        {proposal.type === 'message' &&
          (proposal.status === 'approved' || proposal.status === 'edited') && (
            <div className="mt-3">
              <Button
                size="xs"
                variant="outline"
                onClick={handleCopyToClipboard}
              >
                <Copy className="size-3" />
                Copy to Clipboard
              </Button>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
