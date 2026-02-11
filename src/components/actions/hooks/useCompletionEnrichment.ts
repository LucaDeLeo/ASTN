import { useCallback, useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import type {
  ExtractionFields,
  ExtractionItem,
  ExtractionStatus,
} from '../../profile/enrichment/hooks/useEnrichment'

interface UseCompletionEnrichmentArgs {
  profileId: Id<'profiles'> | null
  actionId: Id<'careerActions'> | null
}

interface ActionContext {
  title: string
  description: string
  type: string
}

export function useCompletionEnrichment({
  profileId,
  actionId,
}: UseCompletionEnrichmentArgs) {
  // Load completion messages filtered by actionId
  const messages =
    useQuery(
      api.enrichment.queries.getCompletionMessagesPublic,
      actionId && profileId ? { actionId, profileId } : 'skip',
    ) ?? []

  // Actions
  const sendCompletionMessageAction = useAction(
    api.enrichment.conversation.sendCompletionMessage,
  )
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

  // Send a completion message
  const sendMessage = useCallback(
    async (messageText: string, actionContext?: ActionContext) => {
      if (!profileId || !actionId || !messageText.trim()) return

      setIsLoading(true)
      setError(null)

      try {
        const result = await sendCompletionMessageAction({
          profileId,
          actionId,
          message: messageText.trim(),
          // Only pass actionContext on the first message (when no messages exist yet)
          ...(actionContext && { actionContext }),
        })

        // Check if LLM signaled extraction
        if (result.shouldExtract) {
          setShouldShowExtract(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message')
      } finally {
        setIsLoading(false)
      }
    },
    [profileId, actionId, sendCompletionMessageAction],
  )

  // Extract profile data from completion conversation
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

      // Transform extraction result into items with status
      const items: Array<ExtractionItem> = []

      if (result.skills_mentioned.length > 0) {
        items.push({
          field: 'skills_mentioned',
          label: 'Skills',
          value: result.skills_mentioned,
          status: 'pending',
        })
      }

      if (result.career_interests.length > 0) {
        items.push({
          field: 'career_interests',
          label: 'AI Safety Interests',
          value: result.career_interests,
          status: 'pending',
        })
      }

      if (result.career_goals) {
        items.push({
          field: 'career_goals',
          label: 'Career Goals',
          value: result.career_goals,
          status: 'pending',
        })
      }

      if (result.background_summary) {
        items.push({
          field: 'background_summary',
          label: 'Background Summary',
          value: result.background_summary,
          status: 'pending',
        })
      }

      if (result.seeking) {
        items.push({
          field: 'seeking',
          label: "What You're Seeking",
          value: result.seeking,
          status: 'pending',
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

    // Actions
    sendMessage,
    extractProfile,
    updateExtractionStatus,
    updateExtractionValue,
    resetExtractions,
  }
}
