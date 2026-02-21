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
import { MODEL_QUALITY } from '../lib/models'
import {
  CAREER_COACH_PROMPT,
  COMPLETION_COACH_PROMPT,
  buildProfileContext,
} from './conversation'
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

// HTTP action that streams Claude's response
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
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY not configured', { status: 500 })
  }

  // Stream Claude's response
  const generateChat = async (
    _ctx: any,
    _request: any,
    _streamId: StreamId,
    chunkAppender: (chunk: string) => Promise<void>,
  ) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL_QUALITY,
        max_tokens: 500,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`)
    }

    if (!response.body) {
      throw new Error('No response body from Anthropic API')
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

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
          if (
            parsed.type === 'content_block_delta' &&
            parsed.delta?.type === 'text_delta' &&
            parsed.delta.text
          ) {
            fullText += parsed.delta.text
            await chunkAppender(parsed.delta.text)
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    // Save assistant message to DB after streaming completes
    await ctx.runMutation(internal.enrichment.queries.saveMessage, {
      profileId: profileId as any,
      role: 'assistant',
      content: fullText,
      ...(actionId ? { actionId: actionId as any } : {}),
    })
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
