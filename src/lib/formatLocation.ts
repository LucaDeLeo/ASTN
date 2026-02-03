/**
 * Normalize location strings from various API sources.
 * Handles inconsistent separators (periods vs commas) and formatting.
 *
 * @example
 * formatLocation("San Francisco Bay Area.USA") // "San Francisco Bay Area, USA"
 * formatLocation("London.  UK") // "London, UK"
 * formatLocation("") // "Location not specified"
 */
export function formatLocation(location: string | undefined | null): string {
  if (!location) return 'Location not specified'

  return location
    .replace(/\.\s*/g, ', ') // Period to comma (e.g., "San Francisco.USA" -> "San Francisco, USA")
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/,\s*$/g, '') // Remove trailing comma
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}
