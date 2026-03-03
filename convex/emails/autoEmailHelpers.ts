import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'
import { resolveApplicantDisplayName } from '../lib/applicantName'
import { getLegacyUserEmail } from '../lib/auth'

/**
 * Get application + auto-email config in a single query transaction.
 * Avoids redundant application fetches across separate queries.
 */
export const getApplicationAndConfig = internalQuery({
  args: { applicationId: v.id('opportunityApplications') },
  returns: v.union(
    v.object({
      application: v.object({
        _id: v.id('opportunityApplications'),
        opportunityId: v.id('orgOpportunities'),
        orgId: v.id('organizations'),
        userId: v.optional(v.string()),
        guestEmail: v.optional(v.string()),
        responses: v.any(),
      }),
      config: v.union(
        v.object({
          enabled: v.boolean(),
          triggers: v.array(v.string()),
          subject: v.string(),
          markdownBody: v.string(),
          requiresPoll: v.boolean(),
        }),
        v.null(),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, { applicationId }) => {
    const app = await ctx.db.get('opportunityApplications', applicationId)
    if (!app) return null

    const config = await ctx.db
      .query('opportunityAutoEmails')
      .withIndex('by_opportunity', (q) =>
        q.eq('opportunityId', app.opportunityId),
      )
      .first()

    return {
      application: {
        _id: app._id,
        opportunityId: app.opportunityId,
        orgId: app.orgId,
        userId: app.userId,
        guestEmail: app.guestEmail,
        responses: app.responses,
      },
      config: config
        ? {
            enabled: config.enabled,
            triggers: config.triggers,
            subject: config.subject,
            markdownBody: config.markdownBody,
            requiresPoll: config.requiresPoll,
          }
        : null,
    }
  },
})

/**
 * Resolve recipient email + name, and poll respondent token in a single query.
 * Combines what was previously separate resolveRecipient + getPollLinkForApplication.
 */
export const getRecipientAndPollToken = internalQuery({
  args: { applicationId: v.id('opportunityApplications') },
  returns: v.union(
    v.object({
      email: v.string(),
      name: v.string(),
      pollToken: v.union(
        v.object({
          accessToken: v.string(),
          respondentToken: v.string(),
          orgSlug: v.string(),
        }),
        v.null(),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, { applicationId }) => {
    const app = await ctx.db.get('opportunityApplications', applicationId)
    if (!app) return null

    // Resolve email + name
    let email: string | null = null
    let name = 'there'

    if (app.guestEmail) {
      email = app.guestEmail
      name = resolveApplicantDisplayName({
        responses: app.responses,
        fallback: 'there',
      })
    } else if (app.userId) {
      const userId = app.userId
      const profile = await ctx.db
        .query('profiles')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .first()

      name = resolveApplicantDisplayName({
        profileName: profile?.name,
        responses: app.responses,
        fallback: 'there',
      })

      if (profile?.email) {
        email = profile.email
      } else {
        email = await getLegacyUserEmail(ctx, userId)
      }
    }

    if (!email) return null

    // Resolve poll token (if open poll exists)
    let pollToken: {
      accessToken: string
      respondentToken: string
      orgSlug: string
    } | null = null

    const openPoll = await ctx.db
      .query('availabilityPolls')
      .withIndex('by_opportunity', (q) =>
        q.eq('opportunityId', app.opportunityId),
      )
      .filter((q) => q.eq(q.field('status'), 'open'))
      .first()

    if (openPoll) {
      const respondent = await ctx.db
        .query('pollRespondents')
        .withIndex('by_poll_and_application', (q) =>
          q.eq('pollId', openPoll._id).eq('applicationId', applicationId),
        )
        .first()

      if (respondent) {
        const opportunity = await ctx.db.get(
          'orgOpportunities',
          app.opportunityId,
        )
        const org = opportunity
          ? await ctx.db.get('organizations', opportunity.orgId)
          : null

        if (org?.slug) {
          pollToken = {
            accessToken: openPoll.accessToken,
            respondentToken: respondent.respondentToken,
            orgSlug: org.slug,
          }
        }
      }
    }

    return { email, name, pollToken }
  },
})

/**
 * Log an auto-email send attempt.
 */
export const logAutoEmail = internalMutation({
  args: {
    opportunityId: v.id('orgOpportunities'),
    applicationId: v.id('opportunityApplications'),
    recipientEmail: v.string(),
    recipientName: v.string(),
    trigger: v.string(),
    subject: v.string(),
    status: v.union(v.literal('sent'), v.literal('failed')),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert('autoEmailLog', {
      ...args,
      sentAt: Date.now(),
    })
    return null
  },
})
