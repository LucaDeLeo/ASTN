import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MessageSquare, Send } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import { renderMarkdown } from '~/lib/render-markdown'

interface Message {
  _id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

interface EnrichmentChatProps {
  messages: Array<Message>
  input: string
  onInputChange: (value: string) => void
  onSendMessage: (message: string) => void
  isLoading: boolean
  disabled?: boolean
  streamingText?: string
  isStreaming?: boolean
}

export function EnrichmentChat({
  messages,
  input,
  onInputChange,
  onSendMessage,
  isLoading,
  disabled = false,
  streamingText = '',
  isStreaming = false,
}: EnrichmentChatProps) {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

  // Focus input on mount
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  // Intercept clicks on internal links for SPA navigation
  const handleMessagesClick = useCallback(
    (e: React.MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href]')
      if (!target) return
      const href = target.getAttribute('href')
      if (href && href.startsWith('/')) {
        e.preventDefault()
        void navigate({ to: href })
      }
    },
    [navigate],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim())
      onInputChange('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Filter out empty messages
  const visibleMessages = messages.filter((m) => m.content.trim())

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onClick={handleMessagesClick}
      >
        {visibleMessages.length === 0 && !streamingText ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <MessageSquare className="size-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Start a conversation
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Tell me about your background and interests in AI safety. I will
              help you articulate your experience and goals for your profile.
            </p>
          </div>
        ) : (
          <>
            {visibleMessages.map((message, index) => (
              <div
                key={message._id}
                className={cn(
                  'flex animate-in fade-in slide-in-from-bottom-2 duration-300',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md',
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.role === 'assistant'
                      ? renderMarkdown(message.content)
                      : message.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Streaming assistant message */}
            {isStreaming && streamingText && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-muted text-foreground">
                  <p className="text-sm whitespace-pre-wrap">
                    {renderMarkdown(streamingText)}
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-muted-foreground/70 animate-pulse align-text-bottom" />
                  </p>
                </div>
              </div>
            )}

            {/* Bouncing dots: waiting for first token */}
            {isLoading && !streamingText && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="size-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span
                      className="size-2 bg-muted-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <span
                      className="size-2 bg-muted-foreground/50 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex gap-2 items-end bg-muted/50"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            messages.length === 0
              ? 'Tell me about your background...'
              : 'Continue the conversation...'
          }
          disabled={isLoading || disabled}
          className="flex-1 min-h-9 max-h-[120px] resize-none"
          rows={1}
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          size="icon"
          className="shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}
