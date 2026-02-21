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
