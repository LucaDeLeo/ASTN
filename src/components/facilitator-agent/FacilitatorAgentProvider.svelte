<script lang="ts">
  import type { Snippet } from 'svelte'
  import { onMount } from 'svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import { CONVEX_URL } from '$lib/convex-env'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { setFacilitatorAgentContext } from '$lib/stores/facilitator-agent.svelte'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import type {
    AdminAgentEvent,
    AdminAgentMessage,
    AgentModel,
    ContentPart,
    ThinkingLevel,
  } from '../../../shared/admin-agent/types'
  import { FACILITATOR_AGENT_WS_PORT } from '../../../shared/admin-agent/constants'

  type FacilitatorClientMessage =
    | {
        type: 'chat'
        text: string
        model?: AgentModel
        thinking?: ThinkingLevel
      }
    | { type: 'refresh_token'; clerkToken: string }

  let {
    orgSlug,
    programId,
    children,
  }: {
    orgSlug: string
    programId: string
    children?: Snippet
  } = $props()

  const TOKEN_REFRESH_INTERVAL = 45_000
  const MAX_RECONNECT_ATTEMPTS = 3
  const RECONNECT_BASE_DELAY = 1000

  const convex = useConvexClient()
  const clerkContext = getClerkContext()
  const store = setFacilitatorAgentContext()

  const persistedMessages = useQuery(api.facilitatorAgentChat.getMessages, () =>
    programId ? { programId: programId as Id<'programs'> } : 'skip',
  )

  let hasLoadedPersisted = $state(false)
  let ws: WebSocket | null = null
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null
  let reconnectAttempts = 0

  const cleanupSocket = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval)
      tokenRefreshInterval = null
    }

    if (ws) {
      ws.close()
      ws = null
    }
  }

  const persistMessages = async (messages: Array<AdminAgentMessage>) => {
    if (!programId) {
      return
    }

    try {
      await convex.mutation(api.facilitatorAgentChat.saveMessages, {
        programId: programId as Id<'programs'>,
        messages: messages as any,
      })
    } catch {
      // Keep the chat responsive even if persistence fails.
    }
  }

  const getClerkToken = async () => {
    if (!clerkContext.currentSession) {
      return null
    }

    return clerkContext.currentSession.getToken({
      template: 'convex',
    })
  }

  const finalizeStreamParts = async () => {
    if (!store.streamParts.length) {
      return
    }

    const nextMessages = [
      ...store.messages,
      {
        role: 'assistant',
        parts: [...store.streamParts],
      } satisfies AdminAgentMessage,
    ]

    store.messages = nextMessages
    store.streamParts = []
    await persistMessages(nextMessages)
  }

  const handleEvent = async (event: AdminAgentEvent) => {
    switch (event.type) {
      case 'text': {
        store.isStreaming = true

        const last = store.streamParts.at(-1)
        if (last?.type === 'text') {
          store.streamParts = [
            ...store.streamParts.slice(0, -1),
            {
              type: 'text',
              content: last.content + event.content,
            } satisfies ContentPart,
          ]
        } else {
          store.streamParts = [
            ...store.streamParts,
            {
              type: 'text',
              content: event.content,
            } satisfies ContentPart,
          ]
        }
        break
      }

      case 'tool_use':
        store.isStreaming = true
        store.streamParts = [
          ...store.streamParts,
          {
            type: 'tool_call',
            name: event.name,
            input: event.input,
          } satisfies ContentPart,
        ]
        break

      case 'tool_result': {
        let matched = false
        store.streamParts = store.streamParts.map((part) => {
          if (!matched && part.type === 'tool_call' && part.output === undefined) {
            matched = true
            return { ...part, output: event.output }
          }
          return part
        })
        break
      }

      case 'done':
        await finalizeStreamParts()
        store.isStreaming = false
        break

      case 'error': {
        const nextMessages = [
          ...store.messages,
          {
            role: 'assistant',
            parts:
              store.streamParts.length > 0
                ? [
                    ...store.streamParts,
                    {
                      type: 'text',
                      content: `\n\nError: ${event.message}`,
                    } satisfies ContentPart,
                  ]
                : [
                    {
                      type: 'text',
                      content: `Error: ${event.message}`,
                    } satisfies ContentPart,
                  ],
          } satisfies AdminAgentMessage,
        ]

        store.messages = nextMessages
        store.streamParts = []
        store.isStreaming = false
        await persistMessages(nextMessages)
        break
      }

      default:
        break
    }
  }

  store.sendMessage = async (
    text: string,
    model?: AgentModel,
    thinking?: ThinkingLevel,
  ) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }

    const nextMessages = [
      ...store.messages,
      {
        role: 'user',
        content: text,
      } satisfies AdminAgentMessage,
    ]

    store.messages = nextMessages
    await persistMessages(nextMessages)

    ws.send(
      JSON.stringify({
        type: 'chat',
        text,
        model,
        thinking,
      } satisfies FacilitatorClientMessage),
    )
  }

  store.clearChat = () => {
    store.messages = []
    store.streamParts = []

    if (!programId) {
      return
    }

    void convex.mutation(api.facilitatorAgentChat.clearMessages, {
      programId: programId as Id<'programs'>,
    })
  }

  onMount(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === '.') {
        event.preventDefault()
        store.toggle()
      }
    }

    window.addEventListener('keydown', handleShortcut)

    return () => {
      window.removeEventListener('keydown', handleShortcut)
      cleanupSocket()
    }
  })

  $effect(() => {
    store.orgSlug = orgSlug
    store.programId = programId
  })

  $effect(() => {
    if (persistedMessages.data && !hasLoadedPersisted) {
      store.messages = persistedMessages.data as Array<AdminAgentMessage>
      hasLoadedPersisted = true
    }

    if (!programId) {
      hasLoadedPersisted = false
    }
  })

  $effect(() => {
    const agentToken = store.agentToken
    const currentOrgSlug = orgSlug
    const currentProgramId = programId
    const session = clerkContext.currentSession

    if (!agentToken || !currentOrgSlug || !currentProgramId || !session) {
      store.status = 'disconnected'
      cleanupSocket()
      return
    }

    let cancelled = false

    const connect = async () => {
      if (cancelled) {
        return
      }

      store.status = 'connecting'
      const clerkToken = await getClerkToken()

      if (!clerkToken || cancelled) {
        store.status = 'disconnected'
        return
      }

      const wsUrl = `ws://localhost:${FACILITATOR_AGENT_WS_PORT}?token=${encodeURIComponent(agentToken)}&orgSlug=${encodeURIComponent(currentOrgSlug)}&clerkToken=${encodeURIComponent(clerkToken)}&convexUrl=${encodeURIComponent(CONVEX_URL)}`
      const socket = new WebSocket(wsUrl)
      ws = socket

      socket.onopen = () => {
        if (cancelled) {
          socket.close()
          return
        }

        store.status = 'connected'
        reconnectAttempts = 0

        tokenRefreshInterval = setInterval(async () => {
          const freshToken = await getClerkToken()
          if (!freshToken || socket.readyState !== WebSocket.OPEN) {
            return
          }

          socket.send(
            JSON.stringify({
              type: 'refresh_token',
              clerkToken: freshToken,
            } satisfies FacilitatorClientMessage),
          )
        }, TOKEN_REFRESH_INTERVAL)
      }

      socket.onmessage = (messageEvent) => {
        let event: AdminAgentEvent

        try {
          event = JSON.parse(messageEvent.data) as AdminAgentEvent
        } catch {
          return
        }

        void handleEvent(event)
      }

      socket.onclose = () => {
        if (cancelled) {
          return
        }

        void finalizeStreamParts()
        store.status = 'disconnected'
        store.isStreaming = false
        ws = null

        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval)
          tokenRefreshInterval = null
        }

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_BASE_DELAY * 2 ** reconnectAttempts
          reconnectAttempts += 1
          reconnectTimeout = setTimeout(() => {
            void connect()
          }, delay)
        }
      }

      socket.onerror = () => {
        // Let onclose handle reconnect logic.
      }
    }

    void connect()

    return () => {
      cancelled = true
      cleanupSocket()
    }
  })
</script>

{@render children?.()}
