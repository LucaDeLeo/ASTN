import type {
  SDKMessage,
  SDKPartialAssistantMessage,
  SDKToolUseSummaryMessage,
} from '@anthropic-ai/claude-agent-sdk'
import type { AdminAgentEvent } from '../shared/admin-agent/types'

/**
 * Map an SDK stream message to AdminAgentEvent(s) for the browser.
 * Returns null for messages we don't need to forward.
 */
export function mapSdkMessage(
  msg: SDKMessage,
): AdminAgentEvent | AdminAgentEvent[] | null {
  switch (msg.type) {
    case 'stream_event':
      return mapStreamEvent(msg)
    case 'tool_use_summary':
      return mapToolUseSummary(msg)
    case 'user':
      // Tool results come as user messages with tool_result content
      return mapUserMessage(msg)
    case 'result':
      if (msg.subtype !== 'success') {
        const errors = (msg as any).errors as string[] | undefined
        return {
          type: 'error',
          message: errors?.join('; ') ?? `Query ended: ${msg.subtype}`,
        }
      }
      return null
    default:
      return null
  }
}

function mapStreamEvent(
  msg: SDKPartialAssistantMessage,
): AdminAgentEvent | null {
  const event = msg.event

  switch (event.type) {
    case 'content_block_delta': {
      const delta = event.delta
      if (delta.type === 'text_delta') {
        return { type: 'text', content: delta.text }
      }
      return null
    }
    case 'content_block_start': {
      const block = event.content_block
      if (block.type === 'tool_use') {
        return {
          type: 'tool_use',
          name: block.name,
          input: {},
        }
      }
      return null
    }
    default:
      return null
  }
}

function mapToolUseSummary(
  msg: SDKToolUseSummaryMessage,
): AdminAgentEvent | null {
  return {
    type: 'tool_result',
    name: (msg as any).toolName ?? 'tool',
    output: msg.summary,
  }
}

function mapUserMessage(msg: SDKMessage): AdminAgentEvent[] | null {
  // User messages contain tool_result content blocks
  const message = (msg as any).message
  if (!message?.content || !Array.isArray(message.content)) return null

  const events: AdminAgentEvent[] = []
  for (const block of message.content) {
    if (block.type === 'tool_result') {
      // Extract text from the tool result content
      let output = ''
      if (typeof block.content === 'string') {
        output = block.content
      } else if (Array.isArray(block.content)) {
        output = block.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('\n')
      }
      events.push({
        type: 'tool_result',
        name: block.tool_use_id ?? 'tool',
        output,
      })
    }
  }

  return events.length > 0 ? events : null
}
