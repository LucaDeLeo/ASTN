import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createFacilitatorReadTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  programId: Id<'programs'>,
) {
  return [
    tool(
      'get_participant_progress',
      "Get all participants' progress in this program — materials completed and prompts submitted.",
      {},
      async () => {
        console.log('[tool] get_participant_progress')
        try {
          const data = await convex.query(
            api.course.facilitatorQueries.getParticipantProgress,
            { programId },
          )

          if (!data || data.length === 0) {
            return {
              content: [
                { type: 'text' as const, text: 'No enrolled participants.' },
              ],
            }
          }

          const lines = data.map(
            (p: any) =>
              `| ${p.name} | ${p.materialsCompleted}/${p.materialsTotal} | ${p.promptsSubmitted}/${p.promptsTotal} | ${p.userId} |`,
          )
          const table = [
            '| Name | Materials | Prompts | User ID |',
            '|------|-----------|---------|---------|',
            ...lines,
          ].join('\n')

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Participant Progress (${data.length})\n\n${table}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] get_participant_progress ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_prompt_responses',
      'Get all participant responses for a specific prompt/exercise. Use get_response_counts first to find prompt IDs.',
      {
        promptId: z.string().describe('The prompt ID to get responses for'),
      },
      async (args) => {
        console.log('[tool] get_prompt_responses', args.promptId)
        try {
          const data = await convex.query(
            api.course.responses.getPromptResponses,
            { promptId: args.promptId as Id<'coursePrompts'> },
          )

          if (!data || data.length === 0) {
            return {
              content: [{ type: 'text' as const, text: 'No responses found.' }],
            }
          }

          const lines = data.map((r: any) => {
            const fields = r.fieldResponses
              .map((f: any) => {
                const val =
                  f.textValue ?? f.selectedOptionIds?.join(', ') ?? '(no value)'
                const truncated =
                  val.length > 500 ? val.slice(0, 500) + '...' : val
                return `  - ${f.fieldId}: ${truncated}`
              })
              .join('\n')
            return `**${r.userId}** (${r.status})${r.spotlighted ? ' ⭐' : ''}\n${fields}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Responses (${data.length})\n\n${lines.join('\n\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] get_prompt_responses ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_response_counts',
      'Get submission counts for all prompts in this program. Shows how many participants have responded to each exercise.',
      {},
      async () => {
        console.log('[tool] get_response_counts')
        try {
          const data = await convex.query(
            api.course.facilitatorQueries.getResponseCounts,
            { programId },
          )

          if (!data || data.length === 0) {
            return {
              content: [
                { type: 'text' as const, text: 'No prompts in this program.' },
              ],
            }
          }

          const lines = data.map(
            (p: any) =>
              `- **${p.promptTitle}** — ${p.responseCount}/${p.participantCount} responses | ID: ${p.promptId}`,
          )

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Response Counts\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] get_response_counts ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_attendance_summary',
      'Get attendance summary for all sessions in this program.',
      {},
      async () => {
        console.log('[tool] get_attendance_summary')
        try {
          const data = await convex.query(
            api.course.facilitatorQueries.getAttendanceSummary,
            { programId },
          )

          if (!data || data.length === 0) {
            return {
              content: [
                { type: 'text' as const, text: 'No sessions in this program.' },
              ],
            }
          }

          const lines = data.map(
            (s: any) =>
              `- **Day ${s.dayNumber}: ${s.sessionTitle}** — ${s.attendeeCount}/${s.participantCount} attended | ${new Date(s.date).toLocaleDateString()}`,
          )

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Attendance Summary\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] get_attendance_summary ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_sidebar_conversations',
      'List AI sidebar conversations. Shows what participants are discussing with their AI learning partner.',
      {
        userId: z
          .string()
          .optional()
          .describe(
            'Filter to a specific participant. Omit to see all threads.',
          ),
      },
      async (args) => {
        console.log('[tool] get_sidebar_conversations', args.userId)
        try {
          let data: any[]
          if (args.userId) {
            data = await convex.query(
              api.course.sidebarQueries.getParticipantThreadsByUser,
              { programId, userId: args.userId },
            )
          } else {
            data = await convex.query(
              api.course.sidebarQueries.getParticipantThreads,
              { programId },
            )
          }

          if (!data || data.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No sidebar conversations found.',
                },
              ],
            }
          }

          const lines = data.map((t: any) => {
            const name = t.userName ?? t.userId ?? 'Unknown'
            return `- **${name}** — ${t.moduleName} | Thread: ${t.threadId} | ${new Date(t.createdAt).toLocaleDateString()}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Sidebar Conversations (${data.length})\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] get_sidebar_conversations ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_participant_profile',
      "Get a participant's full profile including skills, education, and career goals.",
      {
        userId: z.string().describe('The Clerk user ID of the participant'),
      },
      async (args) => {
        console.log('[tool] get_participant_profile', args.userId)
        try {
          const result = await convex.query(
            api.orgs.members.getMemberProfileForAdmin,
            { orgId, userId: args.userId },
          )

          if (!result) {
            return {
              content: [{ type: 'text' as const, text: 'Profile not found.' }],
            }
          }

          const profile = result as any
          const parts: string[] = [`## ${profile.name ?? 'Unknown'}`]

          if (profile.headline) parts.push(`*${profile.headline}*`)
          if (profile.location) parts.push(`📍 ${profile.location}`)

          if (profile.skills?.length) {
            parts.push(
              `\n**Skills:** ${profile.skills.map((s: any) => s.name ?? s).join(', ')}`,
            )
          }

          if (profile.education?.length) {
            parts.push('\n**Education:**')
            for (const e of profile.education) {
              parts.push(
                `- ${e.institution}${e.degree ? ` — ${e.degree}` : ''}${e.field ? ` in ${e.field}` : ''}`,
              )
            }
          }

          if (profile.workHistory?.length) {
            parts.push('\n**Work History:**')
            for (const w of profile.workHistory) {
              parts.push(
                `- ${w.title} at ${w.organization}${w.current ? ' (current)' : ''}`,
              )
            }
          }

          if (profile.careerGoals) {
            parts.push(`\n**Career Goals:** ${profile.careerGoals}`)
          }
          if (profile.aiSafetyMotivation) {
            parts.push(
              `\n**AI Safety Motivation:** ${profile.aiSafetyMotivation}`,
            )
          }

          return {
            content: [{ type: 'text' as const, text: parts.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] get_participant_profile ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
