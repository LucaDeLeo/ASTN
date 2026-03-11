'use node'

import { v } from 'convex/values'
import { Agent, stepCountIs } from '@convex-dev/agent'
import { anthropic } from '@ai-sdk/anthropic'
import { components, internal } from '../_generated/api'
import { internalAction } from '../_generated/server'

export const learningAgent = new Agent(components.agent, {
  name: 'learning-partner',
  languageModel: anthropic.chat('claude-sonnet-4-6'),
  instructions: '', // Dynamic per-turn
  tools: {},
  stopWhen: stepCountIs(3),
})

/**
 * Stream a response to a participant message in the learning sidebar.
 */
export const streamResponse = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    moduleId: v.id('programModules'),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, promptMessageId, moduleId, userId }) => {
    const context: ModuleContext | null = await ctx.runQuery(
      internal.course.sidebar.buildModuleContext,
      { moduleId, userId },
    )
    if (!context) return null

    const system = buildLearningSystemPrompt(context)

    const { thread } = await learningAgent.continueThread(ctx, { threadId })
    const result = await thread.streamText(
      { promptMessageId, system } as Parameters<typeof thread.streamText>[0],
      { saveStreamDeltas: { chunking: 'word', throttleMs: 100 } },
    )
    await result.consumeStream()
    return null
  },
})

/**
 * Stream proactive feedback after a participant submits a prompt response.
 */
export const streamFeedback = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    moduleId: v.id('programModules'),
    userId: v.string(),
    promptId: v.id('coursePrompts'),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { threadId, promptMessageId, moduleId, userId, promptId },
  ) => {
    // Build context including the specific prompt response
    const context: ModuleContext | null = await ctx.runQuery(
      internal.course.sidebar.buildModuleContext,
      { moduleId, userId },
    )
    if (!context) return null

    // Find the specific prompt and response for richer feedback context
    const prompt = await ctx.runQuery(
      internal.course.sidebar.getPromptWithResponse,
      { promptId, userId },
    )

    const feedbackContext: ModuleContext = prompt
      ? {
          ...context,
          feedbackPrompt: prompt as ModuleContext['feedbackPrompt'],
        }
      : context

    const system = buildLearningSystemPrompt(feedbackContext)

    const { thread } = await learningAgent.continueThread(ctx, { threadId })
    const result = await thread.streamText(
      { promptMessageId, system } as Parameters<typeof thread.streamText>[0],
      { saveStreamDeltas: { chunking: 'word', throttleMs: 100 } },
    )
    await result.consumeStream()
    return null
  },
})

interface ModuleContext {
  moduleTitle: string
  moduleDescription?: string
  materials: Array<{ title: string; type: string; completed: boolean }>
  progress: { completed: number; total: number }
  prompts: Array<{ title: string; userResponse?: string }>
  nextSessionDate?: number
  feedbackPrompt?: {
    title: string
    body?: string
    userResponse: string
  }
}

function buildLearningSystemPrompt(context: ModuleContext): string {
  const parts: Array<string> = []

  parts.push(
    `You are an AI learning partner for an AI safety course. You are helping a participant with the module "${context.moduleTitle}".`,
  )

  if (context.moduleDescription) {
    parts.push(`\nModule description: ${context.moduleDescription}`)
  }

  // Materials overview
  if (context.materials.length > 0) {
    const materialList = context.materials
      .map(
        (m) =>
          `- ${m.title} (${m.type}) ${m.completed ? '[completed]' : '[not completed]'}`,
      )
      .join('\n')
    parts.push(
      `\nModule materials (${context.progress.completed}/${context.progress.total} completed):\n${materialList}`,
    )
  }

  // Prompt responses
  if (context.prompts.length > 0) {
    const promptList = context.prompts
      .map((p) => {
        const response = p.userResponse
          ? p.userResponse.slice(0, 500)
          : '(not yet responded)'
        return `- "${p.title}": ${response}`
      })
      .join('\n')
    parts.push(`\nParticipant's exercise responses:\n${promptList}`)
  }

  // Next session date
  if (context.nextSessionDate) {
    const date = new Date(context.nextSessionDate)
    const daysUntil = Math.ceil(
      (context.nextSessionDate - Date.now()) / (1000 * 60 * 60 * 24),
    )
    parts.push(
      `\nNext session: ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} (${daysUntil > 0 ? `in ${daysUntil} days` : 'today'})`,
    )
  }

  // Proactive feedback context
  if (context.feedbackPrompt) {
    parts.push(
      `\nThe participant just submitted their response to the exercise "${context.feedbackPrompt.title}".`,
    )
    if (context.feedbackPrompt.body) {
      parts.push(`Exercise description: ${context.feedbackPrompt.body}`)
    }
    parts.push(
      `Their response: ${context.feedbackPrompt.userResponse.slice(0, 1000)}`,
    )
    parts.push(
      `\nProvide constructive, Socratic feedback on their submission. Ask guiding questions that help them deepen their understanding. Acknowledge what they got right, then probe areas where their thinking could be more rigorous.`,
    )
  }

  // Socratic method instructions
  parts.push(`

## Your Role and Approach

- When the participant asks about exercises or course concepts, respond with guiding questions that help them think through the problem. Never give direct answers to exercises. Help them discover insights themselves.
- When asked about study priorities or time management, consider which materials are incomplete, which are essential, and proximity to the next session date. Give specific, actionable recommendations.
- Be encouraging but intellectually honest. If the participant's reasoning has gaps, gently probe those gaps.
- Keep responses concise and focused. Avoid lecturing — ask questions that promote active thinking.
- You may reference specific materials by name to guide the participant's study.
- Respond in the same language the participant uses.`)

  return parts.join('\n')
}
