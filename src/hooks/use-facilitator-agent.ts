import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery } from 'convex/react'

import { api } from '../../convex/_generated/api'
import { FACILITATOR_AGENT_WS_PORT } from '../../shared/admin-agent/constants'
import type { Id } from '../../convex/_generated/dataModel'
import type {
  AdminAgentEvent,
  AdminAgentMessage,
  AgentModel,
  ContentPart,
  ThinkingLevel,
} from '../../shared/admin-agent/types'

type FacilitatorClientMessage =
  | {
      type: 'chat'
      text: string
      model?: AgentModel
      thinking?: ThinkingLevel
    }
  | { type: 'refresh_token'; clerkToken: string }

const SESSION_STORAGE_KEY = 'facilitator-agent-token'
const TOKEN_REFRESH_INTERVAL = 45_000
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_BASE_DELAY = 1000

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export function useFacilitatorAgent(programId: string, orgSlug: string) {
  const { getToken } = useAuth()

  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [messages, setMessages] = useState<Array<AdminAgentMessage>>([])
  const [streamParts, setStreamParts] = useState<Array<ContentPart>>([])
  const [isStreaming, setIsStreaming] = useState(false)

  // Load persisted messages from Convex
  const persistedMessages = useQuery(
    api.facilitatorAgentChat.getMessages,
    programId ? { programId: programId as Id<'programs'> } : 'skip',
  )
  const saveMessagesMutation = useMutation(
    api.facilitatorAgentChat.saveMessages,
  )
  const clearMessagesMutation = useMutation(
    api.facilitatorAgentChat.clearMessages,
  )

  // Sync persisted messages into local state on first load
  const initializedRef = useRef(false)
  useEffect(() => {
    if (persistedMessages && !initializedRef.current) {
      initializedRef.current = true
      setMessages(persistedMessages as Array<AdminAgentMessage>)
    }
  }, [persistedMessages])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tokenRefreshInterval = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )
  const agentTokenRef = useRef<string | null>(null)

  // Ref for streaming parts so done handler reads without nested updaters
  const partsRef = useRef<Array<ContentPart>>([])
  // Ref to track messages for persistence (avoids stale closure in WS handler)
  const messagesRef = useRef<Array<AdminAgentMessage>>(messages)
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Persist messages to Convex after changes (debounced via the done/error events)
  const persistToConvex = (updatedMessages: Array<AdminAgentMessage>) => {
    if (!programId) return
    // Fire-and-forget — mutation handles auth
    // Cast needed: facilitator messages never include 'confirmation' parts
    // but the shared AdminAgentMessage type allows them
    saveMessagesMutation({
      programId: programId as Id<'programs'>,
      messages: updatedMessages as any,
    }).catch(() => {
      // Persistence failure is non-fatal
    })
  }

  // Read agent token from URL hash on mount, store in sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    const match = hash.match(/#agent=([^&]+)/)
    if (match) {
      const token = match[1]
      sessionStorage.setItem(SESSION_STORAGE_KEY, token)
      agentTokenRef.current = token
      // Clean up hash from URL
      history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      )
    } else {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        agentTokenRef.current = stored
      }
    }
  }, [])

  // WebSocket connection management
  useEffect(() => {
    const agentToken = agentTokenRef.current
    if (!agentToken) return

    let unmounted = false

    const connect = async () => {
      if (unmounted) return

      setStatus('connecting')

      let clerkToken: string | null = null
      try {
        clerkToken = await getToken({ template: 'convex' })
      } catch {
        setStatus('disconnected')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- clerkToken can be null from getToken()
      if (!clerkToken || unmounted) {
        setStatus('disconnected')
        return
      }

      const convexUrl = import.meta.env.VITE_CONVEX_URL as string
      const wsUrl = `ws://localhost:${FACILITATOR_AGENT_WS_PORT}?token=${encodeURIComponent(agentToken)}&orgSlug=${encodeURIComponent(orgSlug)}&clerkToken=${encodeURIComponent(clerkToken)}&convexUrl=${encodeURIComponent(convexUrl)}`
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (unmounted) {
          ws.close()
          return
        }
        setStatus('connected')
        reconnectAttempts.current = 0

        // Start token refresh interval
        tokenRefreshInterval.current = setInterval(async () => {
          try {
            const freshToken = await getToken({ template: 'convex' })
            if (freshToken && ws.readyState === WebSocket.OPEN) {
              const msg: FacilitatorClientMessage = {
                type: 'refresh_token',
                clerkToken: freshToken,
              }
              ws.send(JSON.stringify(msg))
            }
          } catch {
            // Token refresh failure is non-fatal
          }
        }, TOKEN_REFRESH_INTERVAL)
      }

      ws.onmessage = (event) => {
        let data: AdminAgentEvent
        try {
          data = JSON.parse(event.data) as AdminAgentEvent
        } catch {
          return
        }

        switch (data.type) {
          case 'text': {
            setIsStreaming(true)
            const parts = partsRef.current
            const last = parts[parts.length - 1]
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- last.type can be 'text' or 'tool_call'
            if (last && last.type === 'text') {
              const updated = [...parts]
              updated[updated.length - 1] = {
                type: 'text',
                content: last.content + data.content,
              }
              partsRef.current = updated
            } else {
              partsRef.current = [
                ...parts,
                { type: 'text', content: data.content },
              ]
            }
            setStreamParts(partsRef.current)
            break
          }

          case 'tool_use': {
            setIsStreaming(true)
            partsRef.current = [
              ...partsRef.current,
              { type: 'tool_call', name: data.name, input: data.input },
            ]
            setStreamParts(partsRef.current)
            break
          }

          case 'tool_result': {
            let matched = false
            partsRef.current = partsRef.current.map((p) => {
              if (
                !matched &&
                p.type === 'tool_call' &&
                p.output === undefined
              ) {
                matched = true
                return { ...p, output: data.output }
              }
              return p
            })
            setStreamParts(partsRef.current)
            break
          }

          case 'done': {
            const parts = partsRef.current
            if (parts.length > 0) {
              const newMsg: AdminAgentMessage = {
                role: 'assistant',
                parts,
              }
              setMessages((prev) => {
                const updated = [...prev, newMsg]
                persistToConvex(updated)
                return updated
              })
            }
            partsRef.current = []
            setStreamParts([])
            setIsStreaming(false)
            break
          }

          case 'error':
            setIsStreaming(false)
            {
              // Preserve any accumulated streaming content before adding error
              const accumulated = partsRef.current
              const errorPart: ContentPart = {
                type: 'text',
                content: `\n\nError: ${data.message}`,
              }
              const errorMsg: AdminAgentMessage = {
                role: 'assistant',
                parts:
                  accumulated.length > 0
                    ? [...accumulated, errorPart]
                    : [{ type: 'text', content: `Error: ${data.message}` }],
              }
              setMessages((prev) => {
                const updated = [...prev, errorMsg]
                persistToConvex(updated)
                return updated
              })
            }
            partsRef.current = []
            setStreamParts([])
            break
        }
      }

      ws.onclose = () => {
        if (unmounted) return

        // Save any in-flight streaming content before clearing
        const parts = partsRef.current
        if (parts.length > 0) {
          const msg: AdminAgentMessage = {
            role: 'assistant',
            parts,
          }
          setMessages((prev) => {
            const updated = [...prev, msg]
            persistToConvex(updated)
            return updated
          })
          partsRef.current = []
          setStreamParts([])
        }

        setStatus('disconnected')
        setIsStreaming(false)
        wsRef.current = null

        if (tokenRefreshInterval.current) {
          clearInterval(tokenRefreshInterval.current)
          tokenRefreshInterval.current = null
        }

        // Auto-reconnect with backoff
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_BASE_DELAY * 2 ** reconnectAttempts.current
          reconnectAttempts.current += 1
          reconnectTimeout.current = setTimeout(connect, delay)
        }
      }

      ws.onerror = () => {
        // onclose will fire after this
      }
    }

    connect()

    return () => {
      unmounted = true
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
        reconnectTimeout.current = null
      }
      if (tokenRefreshInterval.current) {
        clearInterval(tokenRefreshInterval.current)
        tokenRefreshInterval.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [orgSlug, getToken])

  const sendMessage = (
    text: string,
    model?: AgentModel,
    thinking?: ThinkingLevel,
  ) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const userMsg: AdminAgentMessage = { role: 'user', content: text }
    setMessages((prev) => {
      const updated = [...prev, userMsg]
      persistToConvex(updated)
      return updated
    })

    const msg: FacilitatorClientMessage = {
      type: 'chat',
      text,
      model,
      thinking,
    }
    wsRef.current.send(JSON.stringify(msg))
  }

  const clearChat = () => {
    setMessages([])
    if (programId) {
      clearMessagesMutation({
        programId: programId as Id<'programs'>,
      }).catch(() => {})
    }
  }

  return {
    status,
    messages,
    streamParts,
    sendMessage,
    clearChat,
    isStreaming,
  }
}

export type UseFacilitatorAgentReturn = ReturnType<typeof useFacilitatorAgent>
