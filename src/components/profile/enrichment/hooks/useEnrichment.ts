import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useStream } from '@convex-dev/persistent-text-streaming/react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import type { StreamId } from '@convex-dev/persistent-text-streaming'

// Extraction field type
export interface ExtractionFields {
  skills_mentioned: Array<string>
  career_interests: Array<string>
  career_goals?: string
  background_summary?: string
  seeking?: string
}

// Extraction status for each field
export type ExtractionStatus = 'pending' | 'accepted' | 'rejected' | 'edited'

export interface ExtractionItem {
  field: keyof ExtractionFields
  label: string
  value: string | Array<string>
  editedValue?: string | Array<string>
  status: ExtractionStatus
}

// Derive Convex site URL from the cloud URL
const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_URL.replace(
  '.cloud',
  '.site',
)

// Keywords that signal the assistant is ready to extract profile data
const EXTRACTION_KEYWORDS = [
  'save what we',
  'save these',
  'save this to your profile',
  'save it to your profile',
  'add this to your profile',
  'capture these',
  "here's what i'd highlight",
  "here's what i'd capture",
  'shall i save',
  'summarize',
  'update your profile',
  'good picture',
  "what i've learned",
  'what i learned',
]

function checkShouldExtract(text: string): boolean {
  const lower = text.toLowerCase()
  return EXTRACTION_KEYWORDS.some((kw) => lower.includes(kw))
}

export function useEnrichment(profileId: Id<'profiles'> | null) {
  // Load messages from database
  const messages =
    useQuery(
      api.enrichment.queries.getMessagesPublic,
      profileId ? { profileId } : 'skip',
    ) ?? []

  // Mutations & actions
  const startChatMutation = useMutation(api.enrichment.streaming.startChat)
  const extractAction = useAction(
    api.enrichment.extraction.extractFromConversation,
  )

  // Local state
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shouldShowExtract, setShouldShowExtract] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractions, setExtractions] = useState<Array<ExtractionItem> | null>(
    null,
  )

  // Streaming state
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [streamHeaders, setStreamHeaders] = useState<Record<string, string>>({})
  const { getToken } = useAuth()

  // useStream hook — driven when we have an active stream
  const { text: streamingText, status: streamStatus } = useStream(
    api.enrichment.streaming.getChatBody,
    new URL(`${CONVEX_SITE_URL}/enrichment-stream`),
    !!activeStreamId,
    (activeStreamId ?? undefined) as StreamId | undefined,
    {
      authToken: authToken ?? undefined,
      headers: streamHeaders,
    },
  )

  // When stream completes, finalize state
  useEffect(() => {
    if (streamStatus === 'done' && activeStreamId) {
      if (streamingText && checkShouldExtract(streamingText)) {
        setShouldShowExtract(true)
      }
      setActiveStreamId(null)
      setAuthToken(null)
      setStreamHeaders({})
      setIsLoading(false)
    }
    if (streamStatus === 'error' && activeStreamId) {
      setError('Streaming failed. Please try again.')
      setActiveStreamId(null)
      setAuthToken(null)
      setStreamHeaders({})
      setIsLoading(false)
    }
  }, [streamStatus, activeStreamId, streamingText])

  // Send a message with streaming
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!profileId || !messageText.trim()) return

      setIsLoading(true)
      setError(null)

      try {
        const token = await getToken({ template: 'convex' })
        if (!token) throw new Error('Not authenticated')

        const { streamId } = await startChatMutation({
          profileId,
          message: messageText.trim(),
        })

        // Set headers for the HTTP action (useStream will include these)
        setStreamHeaders({ 'X-Profile-Id': profileId })
        setAuthToken(token)
        setActiveStreamId(streamId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message')
        setIsLoading(false)
      }
    },
    [profileId, startChatMutation, getToken],
  )

  // Extract profile data from conversation
  const extractProfile = useCallback(async () => {
    if (!profileId || messages.length === 0) return

    setIsExtracting(true)
    setError(null)

    try {
      const conversationMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const result = await extractAction({
        profileId,
        messages: conversationMessages,
      })

      const items: Array<ExtractionItem> = []

      if (result.skills_mentioned.length > 0) {
        items.push({
          field: 'skills_mentioned',
          label: 'Skills',
          value: result.skills_mentioned,
          status: 'accepted',
        })
      }

      if (result.career_interests.length > 0) {
        items.push({
          field: 'career_interests',
          label: 'AI Safety Interests',
          value: result.career_interests,
          status: 'accepted',
        })
      }

      if (result.career_goals) {
        items.push({
          field: 'career_goals',
          label: 'Career Goals',
          value: result.career_goals,
          status: 'accepted',
        })
      }

      if (result.background_summary) {
        items.push({
          field: 'background_summary',
          label: 'Background Summary',
          value: result.background_summary,
          status: 'accepted',
        })
      }

      if (result.seeking) {
        items.push({
          field: 'seeking',
          label: "What You're Seeking",
          value: result.seeking,
          status: 'accepted',
        })
      }

      setExtractions(items)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to extract profile data',
      )
    } finally {
      setIsExtracting(false)
    }
  }, [profileId, messages, extractAction])

  // Update extraction status
  const updateExtractionStatus = useCallback(
    (field: keyof ExtractionFields, status: ExtractionStatus) => {
      setExtractions(
        (prev) =>
          prev?.map((item) =>
            item.field === field ? { ...item, status } : item,
          ) ?? null,
      )
    },
    [],
  )

  // Update extraction value (for editing)
  const updateExtractionValue = useCallback(
    (field: keyof ExtractionFields, editedValue: string | Array<string>) => {
      setExtractions(
        (prev) =>
          prev?.map((item) =>
            item.field === field
              ? { ...item, editedValue, status: 'edited' }
              : item,
          ) ?? null,
      )
    },
    [],
  )

  // Reset to conversation mode
  const resetExtractions = useCallback(() => {
    setExtractions(null)
    setShouldShowExtract(false)
  }, [])

  return {
    // State
    messages,
    input,
    setInput,
    isLoading,
    error,
    shouldShowExtract,
    isExtracting,
    extractions,
    streamingText: activeStreamId ? streamingText : '',
    isStreaming:
      !!activeStreamId &&
      (streamStatus === 'streaming' || streamStatus === 'pending'),

    // Actions
    sendMessage,
    extractProfile,
    updateExtractionStatus,
    updateExtractionValue,
    resetExtractions,
  }
}
