import { useState, useCallback } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

// Extraction field type
export interface ExtractionFields {
  skills_mentioned: string[];
  career_interests: string[];
  career_goals?: string;
  background_summary?: string;
  seeking?: string;
}

// Extraction status for each field
export type ExtractionStatus = "pending" | "accepted" | "rejected" | "edited";

export interface ExtractionItem {
  field: keyof ExtractionFields;
  label: string;
  value: string | string[];
  editedValue?: string | string[];
  status: ExtractionStatus;
}

export function useEnrichment(profileId: Id<"profiles"> | null) {
  // Load messages from database
  const messages =
    useQuery(
      api.enrichment.queries.getMessagesPublic,
      profileId ? { profileId } : "skip"
    ) ?? [];

  // Actions
  const sendMessageAction = useAction(api.enrichment.conversation.sendMessage);
  const extractAction = useAction(api.enrichment.extraction.extractFromConversation);

  // Local state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowExtract, setShouldShowExtract] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractions, setExtractions] = useState<ExtractionItem[] | null>(null);

  // Send a message
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!profileId || !messageText.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await sendMessageAction({
          profileId,
          message: messageText.trim(),
        });

        // Check if LLM signaled extraction
        if (result.shouldExtract) {
          setShouldShowExtract(true);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send message"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [profileId, sendMessageAction]
  );

  // Extract profile data from conversation
  const extractProfile = useCallback(async () => {
    if (!profileId || messages.length === 0) return;

    setIsExtracting(true);
    setError(null);

    try {
      const conversationMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await extractAction({ messages: conversationMessages });

      // Transform extraction result into items with status
      const items: ExtractionItem[] = [];

      if (result.skills_mentioned && result.skills_mentioned.length > 0) {
        items.push({
          field: "skills_mentioned",
          label: "Skills",
          value: result.skills_mentioned,
          status: "pending",
        });
      }

      if (result.career_interests && result.career_interests.length > 0) {
        items.push({
          field: "career_interests",
          label: "AI Safety Interests",
          value: result.career_interests,
          status: "pending",
        });
      }

      if (result.career_goals) {
        items.push({
          field: "career_goals",
          label: "Career Goals",
          value: result.career_goals,
          status: "pending",
        });
      }

      if (result.background_summary) {
        items.push({
          field: "background_summary",
          label: "Background Summary",
          value: result.background_summary,
          status: "pending",
        });
      }

      if (result.seeking) {
        items.push({
          field: "seeking",
          label: "What You're Seeking",
          value: result.seeking,
          status: "pending",
        });
      }

      setExtractions(items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to extract profile data"
      );
    } finally {
      setIsExtracting(false);
    }
  }, [profileId, messages, extractAction]);

  // Update extraction status
  const updateExtractionStatus = useCallback(
    (field: keyof ExtractionFields, status: ExtractionStatus) => {
      setExtractions((prev) =>
        prev?.map((item) => (item.field === field ? { ...item, status } : item)) ??
        null
      );
    },
    []
  );

  // Update extraction value (for editing)
  const updateExtractionValue = useCallback(
    (field: keyof ExtractionFields, editedValue: string | string[]) => {
      setExtractions((prev) =>
        prev?.map((item) =>
          item.field === field ? { ...item, editedValue, status: "edited" } : item
        ) ?? null
      );
    },
    []
  );

  // Reset to conversation mode
  const resetExtractions = useCallback(() => {
    setExtractions(null);
    setShouldShowExtract(false);
  }, []);

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
  };
}
