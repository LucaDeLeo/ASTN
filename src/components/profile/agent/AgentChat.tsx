import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  optimisticallySendMessage,
  useSmoothText,
  useUIMessages,
} from '@convex-dev/agent/react'
import { Check, MessageSquare, Send, Sparkles } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import type { UIMessage } from '@convex-dev/agent'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { cn } from '~/lib/utils'

interface AgentChatProps {
  profileId: Id<'profiles'>
  threadId: string
}

export function AgentChat({ profileId, threadId }: AgentChatProps) {
  const [input, setInput] = useState('')
  const [autoApprove, setAutoApprove] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('agent-auto-approve') !== 'false'
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Messages with streaming
  const { results: messages } = useUIMessages(
    api.agent.queries.listMessages,
    { threadId },
    { initialNumItems: 50, stream: true },
  )

  // Tool calls for approve/undo
  const toolCalls = useQuery(api.agent.queries.getToolCalls, {
    threadId,
  })

  // Mutations
  const sendMessageMut = useMutation(
    api.agent.threadOps.sendMessage,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.agent.queries.listMessages),
  )
  const resolveToolChange = useMutation(api.agent.mutations.resolveToolChange)
  const batchApprove = useMutation(api.agent.mutations.batchApprovePending)

  // Check if agent is currently responding
  const isStreaming = messages.some((m: UIMessage) => m.status === 'streaming')
  const isLoading =
    isStreaming || messages.some((m: UIMessage) => m.status === 'pending')

  // Persist auto-approve preference
  useEffect(() => {
    localStorage.setItem('agent-auto-approve', String(autoApprove))
  }, [autoApprove])

  // Auto-approve new tool calls when toggle is on
  useEffect(() => {
    if (!autoApprove || !toolCalls) return
    const pending = toolCalls.filter(
      (tc: Doc<'agentToolCalls'>) => tc.status === 'pending',
    )
    for (const tc of pending) {
      resolveToolChange({ toolCallId: tc._id, action: 'approve' })
    }
  }, [autoApprove, toolCalls, resolveToolChange])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')

    // Batch-approve pending tool calls on send
    batchApprove({ threadId })

    await sendMessageMut({ threadId, prompt: text, profileId })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Associate tool calls with assistant messages by creation time
  const allToolCalls = toolCalls ?? []

  const getToolCallsForMessage = (
    message: UIMessage,
    nextMessage: UIMessage | undefined,
  ): Array<Doc<'agentToolCalls'>> => {
    if (message.role !== 'assistant') return []
    return allToolCalls.filter((tc: Doc<'agentToolCalls'>) => {
      if (tc.createdAt < message._creationTime) return false
      if (nextMessage && tc.createdAt >= nextMessage._creationTime) return false
      return true
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with auto-approve toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/50">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-coral-400" />
          <span className="text-sm font-medium">Profile Builder</span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-muted-foreground">Auto-approve</span>
          <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
        </label>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <MessageSquare className="size-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Let's build your profile
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Tell me about yourself — your background, interests, and goals in
              AI safety. I'll build your profile as we talk.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message: UIMessage, idx: number) => (
              <MessageBubble
                key={message.key}
                message={message}
                relatedToolCalls={getToolCallsForMessage(
                  message,
                  messages[idx + 1],
                )}
                autoApprove={autoApprove}
                onApprove={(id) =>
                  resolveToolChange({ toolCallId: id, action: 'approve' })
                }
                onUndo={(id) =>
                  resolveToolChange({ toolCallId: id, action: 'undo' })
                }
              />
            ))}

            {/* Loading dots when waiting for first token */}
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
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex gap-2 items-end bg-muted/50"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            messages.length === 0
              ? 'Tell me about your background...'
              : 'Continue the conversation...'
          }
          disabled={isLoading}
          className="flex-1 min-h-9 max-h-[120px] resize-none"
          rows={1}
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          size="icon"
          className="shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}

// Map tool part type names to agentToolCalls toolName values
function getToolNameFromPart(part: {
  type: string
  toolName?: string
}): string | null {
  if (part.type === 'dynamic-tool' && 'toolName' in part)
    return part.toolName ?? null
  if (part.type.startsWith('tool-')) return part.type.slice(5)
  return null
}

// Individual message bubble component
function MessageBubble({
  message,
  relatedToolCalls,
  autoApprove,
  onApprove,
  onUndo,
}: {
  message: UIMessage
  relatedToolCalls: Array<Doc<'agentToolCalls'>>
  autoApprove: boolean
  onApprove: (id: Id<'agentToolCalls'>) => void
  onUndo: (id: Id<'agentToolCalls'>) => void
}) {
  const [smoothText] = useSmoothText(message.text || '', {
    startStreaming: message.status === 'streaming',
  })

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 bg-primary text-primary-foreground">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    )
  }

  const isStreaming = message.status === 'streaming'

  // When streaming, render as a single block (parts may not be finalized)
  if (isStreaming) {
    return (
      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {smoothText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-muted text-foreground">
              <p className="text-sm whitespace-pre-wrap">
                {renderMarkdown(smoothText)}
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-muted-foreground/70 animate-pulse align-text-bottom" />
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // When complete, render parts inline with tool calls interleaved
  const parts = message.parts
  const matchedToolCallIds = new Set<string>()
  // Track which tool calls we've matched to parts (by toolName, in order)
  const toolCallsByName = new Map<string, Array<Doc<'agentToolCalls'>>>()
  for (const tc of relatedToolCalls) {
    const existing = toolCallsByName.get(tc.toolName) ?? []
    existing.push(tc)
    toolCallsByName.set(tc.toolName, existing)
  }
  const toolCallCursors = new Map<string, number>()

  const elements: Array<React.ReactNode> = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part.type === 'text' && part.text) {
      elements.push(
        <div key={`text-${i}`} className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 bg-muted text-foreground">
            <p className="text-sm whitespace-pre-wrap">
              {renderMarkdown(part.text)}
            </p>
          </div>
        </div>,
      )
    } else if (part.type === 'step-start') {
      // Skip step boundaries
    } else {
      // Tool part — match to agentToolCalls
      const toolName = getToolNameFromPart(
        part as { type: string; toolName?: string },
      )
      if (toolName) {
        const candidates = toolCallsByName.get(toolName) ?? []
        const cursor = toolCallCursors.get(toolName) ?? 0
        if (cursor < candidates.length) {
          const tc = candidates[cursor]
          toolCallCursors.set(toolName, cursor + 1)
          matchedToolCallIds.add(tc._id)
          elements.push(
            <ToolCallInline
              key={tc._id}
              displayText={tc.displayText}
              status={tc.status}
              autoApprove={autoApprove}
              onApprove={() => onApprove(tc._id)}
              onUndo={() => onUndo(tc._id)}
            />,
          )
        }
      }
    }
  }

  // Safety net: render any remaining unmatched tool calls
  for (const tc of relatedToolCalls) {
    if (!matchedToolCallIds.has(tc._id)) {
      elements.push(
        <ToolCallInline
          key={tc._id}
          displayText={tc.displayText}
          status={tc.status}
          autoApprove={autoApprove}
          onApprove={() => onApprove(tc._id)}
          onUndo={() => onUndo(tc._id)}
        />,
      )
    }
  }

  if (elements.length === 0) return null

  return (
    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {elements}
    </div>
  )
}

// Compact inline tool call status
function ToolCallInline({
  displayText,
  status,
  autoApprove,
  onApprove,
  onUndo,
}: {
  displayText: string
  status: 'pending' | 'approved' | 'undone'
  autoApprove: boolean
  onApprove?: () => void
  onUndo?: () => void
}) {
  return (
    <div
      className={cn(
        'max-w-[80%] flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border',
        status === 'pending' && 'border-amber-200 bg-amber-50 text-amber-800',
        status === 'approved' && 'border-green-200 bg-green-50 text-green-700',
        status === 'undone' && 'border-slate-200 bg-slate-50 text-slate-400',
      )}
    >
      <Check
        className={cn(
          'size-3.5 shrink-0',
          status === 'approved' && 'text-green-600',
          status === 'pending' && 'text-amber-500',
          status === 'undone' && 'text-slate-400',
        )}
      />
      <span
        className={cn('flex-1 truncate', status === 'undone' && 'line-through')}
      >
        {displayText}
      </span>

      {status === 'pending' && !autoApprove && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onApprove}
            className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={onUndo}
            className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            Undo
          </button>
        </div>
      )}

      {status === 'undone' && (
        <span className="text-xs text-slate-400 shrink-0">Undone</span>
      )}
    </div>
  )
}

// Simple markdown renderer (bold and italic)
function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}
