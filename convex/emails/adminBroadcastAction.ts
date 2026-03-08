'use node'

import { v } from 'convex/values'
import { marked } from 'marked'
import { api, internal } from '../_generated/api'
import { action } from '../_generated/server'
import { applicationStatusValidator } from './adminBroadcast'
import { renderAdminBroadcast } from './templates'

/**
 * Send a broadcast email to applicants of an opportunity.
 * Public action called from the admin email compose page.
 *
 * If `pollId` and `pollLinkBase` are provided, `{{poll_link}}` in the markdown body
 * will be replaced with each recipient's unique poll link.
 */
export const sendBroadcastToApplicants = action({
  args: {
    opportunityId: v.id('orgOpportunities'),
    statuses: v.array(applicationStatusValidator),
    subject: v.string(),
    markdownBody: v.string(),
    pollId: v.optional(v.id('availabilityPolls')),
    pollLinkBase: v.optional(v.string()),
  },
  returns: v.object({
    sent: v.number(),
    failed: v.number(),
  }),
  handler: async (
    ctx,
    { opportunityId, statuses, subject, markdownBody, pollId, pollLinkBase },
  ) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const isAdmin: boolean = await ctx.runQuery(
      internal.emails.adminBroadcast.verifyOrgAdmin,
      { userId: identity.subject, opportunityId },
    )
    if (!isAdmin) throw new Error('Admin access required')

    // Rate limit broadcast emails per admin
    await ctx.runMutation(
      internal.emails.adminBroadcast.checkBroadcastRateLimit,
      { userId: identity.subject },
    )

    const recipients: Array<{
      email: string
      name: string
      applicationId: string
    }> = await ctx.runQuery(
      internal.emails.adminBroadcast.getRecipientsForEmail,
      { opportunityId, statuses },
    )

    if (recipients.length === 0) {
      return { sent: 0, failed: 0 }
    }

    // Build applicationId → respondentToken map if poll link substitution is needed
    let tokenMap: Map<string, string> | null = null

    if (pollId && pollLinkBase && markdownBody.includes('{{poll_link}}')) {
      const respondents: Array<{
        respondentToken: string
        applicationId: string
      }> = await ctx.runQuery(api.availabilityPolls.getRespondentLinks, {
        pollId,
      })

      tokenMap = new Map<string, string>()
      for (const r of respondents) {
        tokenMap.set(r.applicationId, r.respondentToken)
      }
    }

    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        // Substitute {{poll_link}} per recipient
        let recipientMarkdown = markdownBody
        if (tokenMap && pollLinkBase) {
          const token = tokenMap.get(recipient.applicationId)
          const link = token ? `${pollLinkBase}/${token}` : pollLinkBase
          recipientMarkdown = recipientMarkdown.replaceAll(
            '{{poll_link}}',
            link,
          )
        }

        const recipientHtml: string = await marked(recipientMarkdown, {
          breaks: true,
          gfm: true,
        })

        const html: string = await renderAdminBroadcast({
          userName: recipient.name,
          bodyHtml: recipientHtml,
        })

        await ctx.runMutation(internal.emails.adminBroadcast.sendSingleEmail, {
          to: recipient.email,
          subject,
          html,
        })
        sent++
      } catch (err) {
        console.error(`Failed to send to ${recipient.email}:`, err)
        failed++
      }
    }

    return { sent, failed }
  },
})
