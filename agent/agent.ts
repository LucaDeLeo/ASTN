import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../convex/_generated/dataModel'
import type { AdminAgentEvent } from '../shared/admin-agent/types'
import { mapSdkMessage } from './sdk-mapper'
import { createMemberTools } from './tools/members'
import { createOpportunityTools } from './tools/opportunities'
import { createProgramTools } from './tools/programs'
import { createStatsTools } from './tools/stats'

export function createAdminAgent(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  orgName: string,
) {
  // Build tools, MCP server, and system prompt once per connection
  const tools = [
    ...createMemberTools(convex, orgId),
    ...createOpportunityTools(convex, orgId),
    ...createProgramTools(convex, orgId),
    ...createStatsTools(convex, orgId),
  ]

  const mcpServer = createSdkMcpServer({
    name: 'astn-admin',
    version: '0.0.1',
    tools,
  })

  const allowedTools = tools.map((t) => `mcp__astn-admin__${t.name}`)

  const systemPrompt = [
    `You are an AI assistant for org admins of "${orgName}" on the AI Safety Talent Network (ASTN).`,
    'You help admins understand their community: members, engagement, programs, and opportunities.',
    '',
    'CRITICAL RULE: When the admin asks a question, IMMEDIATELY call the relevant tools to get data. Do NOT ask clarifying questions or offer menus of options. Just go get the data and answer. If the question is ambiguous, make your best guess about what tools to call and call them. You can always refine later.',
    '',
    'Available tools:',
    '- list_members: List all org members with profiles, names, emails, roles, completeness',
    '- get_member_profile(userId): Get detailed profile — skills, work history, education, career goals',
    '- get_member_attendance(userId): Get event attendance history for a member',
    '- get_member_engagement(userId): Get engagement level, history, and override status',
    '- list_opportunities: List all opportunities (active, closed, draft)',
    '- get_opportunity(opportunityId): Get full details of a specific opportunity',
    '- list_applications(opportunityId): List applications for an opportunity',
    '- list_programs: List programs with participant counts',
    '- get_org_stats(timeRange?): Member counts, skills distribution, engagement breakdown, event metrics',
    '- get_engagement_overview: Engagement levels for all members at a glance',
    '',
    'Guidelines:',
    "- ALWAYS call tools first, talk second. Never say 'would you like me to...' — just do it.",
    '- Be concise and data-driven. Lead with the answer, not the process.',
    '- Format data as readable markdown — use bold, tables, and lists.',
    '- For broad questions, call multiple tools in parallel to gather context.',
    '- Keep responses short. The admin is busy.',
  ].join('\n')

  return {
    async *chat(message: string): AsyncGenerator<AdminAgentEvent> {
      const q = query({
        prompt: message,
        options: {
          systemPrompt,
          model: 'claude-sonnet-4-6',
          tools: [],
          mcpServers: { 'astn-admin': mcpServer },
          allowedTools,
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
          includePartialMessages: true,
          maxTurns: 10,
          persistSession: false,
          env: { ...process.env, CLAUDECODE: undefined },
          stderr: (data: string) => console.error('[sdk stderr]', data),
        },
      })

      for await (const msg of q) {
        const result = mapSdkMessage(msg)
        if (result) {
          if (Array.isArray(result)) {
            for (const event of result) {
              yield event
            }
          } else {
            yield result
          }
        }
      }
    },
  }
}
