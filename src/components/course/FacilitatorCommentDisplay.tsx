import { useQuery } from 'convex/react'
import { Bot } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { cn } from '~/lib/utils'

interface FacilitatorCommentDisplayProps {
  promptResponseId: Id<'coursePromptResponses'>
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

export function FacilitatorCommentDisplay({
  promptResponseId,
}: FacilitatorCommentDisplayProps) {
  const comments = useQuery(
    api.course.facilitatorComments.getCommentsForResponse,
    { promptResponseId },
  )

  if (!comments || comments.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      {comments.map(
        (comment: {
          _id: string
          authorName: string
          content: string
          fromAgent?: boolean
          createdAt: number
        }) => (
          <div
            key={comment._id}
            className={cn(
              'rounded-md border-l-2 border-teal-500 bg-muted/50 px-3 py-2',
            )}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-medium">{comment.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.createdAt)}
              </span>
              {comment.fromAgent && (
                <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                  <Bot className="size-3" />
                  AI-assisted
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
          </div>
        ),
      )}
    </div>
  )
}
