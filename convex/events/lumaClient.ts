"use node";

// Lu.ma API client for fetching events
// Based on: https://docs.luma.com/reference/get_v1-calendar-list-events

export interface LumaEvent {
  api_id: string;
  event: {
    api_id: string;
    name: string;
    start_at: string; // ISO 8601
    end_at: string | null;
    timezone: string;
    description: string | null;
    description_md: string | null;
    cover_url: string | null;
    url: string;
    meeting_url: string | null;
    geo_address_json: { address?: string } | null;
  };
}

interface LumaListResponse {
  entries: Array<LumaEvent>;
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * Fetch events from Lu.ma API for a calendar.
 * The API key is per-calendar, so it implicitly identifies which calendar to fetch from.
 *
 * @param apiKey - Lu.ma API key (requires Luma Plus subscription)
 * @param options - Optional date filters (ISO 8601 format)
 * @returns Array of Lu.ma events
 */
export async function fetchLumaEvents(
  apiKey: string,
  options?: { after?: string; before?: string }
): Promise<Array<LumaEvent>> {
  const events: Array<LumaEvent> = [];
  let cursor: string | null = null;

  do {
    const params = new URLSearchParams();
    if (options?.after) params.set("after", options.after);
    if (options?.before) params.set("before", options.before);
    if (cursor) params.set("pagination_cursor", cursor);
    params.set("pagination_limit", "100");
    params.set("sort_column", "start_at");
    params.set("sort_direction", "asc");

    const response = await fetch(
      `https://public-api.lu.ma/public/v1/calendar/list-events?${params}`,
      {
        headers: {
          "x-luma-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait 60 seconds and retry once
        console.log("Lu.ma rate limited, waiting 60s...");
        await new Promise((resolve) => setTimeout(resolve, 60000));
        continue;
      }
      throw new Error(`Lu.ma API error: ${response.status} ${response.statusText}`);
    }

    const data: LumaListResponse = await response.json();
    events.push(...data.entries);
    cursor = data.has_more ? data.next_cursor : null;

    // Rate limit protection: 200ms delay between pages
    if (cursor) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } while (cursor);

  return events;
}
