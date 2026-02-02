export const FIELD_LIMITS = {
  // Profile fields (generous -- defensive, not editorial)
  name: 200,
  pronouns: 50,
  location: 200,
  headline: 500,
  careerGoals: 5000,
  seeking: 3000,
  enrichmentSummary: 10000,
  // Per-item limits
  workDescription: 3000,
  skillName: 100,
  // Enrichment chat
  chatMessage: 5000,
  // Document text extraction
  documentText: 100000,
} as const;

export function validateFieldLength(
  value: string | undefined,
  field: keyof typeof FIELD_LIMITS
): void {
  if (value && value.length > FIELD_LIMITS[field]) {
    throw new Error("Content too long to process");
  }
}
