import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createFacilitatorProposalTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  programId: Id<'programs'>,
) {
  return [
    tool(
      'draft_comment',
      "Draft a comment on a participant's exercise response. The facilitator will review it before the participant sees it.",
      {
        responseId: z.string().describe('The coursePromptResponses ID'),
        content: z.string().describe('The comment text to propose'),
      },
      async (args) => {
        console.log('[tool] draft_comment', args.responseId)
        try {
          await convex.mutation(api.course.proposals.createProposalFromAgent, {
            programId,
            type: 'comment',
            targetId: args.responseId,
            targetType: 'promptResponse',
            content: args.content,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: 'Draft comment created. The facilitator will review and approve/dismiss it.',
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] draft_comment ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'draft_message',
      'Draft a message to a participant. The facilitator will review and can copy it to send via their preferred channel.',
      {
        userId: z.string().describe('Participant to message'),
        content: z.string().describe('The message text'),
      },
      async (args) => {
        console.log('[tool] draft_message', args.userId)
        try {
          await convex.mutation(api.course.proposals.createProposalFromAgent, {
            programId,
            type: 'message',
            targetId: args.userId,
            targetType: 'participant',
            content: args.content,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: 'Draft message created. The facilitator will review it.',
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] draft_message ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'suggest_pairs',
      'Suggest participant pair assignments for a session activity. Include rationale based on complementary backgrounds or exercise responses.',
      {
        content: z
          .string()
          .describe(
            'JSON or markdown describing the pair assignments and rationale',
          ),
      },
      async (args) => {
        console.log('[tool] suggest_pairs')
        try {
          await convex.mutation(api.course.proposals.createProposalFromAgent, {
            programId,
            type: 'pairs',
            content: args.content,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: 'Pair suggestion created.',
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] suggest_pairs ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'flag_pattern',
      'Flag a pattern, misconception, or notable trend observed across participant responses. Useful for session prep.',
      {
        content: z
          .string()
          .describe('Description of the pattern or misconception observed'),
        targetId: z
          .string()
          .optional()
          .describe('Optional prompt ID this pattern relates to'),
        targetType: z.string().optional().describe('e.g., "prompt", "session"'),
      },
      async (args) => {
        console.log('[tool] flag_pattern')
        try {
          await convex.mutation(api.course.proposals.createProposalFromAgent, {
            programId,
            type: 'flag',
            targetId: args.targetId,
            targetType: args.targetType,
            content: args.content,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: 'Pattern flagged for facilitator review.',
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] flag_pattern ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
