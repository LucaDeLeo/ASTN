import { useCallback, useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export type ExtractionStage = "reading" | "extracting" | "matching";

export type ExtractionState =
  | { status: "idle" }
  | {
      status: "extracting";
      stage: ExtractionStage;
      documentId: Id<"uploadedDocuments">;
    }
  | { status: "success"; extractedData: ExtractedData }
  | { status: "error"; error: string; canRetry: boolean };

// Matches the extractedData shape from schema
export interface ExtractedData {
  name?: string;
  email?: string;
  location?: string;
  education?: Array<{
    institution: string;
    degree?: string;
    field?: string;
    startYear?: number;
    endYear?: number;
    current?: boolean;
  }>;
  workHistory?: Array<{
    organization: string;
    title: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: Array<string>;
  rawSkills?: Array<string>;
}

export interface UseExtractionReturn {
  state: ExtractionState;
  extractFromDocument: (documentId: Id<"uploadedDocuments">) => Promise<void>;
  extractFromText: (text: string) => Promise<void>;
  retry: () => void;
  reset: () => void;
}

/**
 * Hook for managing extraction lifecycle with progress stages and error handling.
 *
 * States:
 * - idle: No extraction in progress
 * - extracting: Extraction running (with stage indicator)
 * - success: Extraction complete with data
 * - error: Extraction failed with error message
 */
export function useExtraction(): UseExtractionReturn {
  const [state, setState] = useState<ExtractionState>({ status: "idle" });
  const [lastDocumentId, setLastDocumentId] =
    useState<Id<"uploadedDocuments"> | null>(null);
  const [lastText, setLastText] = useState<string | null>(null);

  const extractPdfAction = useAction(api.extraction.pdf.extractFromPdf);
  const extractTextAction = useAction(api.extraction.text.extractFromText);

  // Poll for status updates when extracting
  const documentStatus = useQuery(
    api.extraction.queries.getExtractionStatus,
    state.status === "extracting" && state.documentId
      ? { documentId: state.documentId }
      : "skip"
  );

  // Update state based on polling results
  useEffect(() => {
    if (state.status !== "extracting" || !documentStatus) return;

    if (documentStatus.status === "extracted" && documentStatus.extractedData) {
      setState({
        status: "success",
        extractedData: documentStatus.extractedData as ExtractedData,
      });
    } else if (documentStatus.status === "failed") {
      setState({
        status: "error",
        error: documentStatus.errorMessage || "Extraction failed",
        canRetry: true,
      });
    }
  }, [documentStatus, state.status]);

  const extractFromDocument = useCallback(
    async (documentId: Id<"uploadedDocuments">) => {
      setLastDocumentId(documentId);
      setLastText(null);

      // Simulate stage progression for UX (actual stages happen server-side)
      setState({ status: "extracting", stage: "reading", documentId });

      // Brief delay to show "reading" stage, then update to "extracting"
      setTimeout(() => {
        setState((prev) =>
          prev.status === "extracting" ? { ...prev, stage: "extracting" } : prev
        );
      }, 500);

      setTimeout(() => {
        setState((prev) =>
          prev.status === "extracting" ? { ...prev, stage: "matching" } : prev
        );
      }, 2000);

      try {
        // Action runs and updates document status
        // Polling above will catch success/failure
        await extractPdfAction({ documentId });
      } catch (error) {
        // Action threw - set error state directly
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "Extraction failed",
          canRetry: true,
        });
      }
    },
    [extractPdfAction]
  );

  const extractFromText = useCallback(
    async (text: string) => {
      setLastText(text);
      setLastDocumentId(null);

      // Text extraction doesn't have a documentId to poll
      // Use a placeholder - the action returns result directly
      setState({
        status: "extracting",
        stage: "extracting",
        documentId: "" as Id<"uploadedDocuments">,
      });

      try {
        const result = await extractTextAction({ text });
        // Action always returns { success: true, extractedData } on success
        setState({
          status: "success",
          extractedData: result.extractedData as ExtractedData,
        });
      } catch (error) {
        setState({
          status: "error",
          error: error instanceof Error ? error.message : "Extraction failed",
          canRetry: true,
        });
      }
    },
    [extractTextAction]
  );

  const retry = useCallback(() => {
    if (lastDocumentId) {
      void extractFromDocument(lastDocumentId);
    } else if (lastText !== null) {
      void extractFromText(lastText);
    }
  }, [lastDocumentId, lastText, extractFromDocument, extractFromText]);

  const reset = useCallback(() => {
    setState({ status: "idle" });
    setLastDocumentId(null);
    setLastText(null);
  }, []);

  return {
    state,
    extractFromDocument,
    extractFromText,
    retry,
    reset,
  };
}
