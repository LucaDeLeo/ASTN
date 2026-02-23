/**
 * Scoring utilities for ranking matches by fit quality and deadline urgency.
 */

/** Maps tier + per-tier score (0-100) to a global 0-100 fit scale. */
export function computeGlobalFitScore(
  tier: 'great' | 'good' | 'exploring',
  score: number,
): number {
  const clamped = Math.max(0, Math.min(100, score))
  switch (tier) {
    case 'great':
      return 67 + Math.round((clamped / 100) * 33)
    case 'good':
      return 34 + Math.round((clamped / 100) * 32)
    case 'exploring':
      return Math.round((clamped / 100) * 33)
  }
}

/** Urgency score: 100 = deadline today, 0 = 30+ days out or past, 50 = no deadline. */
export function computeUrgencyScore(deadline?: number): number {
  if (deadline == null) return 50
  const now = Date.now()
  const daysUntil = (deadline - now) / (1000 * 60 * 60 * 24)
  if (daysUntil < 0) return 0
  if (daysUntil >= 30) return 0
  return Math.round(100 * (1 - daysUntil / 30))
}

/** Combined score for sort order: 70% fit + 30% urgency. */
export function computeCombinedScore(
  tier: 'great' | 'good' | 'exploring',
  score: number,
  deadline?: number,
): number {
  return (
    0.7 * computeGlobalFitScore(tier, score) +
    0.3 * computeUrgencyScore(deadline)
  )
}

// ---------------------------------------------------------------------------
// Sort utilities
// ---------------------------------------------------------------------------

export type MatchSortOrder = 'combined' | 'fit' | 'deadline' | 'newest'

export const SORT_OPTIONS: Array<{ value: MatchSortOrder; label: string }> = [
  { value: 'combined', label: 'Best match' },
  { value: 'fit', label: 'Highest fit' },
  { value: 'deadline', label: 'Most urgent' },
  { value: 'newest', label: 'Newest' },
]

interface Sortable {
  tier: 'great' | 'good' | 'exploring'
  score: number
  isNew: boolean
  opportunity: { deadline?: number }
}

export function sortMatches<T extends Sortable>(
  matches: Array<T>,
  order: MatchSortOrder,
): Array<T> {
  const copy = [...matches]

  switch (order) {
    case 'combined':
      return copy.sort(
        (a, b) =>
          computeCombinedScore(b.tier, b.score, b.opportunity.deadline) -
          computeCombinedScore(a.tier, a.score, a.opportunity.deadline),
      )
    case 'fit':
      return copy.sort(
        (a, b) =>
          computeGlobalFitScore(b.tier, b.score) -
          computeGlobalFitScore(a.tier, a.score),
      )
    case 'deadline':
      return copy.sort(
        (a, b) =>
          computeUrgencyScore(b.opportunity.deadline) -
          computeUrgencyScore(a.opportunity.deadline),
      )
    case 'newest':
      return copy.sort((a, b) => {
        if (a.isNew !== b.isNew) return a.isNew ? -1 : 1
        return (
          computeCombinedScore(b.tier, b.score, b.opportunity.deadline) -
          computeCombinedScore(a.tier, a.score, a.opportunity.deadline)
        )
      })
  }
}

/** Tailwind color class for fit score display. */
export function getFitScoreColor(fitScore: number): string {
  if (fitScore >= 67) return 'text-emerald-600'
  if (fitScore >= 34) return 'text-blue-600'
  return 'text-amber-600'
}
