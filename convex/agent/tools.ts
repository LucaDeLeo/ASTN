import { createTool } from '@convex-dev/agent'
import { z } from 'zod'
import { internal } from '../_generated/api'
import { SKILLS_LIST_STRING } from './prompts'

// Helper: look up the current user's profile from tool context
async function getProfile(ctx: {
  userId?: string
  runQuery: (ref: never, args: never) => Promise<unknown>
}) {
  if (!ctx.userId) return null
  return (await ctx.runQuery(
    internal.agent.queries.getProfileByUserId as never,
    { userId: ctx.userId } as never,
  )) as {
    _id: string
    name?: string
    pronouns?: string
    location?: string
    headline?: string
    education?: Array<{
      institution: string
      degree?: string
      field?: string
      startYear?: number
      endYear?: number
      current?: boolean
    }>
    workHistory?: Array<{
      organization: string
      title: string
      startDate?: number
      endDate?: number
      current?: boolean
      description?: string
    }>
    skills?: Array<string>
    careerGoals?: string
    aiSafetyInterests?: Array<string>
    seeking?: string
    matchPreferences?: {
      remotePreference?: string
      roleTypes?: Array<string>
      experienceLevels?: Array<string>
      willingToRelocate?: boolean
      workAuthorization?: string
      minimumSalaryUSD?: number
      availability?: string
      commitmentTypes?: Array<string>
    }
  } | null
}

export const updateBasicInfo = createTool({
  description:
    "Update the user's basic profile info. Call with any subset of: name, pronouns, location, headline.",
  args: z.object({
    name: z.string().optional().describe("The user's full name"),
    pronouns: z
      .string()
      .optional()
      .describe('Pronouns, e.g. "they/them", "she/her"'),
    location: z
      .string()
      .optional()
      .describe('City and country, e.g. "San Francisco, USA"'),
    headline: z
      .string()
      .optional()
      .describe(
        'Short professional headline, e.g. "AI Safety Researcher at Anthropic"',
      ),
  }),
  handler: async (ctx, args): Promise<string> => {
    const profile = await getProfile(ctx)
    if (!profile) return 'Error: profile not found'

    const updates: Record<string, string> = {}
    const previousValues: Record<string, string | undefined> = {}

    if (args.name !== undefined) {
      previousValues.name = profile.name
      updates.name = args.name
    }
    if (args.pronouns !== undefined) {
      previousValues.pronouns = profile.pronouns
      updates.pronouns = args.pronouns
    }
    if (args.location !== undefined) {
      previousValues.location = profile.location
      updates.location = args.location
    }
    if (args.headline !== undefined) {
      previousValues.headline = profile.headline
      updates.headline = args.headline
    }

    if (Object.keys(updates).length === 0) return 'No updates provided'

    const displayParts: Array<string> = []
    if (updates.name) displayParts.push(`name to ${updates.name}`)
    if (updates.pronouns) displayParts.push(`pronouns to ${updates.pronouns}`)
    if (updates.location) displayParts.push(`location to ${updates.location}`)
    if (updates.headline) displayParts.push(`headline to "${updates.headline}"`)
    const displayText = `Updated ${displayParts.join(', ')}`

    await ctx.runMutation(
      internal.agent.mutations.applyToolChange as never,
      {
        profileId: profile._id,
        threadId: ctx.threadId,
        toolName: 'update_basic_info',
        displayText,
        updates: JSON.stringify(updates),
        previousValues: JSON.stringify(previousValues),
      } as never,
    )

    return displayText
  },
})

export const addEducation = createTool({
  description:
    "Add an education entry to the user's profile. Appends to existing education array.",
  args: z.object({
    institution: z.string().describe('Name of the institution'),
    degree: z
      .string()
      .optional()
      .describe('Degree type, e.g. "PhD", "MSc", "BA"'),
    field: z
      .string()
      .optional()
      .describe('Field of study, e.g. "Computer Science"'),
    startYear: z.number().optional().describe('Year started'),
    endYear: z.number().optional().describe('Year completed'),
    current: z.boolean().optional().describe('Whether currently studying here'),
  }),
  handler: async (ctx, args): Promise<string> => {
    const profile = await getProfile(ctx)
    if (!profile) return 'Error: profile not found'

    const existing = profile.education ?? []
    const newEntry = {
      institution: args.institution,
      degree: args.degree,
      field: args.field,
      startYear: args.startYear,
      endYear: args.endYear,
      current: args.current,
    }
    const updated = [...existing, newEntry]

    const displayText = `Added education: ${args.degree ? `${args.degree} ` : ''}${args.field ? `in ${args.field} ` : ''}at ${args.institution}`

    await ctx.runMutation(
      internal.agent.mutations.applyToolChange as never,
      {
        profileId: profile._id,
        threadId: ctx.threadId,
        toolName: 'add_education',
        displayText,
        updates: JSON.stringify({ education: updated }),
        previousValues: JSON.stringify({ education: existing }),
      } as never,
    )

    return displayText
  },
})

export const addWorkExperience = createTool({
  description:
    "Add a work experience entry to the user's profile. Appends to existing work history array. Dates should be YYYY-MM format strings which will be converted to timestamps.",
  args: z.object({
    organization: z.string().describe('Company or organization name'),
    title: z.string().describe('Job title'),
    startDate: z
      .string()
      .optional()
      .describe('Start date in YYYY-MM format, e.g. "2023-01"'),
    endDate: z
      .string()
      .optional()
      .describe('End date in YYYY-MM format, or omit if current'),
    current: z
      .boolean()
      .optional()
      .describe('Whether this is the current role'),
    description: z.string().optional().describe('Brief role description'),
  }),
  handler: async (ctx, args): Promise<string> => {
    const profile = await getProfile(ctx)
    if (!profile) return 'Error: profile not found'

    const existing = profile.workHistory ?? []
    const newEntry = {
      organization: args.organization,
      title: args.title,
      startDate: convertDateString(args.startDate),
      endDate: convertDateString(args.endDate),
      current: args.current,
      description: args.description,
    }
    const updated = [...existing, newEntry]

    const displayText = `Added work experience: ${args.title} at ${args.organization}`

    await ctx.runMutation(
      internal.agent.mutations.applyToolChange as never,
      {
        profileId: profile._id,
        threadId: ctx.threadId,
        toolName: 'add_work_experience',
        displayText,
        updates: JSON.stringify({ workHistory: updated }),
        previousValues: JSON.stringify({ workHistory: existing }),
      } as never,
    )

    return displayText
  },
})

export const setSkills = createTool({
  description: `Replace the user's skills array. Use ONLY skill names from the taxonomy: ${SKILLS_LIST_STRING}. Map mentioned skills to the closest match in the taxonomy.`,
  args: z.object({
    skills: z
      .array(z.string())
      .describe('Array of skill names from the taxonomy'),
  }),
  handler: async (ctx, args): Promise<string> => {
    const profile = await getProfile(ctx)
    if (!profile) return 'Error: profile not found'

    const existing = profile.skills ?? []
    const displayText = `Updated skills`

    await ctx.runMutation(
      internal.agent.mutations.applyToolChange as never,
      {
        profileId: profile._id,
        threadId: ctx.threadId,
        toolName: 'set_skills',
        displayText,
        updates: JSON.stringify({ skills: args.skills }),
        previousValues: JSON.stringify({ skills: existing }),
      } as never,
    )

    return displayText
  },
})

export const setCareerGoals = createTool({
  description:
    "Set the user's career goals description. A paragraph summarizing their aspirations and direction.",
  args: z.object({
    careerGoals: z.string().describe('Career goals paragraph'),
  }),
  handler: async (ctx, args): Promise<string> => {
    const profile = await getProfile(ctx)
    if (!profile) return 'Error: profile not found'

    const existing = profile.careerGoals
    const displayText = `Updated career goals`

    await ctx.runMutation(
      internal.agent.mutations.applyToolChange as never,
      {
        profileId: profile._id,
        threadId: ctx.threadId,
        toolName: 'set_career_goals',
        displayText,
        updates: JSON.stringify({ careerGoals: args.careerGoals }),
        previousValues: JSON.stringify({ careerGoals: existing }),
      } as never,
    )

    return displayText
  },
})

export const setAiSafetyInterests = createTool({
  description:
    "Set the user's AI safety interest areas. Examples: technical alignment, governance, policy, interpretability, field-building, coordination, red teaming.",
  args: z.object({
    interests: z
      .array(z.string())
      .describe('Array of AI safety interest areas'),
  }),
  handler: async (ctx, args): Promise<string> => {
    const profile = await getProfile(ctx)
    if (!profile) return 'Error: profile not found'

    const existing = profile.aiSafetyInterests ?? []
    const displayText = `Updated areas of interest`

    await ctx.runMutation(
      internal.agent.mutations.applyToolChange as never,
      {
        profileId: profile._id,
        threadId: ctx.threadId,
        toolName: 'set_ai_safety_interests',
        displayText,
        updates: JSON.stringify({ aiSafetyInterests: args.interests }),
        previousValues: JSON.stringify({ aiSafetyInterests: existing }),
      } as never,
    )

    return displayText
  },
})

export const setSeeking = createTool({
  description:
    "Set what the user is seeking — their desired role type or contribution. E.g. 'Full-time research position in alignment', 'Part-time policy consulting', 'Volunteer field-building'.",
  args: z.object({
    seeking: z.string().describe('What the user is looking for'),
  }),
  handler: async (ctx, args): Promise<string> => {
    const profile = await getProfile(ctx)
    if (!profile) return 'Error: profile not found'

    const existing = profile.seeking
    const displayText = `Updated looking for`

    await ctx.runMutation(
      internal.agent.mutations.applyToolChange as never,
      {
        profileId: profile._id,
        threadId: ctx.threadId,
        toolName: 'set_seeking',
        displayText,
        updates: JSON.stringify({ seeking: args.seeking }),
        previousValues: JSON.stringify({ seeking: existing }),
      } as never,
    )

    return displayText
  },
})

export const setMatchPreferences = createTool({
  description:
    "Set the user's match preferences for opportunity filtering. Call when they mention constraints like remote-only, role types, relocation, visa, salary, availability, or commitment type. Merges with existing preferences — only sets fields you provide.",
  args: z.object({
    remotePreference: z
      .enum(['remote_only', 'on_site_ok', 'no_preference'])
      .optional()
      .describe('Remote work preference'),
    roleTypes: z
      .array(z.string())
      .optional()
      .describe(
        'Preferred role types, e.g. ["research", "engineering", "policy"]',
      ),
    experienceLevels: z
      .array(z.string())
      .optional()
      .describe('Preferred experience levels, e.g. ["entry", "mid", "senior"]'),
    willingToRelocate: z
      .boolean()
      .optional()
      .describe('Whether the user is willing to relocate'),
    workAuthorization: z
      .string()
      .optional()
      .describe(
        'Work authorization status, e.g. "US citizen", "Need visa sponsorship"',
      ),
    minimumSalaryUSD: z
      .number()
      .optional()
      .describe('Minimum acceptable salary in USD per year'),
    availability: z
      .enum([
        'immediately',
        'within_1_month',
        'within_3_months',
        'within_6_months',
        'not_available',
      ])
      .optional()
      .describe('When the user can start'),
    commitmentTypes: z
      .array(
        z.enum([
          'full_time',
          'part_time',
          'contract',
          'fellowship',
          'internship',
          'volunteer',
        ]),
      )
      .optional()
      .describe('Acceptable commitment types'),
  }),
  handler: async (ctx, args): Promise<string> => {
    const profile = await getProfile(ctx)
    if (!profile) return 'Error: profile not found'

    // Merge with existing preferences
    const existing = profile.matchPreferences ?? {}
    const merged = { ...existing }

    if (args.remotePreference !== undefined)
      merged.remotePreference = args.remotePreference
    if (args.roleTypes !== undefined) merged.roleTypes = args.roleTypes
    if (args.experienceLevels !== undefined)
      merged.experienceLevels = args.experienceLevels
    if (args.willingToRelocate !== undefined)
      merged.willingToRelocate = args.willingToRelocate
    if (args.workAuthorization !== undefined)
      merged.workAuthorization = args.workAuthorization
    if (args.minimumSalaryUSD !== undefined)
      merged.minimumSalaryUSD = args.minimumSalaryUSD
    if (args.availability !== undefined) merged.availability = args.availability
    if (args.commitmentTypes !== undefined)
      merged.commitmentTypes = args.commitmentTypes

    const displayParts: Array<string> = []
    if (args.remotePreference)
      displayParts.push(`remote: ${args.remotePreference.replace(/_/g, ' ')}`)
    if (args.roleTypes?.length)
      displayParts.push(`roles: ${args.roleTypes.join(', ')}`)
    if (args.experienceLevels?.length)
      displayParts.push(`levels: ${args.experienceLevels.join(', ')}`)
    if (args.willingToRelocate !== undefined)
      displayParts.push(
        args.willingToRelocate ? 'willing to relocate' : 'not relocating',
      )
    if (args.workAuthorization)
      displayParts.push(`authorization: ${args.workAuthorization}`)
    if (args.minimumSalaryUSD)
      displayParts.push(
        `min salary: $${args.minimumSalaryUSD.toLocaleString()}`,
      )
    if (args.availability)
      displayParts.push(`available: ${args.availability.replace(/_/g, ' ')}`)
    if (args.commitmentTypes?.length)
      displayParts.push(
        `commitment: ${args.commitmentTypes.map((t) => t.replace(/_/g, ' ')).join(', ')}`,
      )

    const displayText =
      displayParts.length > 0
        ? `Updated match preferences: ${displayParts.join(', ')}`
        : 'Updated match preferences'

    await ctx.runMutation(
      internal.agent.mutations.applyToolChange as never,
      {
        profileId: profile._id,
        threadId: ctx.threadId,
        toolName: 'set_match_preferences',
        displayText,
        updates: JSON.stringify({ matchPreferences: merged }),
        previousValues: JSON.stringify({
          matchPreferences: profile.matchPreferences,
        }),
      } as never,
    )

    return displayText
  },
})

// Convert YYYY-MM date string to Unix timestamp (first of month)
function convertDateString(dateStr?: string): number | undefined {
  if (!dateStr || dateStr.toLowerCase() === 'present') return undefined
  const parts = dateStr.split('-')
  if (parts.length < 2) return undefined
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  if (isNaN(year) || isNaN(month)) return undefined
  return Date.UTC(year, month - 1, 1)
}
