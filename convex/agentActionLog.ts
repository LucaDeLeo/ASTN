import { v } from 'convex/values'
import { mutation } from './_generated/server'

// Public mutation (not internalMutation) because the admin agent runs as an
// external Node.js process that connects via ConvexClient. External clients
// can only call public functions. Auth is enforced at the WS connection layer
// in agent/server.ts (Clerk token verification).
export const logAgentAction = mutation({
  args: {
    userId: v.string(),
    orgId: v.id('organizations'),
    toolName: v.string(),
    params: v.string(),
    result: v.string(),
    approvalStatus: v.union(
      v.literal('auto'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('n/a'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('agentActionLog', {
      ...args,
      timestamp: Date.now(),
    })
  },
})
