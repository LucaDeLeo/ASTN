import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import type { Id } from "./_generated/dataModel";

// Type for match computation result
interface MatchComputationResult {
  matchCount: number;
  message?: string;
  tiers?: {
    great: number;
    good: number;
    exploring: number;
  };
  growthAreas?: Array<{
    theme: string;
    items: Array<string>;
  }>;
}

// Get all matches for current user, grouped by tier
export const getMyMatches = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get user's profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first();

    if (!profile) {
      return {
        matches: { great: [], good: [], exploring: [] },
        savedMatches: [],
        needsProfile: true
      };
    }

    // Get matches for this profile
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_profile", q => q.eq("profileId", profile._id))
      .collect();

    if (matches.length === 0) {
      return {
        matches: { great: [], good: [], exploring: [] },
        savedMatches: [],
        needsProfile: false,
        needsComputation: true,
        profileId: profile._id,
      };
    }

    // Enrich matches with opportunity data
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const opportunity = await ctx.db.get("opportunities", match.opportunityId);
        return {
          ...match,
          opportunity: opportunity ? {
            _id: opportunity._id,
            title: opportunity.title,
            organization: opportunity.organization,
            location: opportunity.location,
            isRemote: opportunity.isRemote,
            roleType: opportunity.roleType,
            experienceLevel: opportunity.experienceLevel,
            sourceUrl: opportunity.sourceUrl,
            deadline: opportunity.deadline,
          } : null,
        };
      })
    );

    // Filter out matches where opportunity was deleted
    // Type guard to ensure opportunity is non-null
    const validMatches = enrichedMatches.filter(
      (m): m is typeof m & { opportunity: NonNullable<typeof m.opportunity> } =>
        m.opportunity !== null
    );

    // Separate saved matches from active matches
    const savedMatches = validMatches
      .filter((m) => m.status === "saved")
      .sort((a, b) => b.score - a.score);

    // Filter to only active matches (exclude dismissed and saved)
    const activeMatches = validMatches.filter(
      (m) => m.status !== "dismissed" && m.status !== "saved"
    );

    // Group active matches by tier and sort by score
    const grouped = {
      great: activeMatches
        .filter(m => m.tier === "great")
        .sort((a, b) => b.score - a.score),
      good: activeMatches
        .filter(m => m.tier === "good")
        .sort((a, b) => b.score - a.score),
      exploring: activeMatches
        .filter(m => m.tier === "exploring")
        .sort((a, b) => b.score - a.score),
    };

    // Count new matches for badge (from active matches only)
    const newMatchCount = activeMatches.filter(m => m.isNew).length;

    // Get staleness (oldest computation time)
    const computedAt = matches.length > 0
      ? Math.min(...matches.map(m => m.computedAt))
      : null;

    return {
      matches: grouped,
      savedMatches,
      newMatchCount,
      computedAt,
      needsProfile: false,
      needsComputation: false,
      profileId: profile._id,
    };
  },
});

// Get a single match by ID with full details
export const getMatchById = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const match = await ctx.db.get("matches", matchId);
    if (!match) {
      return null;
    }

    // Verify ownership
    const profile = await ctx.db.get("profiles", match.profileId);
    if (!profile || profile.userId !== userId) {
      return null;
    }

    // Get full opportunity data
    const opportunity = await ctx.db.get("opportunities", match.opportunityId);
    if (!opportunity) {
      return null;
    }

    return {
      ...match,
      opportunity,
    };
  },
});

// Get match count for navigation badge
export const getNewMatchCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return 0;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first();

    if (!profile) {
      return 0;
    }

    const newMatches = await ctx.db
      .query("matches")
      .withIndex("by_profile_new", q => q.eq("profileId", profile._id).eq("isNew", true))
      .collect();

    return newMatches.length;
  },
});

// Trigger match computation (called from UI when needed)
export const triggerMatchComputation = action({
  args: {},
  handler: async (ctx): Promise<MatchComputationResult> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get profile
    const profile: { _id: Id<"profiles"> } | null = await ctx.runQuery(
      internal.matching.queries.getProfileByUserId,
      { userId }
    );

    if (!profile) {
      throw new Error("Profile not found - please create a profile first");
    }

    // Trigger computation
    const result: MatchComputationResult = await ctx.runAction(
      internal.matching.compute.computeMatchesForProfile,
      { profileId: profile._id }
    );

    return result;
  },
});

// Mark matches as viewed (clear "new" badge)
export const markMatchesViewed = action({
  args: {},
  handler: async (ctx): Promise<{ markedCount: number }> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile: { _id: Id<"profiles"> } | null = await ctx.runQuery(
      internal.matching.queries.getProfileByUserId,
      { userId }
    );

    if (!profile) {
      return { markedCount: 0 };
    }

    const result: { markedCount: number } = await ctx.runMutation(
      internal.matching.mutations.markMatchesViewed,
      { profileId: profile._id }
    );

    return result;
  },
});

/**
 * Dismiss a match - removes it from the user's match list
 */
export const dismissMatch = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");

    // Verify ownership
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || match.profileId !== profile._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(matchId, { status: "dismissed" });
  },
});

/**
 * Save a match - marks it as a favorite for easy access
 */
export const saveMatch = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const match = await ctx.db.get(matchId);
    if (!match) throw new Error("Match not found");

    // Verify ownership
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile || match.profileId !== profile._id) {
      throw new Error("Not authorized");
    }

    // Toggle: if already saved, unsave (set to active)
    const newStatus = match.status === "saved" ? "active" : "saved";
    await ctx.db.patch(matchId, { status: newStatus });
  },
});
