// Match ExtractionResult from convex/extraction/prompts.ts
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
    startDate?: string; // YYYY-MM from extraction
    endDate?: string; // YYYY-MM or "present"
    current?: boolean;
    description?: string;
  }>;
  skills?: Array<string>;
  rawSkills?: Array<string>;
}

export type ResumeReviewStatus = "pending" | "accepted" | "rejected" | "edited";

export interface ResumeReviewItem {
  id: string; // Unique key: "name", "location", "education.0", "workHistory.1", etc.
  field: string; // Top-level field: "name", "location", "education", "workHistory", "skills"
  index?: number; // For array items
  label: string;
  value: unknown;
  editedValue?: unknown;
  status: ResumeReviewStatus;
}
