import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import type { ConfirmationContext } from './confirmable'
import { confirmAction } from './confirmable'

export function createMemberTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  userId: string,
  confirmCtx: ConfirmationContext,
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
        userId: z
          .string()
          .describe(
            'The Clerk user ID from list_members (looks like "user_39zX...")',
          ),
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
        userId: z
          .string()
          .describe(
            'The Clerk user ID from list_members (looks like "user_39zX...")',
          ),
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
        userId: z
          .string()
          .describe(
            'The Clerk user ID from list_members (looks like "user_39zX...")',
          ),
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

    tool(
      'override_engagement',
      "Override a member's engagement level. Requires notes explaining why. Call get_member_engagement first to see current level. Levels: 'highly_engaged', 'moderate', 'at_risk', 'new', 'inactive'.",
      {
        userId: z
          .string()
          .describe('The Clerk user ID from list_members'),
        level: z
          .enum(['highly_engaged', 'moderate', 'at_risk', 'new', 'inactive'])
          .describe('The new engagement level to set'),
        notes: z
          .string()
          .describe('Required explanation for why this override is being set'),
        expiresInDays: z
          .number()
          .optional()
          .describe('Optional: auto-expire this override after N days'),
      },
      async (args) => {
        console.log('[tool] override_engagement', args.userId, args.level)
        try {
          // Look up engagement record by userId + orgId
          const engagement = await convex.query(
            api.engagement.queries.getMemberEngagementForAdmin,
            { orgId, userId: args.userId },
          )

          if (!engagement) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No engagement record found for user ${args.userId}. Engagement must be computed first.`,
                },
              ],
              isError: true,
            }
          }

          const expiresAt = args.expiresInDays
            ? Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000
            : undefined

          await convex.mutation(api.engagement.mutations.overrideEngagement, {
            engagementId: engagement._id as Id<'memberEngagement'>,
            newLevel: args.level,
            notes: args.notes,
            expiresAt,
          })

          await convex.mutation(api.agentActionLog.logAgentAction, {
            userId,
            orgId,
            toolName: 'override_engagement',
            params: JSON.stringify({
              userId: args.userId,
              level: args.level,
              notes: args.notes,
              expiresInDays: args.expiresInDays,
            }),
            result: 'success',
            approvalStatus: 'auto' as const,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `Engagement override set for user ${args.userId}: ${args.level}. Notes: ${args.notes}${args.expiresInDays ? `. Expires in ${args.expiresInDays} days.` : ''}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] override_engagement ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'clear_engagement_override',
      "Clear an engagement override for a member, returning them to their computed level. Call get_member_engagement first to verify there's an active override.",
      {
        userId: z
          .string()
          .describe('The Clerk user ID from list_members'),
      },
      async (args) => {
        console.log('[tool] clear_engagement_override', args.userId)
        try {
          // Look up engagement record by userId + orgId
          const engagement = await convex.query(
            api.engagement.queries.getMemberEngagementForAdmin,
            { orgId, userId: args.userId },
          )

          if (!engagement) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No engagement record found for user ${args.userId}.`,
                },
              ],
              isError: true,
            }
          }

          await convex.mutation(api.engagement.mutations.clearOverride, {
            engagementId: engagement._id as Id<'memberEngagement'>,
          })

          await convex.mutation(api.agentActionLog.logAgentAction, {
            userId,
            orgId,
            toolName: 'clear_engagement_override',
            params: JSON.stringify({ userId: args.userId }),
            result: 'success',
            approvalStatus: 'auto' as const,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `Engagement override cleared for user ${args.userId}. They will return to their computed level.`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] clear_engagement_override ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    // ── Confirmable write tools ──────────────────────────────

    tool(
      'promote_to_admin',
      'Promote a member to admin role (requires user confirmation). Call list_members first to get the userId.',
      {
        userId: z
          .string()
          .describe('The Clerk user ID from list_members'),
      },
      async (args) => {
        console.log('[tool] promote_to_admin', args.userId)
        try {
          // Look up the member to get their name and membershipId
          const members = await convex.query(
            api.orgs.admin.getAllMembersWithProfiles,
            { orgId },
          )
          const member = members?.find(
            (m: any) => m.membership?.userId === args.userId,
          )

          if (!member || !member.membership) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Member not found: ${args.userId}`,
                },
              ],
              isError: true,
            }
          }

          const memberName = member.profile?.name || member.email || args.userId
          const currentRole = member.membership.role || 'member'

          if (currentRole === 'admin') {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `${memberName} is already an admin.`,
                },
              ],
            }
          }

          const approved = await confirmAction(confirmCtx, {
            action: 'Promote to Admin',
            description: `Promote ${memberName} from ${currentRole} to admin`,
            details: {
              member: memberName,
              currentRole,
              newRole: 'admin',
            },
          })

          await convex.mutation(api.agentActionLog.logAgentAction, {
            userId,
            orgId,
            toolName: 'promote_to_admin',
            params: JSON.stringify({ userId: args.userId }),
            result: approved ? 'approved' : 'rejected',
            approvalStatus: approved ? 'approved' : 'rejected',
          })

          if (!approved) {
            return {
              content: [
                { type: 'text' as const, text: 'Action rejected by user.' },
              ],
            }
          }

          await convex.mutation(api.orgs.admin.promoteToAdmin, {
            orgId,
            membershipId: member.membership._id as Id<'orgMemberships'>,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `${memberName} has been promoted to admin.`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] promote_to_admin ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'demote_to_member',
      'Demote an admin to regular member role (requires user confirmation). Call list_members first to get the userId.',
      {
        userId: z
          .string()
          .describe('The Clerk user ID from list_members'),
      },
      async (args) => {
        console.log('[tool] demote_to_member', args.userId)
        try {
          // Look up the member to get their name and membershipId
          const members = await convex.query(
            api.orgs.admin.getAllMembersWithProfiles,
            { orgId },
          )
          const member = members?.find(
            (m: any) => m.membership?.userId === args.userId,
          )

          if (!member || !member.membership) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Member not found: ${args.userId}`,
                },
              ],
              isError: true,
            }
          }

          const memberName = member.profile?.name || member.email || args.userId
          const currentRole = member.membership.role || 'member'

          if (currentRole !== 'admin') {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `${memberName} is not an admin (current role: ${currentRole}).`,
                },
              ],
            }
          }

          const approved = await confirmAction(confirmCtx, {
            action: 'Demote to Member',
            description: `Demote ${memberName} from admin to member`,
            details: {
              member: memberName,
              currentRole: 'admin',
              newRole: 'member',
            },
          })

          await convex.mutation(api.agentActionLog.logAgentAction, {
            userId,
            orgId,
            toolName: 'demote_to_member',
            params: JSON.stringify({ userId: args.userId }),
            result: approved ? 'approved' : 'rejected',
            approvalStatus: approved ? 'approved' : 'rejected',
          })

          if (!approved) {
            return {
              content: [
                { type: 'text' as const, text: 'Action rejected by user.' },
              ],
            }
          }

          await convex.mutation(api.orgs.admin.demoteToMember, {
            orgId,
            membershipId: member.membership._id as Id<'orgMemberships'>,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `${memberName} has been demoted to member.`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] demote_to_member ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
