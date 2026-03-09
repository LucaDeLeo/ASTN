'use node'

// Lu.ma public API client for fetching calendar events
// Uses the undocumented but publicly accessible api2.luma.com endpoint
// No API key or Luma Plus subscription required

import { log } from '../lib/logging'

export interface LumaEventEntry {
  api_id: string
  event: {
    api_id: string
    name: string
    start_at: string // ISO 8601
    end_at: string | null
    timezone: string
    cover_url: string | null
    url: string // short slug like "mynllt51"
    location_type: string // "offline" | "online"
    virtual_info: { has_access: boolean } | null
    geo_address_info: {
      address?: string
      full_address?: string
      city?: string
      city_state?: string
    } | null
  }
  guest_count: number | null
}

interface LumaCalendarResponse {
  entries: Array<LumaEventEntry>
  has_more: boolean
  next_cursor?: string | null
}

const CALENDAR_API_URL = 'https://api2.luma.com/calendar/get-items'

/**
 * Fetch events from a Lu.ma calendar using the public API.
 * No API key required - uses the same endpoint as the Luma frontend.
 *
 * @param calendarApiId - The calendar's API ID (e.g., "cal-0oFAsTn5vpwcAwb")
 * @param options - Period filter: "upcoming" or "past"
 * @returns Array of Lu.ma event entries
 */
export async function fetchLumaEvents(
  calendarApiId: string,
  options?: { period?: 'upcoming' | 'past' },
): Promise<Array<LumaEventEntry>> {
  const events: Array<LumaEventEntry> = []
  let cursor: string | null = null

  do {
    const params = new URLSearchParams({
      calendar_api_id: calendarApiId,
      pagination_limit: '50',
    })
    if (options?.period) params.set('period', options.period)
    if (cursor) params.set('pagination_cursor', cursor)

    const response = await fetch(`${CALENDAR_API_URL}?${params}`)

    if (!response.ok) {
      if (response.status === 429) {
        log('warn', 'Lu.ma rate limited, waiting 60s')
        await new Promise((resolve) => setTimeout(resolve, 60000))
        continue
      }
      throw new Error(
        `Lu.ma API error: ${response.status} ${response.statusText}`,
      )
    }

    const data: LumaCalendarResponse = await response.json()
    events.push(...data.entries)
    cursor = data.has_more ? (data.next_cursor ?? null) : null

    // Rate limit protection: 200ms delay between pages
    if (cursor) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  } while (cursor)

  return events
}

/**
 * Resolve a Lu.ma calendar URL to its calendar API ID.
 * Fetches the public calendar page and extracts the ID from __NEXT_DATA__.
 *
 * @param calendarUrl - The public calendar URL (e.g., "https://lu.ma/baish")
 * @returns The calendar API ID (e.g., "cal-0oFAsTn5vpwcAwb")
 */
export async function resolveLumaCalendarId(
  calendarUrl: string,
): Promise<string> {
  // Extract slug from URL (handles both lu.ma/slug and luma.com/slug)
  const url = new URL(calendarUrl)
  const slug = url.pathname.replace(/^\//, '').split('/')[0]
  if (!slug) {
    throw new Error(`Invalid Lu.ma calendar URL: ${calendarUrl}`)
  }

  // Fetch the public calendar page (lu.ma redirects to luma.com)
  const response = await fetch(`https://luma.com/${slug}`, {
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Lu.ma calendar page: ${response.status} ${response.statusText}`,
    )
  }

  const html = await response.text()

  // Extract __NEXT_DATA__ JSON from the page
  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/,
  )
  if (!nextDataMatch) {
    throw new Error('Could not find __NEXT_DATA__ in Lu.ma calendar page')
  }

  const nextData = JSON.parse(nextDataMatch[1])

  // Navigate the Next.js data structure to find the calendar API ID
  // The structure is: props.pageProps.initialData.data.calendar.api_id
  // or it may be at a different path depending on the page structure
  const pageProps = nextData?.props?.pageProps
  const calendarApiId =
    pageProps?.initialData?.data?.calendar?.api_id ??
    pageProps?.calendar?.api_id ??
    findCalendarApiId(nextData)

  if (!calendarApiId || !calendarApiId.startsWith('cal-')) {
    throw new Error(
      `Could not find calendar API ID in Lu.ma page data for slug: ${slug}`,
    )
  }

  return calendarApiId
}

/**
 * Deep search for calendar API ID in the Next.js data structure.
 * Fallback if the expected path doesn't work.
 */
function findCalendarApiId(obj: unknown): string | null {
  if (typeof obj !== 'object' || obj === null) return null

  if (
    'api_id' in (obj as Record<string, unknown>) &&
    typeof (obj as Record<string, unknown>).api_id === 'string' &&
    ((obj as Record<string, unknown>).api_id as string).startsWith('cal-')
  ) {
    return (obj as Record<string, unknown>).api_id as string
  }

  for (const value of Object.values(obj as Record<string, unknown>)) {
    const result = findCalendarApiId(value)
    if (result) return result
  }

  return null
}
