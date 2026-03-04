import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createProgramTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
) {
  return [
    tool(
      'list_programs',
      'List programs for the organization with participant counts, optionally filtered by status.',
      {
        status: z
          .enum(['planning', 'active', 'completed', 'archived'])
          .optional()
          .describe('Filter programs by status'),
      },
      async (args) => {
        console.log('[tool] list_programs', args.status)
        try {
          const programs = await convex.query(api.programs.getOrgPrograms, {
            orgId,
            status: args.status,
          })

          if (!programs || programs.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No programs found${args.status ? ` with status "${args.status}"` : ''}.`,
                },
              ],
            }
          }

          const lines = programs.map((p: any) => {
            const status = p.status || 'unknown'
            const participants = p.participantCount ?? 'N/A'
            const dates: string[] = []
            if (p.startDate)
              dates.push(`Start: ${new Date(p.startDate).toLocaleDateString()}`)
            if (p.endDate)
              dates.push(`End: ${new Date(p.endDate).toLocaleDateString()}`)
            const dateStr = dates.length > 0 ? ` | ${dates.join(' | ')}` : ''
            return `- **${p.name || 'Untitled'}** | Status: ${status} | Participants: ${participants}${dateStr} | ID: ${p._id}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Programs (${programs.length})\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] list_programs ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
