import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createStatsTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
) {
  return [
    tool(
      'get_org_stats',
      'Get organization statistics including member counts, skill distribution, and engagement metrics.',
      {
        timeRange: z
          .enum(['7d', '30d', '90d', 'all'])
          .optional()
          .describe('Time range for stats (default: 30d)'),
      },
      async (args) => {
        console.log('[tool] get_org_stats', args.timeRange)
        try {
          const stats = await convex.query(api.orgs.stats.getEnhancedOrgStats, {
            orgId,
            timeRange: args.timeRange,
          })

          if (!stats) {
            return {
              content: [{ type: 'text' as const, text: 'No stats available.' }],
            }
          }

          // Return shape: { memberCount, adminCount, joinedThisMonth, skillsDistribution,
          //   completenessDistribution, engagementDistribution, careerDistribution,
          //   eventMetrics, timeRange }
          const sections: string[] = []
          sections.push('## Organization Statistics')
          sections.push(`**Time Range:** ${stats.timeRange || '30d'}`)
          sections.push(`**Total Members:** ${stats.memberCount ?? 'N/A'}`)
          sections.push(`**Admins:** ${stats.adminCount ?? 'N/A'}`)
          sections.push(
            `**New Members (period):** ${stats.joinedThisMonth ?? 'N/A'}`,
          )

          if (stats.engagementDistribution) {
            const engagement = Object.entries(stats.engagementDistribution)
              .map(([level, count]) => `${level}: ${count}`)
              .join(', ')
            sections.push(`**Engagement Distribution:** ${engagement}`)
          }

          if (
            stats.skillsDistribution &&
            Array.isArray(stats.skillsDistribution) &&
            stats.skillsDistribution.length > 0
          ) {
            const skills = stats.skillsDistribution
              .slice(0, 10)
              .map((s: any) => `${s.skill || s.name}: ${s.count}`)
              .join(', ')
            sections.push(`**Top Skills:** ${skills}`)
          }

          if (stats.eventMetrics) {
            const em = stats.eventMetrics
            sections.push(
              `**Event Metrics:** ${em.totalResponses ?? 0} responses, ${em.attendedCount ?? 0} attended, ${em.attendanceRate != null ? `${Math.round(em.attendanceRate * 100)}%` : 'N/A'} attendance rate`,
            )
          }

          if (stats.completenessDistribution) {
            const completeness = Object.entries(stats.completenessDistribution)
              .map(([range, count]) => `${range}: ${count}`)
              .join(', ')
            sections.push(`**Profile Completeness:** ${completeness}`)
          }

          if (
            stats.careerDistribution &&
            Array.isArray(stats.careerDistribution) &&
            stats.careerDistribution.length > 0
          ) {
            const careers = stats.careerDistribution
              .map((c: any) => `${c.category || c.name}: ${c.count}`)
              .join(', ')
            sections.push(`**Career Distribution:** ${careers}`)
          }

          return {
            content: [{ type: 'text' as const, text: sections.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] get_org_stats ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_engagement_overview',
      'Get engagement levels for all members in the organization.',
      {},
      async () => {
        console.log('[tool] get_engagement_overview')
        try {
          const engagement = await convex.query(
            api.engagement.queries.getOrgEngagementForAdmin,
            { orgId },
          )

          if (!engagement || engagement.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No engagement data available.',
                },
              ],
            }
          }

          // Return shape: { _id, userId, level, computedLevel, adminExplanation, hasOverride, overrideNotes }
          const lines = engagement.map((e: any) => {
            const userId = e.userId || 'unknown'
            const level = e.level || 'unknown'
            const override = e.hasOverride ? ' (overridden)' : ''
            const explanation = e.adminExplanation
              ? ` — ${e.adminExplanation}`
              : ''
            return `- User ${userId} | Level: **${level}**${override}${explanation}`
          })

          // Summarize by level
          const levelCounts: Record<string, number> = {}
          for (const e of engagement as any[]) {
            const level = e.level || 'unknown'
            levelCounts[level] = (levelCounts[level] || 0) + 1
          }

          const summary = Object.entries(levelCounts)
            .map(([level, count]) => `${level}: ${count}`)
            .join(' | ')

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Engagement Overview (${engagement.length} members)\n\n**Summary:** ${summary}\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] get_engagement_overview ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
