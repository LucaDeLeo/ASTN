'use node'

import { v } from 'convex/values'
import { marked } from 'marked'
import { internal } from '../_generated/api'
import { action } from '../_generated/server'
import { applicationStatusValidator } from './adminBroadcast'
import { renderAdminBroadcast } from './templates'

/**
 * Send a broadcast email to applicants of an opportunity.
 * Public action called from the admin email compose page.
 */
export const sendBroadcastToApplicants = action({
  args: {
    opportunityId: v.id('orgOpportunities'),
    statuses: v.array(applicationStatusValidator),
    subject: v.string(),
    markdownBody: v.string(),
  },
  returns: v.object({
    sent: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, { opportunityId, statuses, subject, markdownBody }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const isAdmin: boolean = await ctx.runQuery(
      internal.emails.adminBroadcast.verifyOrgAdmin,
      { userId: identity.subject, opportunityId },
    )
    if (!isAdmin) throw new Error('Admin access required')

    const recipients: Array<{ email: string; name: string }> =
      await ctx.runQuery(internal.emails.adminBroadcast.getRecipientsForEmail, {
        opportunityId,
        statuses,
      })

    if (recipients.length === 0) {
      return { sent: 0, failed: 0 }
    }

    const bodyHtml = await marked(markdownBody)

    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      try {
        const html: string = await renderAdminBroadcast({
          userName: recipient.name,
          bodyHtml,
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
