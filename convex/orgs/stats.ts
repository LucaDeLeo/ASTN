import { v } from "convex/values";

import { auth } from "../auth";
import { query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// Helper: Require current user is an admin of the given org
async function requireOrgAdmin(
  ctx: QueryCtx,
  orgId: Id<"organizations">
): Promise<Doc<"orgMemberships">> {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const membership = await ctx.db
    .query("orgMemberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("orgId"), orgId))
    .first();

  if (!membership) {
    throw new Error("Not a member of this organization");
  }

  if (membership.role !== "admin") {
    throw new Error("Admin access required");
  }

  return membership;
}

// Get aggregate stats for an organization
export const getOrgStats = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await requireOrgAdmin(ctx, orgId);

    // Get all memberships for this org
    const memberships = await ctx.db
      .query("orgMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    const memberCount = memberships.length;
    const adminCount = memberships.filter((m) => m.role === "admin").length;

    // Count members who joined in the past 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const joinedThisMonth = memberships.filter(
      (m) => m.joinedAt >= thirtyDaysAgo
    ).length;

    // Fetch profiles for all members to calculate skills and completeness
    const profilesWithCompleteness: Array<{
      profile: Doc<"profiles"> | null;
      completeness: number;
    }> = [];

    for (const membership of memberships) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", membership.userId))
        .first();

      if (profile) {
        // Calculate completeness percentage
        const completeness = calculateCompleteness(profile);
        profilesWithCompleteness.push({ profile, completeness });
      } else {
        profilesWithCompleteness.push({ profile: null, completeness: 0 });
      }
    }

    // Skills distribution: count occurrences of each skill
    const skillCounts: Record<string, number> = {};
    for (const { profile } of profilesWithCompleteness) {
      if (profile?.skills) {
        for (const skill of profile.skills) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      }
    }

    // Get top 10 skills sorted by count
    const skillsDistribution = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Completeness distribution
    const completenessDistribution = {
      high: 0, // > 70%
      medium: 0, // 40-70%
      low: 0, // < 40%
    };

    for (const { completeness } of profilesWithCompleteness) {
      if (completeness > 70) {
        completenessDistribution.high++;
      } else if (completeness >= 40) {
        completenessDistribution.medium++;
      } else {
        completenessDistribution.low++;
      }
    }

    return {
      memberCount,
      adminCount,
      joinedThisMonth,
      skillsDistribution,
      completenessDistribution,
    };
  },
});

// Calculate profile completeness percentage (mirrors profiles.ts logic)
function calculateCompleteness(profile: Doc<"profiles">): number {
  const sections = [
    // basicInfo
    Boolean(profile.name) && Boolean(profile.location),
    // education
    Array.isArray(profile.education) && profile.education.length > 0,
    // workHistory
    Array.isArray(profile.workHistory) && profile.workHistory.length > 0,
    // careerGoals
    Boolean(profile.careerGoals),
    // skills
    Array.isArray(profile.skills) && profile.skills.length > 0,
    // enrichment
    profile.hasEnrichmentConversation === true,
    // privacy
    profile.privacySettings !== undefined &&
      "defaultVisibility" in profile.privacySettings,
  ];

  const completedCount = sections.filter(Boolean).length;
  return Math.round((completedCount / sections.length) * 100);
}

// Get enhanced stats with time range filtering, engagement distribution, and career breakdown
export const getEnhancedOrgStats = query({
  args: {
    orgId: v.id("organizations"),
    timeRange: v.optional(
      v.union(
        v.literal("7d"),
        v.literal("30d"),
        v.literal("90d"),
        v.literal("all")
      )
    ),
  },
  handler: async (ctx, { orgId, timeRange = "30d" }) => {
    await requireOrgAdmin(ctx, orgId);

    const now = Date.now();
    const ranges: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
      all: now, // From epoch
    };
    const since = now - ranges[timeRange];

    // Get all memberships for this org
    const memberships = await ctx.db
      .query("orgMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    const memberCount = memberships.length;
    const adminCount = memberships.filter((m) => m.role === "admin").length;

    // Count members who joined in the time range
    const joinedInRange = memberships.filter(
      (m) => m.joinedAt >= since
    ).length;

    // Get engagement data for this org
    const engagementRecords = await ctx.db
      .query("memberEngagement")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Build engagement distribution
    const engagementDistribution: Record<string, number> = {
      highly_engaged: 0,
      moderate: 0,
      at_risk: 0,
      new: 0,
      inactive: 0,
      pending: 0, // No engagement record yet
    };

    const engagementMap = new Map(
      engagementRecords.map((e) => [e.userId, e])
    );
    for (const m of memberships) {
      const eng = engagementMap.get(m.userId);
      if (eng) {
        // Use effective level (override if present, otherwise computed)
        const level = eng.override?.level ?? eng.level;
        engagementDistribution[level]++;
      } else {
        engagementDistribution.pending++;
      }
    }

    // Build career stage distribution and skills distribution from profiles
    const careerDistribution: Record<string, number> = {};
    const skillCounts: Record<string, number> = {};
    const profilesWithCompleteness: Array<{
      profile: Doc<"profiles"> | null;
      completeness: number;
    }> = [];

    for (const m of memberships) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", m.userId))
        .first();

      if (profile) {
        // Career distribution
        const stage = profile.seeking ?? "Unknown";
        careerDistribution[stage] = (careerDistribution[stage] ?? 0) + 1;

        // Skills distribution
        if (profile.skills) {
          for (const skill of profile.skills) {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          }
        }

        // Completeness tracking
        const completeness = calculateCompleteness(profile);
        profilesWithCompleteness.push({ profile, completeness });
      } else {
        careerDistribution["Unknown"] =
          (careerDistribution["Unknown"] ?? 0) + 1;
        profilesWithCompleteness.push({ profile: null, completeness: 0 });
      }
    }

    // Get top 10 skills sorted by count
    const skillsDistribution = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Completeness distribution
    const completenessDistribution = {
      high: 0, // > 70%
      medium: 0, // 40-70%
      low: 0, // < 40%
    };

    for (const { completeness } of profilesWithCompleteness) {
      if (completeness > 70) {
        completenessDistribution.high++;
      } else if (completeness >= 40) {
        completenessDistribution.medium++;
      } else {
        completenessDistribution.low++;
      }
    }

    // Get event attendance metrics for the time range
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.gte(q.field("createdAt"), since))
      .collect();

    const attendedCount = attendance.filter(
      (a) => a.status === "attended" || a.status === "partial"
    ).length;

    const eventMetrics = {
      totalResponses: attendance.length,
      attendedCount,
      attendanceRate:
        attendance.length > 0
          ? Math.round((attendedCount / attendance.length) * 100)
          : 0,
    };

    return {
      memberCount,
      adminCount,
      joinedThisMonth: joinedInRange, // Keep field name for backward compatibility
      skillsDistribution,
      completenessDistribution,
      engagementDistribution,
      careerDistribution,
      eventMetrics,
      timeRange,
    };
  },
});
