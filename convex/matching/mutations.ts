import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

// Match result type from LLM
const matchResultValidator = v.object({
  opportunityId: v.id("opportunities"),
  tier: v.union(v.literal("great"), v.literal("good"), v.literal("exploring")),
  score: v.number(),
  strengths: v.array(v.string()),
  gap: v.optional(v.string()),
  interviewChance: v.string(),
  ranking: v.string(),
  confidence: v.string(),
  recommendations: v.array(
    v.object({
      type: v.union(
        v.literal("specific"),
        v.literal("skill"),
        v.literal("experience")
      ),
      action: v.string(),
      priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    })
  ),
});

// Save batch of matches for a profile
export const saveMatches = internalMutation({
  args: {
    profileId: v.id("profiles"),
    matches: v.array(matchResultValidator),
    modelVersion: v.string(),
  },
  handler: async (ctx, { profileId, matches, modelVersion }) => {
    const now = Date.now();

    // Get existing match opportunity IDs to determine which are "new"
    const existingMatches = await ctx.db
      .query("matches")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .collect();

    const existingOppIds = new Set(existingMatches.map((m) => m.opportunityId));

    // Delete old matches for this profile
    for (const match of existingMatches) {
      await ctx.db.delete(match._id);
    }

    // Insert new matches
    for (const match of matches) {
      const isNew = !existingOppIds.has(match.opportunityId);

      await ctx.db.insert("matches", {
        profileId,
        opportunityId: match.opportunityId,
        tier: match.tier,
        score: match.score,
        explanation: {
          strengths: match.strengths,
          gap: match.gap,
        },
        probability: {
          interviewChance: match.interviewChance,
          ranking: match.ranking,
          confidence: match.confidence,
        },
        recommendations: match.recommendations,
        isNew,
        computedAt: now,
        modelVersion,
      });
    }

    return { savedCount: matches.length };
  },
});

// Clear all matches for a profile (used before recomputation)
export const clearMatchesForProfile = internalMutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_profile", (q) => q.eq("profileId", profileId))
      .collect();

    for (const match of matches) {
      await ctx.db.delete(match._id);
    }

    return { deletedCount: matches.length };
  },
});

// Mark matches as not new (after user has viewed them)
export const markMatchesViewed = internalMutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const newMatches = await ctx.db
      .query("matches")
      .withIndex("by_profile_new", (q) =>
        q.eq("profileId", profileId).eq("isNew", true)
      )
      .collect();

    for (const match of newMatches) {
      await ctx.db.patch(match._id, { isNew: false });
    }

    return { markedCount: newMatches.length };
  },
});
