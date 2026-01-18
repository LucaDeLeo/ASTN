import { useCallback, useMemo, useState } from "react";
import type {
  ExtractedData,
  ResumeReviewItem,
  ResumeReviewStatus,
} from "../types";

/**
 * Generates a human-readable label for an education entry
 */
function formatEducationLabel(edu: NonNullable<ExtractedData["education"]>[0]): string {
  const parts: string[] = [];
  if (edu.degree) parts.push(edu.degree);
  if (edu.field) parts.push(`in ${edu.field}`);
  parts.push(`at ${edu.institution}`);
  return parts.join(" ");
}

/**
 * Generates a human-readable label for a work history entry
 */
function formatWorkLabel(work: NonNullable<ExtractedData["workHistory"]>[0]): string {
  return `${work.title} at ${work.organization}`;
}

/**
 * Transforms extracted data into a flat list of reviewable items
 */
function buildReviewItems(data: ExtractedData): ResumeReviewItem[] {
  const items: ResumeReviewItem[] = [];

  // Basic fields
  if (data.name) {
    items.push({
      id: "name",
      field: "name",
      label: "Name",
      value: data.name,
      status: "pending",
    });
  }

  if (data.email) {
    items.push({
      id: "email",
      field: "email",
      label: "Email",
      value: data.email,
      status: "pending",
    });
  }

  if (data.location) {
    items.push({
      id: "location",
      field: "location",
      label: "Location",
      value: data.location,
      status: "pending",
    });
  }

  // Education entries (each as separate reviewable item)
  if (data.education && data.education.length > 0) {
    data.education.forEach((edu, index) => {
      items.push({
        id: `education.${index}`,
        field: "education",
        index,
        label: formatEducationLabel(edu),
        value: edu,
        status: "pending",
      });
    });
  }

  // Work history entries (each as separate reviewable item)
  if (data.workHistory && data.workHistory.length > 0) {
    data.workHistory.forEach((work, index) => {
      items.push({
        id: `workHistory.${index}`,
        field: "workHistory",
        index,
        label: formatWorkLabel(work),
        value: work,
        status: "pending",
      });
    });
  }

  // Skills as a single item (array value)
  if (data.skills && data.skills.length > 0) {
    items.push({
      id: "skills",
      field: "skills",
      label: `Skills (${data.skills.length})`,
      value: data.skills,
      status: "pending",
    });
  }

  return items;
}

export interface UseResumeReviewReturn {
  /** Flat list of reviewable items */
  items: ResumeReviewItem[];
  /** Update the status of an item by id */
  updateStatus: (id: string, status: ResumeReviewStatus) => void;
  /** Update the edited value of an item (automatically sets status to "edited") */
  updateValue: (id: string, value: unknown) => void;
  /** Get data ready for applying to profile (only accepted/edited items) */
  getAcceptedData: () => Partial<ExtractedData>;
  /** Reset all items to pending state */
  reset: () => void;
  /** Accept all pending items */
  acceptAll: () => void;
  /** Count of accepted or edited items */
  acceptedCount: number;
  /** Total number of reviewable fields */
  totalFields: number;
  /** Whether at least one field is accepted or edited */
  hasAcceptedFields: boolean;
}

/**
 * Hook to manage the review state for extracted resume data.
 * Transforms nested extraction data into a flat list of reviewable items
 * with status tracking (pending/accepted/rejected/edited) and edited values.
 */
export function useResumeReview(
  extractedData: ExtractedData | null
): UseResumeReviewReturn {
  // Build initial items from extracted data
  const initialItems = useMemo(
    () => (extractedData ? buildReviewItems(extractedData) : []),
    [extractedData]
  );

  // Local state for items with status and edits
  const [items, setItems] = useState<ResumeReviewItem[]>(initialItems);

  // Re-initialize when extracted data changes
  useMemo(() => {
    if (extractedData) {
      setItems(buildReviewItems(extractedData));
    }
  }, [extractedData]);

  // Update status of an item
  const updateStatus = useCallback((id: string, status: ResumeReviewStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }, []);

  // Update value and set status to edited
  const updateValue = useCallback((id: string, value: unknown) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, editedValue: value, status: "edited" } : item
      )
    );
  }, []);

  // Accept all pending items
  const acceptAll = useCallback(() => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === "pending" ? { ...item, status: "accepted" } : item
      )
    );
  }, []);

  // Reset all items to pending
  const reset = useCallback(() => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: "pending" as const,
        editedValue: undefined,
      }))
    );
  }, []);

  // Get data ready for profile application
  const getAcceptedData = useCallback((): Partial<ExtractedData> => {
    const result: Partial<ExtractedData> = {};

    // Collect education entries
    const educationItems = items.filter(
      (item) =>
        item.field === "education" &&
        (item.status === "accepted" || item.status === "edited")
    );
    if (educationItems.length > 0) {
      result.education = educationItems.map((item) =>
        item.status === "edited" && item.editedValue !== undefined
          ? (item.editedValue as NonNullable<ExtractedData["education"]>[0])
          : (item.value as NonNullable<ExtractedData["education"]>[0])
      );
    }

    // Collect work history entries
    const workItems = items.filter(
      (item) =>
        item.field === "workHistory" &&
        (item.status === "accepted" || item.status === "edited")
    );
    if (workItems.length > 0) {
      result.workHistory = workItems.map((item) =>
        item.status === "edited" && item.editedValue !== undefined
          ? (item.editedValue as NonNullable<ExtractedData["workHistory"]>[0])
          : (item.value as NonNullable<ExtractedData["workHistory"]>[0])
      );
    }

    // Simple fields
    for (const item of items) {
      if (item.status !== "accepted" && item.status !== "edited") continue;
      const value =
        item.status === "edited" && item.editedValue !== undefined
          ? item.editedValue
          : item.value;

      switch (item.field) {
        case "name":
          result.name = value as string;
          break;
        case "location":
          result.location = value as string;
          break;
        case "skills":
          result.skills = value as string[];
          break;
        // email is not included in profile data
      }
    }

    return result;
  }, [items]);

  // Computed values
  const acceptedCount = items.filter(
    (item) => item.status === "accepted" || item.status === "edited"
  ).length;

  const totalFields = items.length;
  const hasAcceptedFields = acceptedCount > 0;

  return {
    items,
    updateStatus,
    updateValue,
    getAcceptedData,
    reset,
    acceptAll,
    acceptedCount,
    totalFields,
    hasAcceptedFields,
  };
}
