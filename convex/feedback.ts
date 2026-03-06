import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { internal } from './_generated/api'
import { rateLimiter } from './lib/rateLimiter'

export const submit = mutation({
  args: {
    featureRequests: v.optional(v.string()),
    bugReports: v.optional(v.string()),
    page: v.string(),
  },
  returns: v.id('feedback'),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'feedbackSubmit', { throws: true })

    if (!args.featureRequests?.trim() && !args.bugReports?.trim()) {
      throw new Error('Please fill in at least one field')
    }

    const identity = await ctx.auth.getUserIdentity()

    const featureRequests = args.featureRequests?.trim() || undefined
    const bugReports = args.bugReports?.trim() || undefined
    const userId = identity?.subject

    const id = await ctx.db.insert('feedback', {
      featureRequests,
      bugReports,
      page: args.page,
      userId,
      createdAt: Date.now(),
    })

    await ctx.scheduler.runAfter(
      0,
      internal.emails.send.sendFeedbackNotification,
      {
        featureRequests,
        bugReports,
        page: args.page,
        userId,
      },
    )

    return id
  },
})
