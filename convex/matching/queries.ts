import { internalQuery } from "../_generated/server";
import { v } from "convex/values";

// Get full profile data for context construction
export const getFullProfile = internalQuery({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.db.get(profileId);
    if (!profile) return null;

    return {
      _id: profile._id,
      name: profile.name,
      pronouns: profile.pronouns,
      location: profile.location,
      headline: profile.headline,
      education: profile.education || [],
      workHistory: profile.workHistory || [],
      skills: profile.skills || [],
      careerGoals: profile.careerGoals,
      aiSafetyInterests: profile.aiSafetyInterests || [],
      seeking: profile.seeking,
      enrichmentSummary: profile.enrichmentSummary,
      hasEnrichmentConversation: profile.hasEnrichmentConversation,
      privacySettings: profile.privacySettings,
    };
  },
});

// Get candidate opportunities for matching (excludes hidden orgs, expired, archived)
export const getCandidateOpportunities = internalQuery({
  args: {
    hiddenOrgs: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { hiddenOrgs, limit }) => {
    const now = Date.now();

    // Get active opportunities
    let opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter out:
    // 1. Organizations the user has hidden from their profile
    // 2. Expired opportunities (deadline passed)
    opportunities = opportunities.filter((opp) => {
      // Check hidden orgs
      if (hiddenOrgs.includes(opp.organization)) return false;

      // Check deadline (only filter if deadline exists and has passed)
      if (opp.deadline && opp.deadline < now) return false;

      return true;
    });

    // Apply limit if specified
    if (limit) {
      opportunities = opportunities.slice(0, limit);
    }

    return opportunities;
  },
});

// Get existing matches for a profile (for staleness check)
export const getExistingMatches = internalQuery({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query("matches")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .collect();
  },
});

// Get profile by userId (for public query to find profile)
export const getProfileByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});
