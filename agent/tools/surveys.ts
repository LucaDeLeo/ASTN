import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import type { ConfirmationContext } from './confirmable'
import { confirmAction } from './confirmable'

export function createSurveyTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  userId: string,
  confirmCtx: ConfirmationContext,
) {
  return [
    tool(
      'create_survey',
      'Create a feedback survey for an opportunity. Build formFields from the conversation — each field needs: key (camelCase), kind (text/textarea/select/multi_select/checkbox/radio/rating/nps/section_header), label, and optionally description, required, options (for select/multi_select/radio/rating). Call list_opportunities first to get the opportunityId.',
      {
        opportunityId: z
          .string()
          .describe('The opportunity ID from list_opportunities'),
        title: z.string().describe('Survey title shown to respondents'),
        description: z
          .string()
          .optional()
          .describe('Intro text shown before the form'),
        formFields: z
          .array(
            z.object({
              key: z.string(),
              kind: z.string(),
              label: z.string(),
              description: z.string().optional(),
              required: z.boolean().optional(),
              placeholder: z.string().optional(),
              options: z.array(z.string()).optional(),
              maxSelections: z.number().optional(),
              rows: z.number().optional(),
            }),
          )
          .describe('Array of form field definitions'),
      },
      async (args) => {
        console.log('[tool] create_survey', args.opportunityId, args.title)
        try {
          const approved = await confirmAction(confirmCtx, {
            action: 'Create Feedback Survey',
            description: `Create survey "${args.title}" with ${args.formFields.length} question${args.formFields.length !== 1 ? 's' : ''}. Respondent tokens will be generated for all current applicants.`,
            details: {
              title: args.title,
              questions: args.formFields.map((f) => `${f.label} (${f.kind})`),
            },
          })

          if (!approved) {
            return {
              content: [
                { type: 'text' as const, text: 'Action rejected by user.' },
              ],
            }
          }

          const surveyId = await convex.mutation(
            api.feedbackSurveys.createSurvey,
            {
              opportunityId: args.opportunityId as Id<'orgOpportunities'>,
              title: args.title,
              description: args.description,
              formFields: args.formFields,
            },
          )

          return {
            content: [
              {
                type: 'text' as const,
                text: `Survey "${args.title}" created successfully (ID: ${surveyId}). Respondent tokens have been generated for all current applicants. Use the email page with {{survey_link}} to notify them.`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] create_survey ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_survey',
      'Get the feedback survey for an opportunity, including its configuration (title, description, fields, status). Call list_opportunities first to get the opportunityId.',
      {
        opportunityId: z
          .string()
          .describe('The opportunity ID from list_opportunities'),
      },
      async (args) => {
        console.log('[tool] get_survey', args.opportunityId)
        try {
          const survey = await convex.query(
            api.feedbackSurveys.getSurveyByOpportunity,
            {
              opportunityId: args.opportunityId as Id<'orgOpportunities'>,
            },
          )

          if (!survey) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No feedback survey found for this opportunity.',
                },
              ],
            }
          }

          const fields = survey.formFields as Array<{
            label: string
            kind: string
            required?: boolean
          }>
          const text = [
            `## Feedback Survey: ${survey.title}`,
            `**Survey ID:** ${survey._id}`,
            `**Status:** ${survey.status}`,
            survey.description ? `**Description:** ${survey.description}` : '',
            `**Created:** ${new Date(survey.createdAt).toLocaleDateString()}`,
            '',
            `### Questions (${fields.length})`,
            ...fields.map(
              (f, i) =>
                `${i + 1}. ${f.label} (${f.kind})${f.required ? ' *required*' : ''}`,
            ),
          ]
            .filter(Boolean)
            .join('\n')

          return { content: [{ type: 'text' as const, text }] }
        } catch (e: any) {
          console.error('[tool] get_survey ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_survey_results',
      'Get all responses for a feedback survey. Returns per-respondent answers formatted as markdown. Use get_survey first to get the surveyId.',
      {
        surveyId: z.string().describe('The survey ID from get_survey'),
      },
      async (args) => {
        console.log('[tool] get_survey_results', args.surveyId)
        try {
          const results = await convex.query(
            api.feedbackSurveys.getSurveyResults,
            {
              surveyId: args.surveyId as Id<'feedbackSurveys'>,
            },
          )

          const { survey, respondents, responseCount, totalRespondents } =
            results
          const fields = survey.formFields as Array<{
            key: string
            label: string
            kind: string
          }>

          const lines: string[] = [
            `## Survey Results: ${survey.title}`,
            `**Responses:** ${responseCount}/${totalRespondents}`,
            '',
          ]

          const responded = respondents.filter((r) => r.hasResponded)
          const pending = respondents.filter((r) => !r.hasResponded)

          for (const r of responded) {
            lines.push(`### ${r.respondentName}`)
            if (r.response) {
              for (const field of fields) {
                const val = r.response.responses[field.key]
                const display =
                  val === undefined || val === null
                    ? '\u2014'
                    : Array.isArray(val)
                      ? val.join(', ')
                      : String(val)
                lines.push(`- **${field.label}:** ${display}`)
              }
              lines.push(
                `- *Submitted:* ${new Date(r.response.submittedAt).toLocaleDateString()}`,
              )
            }
            lines.push('')
          }

          if (pending.length > 0) {
            lines.push(
              `### Pending (${pending.length})`,
              ...pending.map((r) => `- ${r.respondentName}`),
            )
          }

          return {
            content: [{ type: 'text' as const, text: lines.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] get_survey_results ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_survey_respondent_links',
      'Get respondent tokens for a survey (for email link building). Use get_survey first to get the surveyId.',
      {
        surveyId: z.string().describe('The survey ID from get_survey'),
      },
      async (args) => {
        console.log('[tool] get_survey_respondent_links', args.surveyId)
        try {
          const links = await convex.query(
            api.feedbackSurveys.getRespondentLinks,
            {
              surveyId: args.surveyId as Id<'feedbackSurveys'>,
            },
          )

          if (links.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No respondents linked to this survey.',
                },
              ],
            }
          }

          const lines = [
            `## Survey Respondent Links (${links.length})`,
            '',
            ...links.map(
              (l) =>
                `- **${l.respondentName}** \u2192 Application ID: ${l.applicationId}`,
            ),
          ]

          return {
            content: [{ type: 'text' as const, text: lines.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] get_survey_respondent_links ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'close_survey',
      'Close a feedback survey to stop accepting responses. Use get_survey first to get the surveyId.',
      {
        surveyId: z.string().describe('The survey ID from get_survey'),
      },
      async (args) => {
        console.log('[tool] close_survey', args.surveyId)
        try {
          const approved = await confirmAction(confirmCtx, {
            action: 'Close Survey',
            description: 'Close the survey to stop accepting new responses.',
            details: { surveyId: args.surveyId },
          })

          if (!approved) {
            return {
              content: [
                { type: 'text' as const, text: 'Action rejected by user.' },
              ],
            }
          }

          await convex.mutation(api.feedbackSurveys.closeSurvey, {
            surveyId: args.surveyId as Id<'feedbackSurveys'>,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: 'Survey closed. No new responses will be accepted.',
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] close_survey ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}
