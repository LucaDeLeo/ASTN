<script lang="ts">
  import type { Snippet } from 'svelte'
  import { onMount } from 'svelte'
  import { api } from '$convex/_generated/api'
  import { CONVEX_URL } from '$lib/convex-env'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { setAdminAgentContext } from '$lib/stores/admin-agent.svelte'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import type {
    AdminAgentEvent,
    AdminAgentMessage,
    AdminClientMessage,
    AgentModel,
    ContentPart,
    ThinkingLevel,
  } from '../../../shared/admin-agent/types'
  import { ADMIN_AGENT_WS_PORT } from '../../../shared/admin-agent/constants'

  let { orgSlug, children }: { orgSlug: string; children?: Snippet } = $props()

  const TOKEN_REFRESH_INTERVAL = 45_000
  const MAX_RECONNECT_ATTEMPTS = 3
  const RECONNECT_BASE_DELAY = 1000

  const convex = useConvexClient()
  const clerkContext = getClerkContext()
  const store = setAdminAgentContext()

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    orgSlug ? { slug: orgSlug } : 'skip',
  )
  const persistedMessages = useQuery(api.adminAgentChat.getMessages, () =>
    org.data?._id ? { orgId: org.data._id } : 'skip',
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
    if (!org.data?._id) {
      return
    }

    try {
      await convex.mutation(api.adminAgentChat.saveMessages, {
        orgId: org.data._id,
        messages,
      })
    } catch {
      // Persistence failures should not interrupt the live chat.
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

  const setConfirmationStatus = async (confirmId: string, approved: boolean) => {
    const status = approved ? 'approved' : 'rejected'
    store.streamParts = store.streamParts.map((part) =>
      part.type === 'confirmation' && part.confirmId === confirmId
        ? { ...part, status }
        : part,
    )

    store.messages = store.messages.map((message) => {
      if (message.role !== 'assistant') {
        return message
      }

      return {
        ...message,
        parts: message.parts.map((part) =>
          part.type === 'confirmation' && part.confirmId === confirmId
            ? { ...part, status }
            : part,
        ),
      }
    })

    await persistMessages(store.messages)
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

      case 'confirm_request':
        store.isStreaming = true
        store.streamParts = [
          ...store.streamParts,
          {
            type: 'confirmation',
            confirmId: event.confirmId,
            action: event.action,
            description: event.description,
            details: event.details,
            status: 'pending',
          } satisfies ContentPart,
        ]
        break

      case 'action_result':
        store.streamParts = store.streamParts.map((part) =>
          part.type === 'confirmation' && part.confirmId === event.confirmId
            ? {
                ...part,
                status: event.success ? 'approved' : 'rejected',
              }
            : part,
        )
        break

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

    const message: AdminClientMessage = {
      type: 'chat',
      text,
      model,
      thinking,
    }
    ws.send(JSON.stringify(message))
  }

  store.sendConfirmResponse = async (confirmId: string, approved: boolean) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }

    const message: AdminClientMessage = {
      type: 'confirm_response',
      confirmId,
      approved,
    }

    ws.send(JSON.stringify(message))
    await setConfirmationStatus(confirmId, approved)
  }

  store.clearChat = () => {
    store.messages = []
    store.streamParts = []

    if (!org.data?._id) {
      return
    }

    void convex.mutation(api.adminAgentChat.clearMessages, {
      orgId: org.data._id,
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
  })

  $effect(() => {
    const currentOrgId = org.data?._id
    if (!currentOrgId) {
      hasLoadedPersisted = false
      return
    }

    if (persistedMessages.data && !hasLoadedPersisted) {
      store.messages = persistedMessages.data as Array<AdminAgentMessage>
      hasLoadedPersisted = true
    }
  })

  $effect(() => {
    const agentToken = store.agentToken
    const currentOrgSlug = orgSlug
    const session = clerkContext.currentSession

    if (!agentToken || !currentOrgSlug || !session) {
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

      const wsUrl = `ws://localhost:${ADMIN_AGENT_WS_PORT}?token=${encodeURIComponent(agentToken)}&orgSlug=${encodeURIComponent(currentOrgSlug)}&clerkToken=${encodeURIComponent(clerkToken)}&convexUrl=${encodeURIComponent(CONVEX_URL)}`
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
            } satisfies AdminClientMessage),
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
        // Let the close handler drive recovery.
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
