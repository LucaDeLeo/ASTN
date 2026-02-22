import { log } from '../lib/logging'

interface NormalizedOpportunity {
  sourceId: string
  source: string
  title: string
  organization: string
  location: string
  isRemote: boolean
  roleType: string
  experienceLevel?: string
  description: string
  requirements?: Array<string>
  salaryRange?: string
  deadline?: number
  sourceUrl: string
  postedAt?: number
  opportunityType?: 'job' | 'event'
  eventType?: string
  startDate?: number
  endDate?: number
}

interface ValidationResult<T> {
  valid: Array<T>
  dropped: number
}

/**
 * Validate and sanitize a batch of normalized opportunities.
 * - Trims all string fields
 * - Drops records with empty title or description after trimming
 * - Logs a summary of results
 */
export function validateAndSanitizeBatch<T extends NormalizedOpportunity>(
  opportunities: Array<T>,
): ValidationResult<T> {
  const valid: Array<T> = []
  let droppedEmptyTitle = 0
  let droppedEmptyDescription = 0

  for (const opp of opportunities) {
    // Trim all string fields
    const sanitized = {
      ...opp,
      title: opp.title.trim(),
      organization: opp.organization.trim(),
      location: opp.location.trim(),
      description: opp.description.trim(),
      sourceUrl: opp.sourceUrl.trim(),
      requirements: opp.requirements?.map((r) => r.trim()).filter(Boolean),
      salaryRange: opp.salaryRange?.trim() || undefined,
      experienceLevel: opp.experienceLevel?.trim() || undefined,
      eventType: opp.eventType?.trim() || undefined,
    }

    // Drop records with empty title after trimming
    if (!sanitized.title) {
      droppedEmptyTitle++
      continue
    }

    // Drop records with empty description after trimming
    if (!sanitized.description) {
      droppedEmptyDescription++
      continue
    }

    valid.push(sanitized as T)
  }

  const dropped = droppedEmptyTitle + droppedEmptyDescription

  log('info', 'Validation: batch sanitized', {
    total: opportunities.length,
    valid: valid.length,
    dropped,
    droppedEmptyTitle,
    droppedEmptyDescription,
  })

  return { valid, dropped }
}
