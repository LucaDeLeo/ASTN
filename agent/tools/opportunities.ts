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
      "Set a quality score (0–100) on an application. Higher scores increase the applicant's weight in schedule optimization. IMPORTANT: Call list_applications first to get the real application ID.",
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
          })
          return {
            content: [
              {
                type: 'text' as const,
                text: `Quality score set to ${args.qualityScore} for application ${args.applicationId}.`,
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
