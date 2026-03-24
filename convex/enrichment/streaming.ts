import { v } from 'convex/values'
import {
  PersistentTextStreaming,
  StreamIdValidator,
} from '@convex-dev/persistent-text-streaming'
import { components, internal } from '../_generated/api'
import {
  httpAction,
  internalQuery,
  mutation,
  query,
} from '../_generated/server'
import { requireAuth } from '../lib/auth'
import { rateLimiter } from '../lib/rateLimiter'
import { FIELD_LIMITS } from '../lib/limits'
import { MODEL_CONVERSATION } from '../lib/models'
import {
  CAREER_COACH_PROMPT,
  COMPLETION_COACH_PROMPT,
  buildProfileContext,
} from './conversation'
import type { ConversationModelConfig } from '../lib/models'
import type { StreamId } from '@convex-dev/persistent-text-streaming'

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming,
)

// Start a streaming enrichment chat: save user message, create stream
export const startChat = mutation({
  args: {
    profileId: v.id('profiles'),
    message: v.string(),
  },
  returns: v.object({ streamId: StreamIdValidator }),
  handler: async (ctx, { profileId, message }) => {
    const userId = await requireAuth(ctx)

    await rateLimiter.limit(ctx, 'enrichmentChat', {
      key: userId,
      throws: true,
    })

    const profile = await ctx.db.get('profiles', profileId)
    if (!profile || profile.userId !== userId) {
      throw new Error('Not authorized')
    }

    if (message.length > FIELD_LIMITS.chatMessage) {
      throw new Error('Content too long to process')
    }

    await ctx.db.insert('enrichmentMessages', {
      profileId,
      role: 'user',
      content: message,
      createdAt: Date.now(),
    })

    const streamId = await persistentTextStreaming.createStream(ctx)
    return { streamId }
  },
})

// Start a streaming completion chat: save user message, create stream
export const startCompletionChat = mutation({
  args: {
    profileId: v.id('profiles'),
    actionId: v.id('careerActions'),
    message: v.string(),
  },
  returns: v.object({ streamId: StreamIdValidator }),
  handler: async (ctx, { profileId, actionId, message }) => {
    const userId = await requireAuth(ctx)

    await rateLimiter.limit(ctx, 'enrichmentChat', {
      key: userId,
      throws: true,
    })

    const profile = await ctx.db.get('profiles', profileId)
    if (!profile || profile.userId !== userId) {
      throw new Error('Not authorized')
    }

    if (message.length > FIELD_LIMITS.chatMessage) {
      throw new Error('Content too long to process')
    }

    await ctx.db.insert('enrichmentMessages', {
      profileId,
      role: 'user',
      content: message,
      actionId,
      createdAt: Date.now(),
    })

    const streamId = await persistentTextStreaming.createStream(ctx)
    return { streamId }
  },
})

// Query for DB fallback (used by useStream hook)
export const getChatBody = query({
  args: { streamId: StreamIdValidator },
  returns: v.object({
    text: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('streaming'),
      v.literal('done'),
      v.literal('error'),
      v.literal('timeout'),
    ),
  }),
  handler: async (ctx, { streamId }) => {
    return await persistentTextStreaming.getStreamBody(
      ctx,
      streamId as StreamId,
    )
  },
})

// Internal query to look up a career action by ID (for completion chat system prompt)
export const getCareerAction = internalQuery({
  args: { actionId: v.id('careerActions') },
  returns: v.union(
    v.object({
      title: v.string(),
      description: v.string(),
      type: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, { actionId }) => {
    const action = await ctx.db.get('careerActions', actionId)
    if (!action) return null
    return {
      title: action.title,
      description: action.description,
      type: action.type,
    }
  },
})

// --- Provider helpers for multi-model streaming ---

function buildProviderRequest(
  config: ConversationModelConfig,
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
): { url: string; headers: Record<string, string>; body: string } {
  if (config.provider === 'anthropic') {
    return {
      url: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    }
  }
  // openai-compatible (Kimi, etc.)
  return {
    url: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  }
}

function parseSSEChunk(
  config: ConversationModelConfig,
  parsed: any,
): { text?: string; inputTokens?: number; outputTokens?: number } {
  if (config.provider === 'anthropic') {
    const result: {
      text?: string
      inputTokens?: number
      outputTokens?: number
    } = {}
    if (
      parsed.type === 'content_block_delta' &&
      parsed.delta?.type === 'text_delta' &&
      parsed.delta.text
    ) {
      result.text = parsed.delta.text
    }
    if (parsed.type === 'message_start' && parsed.message?.usage) {
      result.inputTokens = parsed.message.usage.input_tokens ?? 0
    }
    if (parsed.type === 'message_delta' && parsed.usage) {
      result.outputTokens = parsed.usage.output_tokens ?? 0
    }
    return result
  }
  // openai-compatible
  const result: { text?: string; inputTokens?: number; outputTokens?: number } =
    {}
  const delta = parsed.choices?.[0]?.delta
  if (delta?.content) {
    result.text = delta.content
  }
  if (parsed.usage) {
    result.inputTokens = parsed.usage.prompt_tokens ?? 0
    result.outputTokens = parsed.usage.completion_tokens ?? 0
  }
  return result
}

// HTTP action that streams the LLM response
// The useStream hook sends { streamId } in the body and passes custom headers
// for profileId, mode, and actionId.
export const streamChat = httpAction(async (ctx, request) => {
  const body = (await request.json()) as { streamId: string }
  const { streamId } = body

  // Read context from custom headers (set by useStream's headers option)
  const profileId = request.headers.get('X-Profile-Id')
  const mode = request.headers.get('X-Mode') // 'completion' or absent
  const actionId = request.headers.get('X-Action-Id')

  if (!profileId) {
    return new Response('Missing X-Profile-Id header', { status: 400 })
  }

  // Auth: verify Clerk JWT from Authorization header
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    return new Response('Unauthorized', { status: 401 })
  }
  const userId = identity.subject

  // Ownership check
  const profile = await ctx.runQuery(
    internal.enrichment.queries.getProfileInternal,
    { profileId: profileId as any },
  )

  if (!profile || profile.userId !== userId) {
    return new Response('Not authorized', { status: 403 })
  }

  // Load conversation history
  let messages: Array<{ role: string; content: string }>

  if (mode === 'completion' && actionId) {
    const dbMessages = await ctx.runQuery(
      internal.enrichment.queries.getMessagesByAction,
      { actionId: actionId as any },
    )
    messages = dbMessages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }))
  } else {
    const dbMessages = await ctx.runQuery(
      internal.enrichment.queries.getMessages,
      { profileId: profileId as any },
    )
    messages = dbMessages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }))
  }

  // Build system prompt
  const profileContext = buildProfileContext(profile)
  const preferredLanguage = profile.preferredLanguage || 'en'
  let systemPrompt: string

  if (mode === 'completion') {
    // Look up action context from DB
    let actionCtxStr = 'No action context provided'
    if (actionId) {
      const actionData = await ctx.runQuery(
        internal.enrichment.streaming.getCareerAction,
        { actionId: actionId as any },
      )
      if (actionData) {
        actionCtxStr = `Type: ${actionData.type}\nTitle: ${actionData.title}\nDescription: ${actionData.description}`
      }
    }
    systemPrompt = COMPLETION_COACH_PROMPT.replace(
      '{actionContext}',
      actionCtxStr,
    )
      .replace(
        '{profileContext}',
        `<profile_data>\n${profileContext}\n</profile_data>`,
      )
      .replace('{preferredLanguage}', preferredLanguage)
  } else {
    systemPrompt = CAREER_COACH_PROMPT.replace(
      '{profileContext}',
      `<profile_data>\n${profileContext}\n</profile_data>`,
    ).replace('{preferredLanguage}', preferredLanguage)
  }

  // Get API key from environment
  const modelConfig = MODEL_CONVERSATION
  const apiKey = process.env[modelConfig.apiKeyEnv]
  if (!apiKey) {
    return new Response(`${modelConfig.apiKeyEnv} not configured`, {
      status: 500,
    })
  }

  // Stream the LLM response
  const generateChat = async (
    _ctx: any,
    _request: any,
    _streamId: StreamId,
    chunkAppender: (chunk: string) => Promise<void>,
  ) => {
    const req = buildProviderRequest(
      modelConfig,
      apiKey,
      systemPrompt,
      messages,
    )
    const response = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: req.body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `${modelConfig.provider} API error: ${response.status} ${errorText}`,
      )
    }

    if (!response.body) {
      throw new Error(`No response body from ${modelConfig.provider} API`)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''
    let streamInputTokens = 0
    let streamOutputTokens = 0
    const streamStart = Date.now()

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const chunk = parseSSEChunk(modelConfig, parsed)
          if (chunk.text) {
            fullText += chunk.text
            await chunkAppender(chunk.text)
          }
          if (chunk.inputTokens !== undefined) {
            streamInputTokens = chunk.inputTokens
          }
          if (chunk.outputTokens !== undefined) {
            streamOutputTokens = chunk.outputTokens
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
    const streamDuration = Date.now() - streamStart

    // Save assistant message to DB after streaming completes
    await ctx.runMutation(internal.enrichment.queries.saveMessage, {
      profileId: profileId as any,
      role: 'assistant',
      content: fullText,
      ...(actionId ? { actionId: actionId as any } : {}),
    })

    // Log LLM usage — estimate tokens from text if provider didn't report them.
    // Wrapped in try-catch because this runs inside void doStream() and errors
    // would be silently swallowed, potentially masking the real issue.
    try {
      const inputTokens =
        streamInputTokens > 0
          ? streamInputTokens
          : Math.ceil(
              ((systemPrompt?.length ?? 0) +
                messages.reduce(
                  (sum: number, m: { content?: string }) =>
                    sum + (m.content?.length ?? 0),
                  0,
                )) /
                4,
            )
      const outputTokens =
        streamOutputTokens > 0
          ? streamOutputTokens
          : Math.ceil(fullText.length / 4)

      await ctx.runMutation(internal.lib.llmUsage.logUsage, {
        operation: 'enrichment_chat',
        model: modelConfig.model,
        inputTokens,
        outputTokens,
        userId,
        profileId: profileId as any,
        durationMs: streamDuration,
      })
    } catch (e) {
      console.error('Failed to log enrichment_chat usage:', e)
    }
  }

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    streamId as StreamId,
    generateChat,
  )

  // CORS headers
  const origin = request.headers.get('Origin') ?? '*'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Vary', 'Origin')

  return response
})

// CORS preflight handler
// eslint-disable-next-line @typescript-eslint/require-await
export const corsHandler = httpAction(async (_ctx, request) => {
  const origin = request.headers.get('Origin') ?? '*'
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Profile-Id, X-Mode, X-Action-Id',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  })
})
