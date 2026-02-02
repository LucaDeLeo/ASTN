'use node'
import { internalAction } from '../_generated/server'
import { log } from '../lib/logging'

// Airtable API access provided by aisafety.com team
const AIRTABLE_API_KEY = process.env.AIRTABLE_TOKEN || ''
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || ''
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Jobs'

type AirtableRecord = {
  id: string
  fields: {
    '!Title'?: string
    '!Org'?: string
    '!Location'?: string
    'Work location'?: string
    '!Description'?: string
    '!Required degree'?: string
    'Vacancy Button'?: string
    'Role type'?: Array<string>
    '!Salary (display)'?: string
    '!Date it closes'?: string
    'Skill set'?: Array<string>
    '!MinimumExperienceLevel'?: Array<string>
  }
}

type NormalizedOpportunity = {
  sourceId: string
  source: 'aisafety_com'
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
}

export const fetchOpportunities = internalAction({
  args: {},
  handler: async (): Promise<Array<NormalizedOpportunity>> => {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      log('error', 'Missing aisafety.com Airtable credentials')
      return []
    }

    const results: Array<AirtableRecord> = []
    let offset: string | undefined

    try {
      // Paginate through all records
      do {
        const url = new URL(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
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

      log('info', 'Fetched opportunities from aisafety.com Airtable', {
        count: results.length,
      })

      return results
        .filter((record) => record.fields['!Title'])
        .map((record) => normalizeAirtableRecord(record))
    } catch (error) {
      log('error', 'Error fetching from aisafety.com Airtable', {
        error: String(error),
      })
      return []
    }
  },
})

function normalizeAirtableRecord(
  record: AirtableRecord,
): NormalizedOpportunity {
  const fields = record.fields
  const location = fields['!Location'] || 'Remote'
  const workLocation = fields['Work location']?.toLowerCase() || ''

  return {
    sourceId: `aisafety-${record.id}`,
    source: 'aisafety_com',
    title: fields['!Title'] || 'Untitled',
    organization: fields['!Org'] || 'Unknown',
    location: location,
    isRemote:
      workLocation === 'remote' || location.toLowerCase().includes('remote'),
    roleType: mapRoleType(
      fields['Skill set']?.join(' ') || fields['!Title'] || '',
    ),
    experienceLevel: mapExperienceLevel(fields['!MinimumExperienceLevel']?.[0]),
    description: fields['!Description'] || '',
    requirements: fields['!Required degree']
      ? [fields['!Required degree']]
      : undefined,
    salaryRange: fields['!Salary (display)'],
    deadline: parseDeadline(fields['!Date it closes']),
    sourceUrl: fields['Vacancy Button'] || `https://www.aisafety.com/jobs`,
  }
}

function mapExperienceLevel(level?: string): string | undefined {
  if (!level) return undefined
  const lower = level.toLowerCase()
  if (lower.includes('entry') || lower.includes('0-4')) return 'entry'
  if (lower.includes('mid') || lower.includes('5-9')) return 'mid'
  if (lower.includes('senior') || lower.includes('10+')) return 'senior'
  return undefined
}

function parseDeadline(dateStr?: string): number | undefined {
  if (!dateStr || dateStr === 'No Deadline' || dateStr.includes('2050'))
    return undefined
  try {
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? undefined : date.getTime()
  } catch {
    return undefined
  }
}

function mapRoleType(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('research')) return 'research'
  if (
    lower.includes('engineer') ||
    lower.includes('developer') ||
    lower.includes('software')
  )
    return 'engineering'
  if (
    lower.includes('operations') ||
    lower.includes('ops') ||
    lower.includes('coordinator')
  )
    return 'operations'
  if (lower.includes('policy') || lower.includes('governance')) return 'policy'
  return 'other'
}
