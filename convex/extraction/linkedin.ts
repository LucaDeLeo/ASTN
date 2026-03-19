'use node'

import Exa from 'exa-js'
import { v } from 'convex/values'
import { action } from '../_generated/server'
import { internal } from '../_generated/api'
import { matchSkillsToTaxonomy } from './skills'
import type { ExtractionResult } from './prompts'

/**
 * Validate and normalize a LinkedIn profile URL.
 */
function validateLinkedInUrl(url: string): string {
  let normalized = url.trim()
  if (!normalized.startsWith('http')) {
    normalized = `https://${normalized}`
  }

  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch {
    throw new Error('Invalid URL format')
  }

  if (!parsed.hostname.endsWith('linkedin.com')) {
    throw new Error('Not a LinkedIn URL')
  }
  if (!parsed.pathname.startsWith('/in/')) {
    throw new Error('URL must be a LinkedIn profile URL (linkedin.com/in/...)')
  }

  // Extract just the username from /in/username/... stripping extra path
  // segments (e.g. /details/experience/) and all query params (?locale=,
  // ?trk=, UTM params) that can cause Exa to match the wrong person.
  const username = parsed.pathname.split('/').filter(Boolean)[1]
  if (!username) {
    throw new Error('Could not extract LinkedIn username from URL')
  }

  return `https://www.linkedin.com/in/${username}`
}

// --- Exa entity types (from actual API response) ---

interface ExaPersonEntity {
  type: 'person'
  properties?: {
    name?: string | null
    location?: string | null
    workHistory?: Array<{
      title?: string | null
      location?: string | null
      dates?: { from?: string | null; to?: string | null } | null
      company?: { id?: string | null; name?: string | null } | null
    }>
    educationHistory?: Array<{
      degree?: string | null
      dates?: { from?: string | null; to?: string | null } | null
      institution?: { id?: string | null; name?: string | null } | null
    }>
  }
}

function getPersonEntity(
  entities: Array<{ type: string }>,
): ExaPersonEntity | undefined {
  return entities.find((e) => e.type === 'person') as
    | ExaPersonEntity
    | undefined
}

// --- Entity mappers ---

function mapEducation(person: ExaPersonEntity): ExtractionResult['education'] {
  const items = person.properties?.educationHistory
  if (!items || items.length === 0) return undefined

  const mapped: NonNullable<ExtractionResult['education']> = []

  for (const e of items) {
    if (!e.institution?.name) continue

    const edu: NonNullable<ExtractionResult['education']>[number] = {
      institution: e.institution.name,
    }

    if (e.degree) {
      // Split "Licenciatura en Ciencias de la Computacion, Artificial Intelligence"
      // into degree + field on the last comma
      const commaIdx = e.degree.lastIndexOf(',')
      if (commaIdx > 0) {
        edu.degree = e.degree.substring(0, commaIdx).trim()
        edu.field = e.degree.substring(commaIdx + 1).trim()
      } else {
        edu.degree = e.degree
      }
    }

    if (e.dates?.from) {
      edu.startYear = parseInt(e.dates.from.substring(0, 4))
    }
    if (e.dates?.to) {
      const toYear = parseInt(e.dates.to.substring(0, 4))
      if (!isNaN(toYear)) {
        edu.endYear = toYear
      }
    }
    if (e.dates?.from && !e.dates.to) {
      edu.current = true
    }

    mapped.push(edu)
  }

  return mapped.length > 0 ? mapped : undefined
}

function mapWorkHistory(
  person: ExaPersonEntity,
): ExtractionResult['workHistory'] {
  const items = person.properties?.workHistory
  if (!items || items.length === 0) return undefined

  const mapped: NonNullable<ExtractionResult['workHistory']> = []

  for (const w of items) {
    if (!w.company?.name || !w.title) continue

    const entry: NonNullable<ExtractionResult['workHistory']>[number] = {
      organization: w.company.name,
      title: w.title,
    }

    if (w.dates?.from) {
      entry.startDate = w.dates.from.substring(0, 7)
    }
    if (w.dates?.to) {
      entry.endDate = w.dates.to.substring(0, 7)
    } else if (w.dates?.from) {
      entry.endDate = 'present'
      entry.current = true
    }

    mapped.push(entry)
  }

  return mapped.length > 0 ? mapped : undefined
}

// --- Text parsing for descriptions and skills ---

/**
 * Extract role descriptions from the LinkedIn profile markdown text.
 * Each experience entry in Exa's text looks like:
 *
 *   ### Title at [Company](link) (Current)
 *   Date range • Duration
 *   Location (optional)
 *   Company: size info
 *   Description text...
 *   Department: ... • Level: ...
 *
 * We match each work history entry to its text section and extract the description.
 */
function enrichWorkDescriptions(
  workHistory: NonNullable<ExtractionResult['workHistory']>,
  text: string,
): void {
  // Find the Experience section
  const expMatch = text.match(
    /##\s*Experience\s*\n([\s\S]*?)(?=\n##\s[^#]|\n#\s|$)/,
  )
  if (!expMatch) return

  const expSection = expMatch[1]

  // Split into individual entries by ### headers
  const entryBlocks = expSection.split(/\n(?=###\s)/)

  for (const job of workHistory) {
    // Find the matching text block for this job
    const block = entryBlocks.find((b) => {
      const firstLine = b.split('\n')[0] || ''
      // Match on title AND company name in the ### header
      return (
        firstLine.includes(job.title) && firstLine.includes(job.organization)
      )
    })

    if (!block) continue

    const lines = block.split('\n').slice(1) // skip ### header
    const descLines: Array<string> = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Skip metadata lines
      if (/^\w{3}\s+\d{4}\s*[-–]/.test(trimmed)) continue // "Oct 2025 - Present • 3 months"
      if (trimmed.startsWith('Company:')) continue // "Company: 1-10 employees..."
      if (trimmed.startsWith('Department:')) continue // "Department: C-Suite • Level: Founder"
      if (trimmed.startsWith('Level:')) continue
      // Skip location-only lines (short, no punctuation except comma)
      if (
        trimmed.length < 50 &&
        /^[A-Z][\w\s,]+$/.test(trimmed) &&
        !trimmed.includes('.')
      )
        continue

      descLines.push(trimmed)
    }

    if (descLines.length > 0) {
      job.description = descLines.join('\n').substring(0, 1000)
    }
  }
}

/**
 * Parse skills from LinkedIn profile markdown text.
 * Exa returns skills as: "skill1 • skill2 • skill3" or comma/newline separated.
 */
function parseSkills(text: string): Array<string> {
  const sectionMatch = text.match(
    /##\s*Skills\s*\n([\s\S]*?)(?=\n##\s[^#]|\n#\s|$)/,
  )
  if (!sectionMatch) return []

  const section = sectionMatch[1]
  const skills: Array<string> = []

  // Try bullet list
  const bulletItems = section.match(/^[-*]\s+(.+)$/gm)
  if (bulletItems && bulletItems.length > 0) {
    for (const item of bulletItems) {
      const skill = item.replace(/^[-*]\s+/, '').trim()
      if (skill) skills.push(skill)
    }
    return skills
  }

  // Try separator-delimited (· or • or |)
  if (
    section.includes('\u00b7') ||
    section.includes('\u2022') ||
    section.includes('|')
  ) {
    const items = section.split(/[\u00b7\u2022|]/)
    for (const item of items) {
      const skill = item.trim()
      if (skill && !skill.startsWith('#')) skills.push(skill)
    }
    return skills
  }

  // Fall back to comma-delimited or one-per-line
  const lines = section
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#'))
  for (const line of lines) {
    if (line.includes(',')) {
      for (const s of line.split(',')) {
        const skill = s.trim()
        if (skill) skills.push(skill)
      }
    } else {
      const skill = line.trim()
      if (skill) skills.push(skill)
    }
  }

  return skills
}

// --- Main action ---

export const extractFromLinkedIn = action({
  args: { linkedinUrl: v.string() },
  handler: async (ctx, { linkedinUrl }) => {
    const normalizedUrl = validateLinkedInUrl(linkedinUrl)

    const apiKey = process.env.EXA_API_KEY
    if (!apiKey) {
      throw new Error('EXA_API_KEY environment variable not configured')
    }

    const exa = new Exa(apiKey)
    const result = await exa.search(normalizedUrl, {
      category: 'people',
      numResults: 1,
      type: 'auto',
      contents: {
        text: { verbosity: 'full' } as Record<string, unknown>,
      },
    })

    if (result.results.length === 0) {
      throw new Error(
        'No profile found for this LinkedIn URL. Please check the URL and try again.',
      )
    }

    const profile = result.results[0]
    const text = profile.text || ''
    const entities = (profile.entities ?? []) as Array<{ type: string }>
    const person = getPersonEntity(entities)

    // 1. Map structured entities
    const name =
      person?.properties?.name ||
      profile.title?.replace(/\s*[-|].*/, '') ||
      undefined
    const location = person?.properties?.location || undefined
    const education = person ? mapEducation(person) : undefined
    const workHistory = person ? mapWorkHistory(person) : undefined

    // 2. Enrich work history with descriptions from text
    if (workHistory) {
      enrichWorkDescriptions(workHistory, text)
    }

    // 3. Parse skills from text + match to taxonomy
    const rawSkills = parseSkills(text)
    const taxonomy = await ctx.runQuery(
      internal.extraction.queries.getSkillsTaxonomy,
    )
    const matchedSkills = matchSkillsToTaxonomy(rawSkills, taxonomy)

    return {
      success: true as const,
      extractedData: {
        name: name || undefined,
        location: location || undefined,
        education,
        workHistory,
        skills: matchedSkills.length > 0 ? matchedSkills : undefined,
        rawSkills: rawSkills.length > 0 ? rawSkills : undefined,
      },
    }
  },
})
