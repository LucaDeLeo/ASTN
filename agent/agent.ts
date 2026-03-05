import { query, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import type {
  AdminAgentEvent,
  AgentModel,
  ThinkingLevel,
} from '../shared/admin-agent/types'
import { mapSdkMessage } from './sdk-mapper'
import { createAvailabilityTools } from './tools/availability'
import { createMemberTools } from './tools/members'
import { createOpportunityTools } from './tools/opportunities'
import { createProgramTools } from './tools/programs'
import { createStatsTools } from './tools/stats'

// Max conversation history entries to pass as context
const MAX_HISTORY = 20

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
    ...createAvailabilityTools(convex, orgId),
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
    '- get_availability_poll(opportunityId): Get the availability poll config for an opportunity',
    '- get_poll_results(pollId): Get all availability responses — who is available when, slot popularity',
    '- get_respondent_application_map(pollId): Map poll respondents to their application IDs (for cross-referencing quality)',
    '- analyze_fixed_schedule(pollId, blockDurationMinutes): Find the best fixed daily time block — ranks all possible start times by attendance across all days, shows per-day breakdown with who can/cannot make it',
    '',
    'Guidelines:',
    "- ALWAYS call tools first, talk second. Never say 'would you like me to...' — just do it.",
    '- Be concise and data-driven. Lead with the answer, not the process.',
    '- Format data as readable markdown — use bold, tables, and lists.',
    '- For broad questions, call multiple tools in parallel to gather context.',
    '- Keep responses short. The admin is busy.',
  ].join('\n')

  function buildThinkingConfig(level: ThinkingLevel) {
    switch (level) {
      case 'off':
        return { type: 'disabled' as const }
      case 'adaptive':
        return { type: 'adaptive' as const }
      case 'high':
        return { type: 'enabled' as const, budgetTokens: 10000 }
      case 'max':
        return { type: 'enabled' as const, budgetTokens: 32000 }
    }
  }

  /** Fetch persisted conversation from Convex and format as context */
  async function buildPromptWithHistory(message: string): Promise<string> {
    try {
      const messages = await convex.query(api.adminAgentChat.getMessages, {
        orgId,
      })
      if (!messages || messages.length === 0) return message

      const recent = messages.slice(-MAX_HISTORY)
      const historyText = recent
        .map((m) => {
          if (m.role === 'user') {
            return `Admin: ${m.content ?? ''}`
          }
          // Assistant messages — extract text from parts
          const text =
            m.parts
              ?.filter((p) => p.type === 'text')
              .map((p) => ('content' in p ? p.content : ''))
              .join('') ?? ''
          return `You (assistant): ${text}`
        })
        .join('\n\n---\n\n')

      return `<conversation_history>\n${historyText}\n</conversation_history>\n\nAdmin's new message:\n${message}`
    } catch (e: any) {
      console.log(`[agent] Could not fetch history: ${e?.message}`)
      return message
    }
  }

  return {
    async *chat(
      message: string,
      model?: AgentModel,
      thinking?: ThinkingLevel,
    ): AsyncGenerator<AdminAgentEvent> {
      const selectedModel = model ?? 'claude-opus-4-6'
      const thinkingConfig = buildThinkingConfig(thinking ?? 'adaptive')

      const prompt = await buildPromptWithHistory(message)
      const historyCount = prompt.includes('<conversation_history>')
        ? 'with history'
        : 'no history'
      console.log(
        `[agent] model=${selectedModel} thinking=${thinking ?? 'adaptive'} ${historyCount}`,
      )

      const q = query({
        prompt,
        options: {
          systemPrompt,
          model: selectedModel,
          thinking: thinkingConfig,
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
