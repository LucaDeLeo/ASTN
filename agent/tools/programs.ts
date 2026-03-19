import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createProgramTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  userId: string,
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

    tool(
      'enroll_participant',
      'Enroll a member in a program. Call list_programs first to get the programId and list_members to get the userId.',
      {
        programId: z
          .string()
          .describe('The Convex document ID of the program from list_programs'),
        userId: z.string().describe('The Clerk user ID from list_members'),
        adminNotes: z
          .string()
          .optional()
          .describe('Optional notes about why this member is being enrolled'),
      },
      async (args) => {
        console.log('[tool] enroll_participant', args.programId, args.userId)
        try {
          const result = await convex.mutation(api.programs.enrollMember, {
            programId: args.programId as Id<'programs'>,
            userId: args.userId,
            adminNotes: args.adminNotes,
          })

          await convex.mutation(api.agentActionLog.logAgentAction, {
            userId,
            orgId,
            toolName: 'enroll_participant',
            params: JSON.stringify({
              programId: args.programId,
              userId: args.userId,
              adminNotes: args.adminNotes,
            }),
            result: JSON.stringify({ participationId: result.participationId }),
            approvalStatus: 'auto' as const,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `User ${args.userId} enrolled in program ${args.programId}. Participation ID: ${result.participationId}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] enroll_participant ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'list_program_participants',
      'List all participants in a program with their names and enrollment details. Use this to find participationIds for remove_participant.',
      {
        programId: z
          .string()
          .describe('The Convex document ID of the program from list_programs'),
      },
      async (args) => {
        console.log('[tool] list_program_participants', args.programId)
        try {
          const participants = await convex.query(
            api.programs.getProgramParticipants,
            {
              programId: args.programId as Id<'programs'>,
            },
          )

          if (!participants || participants.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No participants found in this program.',
                },
              ],
            }
          }

          const lines = participants.map((p: any) => {
            const status = p.status || 'active'
            const enrolled = p.enrolledAt
              ? new Date(p.enrolledAt).toLocaleDateString()
              : 'N/A'
            return `- **${p.memberName}** | Status: ${status} | Enrolled: ${enrolled} | User: ${p.userId} | Participation ID: ${p._id}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Program Participants (${participants.length})\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] list_program_participants ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'remove_participant',
      'Remove a participant from a program. Use list_program_participants to find the participationId.',
      {
        participationId: z
          .string()
          .describe(
            'The Convex document ID of the program participation record',
          ),
        reason: z
          .string()
          .optional()
          .describe('Optional reason for removing the participant'),
      },
      async (args) => {
        console.log('[tool] remove_participant', args.participationId)
        try {
          await convex.mutation(api.programs.unenrollMember, {
            participationId: args.participationId as Id<'programParticipation'>,
            reason: args.reason,
          })

          await convex.mutation(api.agentActionLog.logAgentAction, {
            userId,
            orgId,
            toolName: 'remove_participant',
            params: JSON.stringify({
              participationId: args.participationId,
              reason: args.reason,
            }),
            result: 'success',
            approvalStatus: 'auto' as const,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `Participant ${args.participationId} removed from program.${args.reason ? ` Reason: ${args.reason}` : ''}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] remove_participant ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
