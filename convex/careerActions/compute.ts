'use node'

import { v } from 'convex/values'
import Anthropic from '@anthropic-ai/sdk'
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { log } from '../lib/logging'
import {
  ACTION_GENERATION_SYSTEM_PROMPT,
  buildActionGenerationContext,
  buildProfileContext,
  generateCareerActionsTool,
} from './prompts'
import { actionResultSchema } from './validation'

const MODEL_VERSION = 'claude-haiku-4-5-20251001'

export const computeActionsForProfile = internalAction({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    try {
      // 1. Fetch profile
      const profile = await ctx.runQuery(
        internal.careerActions.queries.getFullProfile,
        { profileId },
      )
      if (!profile) {
        log('error', 'computeActionsForProfile: profile not found', {
          profileId,
        })
        return
      }

      // 2. Fetch existing matches for growth area context
      const existingMatches: Array<{
        recommendations: Array<{
          type: string
          action: string
          priority: string
        }>
      }> = await ctx.runQuery(internal.matching.queries.getExistingMatches, {
        profileId,
      })

      // Aggregate recommendations as growth areas
      const growthAreas = existingMatches.flatMap((m) =>
        m.recommendations.map((r) => ({
          type: r.type,
          action: r.action,
        })),
      )

      // 3. Fetch preserved actions (saved/in_progress/done) to avoid duplicates
      const preservedActions: Array<{ type: string; title: string }> =
        await ctx.runQuery(internal.careerActions.queries.getPreservedActions, {
          profileId,
        })

      // 4. Build context strings
      const profileContext = buildProfileContext(profile)
      const contextString = buildActionGenerationContext(
        profileContext,
        growthAreas,
        preservedActions,
      )

      // 5. Call Haiku for action generation
      const anthropic = new Anthropic()
      const response = await anthropic.messages.create({
        model: MODEL_VERSION,
        max_tokens: 4096,
        tools: [generateCareerActionsTool],
        tool_choice: { type: 'tool', name: 'generate_career_actions' },
        system: ACTION_GENERATION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: contextString }],
      })

      // 6. Extract tool_use block
      const toolUse = response.content.find(
        (block) => block.type === 'tool_use',
      )
      if (!toolUse) {
        log('error', 'computeActionsForProfile: no tool use in response', {
          profileId,
        })
        return
      }

      // 7. Validate with Zod (shadow mode: log errors, accept data)
      const parseResult = actionResultSchema.safeParse(toolUse.input)
      if (!parseResult.success) {
        log('error', 'computeActionsForProfile: validation failed', {
          profileId,
          issues: parseResult.error.issues,
        })
      }

      const result = (
        parseResult.success ? parseResult.data : toolUse.input
      ) as {
        actions: Array<{
          type: string
          title: string
          description: string
          rationale: string
          profileBasis?: Array<string>
        }>
      }

      if (!Array.isArray(result.actions) || result.actions.length === 0) {
        log('error', 'computeActionsForProfile: no actions in result', {
          profileId,
        })
        return
      }

      // 8. Save generated actions
      await ctx.runMutation(
        internal.careerActions.mutations.saveGeneratedActions,
        {
          profileId,
          actions: result.actions.map((a) => ({
            type: a.type as
              | 'replicate'
              | 'collaborate'
              | 'start_org'
              | 'identify_gaps'
              | 'volunteer'
              | 'build_tools'
              | 'teach_write'
              | 'develop_skills',
            title: a.title,
            description: a.description,
            rationale: a.rationale,
            profileBasis: a.profileBasis,
          })),
          modelVersion: MODEL_VERSION,
        },
      )

      log('info', 'computeActionsForProfile: success', {
        profileId,
        actionCount: result.actions.length,
      })
    } catch (error: unknown) {
      // Fire-and-forget: log errors but do NOT throw
      // Action generation failing should not surface errors to user
      log('error', 'computeActionsForProfile: failed', {
        profileId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})
