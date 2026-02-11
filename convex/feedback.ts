import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const submit = mutation({
  args: {
    featureRequests: v.optional(v.string()),
    bugReports: v.optional(v.string()),
    page: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.featureRequests?.trim() && !args.bugReports?.trim()) {
      throw new Error('Please fill in at least one field')
    }
    return ctx.db.insert('feedback', {
      featureRequests: args.featureRequests?.trim() || undefined,
      bugReports: args.bugReports?.trim() || undefined,
      page: args.page,
      createdAt: Date.now(),
    })
  },
})
