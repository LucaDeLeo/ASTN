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
      'Get detailed information about a specific opportunity.',
      {
        opportunityId: z
          .string()
          .describe('The ID of the opportunity to retrieve'),
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
      'list_applications',
      'List applications for a specific opportunity, optionally filtered by status.',
      {
        opportunityId: z.string().describe('The ID of the opportunity'),
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

          // Return shape: { _id, userId, guestEmail, status, submittedAt, responses, ... }
          const lines = applications.map((app: any) => {
            const applicant = app.userId || app.guestEmail || 'Unknown'
            const status = app.status || 'submitted'
            const date = app.submittedAt
              ? new Date(app.submittedAt).toLocaleDateString()
              : 'N/A'
            return `- **${applicant}** | Status: ${status} | Applied: ${date} | ID: ${app._id}`
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
