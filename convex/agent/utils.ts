// Shared utilities for agent tools and mutations

export function normalize(s: string): string {
  return s.trim().toLowerCase()
}

export function educationMatches(
  a: { institution: string; degree?: string; field?: string },
  b: { institution: string; degree?: string; field?: string },
): boolean {
  if (normalize(a.institution) !== normalize(b.institution)) return false
  if (a.degree && b.degree && normalize(a.degree) !== normalize(b.degree))
    return false
  if (a.field && b.field && normalize(a.field) !== normalize(b.field))
    return false
  return true
}

export function workMatches(
  a: { organization: string; title?: string },
  b: { organization: string; title?: string },
): boolean {
  if (normalize(a.organization) !== normalize(b.organization)) return false
  if (a.title && b.title && normalize(a.title) !== normalize(b.title))
    return false
  return true
}

/** Convert YYYY-MM date string to Unix timestamp (first of month). */
export function convertDateString(dateStr?: string): number | undefined {
  if (!dateStr || dateStr.toLowerCase() === 'present') return undefined
  const parts = dateStr.split('-')
  if (parts.length < 2) return undefined
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  if (isNaN(year) || isNaN(month)) return undefined
  return Date.UTC(year, month - 1, 1)
}
