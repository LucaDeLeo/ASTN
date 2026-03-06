import { memo, useEffect, useRef, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Copy,
  Send,
  ShieldAlert,
  Terminal,
  Trash2,
  XCircle,
} from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

import type {
  AdminAgentMessage,
  AgentModel,
  ContentPart,
  ThinkingLevel,
} from '../../../shared/admin-agent/types'
import type { UseAdminAgentReturn } from '~/hooks/use-admin-agent'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

function renderMarkdown(content: string): string {
  const raw = marked.parse(content)
  if (typeof raw !== 'string') return content
  return DOMPurify.sanitize(raw)
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1.5"
      onClick={handleCopy}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  )
}

function ToolCallCard({ part }: { part: ContentPart & { type: 'tool_call' } }) {
  return (
    <details className="my-2 rounded-lg border bg-muted/50 text-sm">
      <summary className="cursor-pointer px-3 py-2 font-medium text-muted-foreground hover:text-foreground">
        <span className="ml-1 font-mono text-xs">{part.name}</span>
        {part.output === undefined && (
          <Spinner size="sm" className="inline-block ml-2 align-text-bottom" />
        )}
      </summary>
      <div className="border-t px-3 py-2 space-y-2">
        {part.input != null && Object.keys(part.input as object).length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Input
            </div>
            <pre className="text-xs whitespace-pre-wrap break-all bg-background rounded p-2 overflow-auto max-h-40">
              {typeof part.input === 'string'
                ? part.input
                : JSON.stringify(part.input, null, 2)}
            </pre>
          </div>
        )}
        {part.output != null && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Output
            </div>
            <pre className="text-xs whitespace-pre-wrap break-all bg-background rounded p-2 overflow-auto max-h-40">
              {part.output}
            </pre>
          </div>
        )}
        {part.output === undefined && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Running...
          </div>
        )}
      </div>
    </details>
  )
}

function ConfirmationCard({
  part,
  onRespond,
}: {
  part: ContentPart & { type: 'confirmation' }
  onRespond: (confirmId: string, approved: boolean) => void
}) {
  const isPending = part.status === 'pending'
  const isApproved = part.status === 'approved'
  const isRejected = part.status === 'rejected'

  return (
    <div
      className={cn(
        'my-2 rounded-lg border p-3 text-sm',
        isPending && 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20',
        isApproved && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
        isRejected && 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20',
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <ShieldAlert className="size-4 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
        <div className="min-w-0">
          <div className="font-medium text-foreground">{part.action}</div>
          <div className="text-muted-foreground mt-0.5">{part.description}</div>
        </div>
      </div>

      {Object.keys(part.details).length > 0 && (
        <div className="ml-6 mb-2">
          {Object.entries(part.details).map(([key, value]) => (
            <div key={key} className="text-xs text-muted-foreground">
              <span className="font-medium">{key}:</span>{' '}
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </div>
          ))}
        </div>
      )}

      {isPending && (
        <div className="flex gap-2 ml-6">
          <Button
            size="sm"
            className="h-7 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onRespond(part.confirmId, true)}
          >
            <Check className="size-3.5 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
            onClick={() => onRespond(part.confirmId, false)}
          >
            <XCircle className="size-3.5 mr-1" />
            Reject
          </Button>
        </div>
      )}

      {isApproved && (
        <div className="flex items-center gap-1.5 ml-6 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="size-3.5" />
          Approved
        </div>
      )}

      {isRejected && (
        <div className="flex items-center gap-1.5 ml-6 text-xs text-red-600 dark:text-red-400">
          <XCircle className="size-3.5" />
          Rejected
        </div>
      )}
    </div>
  )
}

const TextPart = memo(function TextPart({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
})

function AssistantParts({
  parts,
  isStreaming,
  onConfirmRespond,
}: {
  parts: Array<ContentPart>
  isStreaming?: boolean
  onConfirmRespond?: (confirmId: string, approved: boolean) => void
}) {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%]">
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <span key={i}>
                <TextPart content={part.content} />
                {/* Blinking cursor on the last text part while streaming */}
                {isStreaming && i === parts.length - 1 && (
                  <span className="inline-block w-2 h-4 bg-foreground/70 animate-pulse ml-0.5 align-text-bottom" />
                )}
              </span>
            )
          }
          if (part.type === 'confirmation') {
            return (
              <ConfirmationCard
                key={i}
                part={part}
                onRespond={onConfirmRespond ?? (() => {})}
              />
            )
          }
          return <ToolCallCard key={i} part={part} />
        })}
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  onConfirmRespond,
}: {
  message: AdminAgentMessage
  onConfirmRespond?: (confirmId: string, approved: boolean) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <AssistantParts
      parts={message.parts}
      onConfirmRespond={onConfirmRespond}
    />
  )
}

function DisconnectedView({ orgSlug }: { orgSlug: string }) {
  const command = `bun agent/cli.ts --org=${orgSlug}`

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
          <Terminal className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Agent Disconnected
          </h3>
          <p className="text-sm text-muted-foreground">
            Start the admin agent from your terminal to connect.
          </p>
        </div>
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <code className="block text-sm font-mono text-foreground break-all">
            {command}
          </code>
          <CopyButton text={command} />
        </div>
      </div>
    </div>
  )
}

function ConnectingView() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Spinner />
      <p className="text-sm text-muted-foreground">Connecting...</p>
    </div>
  )
}

export function AdminAgentChat({
  agent,
  orgSlug,
}: {
  agent: UseAdminAgentReturn
  orgSlug: string
}) {
  const {
    status,
    messages,
    streamParts,
    sendMessage,
    sendConfirmResponse,
    clearChat,
    isStreaming,
  } = agent

  const [input, setInput] = useState('')
  const [model, setModel] = useState<AgentModel>('claude-opus-4-6')
  const [thinking, setThinking] = useState<ThinkingLevel>('adaptive')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamParts])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  }, [input])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed, model, thinking)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (status === 'disconnected') {
    return <DisconnectedView orgSlug={orgSlug} />
  }

  if (status === 'connecting') {
    return <ConnectingView />
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with model/thinking controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <div className="size-2 rounded-full bg-green-500 shrink-0" />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as AgentModel)}
          className="text-xs bg-muted rounded px-1.5 py-1 border-none outline-none cursor-pointer"
        >
          <option value="claude-opus-4-6">Opus</option>
          <option value="claude-sonnet-4-6">Sonnet</option>
          <option value="claude-haiku-4-5-20251001">Haiku</option>
        </select>
        <select
          value={thinking}
          onChange={(e) => setThinking(e.target.value as ThinkingLevel)}
          className="text-xs bg-muted rounded px-1.5 py-1 border-none outline-none cursor-pointer"
        >
          <option value="off">No thinking</option>
          <option value="adaptive">Adaptive</option>
          <option value="high">High</option>
          <option value="max">Max</option>
        </select>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-7 text-muted-foreground hover:text-destructive"
            onClick={clearChat}
            disabled={isStreaming}
            title="Clear chat"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">
              Ask the admin agent to help manage your organization.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            onConfirmRespond={sendConfirmResponse}
          />
        ))}

        {isStreaming && streamParts.length > 0 && (
          <AssistantParts
            parts={streamParts}
            isStreaming
            onConfirmRespond={sendConfirmResponse}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the admin agent..."
            disabled={isStreaming}
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'max-h-[150px]',
            )}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="shrink-0 size-9"
          >
            {isStreaming ? <Spinner size="sm" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
