'use node'
import { v } from 'convex/values'
import { internalAction } from '../_generated/server'
import { log } from '../lib/logging'

const AIRTABLE_API_KEY = process.env.AIRTABLE_TOKEN || ''
const AIRTABLE_BASE_ID = process.env.AIRTABLE_EVENTS_BASE_ID || ''
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_EVENTS_TABLE_ID || ''

type AirtableRecord = {
  id: string
  fields: {
    Name?: string
    'Host name'?: string
    Description?: string
    Link?: string | { label?: string; url: string }
    URL?: string | { label?: string; url: string }
    'Applications/registrations close'?: string
    'Location[]'?: Array<string>
    Type?: string | Array<string>
    'Start date'?: string
    'End date'?: string
    'Publish?'?: boolean
    'Hide?'?: boolean
  }
}

type NormalizedOpportunity = {
  sourceId: string
  source: 'aisafety_events'
  title: string
  organization: string
  location: string
  isRemote: boolean
  roleType: string
  description: string
  deadline?: number
  sourceUrl: string
  opportunityType: 'event'
  eventType: string
  startDate?: number
  endDate?: number
}

export const fetchOpportunities = internalAction({
  args: {},
  returns: v.array(
    v.object({
      sourceId: v.string(),
      source: v.literal('aisafety_events'),
      title: v.string(),
      organization: v.string(),
      location: v.string(),
      isRemote: v.boolean(),
      roleType: v.string(),
      description: v.string(),
      deadline: v.optional(v.number()),
      sourceUrl: v.string(),
      opportunityType: v.literal('event'),
      eventType: v.string(),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
    }),
  ),
  handler: async (): Promise<Array<NormalizedOpportunity>> => {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      log('error', 'Missing aisafety events Airtable credentials')
      return []
    }

    const results: Array<AirtableRecord> = []
    let offset: string | undefined

    try {
      do {
        const url = new URL(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
        )
        if (offset) {
          url.searchParams.set('offset', offset)
        }
        url.searchParams.set('pageSize', '100')

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(
            `Airtable API error: ${response.status} ${response.statusText}`,
          )
        }

        const data = (await response.json()) as {
          records: Array<AirtableRecord>
          offset?: string
        }
        results.push(...data.records)
        offset = data.offset

        // Rate limiting: Airtable allows 5 requests/second
        if (offset) {
          await new Promise((resolve) => setTimeout(resolve, 250))
        }
      } while (offset)

      log('info', 'Fetched events from aisafety.com Airtable', {
        count: results.length,
      })

      const now = Date.now()
      return results
        .filter((record) => {
          const fields = record.fields
          // Filter out unpublished, hidden, or unnamed records
          if (!fields.Name) return false
          if (fields['Publish?'] === false) return false
          if (fields['Hide?'] === true) return false

          // Filter out events that can no longer be applied to / already happened
          const closeDate = parseDate(
            fields['Applications/registrations close'],
          )
          if (closeDate && closeDate < now) return false

          // If no close date, filter by start date (event already happened)
          if (!closeDate) {
            const startDate = parseDate(fields['Start date'])
            if (startDate && startDate < now) return false
          }

          return true
        })
        .map((record) => normalizeRecord(record))
    } catch (error) {
      log('error', 'Error fetching events from aisafety.com Airtable', {
        error: String(error),
      })
      return []
    }
  },
})

function normalizeRecord(record: AirtableRecord): NormalizedOpportunity {
  const fields = record.fields
  const locations = fields['Location[]'] || []
  const isRemote = locations.some((l) => l.toLowerCase().includes('online'))
  const physicalLocations = locations.filter(
    (l) => !l.toLowerCase().includes('online'),
  )
  const location =
    physicalLocations.length > 0
      ? physicalLocations.join(', ')
      : isRemote
        ? 'Online'
        : 'Not specified'
  const rawType = fields.Type
  const eventType = (
    Array.isArray(rawType) ? rawType[0] || 'other' : rawType || 'other'
  ).toLowerCase()

  return {
    sourceId: `aisafety-events-${record.id}`,
    source: 'aisafety_events',
    title: fields.Name || 'Untitled',
    organization: fields['Host name'] || 'Unknown',
    location,
    isRemote,
    roleType: mapEventToRoleType(eventType),
    description: fields.Description || '',
    deadline: parseDate(fields['Applications/registrations close']),
    sourceUrl:
      extractUrl(fields.Link) ||
      extractUrl(fields.URL) ||
      'https://www.aisafety.com/events-training',
    opportunityType: 'event',
    eventType,
    startDate: parseDate(fields['Start date']),
    endDate: parseDate(fields['End date']),
  }
}

function extractUrl(
  field?: string | { label?: string; url: string },
): string | undefined {
  if (!field) return undefined
  if (typeof field === 'string') return field
  return field.url
}

function mapEventToRoleType(eventType: string): string {
  // Courses and fellowships map to "training", everything else to "other"
  if (eventType === 'course' || eventType === 'fellowship') return 'training'
  return 'other'
}

function parseDate(dateStr?: string): number | undefined {
  if (!dateStr) return undefined
  try {
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? undefined : date.getTime()
  } catch {
    return undefined
  }
}
