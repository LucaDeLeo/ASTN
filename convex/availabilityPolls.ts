import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUserId } from './lib/auth'
import {
  resolveApplicantDisplayNameByApplicationId,
  resolveApplicantDisplayNameFromApplication,
} from './lib/applicantName'

const slotValueValidator = v.union(v.literal('available'), v.literal('maybe'))

const pollReturnValidator = v.object({
  _id: v.id('availabilityPolls'),
  _creationTime: v.number(),
  opportunityId: v.id('orgOpportunities'),
  orgId: v.id('organizations'),
  createdBy: v.string(),
  title: v.string(),
  timezone: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  startMinutes: v.number(),
  endMinutes: v.number(),
  slotDurationMinutes: v.number(),
  accessToken: v.string(),
  status: v.union(
    v.literal('open'),
    v.literal('closed'),
    v.literal('finalized'),
  ),
  finalizedSlot: v.optional(
    v.object({
      date: v.string(),
      startMinutes: v.number(),
      endMinutes: v.number(),
    }),
  ),
  finalizedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const responseReturnValidator = v.object({
  _id: v.id('availabilityResponses'),
  _creationTime: v.number(),
  pollId: v.id('availabilityPolls'),
  userId: v.optional(v.string()),
  respondentId: v.optional(v.id('pollRespondents')),
  respondentName: v.string(),
  slots: v.record(v.string(), slotValueValidator),
  updatedAt: v.number(),
})

// ─── Admin mutations ───

export const createPoll = mutation({
  args: {
    opportunityId: v.id('orgOpportunities'),
    title: v.string(),
    timezone: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    startMinutes: v.number(),
    endMinutes: v.number(),
    slotDurationMinutes: v.number(),
  },
  returns: v.id('availabilityPolls'),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const opportunity = await ctx.db.get('orgOpportunities', args.opportunityId)
    if (!opportunity) throw new ConvexError('Opportunity not found')

    // Verify admin role
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_org_role', (q) =>
        q.eq('orgId', opportunity.orgId).eq('role', 'admin'),
      )
      .collect()
    const isAdmin = membership.some((m) => m.userId === userId)
    if (!isAdmin) throw new ConvexError('Admin access required')

    // Validate config
    if (args.endDate < args.startDate)
      throw new ConvexError('End date must be on or after start date')
    if (args.endMinutes <= args.startMinutes)
      throw new ConvexError('End time must be after start time')
    if (![15, 30, 60].includes(args.slotDurationMinutes))
      throw new ConvexError('Slot duration must be 15, 30, or 60 minutes')

    // Max 14-day range
    const start = new Date(args.startDate)
    const end = new Date(args.endDate)
    const dayDiff = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (dayDiff > 13)
      throw new ConvexError('Poll cannot span more than 14 days')

    // One active poll per opportunity
    const existing = await ctx.db
      .query('availabilityPolls')
      .withIndex('by_opportunity', (q) =>
        q.eq('opportunityId', args.opportunityId),
      )
      .collect()
    const hasActive = existing.some(
      (p) => p.status === 'open' || p.status === 'closed',
    )
    if (hasActive)
      throw new ConvexError(
        'An active poll already exists for this opportunity',
      )

    const now = Date.now()
    const pollId = await ctx.db.insert('availabilityPolls', {
      ...args,
      orgId: opportunity.orgId,
      createdBy: userId,
      accessToken: crypto.randomUUID(),
      status: 'open',
      createdAt: now,
      updatedAt: now,
    })

    // Generate respondent rows for all applicants
    const applications = await ctx.db
      .query('opportunityApplications')
      .withIndex('by_opportunity_and_status', (q) =>
        q.eq('opportunityId', args.opportunityId),
      )
      .collect()

    for (const app of applications) {
      const name = await resolveApplicantDisplayNameFromApplication(
        ctx.db,
        app,
        'Applicant',
      )

      await ctx.db.insert('pollRespondents', {
        pollId,
        applicationId: app._id,
        respondentToken: crypto.randomUUID(),
        respondentName: name,
      })
    }

    return pollId
  },
})

export const backfillRespondents = mutation({
  args: { pollId: v.id('availabilityPolls') },
  returns: v.number(),
  handler: async (ctx, { pollId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const poll = await ctx.db.get('availabilityPolls', pollId)
    if (!poll) throw new ConvexError('Poll not found')

    // Verify admin
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_org_role', (q) =>
        q.eq('orgId', poll.orgId).eq('role', 'admin'),
      )
      .collect()
    const isAdmin = membership.some((m) => m.userId === userId)
    if (!isAdmin) throw new ConvexError('Admin access required')

    // Collect existing applicationIds so we can skip duplicates
    const existingRespondents = await ctx.db
      .query('pollRespondents')
      .withIndex('by_poll', (q) => q.eq('pollId', pollId))
      .collect()
    const existingAppIds = new Set(existingRespondents.map((r) => r.applicationId))

    const applications = await ctx.db
      .query('opportunityApplications')
      .withIndex('by_opportunity_and_status', (q) =>
        q.eq('opportunityId', poll.opportunityId),
      )
      .collect()

    let count = 0
    for (const app of applications) {
      if (existingAppIds.has(app._id)) continue

      const name = await resolveApplicantDisplayNameFromApplication(
        ctx.db,
        app,
        'Applicant',
      )

      await ctx.db.insert('pollRespondents', {
        pollId,
        applicationId: app._id,
        respondentToken: crypto.randomUUID(),
        respondentName: name,
      })
      count++
    }

    return count
  },
})

export const updatePoll = mutation({
  args: {
    pollId: v.id('availabilityPolls'),
    title: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal('open'), v.literal('closed'), v.literal('finalized')),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { pollId, ...updates }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const poll = await ctx.db.get('availabilityPolls', pollId)
    if (!poll) throw new ConvexError('Poll not found')

    // Verify admin
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_org_role', (q) =>
        q.eq('orgId', poll.orgId).eq('role', 'admin'),
      )
      .collect()
    const isAdmin = membership.some((m) => m.userId === userId)
    if (!isAdmin) throw new ConvexError('Admin access required')

    await ctx.db.patch('availabilityPolls', pollId, {
      ...updates,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const deletePoll = mutation({
  args: { pollId: v.id('availabilityPolls') },
  returns: v.null(),
  handler: async (ctx, { pollId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const poll = await ctx.db.get('availabilityPolls', pollId)
    if (!poll) throw new ConvexError('Poll not found')

    // Verify admin
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_org_role', (q) =>
        q.eq('orgId', poll.orgId).eq('role', 'admin'),
      )
      .collect()
    const isAdmin = membership.some((m) => m.userId === userId)
    if (!isAdmin) throw new ConvexError('Admin access required')

    // Delete all responses first
    const responses = await ctx.db
      .query('availabilityResponses')
      .withIndex('by_poll', (q) => q.eq('pollId', pollId))
      .collect()
    for (const r of responses) {
      await ctx.db.delete('availabilityResponses', r._id)
    }

    // Delete all respondent rows
    const respondents = await ctx.db
      .query('pollRespondents')
      .withIndex('by_poll', (q) => q.eq('pollId', pollId))
      .collect()
    for (const r of respondents) {
      await ctx.db.delete('pollRespondents', r._id)
    }

    await ctx.db.delete('availabilityPolls', pollId)
    return null
  },
})

export const finalizePoll = mutation({
  args: {
    pollId: v.id('availabilityPolls'),
    finalizedSlot: v.object({
      date: v.string(),
      startMinutes: v.number(),
      endMinutes: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { pollId, finalizedSlot }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const poll = await ctx.db.get('availabilityPolls', pollId)
    if (!poll) throw new ConvexError('Poll not found')

    // Verify admin
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_org_role', (q) =>
        q.eq('orgId', poll.orgId).eq('role', 'admin'),
      )
      .collect()
    const isAdmin = membership.some((m) => m.userId === userId)
    if (!isAdmin) throw new ConvexError('Admin access required')

    const now = Date.now()
    await ctx.db.patch('availabilityPolls', pollId, {
      status: 'finalized',
      finalizedSlot,
      finalizedAt: now,
      updatedAt: now,
    })
    return null
  },
})

// ─── Admin queries ───

export const getPollByOpportunity = query({
  args: { opportunityId: v.id('orgOpportunities') },
  returns: v.union(pollReturnValidator, v.null()),
  handler: async (ctx, { opportunityId }) => {
    return await ctx.db
      .query('availabilityPolls')
      .withIndex('by_opportunity', (q) =>
        q.eq('opportunityId', opportunityId),
      )
      .order('desc')
      .first()
  },
})

export const getPollResults = query({
  args: { pollId: v.id('availabilityPolls') },
  returns: v.object({
    poll: pollReturnValidator,
    responses: v.array(responseReturnValidator),
  }),
  handler: async (ctx, { pollId }) => {
    const poll = await ctx.db.get('availabilityPolls', pollId)
    if (!poll) throw new ConvexError('Poll not found')

    const responses = await ctx.db
      .query('availabilityResponses')
      .withIndex('by_poll', (q) => q.eq('pollId', pollId))
      .collect()

    const respondents = await ctx.db
      .query('pollRespondents')
      .withIndex('by_poll', (q) => q.eq('pollId', pollId))
      .collect()

    const respondentNameById = new Map<string, string>()
    await Promise.all(
      respondents.map(async (respondent) => {
        const name = await resolveApplicantDisplayNameByApplicationId(
          ctx.db,
          respondent.applicationId,
          respondent.respondentName,
        )
        respondentNameById.set(respondent._id, name)
      }),
    )

    const responsesWithResolvedNames = responses.map((response) => {
      if (!response.respondentId) return response
      const resolvedName = respondentNameById.get(response.respondentId)
      if (!resolvedName || resolvedName === response.respondentName) return response
      return { ...response, respondentName: resolvedName }
    })

    return { poll, responses: responsesWithResolvedNames }
  },
})

export const getRespondentLinks = query({
  args: { pollId: v.id('availabilityPolls') },
  returns: v.array(
    v.object({
      respondentToken: v.string(),
      respondentName: v.string(),
      applicationId: v.id('opportunityApplications'),
    }),
  ),
  handler: async (ctx, { pollId }) => {
    const respondents = await ctx.db
      .query('pollRespondents')
      .withIndex('by_poll', (q) => q.eq('pollId', pollId))
      .collect()

    return await Promise.all(
      respondents.map(async (respondent) => ({
        respondentToken: respondent.respondentToken,
        respondentName: await resolveApplicantDisplayNameByApplicationId(
          ctx.db,
          respondent.applicationId,
          respondent.respondentName,
        ),
        applicationId: respondent.applicationId,
      })),
    )
  },
})

// ─── Respondent queries (no auth required) ───

export const getPollByToken = query({
  args: { accessToken: v.string() },
  returns: v.union(
    v.object({
      poll: pollReturnValidator,
      opportunity: v.object({
        _id: v.id('orgOpportunities'),
        title: v.string(),
      }),
      org: v.object({
        _id: v.id('organizations'),
        name: v.string(),
        slug: v.optional(v.string()),
      }),
    }),
    v.null(),
  ),
  handler: async (ctx, { accessToken }) => {
    const poll = await ctx.db
      .query('availabilityPolls')
      .withIndex('by_accessToken', (q) => q.eq('accessToken', accessToken))
      .unique()

    if (!poll) return null

    const opportunity = await ctx.db.get('orgOpportunities', poll.opportunityId)
    if (!opportunity) return null

    const org = await ctx.db.get('organizations', poll.orgId)
    if (!org) return null

    return {
      poll,
      opportunity: { _id: opportunity._id, title: opportunity.title },
      org: { _id: org._id, name: org.name, slug: org.slug },
    }
  },
})

export const getPollByRespondentToken = query({
  args: { respondentToken: v.string() },
  returns: v.union(
    v.object({
      poll: pollReturnValidator,
      opportunity: v.object({
        _id: v.id('orgOpportunities'),
        title: v.string(),
      }),
      org: v.object({
        _id: v.id('organizations'),
        name: v.string(),
        slug: v.optional(v.string()),
      }),
      respondentId: v.id('pollRespondents'),
      respondentName: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, { respondentToken }) => {
    const respondent = await ctx.db
      .query('pollRespondents')
      .withIndex('by_respondentToken', (q) =>
        q.eq('respondentToken', respondentToken),
      )
      .unique()

    if (!respondent) return null

    const poll = await ctx.db.get('availabilityPolls', respondent.pollId)
    if (!poll) return null

    const opportunity = await ctx.db.get('orgOpportunities', poll.opportunityId)
    if (!opportunity) return null

    const org = await ctx.db.get('organizations', poll.orgId)
    if (!org) return null

    const respondentName = await resolveApplicantDisplayNameByApplicationId(
      ctx.db,
      respondent.applicationId,
      respondent.respondentName,
    )

    return {
      poll,
      opportunity: { _id: opportunity._id, title: opportunity.title },
      org: { _id: org._id, name: org.name, slug: org.slug },
      respondentId: respondent._id,
      respondentName,
    }
  },
})

export const getResponseByRespondent = query({
  args: {
    pollId: v.id('availabilityPolls'),
    respondentId: v.id('pollRespondents'),
  },
  returns: v.union(responseReturnValidator, v.null()),
  handler: async (ctx, { pollId, respondentId }) => {
    const response = await ctx.db
      .query('availabilityResponses')
      .withIndex('by_poll_and_respondent', (q) =>
        q.eq('pollId', pollId).eq('respondentId', respondentId),
      )
      .first()

    if (!response) return null

    const respondent = await ctx.db.get('pollRespondents', respondentId)
    if (!respondent) return response

    const respondentName = await resolveApplicantDisplayNameByApplicationId(
      ctx.db,
      respondent.applicationId,
      response.respondentName,
    )

    if (respondentName === response.respondentName) return response

    return { ...response, respondentName }
  },
})

// ─── Respondent mutation ───

export const submitResponse = mutation({
  args: {
    pollId: v.id('availabilityPolls'),
    respondentId: v.id('pollRespondents'),
    slots: v.record(v.string(), slotValueValidator),
  },
  returns: v.id('availabilityResponses'),
  handler: async (ctx, { pollId, respondentId, slots }) => {
    // Validate respondent exists and belongs to this poll
    const respondent = await ctx.db.get('pollRespondents', respondentId)
    if (!respondent) throw new ConvexError('Respondent not found')
    if (respondent.pollId !== pollId)
      throw new ConvexError('Respondent does not belong to this poll')

    const poll = await ctx.db.get('availabilityPolls', pollId)
    if (!poll) throw new ConvexError('Poll not found')
    if (poll.status !== 'open')
      throw new ConvexError('Poll is no longer accepting responses')

    const now = Date.now()
    const respondentName = await resolveApplicantDisplayNameByApplicationId(
      ctx.db,
      respondent.applicationId,
      respondent.respondentName,
    )

    // Upsert: check for existing response
    const existing = await ctx.db
      .query('availabilityResponses')
      .withIndex('by_poll_and_respondent', (q) =>
        q.eq('pollId', pollId).eq('respondentId', respondentId),
      )
      .first()
    if (existing) {
      await ctx.db.patch('availabilityResponses', existing._id, {
        respondentName,
        slots,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert('availabilityResponses', {
      pollId,
      respondentId,
      respondentName,
      slots,
      updatedAt: now,
    })
  },
})
