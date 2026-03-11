import { useUIMessages } from '@convex-dev/agent/react'
import { api } from '../../../convex/_generated/api'
import { renderMarkdown } from '~/lib/render-markdown'
import { cn } from '~/lib/utils'

interface ConversationViewerProps {
  threadId: string
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

export function ConversationViewer({ threadId }: ConversationViewerProps) {
  const { results: messages } = useUIMessages(
    api.course.sidebarQueries.listMessages,
    { threadId },
    { initialNumItems: 100, stream: false },
  )

  if (messages.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">
        No messages in this conversation.
      </p>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto space-y-3 p-3">
      {messages.map(
        (message: {
          key: string
          role: string
          text: unknown
          _creationTime: number
        }) => {
          const rawText = message.text
          const text =
            typeof rawText === 'string' ? rawText : String(rawText ?? '')
          const isUser = message.role === 'user'

          return (
            <div
              key={message.key}
              className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5',
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md',
                )}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {isUser ? text : renderMarkdown(text)}
                </p>
                <p
                  className={cn(
                    'text-[10px] mt-1',
                    isUser
                      ? 'text-primary-foreground/60'
                      : 'text-muted-foreground',
                  )}
                >
                  {formatRelativeTime(message._creationTime)}
                </p>
              </div>
            </div>
          )
        },
      )}
    </div>
  )
}
