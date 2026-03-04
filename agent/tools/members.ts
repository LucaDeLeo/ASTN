import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createMemberTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
) {
  return [
    tool(
      'list_members',
      'List all org members with their profiles, including name, email, role, and profile completeness.',
      {},
      async () => {
        console.log('[tool] list_members')
        try {
          const members = await convex.query(
            api.orgs.admin.getAllMembersWithProfiles,
            { orgId },
          )

          if (!members || members.length === 0) {
            return {
              content: [{ type: 'text' as const, text: 'No members found.' }],
            }
          }

          // Return shape: { membership, profile, email, completeness }
          const lines = members.map((m: any) => {
            const name = m.profile?.name || 'Unknown'
            const email = m.email || 'N/A'
            const role = m.membership?.role || 'member'
            const completeness =
              m.completeness != null ? `${m.completeness}%` : 'N/A'
            const userId = m.membership?.userId || 'N/A'
            return `- **${name}** (${email}) | Role: ${role} | Profile: ${completeness} | ID: ${userId}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Members (${members.length})\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] list_members ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_member_profile',
      'Get detailed profile information for a specific member, including skills, experience, and interests.',
      {
        userId: z.string().describe('The user ID of the member'),
      },
      async (args) => {
        console.log('[tool] get_member_profile', args.userId)
        try {
          const result = await convex.query(
            api.orgs.members.getMemberProfileForAdmin,
            { orgId, userId: args.userId as Id<'users'> },
          )

          if (!result) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No profile found for user ${args.userId}`,
                },
              ],
            }
          }

          // Return shape: { restricted, profile: { name, headline, location, ... }, email, membership }
          const p = result.profile
          const sections: string[] = []

          sections.push(`## ${p?.name || 'Unknown Member'}`)
          if (result.email) sections.push(`**Email:** ${result.email}`)
          if (p?.headline) sections.push(`**Headline:** ${p.headline}`)
          if (p?.location) sections.push(`**Location:** ${p.location}`)
          if (p?.pronouns) sections.push(`**Pronouns:** ${p.pronouns}`)

          if (p?.skills && Array.isArray(p.skills) && p.skills.length > 0) {
            sections.push(
              `**Skills:** ${p.skills.map((s: any) => (typeof s === 'string' ? s : s.name || s.label || JSON.stringify(s))).join(', ')}`,
            )
          }

          if (
            p?.aiSafetyInterests &&
            Array.isArray(p.aiSafetyInterests) &&
            p.aiSafetyInterests.length > 0
          ) {
            sections.push(
              `**AI Safety Interests:** ${p.aiSafetyInterests.join(', ')}`,
            )
          }

          if (p?.careerGoals)
            sections.push(`**Career Goals:** ${p.careerGoals}`)
          if (p?.seeking) sections.push(`**Seeking:** ${p.seeking}`)

          if (
            p?.education &&
            Array.isArray(p.education) &&
            p.education.length > 0
          ) {
            sections.push('**Education:**')
            for (const ed of p.education) {
              sections.push(
                `  - ${ed.institution || '?'} — ${ed.degree || ''} ${ed.field || ''}`,
              )
            }
          }

          if (
            p?.workHistory &&
            Array.isArray(p.workHistory) &&
            p.workHistory.length > 0
          ) {
            sections.push('**Work History:**')
            for (const w of p.workHistory) {
              sections.push(
                `  - ${w.company || '?'} — ${w.title || w.role || ''}`,
              )
            }
          }

          if (p?.enrichmentSummary) {
            sections.push(`**AI Summary:** ${p.enrichmentSummary}`)
          }

          return {
            content: [{ type: 'text' as const, text: sections.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] get_member_profile ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_member_attendance',
      'Get event attendance history for a specific member.',
      {
        userId: z.string().describe('The user ID of the member'),
      },
      async (args) => {
        console.log('[tool] get_member_attendance', args.userId)
        try {
          const attendance = await convex.query(
            api.orgs.members.getMemberAttendanceHistory,
            { orgId, userId: args.userId as Id<'users'> },
          )

          if (!attendance || attendance.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No attendance records for user ${args.userId}`,
                },
              ],
            }
          }

          // Return shape: { _id, status, respondedAt, feedbackRating, feedbackText, createdAt, event: { title, startAt, ... } }
          const lines = attendance.map((a: any) => {
            const title = a.event?.title || 'Event'
            const date = a.event?.startAt
              ? new Date(a.event.startAt).toLocaleDateString()
              : 'N/A'
            const status = a.status || 'unknown'
            const feedback = a.feedbackRating
              ? ` | Rating: ${a.feedbackRating}/5`
              : ''
            return `- ${title} (${date}) | Status: ${status}${feedback}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Attendance History (${attendance.length} records)\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] get_member_attendance ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_member_engagement',
      'Get engagement level and history for a specific member.',
      {
        userId: z.string().describe('The user ID of the member'),
      },
      async (args) => {
        console.log('[tool] get_member_engagement', args.userId)
        try {
          const engagement = await convex.query(
            api.orgs.members.getMemberEngagementHistory,
            { orgId, userId: args.userId as Id<'users'> },
          )

          if (!engagement) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No engagement data for user ${args.userId}`,
                },
              ],
            }
          }

          // Return shape: { current: { level, computedLevel, adminExplanation, ... }, history: [...] }
          const sections: string[] = []
          sections.push('## Engagement Data')

          if (engagement.current) {
            const c = engagement.current
            sections.push(`**Current Level:** ${c.level || 'unknown'}`)
            sections.push(`**Computed Level:** ${c.computedLevel || 'unknown'}`)
            if (c.adminExplanation)
              sections.push(`**Admin Explanation:** ${c.adminExplanation}`)
            if (c.userExplanation)
              sections.push(`**User Explanation:** ${c.userExplanation}`)
            if (c.hasOverride)
              sections.push(
                `**Override Active:** Yes (${c.overrideNotes || 'no notes'})`,
              )
          } else {
            sections.push('No current engagement record.')
          }

          if (engagement.history && engagement.history.length > 0) {
            sections.push('\n**History:**')
            for (const h of engagement.history) {
              const date = h.performedAt
                ? new Date(h.performedAt).toLocaleDateString()
                : 'N/A'
              sections.push(
                `- ${date}: ${h.action} (${h.previousLevel} → ${h.newLevel})${h.notes ? ` — ${h.notes}` : ''}`,
              )
            }
          }

          return {
            content: [{ type: 'text' as const, text: sections.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] get_member_engagement ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
