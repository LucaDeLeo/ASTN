/**
 * Normalize location strings from various API sources.
 * Handles inconsistent separators (periods vs commas), literal quotes,
 * and leading-period country-only entries.
 *
 * @example
 * formatLocation("San Francisco Bay Area.USA") // "San Francisco Bay Area, USA"
 * formatLocation("London.  UK") // "London, UK"
 * formatLocation('"Austin, TX.USA"') // "Austin, TX, USA"
 * formatLocation(".USA") // "USA"
 * formatLocation("") // "Location not specified"
 */
export function formatLocation(location: string | undefined | null): string {
  if (!location) return 'Location not specified'

  return location
    .replace(/"/g, '') // Strip literal quote characters
    .replace(/\.\s*/g, ', ') // Period to comma (e.g., "San Francisco.USA" -> "San Francisco, USA")
    .replace(/^,\s*/, '') // Remove leading comma from country-only entries (e.g., ".USA" -> ", USA" -> "USA")
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/,\s*$/g, '') // Remove trailing comma
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}
