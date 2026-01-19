import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get an organization by ID (internal use only).
 * Used by event sync and other internal actions.
 */
export const getById = internalQuery({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    return await ctx.db.get(orgId);
  },
});
