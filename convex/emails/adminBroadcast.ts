import { v } from 'convex/values'
import { getLegacyUserEmail } from '../lib/auth'
import { internalMutation, internalQuery } from '../_generated/server'
import { resend } from './send'

const FROM_ADDRESS = 'ASTN <notifications@safetytalent.org>'

export const applicationStatusValidator = v.union(
  v.literal('submitted'),
  v.literal('under_review'),
  v.literal('accepted'),
  v.literal('rejected'),
  v.literal('waitlisted'),
)

/**
 * Get deduplicated recipients for a broadcast email.
 * Resolves email + name from guest or authenticated applicant data.
 */
export const getRecipientsForEmail = internalQuery({
  args: {
    opportunityId: v.id('orgOpportunities'),
    statuses: v.array(applicationStatusValidator),
  },
  returns: v.array(
    v.object({
      email: v.string(),
      name: v.string(),
    }),
  ),
  handler: async (ctx, { opportunityId, statuses }) => {
    const allApps = []
    for (const status of statuses) {
      const apps = await ctx.db
        .query('opportunityApplications')
        .withIndex('by_opportunity_and_status', (q) =>
          q.eq('opportunityId', opportunityId).eq('status', status),
        )
        .collect()
      allApps.push(...apps)
    }

    const seen = new Set<string>()
    const recipients: Array<{ email: string; name: string }> = []

    for (const app of allApps) {
      let email: string | null = null
      let name = 'there'

      if (app.guestEmail) {
        email = app.guestEmail
        const responses = app.responses as Record<string, unknown> | undefined
        if (responses) {
          const firstTextValue = Object.values(responses).find(
            (val) => typeof val === 'string' && val.trim(),
          )
          if (typeof firstTextValue === 'string') {
            name = firstTextValue.trim()
          }
        }
      } else if (app.userId) {
        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', app.userId!))
          .first()

        if (profile?.email) {
          email = profile.email
          name = profile.name || 'there'
        } else {
          email = await getLegacyUserEmail(ctx, app.userId)
        }
      }

      if (email && !seen.has(email.toLowerCase())) {
        seen.add(email.toLowerCase())
        recipients.push({ email, name })
      }
    }

    return recipients
  },
})

/**
 * Verify that a user is an admin of the org that owns the opportunity.
 */
export const verifyOrgAdmin = internalQuery({
  args: {
    userId: v.string(),
    opportunityId: v.id('orgOpportunities'),
  },
  returns: v.boolean(),
  handler: async (ctx, { userId, opportunityId }) => {
    const opportunity = await ctx.db.get('orgOpportunities', opportunityId)
    if (!opportunity) return false

    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), opportunity.orgId))
      .first()

    return membership?.role === 'admin'
  },
})

/**
 * Send a single broadcast email via Resend.
 */
export const sendSingleEmail = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { to, subject, html }) => {
    await resend.sendEmail(ctx, {
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    })
    return null
  },
})
