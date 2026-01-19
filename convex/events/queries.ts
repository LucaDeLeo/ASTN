import { internalQuery } from "../_generated/server";

/**
 * Get all organizations that have Lu.ma API keys configured.
 * Used by sync action to know which orgs to sync events from.
 */
export const getOrgsWithLumaConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();

    // Filter to orgs with lu.ma API key configured
    return orgs.filter((org) => org.lumaApiKey);
  },
});
