import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createOpportunityTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
) {
  return [
    tool(
      'list_opportunities',
      'List all opportunities for the organization, including active, closed, and draft ones.',
      {},
      async () => {
        console.log('[tool] list_opportunities')
        try {
          const opportunities = await convex.query(
            api.orgOpportunities.listAllByOrg,
            { orgId },
          )

          if (!opportunities || opportunities.length === 0) {
            return {
              content: [
                { type: 'text' as const, text: 'No opportunities found.' },
              ],
            }
          }

          const lines = opportunities.map((opp: any) => {
            const status = opp.status || 'unknown'
            const deadline = opp.deadline
              ? new Date(opp.deadline).toLocaleDateString()
              : 'No deadline'
            return `- **${opp.title || 'Untitled'}** | Status: ${status} | Deadline: ${deadline} | ID: ${opp._id}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Opportunities (${opportunities.length})\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] list_opportunities ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_opportunity',
      'Get detailed information about a specific opportunity. IMPORTANT: You must use a real Convex document ID from list_opportunities (looks like "ps76ne8..."), never guess or abbreviate IDs.',
      {
        opportunityId: z
          .string()
          .describe(
            'The Convex document ID from list_opportunities (e.g. "ps76ne896dw9wzxj2bwpgfzdm981jn45")',
          ),
      },
      async (args) => {
        console.log('[tool] get_opportunity', args.opportunityId)
        try {
          const opp = await convex.query(api.orgOpportunities.get, {
            id: args.opportunityId as Id<'orgOpportunities'>,
          })

          if (!opp) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Opportunity not found: ${args.opportunityId}`,
                },
              ],
            }
          }

          const text = formatOpportunity(opp)
          return { content: [{ type: 'text' as const, text }] }
        } catch (e: any) {
          console.error('[tool] get_opportunity ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'set_quality_score',
      "Set a quality score (0–100) on an application with reasoning. Higher scores increase the applicant's weight in schedule optimization. IMPORTANT: Call list_applications first to get the real application ID. Always include a reason explaining the score.",
      {
        applicationId: z
          .string()
          .describe(
            'The Convex document ID of the application from list_applications',
          ),
        qualityScore: z
          .number()
          .min(0)
          .max(100)
          .describe('Quality score from 0 to 100'),
        reason: z
          .string()
          .optional()
          .describe(
            'Brief explanation of why this score was given (e.g. "Strong ML background, relevant AI safety research experience")',
          ),
      },
      async (args) => {
        console.log(
          '[tool] set_quality_score',
          args.applicationId,
          args.qualityScore,
        )
        try {
          await convex.mutation(api.opportunityApplications.setQualityScore, {
            applicationId: args.applicationId as Id<'opportunityApplications'>,
            qualityScore: args.qualityScore,
            reason: args.reason,
          })
          return {
            content: [
              {
                type: 'text' as const,
                text: `Quality score set to ${args.qualityScore} for application ${args.applicationId}.${args.reason ? ` Reason: ${args.reason}` : ''}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] set_quality_score ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_application',
      'Get full details of a single application including all essay/form responses. Use this to read what an applicant actually wrote. Call list_applications first to get the applicationId.',
      {
        applicationId: z
          .string()
          .describe(
            'The Convex document ID of the application from list_applications',
          ),
      },
      async (args) => {
        console.log('[tool] get_application', args.applicationId)
        try {
          const app = await convex.query(api.opportunityApplications.getById, {
            applicationId: args.applicationId as Id<'opportunityApplications'>,
          })

          if (!app) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Application not found: ${args.applicationId}`,
                },
              ],
            }
          }

          const lines: string[] = [
            `## Application: ${args.applicationId}`,
            `**Status:** ${app.status}`,
            `**Submitted:** ${new Date(app.submittedAt).toLocaleDateString()}`,
            app.qualityScore !== undefined
              ? `**Quality Score:** ${app.qualityScore}`
              : '',
            '',
            '## Responses',
          ]

          if (
            app.responses &&
            typeof app.responses === 'object' &&
            !Array.isArray(app.responses)
          ) {
            for (const [key, value] of Object.entries(
              app.responses as Record<string, unknown>,
            )) {
              if (value === undefined || value === null || value === '')
                continue
              const displayValue = Array.isArray(value)
                ? value.join(', ')
                : String(value)
              lines.push(`**${key}:** ${displayValue}`)
            }
          } else {
            lines.push(String(app.responses))
          }

          return {
            content: [
              { type: 'text' as const, text: lines.filter(Boolean).join('\n') },
            ],
          }
        } catch (e: any) {
          console.error('[tool] get_application ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'list_applications',
      'List applications for a specific opportunity. IMPORTANT: Call list_opportunities first to get the real Convex document ID.',
      {
        opportunityId: z
          .string()
          .describe(
            'The Convex document ID from list_opportunities (e.g. "ps76ne896dw9wzxj2bwpgfzdm981jn45")',
          ),
        statusFilter: z
          .enum([
            'submitted',
            'under_review',
            'accepted',
            'rejected',
            'waitlisted',
          ])
          .optional()
          .describe('Filter applications by status'),
      },
      async (args) => {
        console.log(
          '[tool] list_applications',
          args.opportunityId,
          args.statusFilter,
        )
        try {
          const applications = await convex.query(
            api.opportunityApplications.listByOpportunity,
            {
              opportunityId: args.opportunityId as Id<'orgOpportunities'>,
              statusFilter: args.statusFilter,
            },
          )

          if (!applications || applications.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No applications found${args.statusFilter ? ` with status "${args.statusFilter}"` : ''}.`,
                },
              ],
            }
          }

          // Return shape: { _id, userId, guestEmail, status, submittedAt, responses, qualityScore, ... }
          const lines = applications.map((app: any) => {
            const applicant = app.userId || app.guestEmail || 'Unknown'
            const status = app.status || 'submitted'
            const date = app.submittedAt
              ? new Date(app.submittedAt).toLocaleDateString()
              : 'N/A'
            const score =
              app.qualityScore !== undefined
                ? ` | Score: ${app.qualityScore}`
                : ''
            return `- **${applicant}** | Status: ${status} | Applied: ${date}${score} | ID: ${app._id}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Applications (${applications.length})\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] list_applications ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'fetch_linkedin',
      "Fetch and parse a LinkedIn profile URL using the Exa API. Returns structured data: name, location, education, work history, and skills. Use this when an application includes a LinkedIn URL and you want to evaluate the applicant's background.",
      {
        linkedinUrl: z
          .string()
          .describe(
            'The LinkedIn profile URL (e.g. "https://linkedin.com/in/username")',
          ),
      },
      async (args) => {
        console.log('[tool] fetch_linkedin', args.linkedinUrl)
        try {
          const result = await convex.action(
            api.extraction.linkedin.extractFromLinkedIn,
            { linkedinUrl: args.linkedinUrl },
          )

          const data = (result as any).extractedData
          if (!data) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No data extracted from profile.',
                },
              ],
            }
          }

          const lines: string[] = []

          if (data.name) lines.push(`**Name:** ${data.name}`)
          if (data.location) lines.push(`**Location:** ${data.location}`)

          if (data.education?.length) {
            lines.push('\n## Education')
            for (const edu of data.education) {
              const years = [edu.startYear, edu.endYear]
                .filter(Boolean)
                .join('–')
              lines.push(
                `- **${edu.institution}** ${edu.degree || ''} ${edu.field || ''} ${years ? `(${years})` : ''}`.trim(),
              )
            }
          }

          if (data.workHistory?.length) {
            lines.push('\n## Work Experience')
            for (const job of data.workHistory) {
              const dates = [job.startDate, job.endDate]
                .filter(Boolean)
                .join(' – ')
              lines.push(
                `- **${job.title}** at ${job.organization} ${dates ? `(${dates})` : ''}`,
              )
              if (job.description) lines.push(`  ${job.description}`)
            }
          }

          if (data.skills?.length) {
            lines.push(`\n**Skills:** ${data.skills.join(', ')}`)
          }

          if (data.rawSkills?.length) {
            lines.push(`**Raw Skills:** ${data.rawSkills.join(', ')}`)
          }

          return {
            content: [
              {
                type: 'text' as const,
                text:
                  lines.join('\n') || 'No data extracted from this profile.',
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] fetch_linkedin ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
    tool(
      'create_opportunity',
      'Create a new opportunity for the organization. Returns the new opportunity ID.',
      {
        title: z.string().describe('Title of the opportunity'),
        description: z.string().describe('Description (supports markdown)'),
        type: z
          .enum(['course', 'fellowship', 'job', 'other'])
          .describe('Type of opportunity'),
        status: z
          .enum(['active', 'closed', 'draft'])
          .describe(
            'Initial status — use "active" to publish immediately, "draft" to keep hidden',
          ),
        deadline: z
          .string()
          .optional()
          .describe(
            'Deadline as ISO date string (e.g. "2026-04-01"). Omit for no deadline.',
          ),
        externalUrl: z
          .string()
          .optional()
          .describe('External URL (e.g. for an external application form)'),
        featured: z
          .boolean()
          .optional()
          .describe('Whether to feature this opportunity (default false)'),
        formFields: z
          .any()
          .optional()
          .describe(
            'Form field configuration (JSON). Copy from an existing opportunity via get_opportunity to reuse its form.',
          ),
      },
      async (args) => {
        console.log('[tool] create_opportunity', args.title)
        try {
          const newId = await convex.mutation(api.orgOpportunities.create, {
            orgId,
            title: args.title,
            description: args.description,
            type: args.type,
            status: args.status,
            deadline: args.deadline
              ? new Date(args.deadline).getTime()
              : undefined,
            externalUrl: args.externalUrl,
            featured: args.featured ?? false,
            formFields: args.formFields,
          })
          return {
            content: [
              {
                type: 'text' as const,
                text: `Opportunity created successfully.\n**ID:** ${newId}\n**Title:** ${args.title}\n**Status:** ${args.status}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] create_opportunity ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'update_opportunity',
      'Update fields on an existing opportunity. Only pass the fields you want to change. Use this to close opportunities, change deadlines, set redirects, etc.',
      {
        opportunityId: z
          .string()
          .describe('The Convex document ID of the opportunity to update'),
        title: z.string().optional().describe('New title'),
        description: z.string().optional().describe('New description'),
        type: z
          .enum(['course', 'fellowship', 'job', 'other'])
          .optional()
          .describe('New type'),
        status: z
          .enum(['active', 'closed', 'draft'])
          .optional()
          .describe('New status'),
        deadline: z
          .string()
          .optional()
          .describe('New deadline as ISO date string, or "none" to remove'),
        externalUrl: z.string().optional().describe('New external URL'),
        featured: z.boolean().optional().describe('Whether to feature'),
        formFields: z.any().optional().describe('New form field configuration'),
        redirectOpportunityId: z
          .string()
          .optional()
          .describe(
            'Set a redirect to another opportunity ID. When users visit the old opportunity, they\'ll be shown the new one. Pass "none" to remove redirect.',
          ),
      },
      async (args) => {
        console.log('[tool] update_opportunity', args.opportunityId)
        try {
          const updateArgs: Record<string, unknown> = {
            id: args.opportunityId as Id<'orgOpportunities'>,
          }
          if (args.title !== undefined) updateArgs.title = args.title
          if (args.description !== undefined)
            updateArgs.description = args.description
          if (args.type !== undefined) updateArgs.type = args.type
          if (args.status !== undefined) updateArgs.status = args.status
          if (args.deadline !== undefined) {
            updateArgs.deadline =
              args.deadline === 'none'
                ? undefined
                : new Date(args.deadline).getTime()
          }
          if (args.externalUrl !== undefined)
            updateArgs.externalUrl = args.externalUrl
          if (args.featured !== undefined) updateArgs.featured = args.featured
          if (args.formFields !== undefined)
            updateArgs.formFields = args.formFields
          if (args.redirectOpportunityId !== undefined) {
            updateArgs.redirectOpportunityId =
              args.redirectOpportunityId === 'none'
                ? null
                : args.redirectOpportunityId
          }

          await convex.mutation(api.orgOpportunities.update, updateArgs as any)
          return {
            content: [
              {
                type: 'text' as const,
                text: `Opportunity ${args.opportunityId} updated successfully.`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] update_opportunity ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'duplicate_opportunity',
      'Duplicate an existing opportunity with optional overrides. Copies all fields including form configuration. Great for creating an EOI or new iteration of an existing opportunity. Optionally sets a redirect from the old opportunity to the new one.',
      {
        sourceOpportunityId: z
          .string()
          .describe('The Convex document ID of the opportunity to duplicate'),
        overrides: z
          .object({
            title: z.string().optional().describe('Override the title'),
            description: z
              .string()
              .optional()
              .describe('Override the description'),
            type: z
              .enum(['course', 'fellowship', 'job', 'other'])
              .optional()
              .describe('Override the type'),
            status: z
              .enum(['active', 'closed', 'draft'])
              .optional()
              .describe('Status for the new opportunity (default "draft")'),
            deadline: z
              .string()
              .optional()
              .describe(
                'New deadline as ISO date string. Omit to remove deadline.',
              ),
            externalUrl: z
              .string()
              .optional()
              .describe('Override external URL'),
            featured: z.boolean().optional().describe('Override featured flag'),
            formFields: z
              .any()
              .optional()
              .describe('Override form fields (otherwise copied from source)'),
          })
          .optional()
          .describe('Fields to override on the duplicate'),
        redirectOldToNew: z
          .boolean()
          .optional()
          .describe(
            'If true, set a redirect on the old opportunity pointing to the new one and close the old one (default false)',
          ),
      },
      async (args) => {
        console.log('[tool] duplicate_opportunity', args.sourceOpportunityId)
        try {
          // Fetch the source opportunity
          const source = await convex.query(api.orgOpportunities.get, {
            id: args.sourceOpportunityId as Id<'orgOpportunities'>,
          })

          if (!source) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Source opportunity not found: ${args.sourceOpportunityId}`,
                },
              ],
              isError: true,
            }
          }

          const overrides = args.overrides ?? {}

          // Create the duplicate
          const newId = await convex.mutation(api.orgOpportunities.create, {
            orgId,
            title: overrides.title ?? source.title,
            description: overrides.description ?? source.description,
            type: overrides.type ?? source.type,
            status: overrides.status ?? 'draft',
            deadline: overrides.deadline
              ? new Date(overrides.deadline).getTime()
              : undefined,
            externalUrl: overrides.externalUrl ?? source.externalUrl,
            featured: overrides.featured ?? false,
            formFields: overrides.formFields ?? source.formFields,
          })

          // Optionally redirect old → new and close the old one
          if (args.redirectOldToNew) {
            await convex.mutation(api.orgOpportunities.update, {
              id: args.sourceOpportunityId as Id<'orgOpportunities'>,
              status: 'closed',
              redirectOpportunityId: newId,
            })
          }

          const lines = [
            `Opportunity duplicated successfully.`,
            `**New ID:** ${newId}`,
            `**Title:** ${overrides.title ?? source.title}`,
            `**Status:** ${overrides.status ?? 'draft'}`,
          ]
          if (args.redirectOldToNew) {
            lines.push(
              `**Redirect:** Old opportunity (${args.sourceOpportunityId}) is now closed and redirects to the new one.`,
            )
          }

          return {
            content: [{ type: 'text' as const, text: lines.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] duplicate_opportunity ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}

function formatOpportunity(opp: any): string {
  const sections: string[] = []

  sections.push(`## ${opp.title || 'Untitled Opportunity'}`)
  if (opp.status) sections.push(`**Status:** ${opp.status}`)
  if (opp.description) sections.push(`**Description:** ${opp.description}`)
  if (opp.type) sections.push(`**Type:** ${opp.type}`)
  if (opp.location) sections.push(`**Location:** ${opp.location}`)
  if (opp.deadline) {
    sections.push(
      `**Deadline:** ${new Date(opp.deadline).toLocaleDateString()}`,
    )
  }
  if (opp.compensation) sections.push(`**Compensation:** ${opp.compensation}`)

  if (opp.requirements && opp.requirements.length > 0) {
    sections.push(
      `**Requirements:**\n${opp.requirements.map((r: string) => `  - ${r}`).join('\n')}`,
    )
  }

  if (opp.tags && opp.tags.length > 0) {
    sections.push(`**Tags:** ${opp.tags.join(', ')}`)
  }

  // Fallback for extra fields
  const knownKeys = new Set([
    'title',
    'status',
    'description',
    'type',
    'location',
    'deadline',
    'compensation',
    'requirements',
    'tags',
    '_id',
    '_creationTime',
    'orgId',
  ])

  const extra = Object.entries(opp).filter(
    ([k, v]) => !knownKeys.has(k) && v != null,
  )

  if (extra.length > 0) {
    sections.push('\n**Additional Info:**')
    for (const [key, value] of extra) {
      const formatted =
        typeof value === 'object' ? JSON.stringify(value) : String(value)
      sections.push(`- ${key}: ${formatted}`)
    }
  }

  return sections.join('\n')
}
