// Model + thinking settings
export type AgentModel =
  | 'claude-opus-4-6'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001'
export type ThinkingLevel = 'off' | 'adaptive' | 'high' | 'max'

// Browser -> Agent
export type AdminClientMessage =
  | {
      type: 'chat'
      text: string
      model?: AgentModel
      thinking?: ThinkingLevel
    }
  | { type: 'refresh_token'; clerkToken: string }

// Agent -> Browser (streamed events)
export type AdminAgentEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_use'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; output: string }
  | { type: 'done' }
  | { type: 'error'; message: string }

// Ordered content parts — preserves interleaving of text and tool calls
export type ContentPart =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; input: unknown; output?: string }

// Accumulated message for display
export type AdminAgentMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; parts: Array<ContentPart> }

export type ToolCall = {
  name: string
  input: unknown
  output?: string
}
