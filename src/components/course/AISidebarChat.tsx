import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import {
  optimisticallySendMessage,
  useSmoothText,
  useUIMessages,
} from '@convex-dev/agent/react'
import { Bot, ChevronsDown, Send, Square } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { UIMessage } from '@convex-dev/agent'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'
import { renderMarkdown } from '~/lib/render-markdown'

interface AISidebarChatProps {
  threadId: string
  moduleId: Id<'programModules'>
  isOpen: boolean
}

export function AISidebarChat({
  threadId,
  moduleId,
  isOpen,
}: AISidebarChatProps) {
  const [input, setInput] = useState('')
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const userScrolledUpRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Messages with streaming
  const { results: messages } = useUIMessages(
    api.course.sidebarQueries.listMessages,
    { threadId },
    { initialNumItems: 50, stream: true },
  )

  // Mutations
  const sendMessageMut = useMutation(
    api.course.sidebar.sendMessage,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.course.sidebarQueries.listMessages),
  )
  const abortGeneration = useMutation(api.course.sidebar.abortGeneration)

  // Check if agent is currently responding
  const isStreaming = messages.some((m: UIMessage) => m.status === 'streaming')
  const isLoading =
    isStreaming || messages.some((m: UIMessage) => m.status === 'pending')

  // Track user scroll
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const atBottom = scrollHeight - scrollTop - clientHeight < 40
      userScrolledUpRef.current = !atBottom
      setShowScrollToBottom(!atBottom)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  // Pin to bottom while streaming
  useEffect(() => {
    if (!isStreaming || userScrolledUpRef.current) return
    const container = messagesContainerRef.current
    if (!container) return

    let raf: number
    const tick = () => {
      container.scrollTop = container.scrollHeight
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isStreaming])

  const scrollToBottom = useCallback(() => {
    userScrolledUpRef.current = false
    setShowScrollToBottom(false)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    userScrolledUpRef.current = false
    setShowScrollToBottom(false)

    await sendMessageMut({
      threadId,
      prompt: text,
      moduleId,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit(e)
    }
  }

  const handleStop = () => {
    void abortGeneration({ threadId })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/50">
        <Bot className="size-4 text-teal-500" />
        <span className="text-sm font-medium">AI Learning Partner</span>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="relative flex-1 overflow-y-auto p-3 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="size-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
              <Bot className="size-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              Your AI Learning Partner
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Ask questions about the module materials, get study
              recommendations, or discuss course concepts. I'll guide you with
              questions — not give away answers.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message: UIMessage) => (
              <MessageBubble key={message.key} message={message} />
            ))}

            {/* Loading dots */}
            {isLoading && !isStreaming && (
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

        {/* Scroll-to-bottom FAB */}
        {showScrollToBottom && messages.length > 0 && (
          <div className="sticky bottom-2 flex justify-center pointer-events-none">
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto size-8 rounded-full shadow-md bg-background/90 backdrop-blur-sm"
              onClick={scrollToBottom}
            >
              <ChevronsDown className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-3 flex gap-2 items-end bg-muted/50"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the module..."
          disabled={isLoading}
          className="flex-1 min-h-9 max-h-[120px] resize-none"
          rows={1}
        />
        {isLoading ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="shrink-0"
            onClick={handleStop}
            title="Stop generating"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: UIMessage }) {
  const rawText = message.text as unknown
  const messageText =
    typeof rawText === 'string'
      ? rawText
      : typeof rawText === 'object'
        ? JSON.stringify(rawText)
        : String(rawText as string | number)
  const [smoothText] = useSmoothText(messageText, {
    startStreaming: message.status === 'streaming',
  })

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[90%] rounded-2xl rounded-br-md px-4 py-2.5 bg-primary text-primary-foreground">
          <p className="text-sm whitespace-pre-wrap">{messageText}</p>
        </div>
      </div>
    )
  }

  const isStreamingMsg = message.status === 'streaming'
  const displayText = isStreamingMsg ? smoothText : messageText

  if (!displayText) return null

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className={cn(
          'max-w-[90%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-muted text-foreground',
        )}
      >
        <div className="text-sm whitespace-pre-wrap">
          {renderMarkdown(displayText)}
          {isStreamingMsg && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-muted-foreground/70 animate-pulse align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  )
}
