import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// Section completeness rules
const COMPLETENESS_SECTIONS = [
  {
    id: "basicInfo",
    label: "Basic Information",
    check: (profile: Record<string, unknown>) =>
      Boolean(profile.name) && Boolean(profile.location),
  },
  {
    id: "education",
    label: "Education",
    check: (profile: Record<string, unknown>) =>
      Array.isArray(profile.education) && profile.education.length > 0,
  },
  {
    id: "workHistory",
    label: "Work History",
    check: (profile: Record<string, unknown>) =>
      Array.isArray(profile.workHistory) && profile.workHistory.length > 0,
  },
  {
    id: "careerGoals",
    label: "Career Goals",
    check: (profile: Record<string, unknown>) => Boolean(profile.careerGoals),
  },
  {
    id: "skills",
    label: "Skills",
    check: (profile: Record<string, unknown>) =>
      Array.isArray(profile.skills) && profile.skills.length > 0,
  },
  {
    id: "enrichment",
    label: "Profile Enrichment",
    check: (profile: Record<string, unknown>) =>
      profile.hasEnrichmentConversation === true,
  },
  {
    id: "privacy",
    label: "Privacy Settings",
    check: (profile: Record<string, unknown>) =>
      profile.privacySettings !== undefined &&
      typeof profile.privacySettings === "object" &&
      profile.privacySettings !== null &&
      "defaultVisibility" in profile.privacySettings,
  },
];

// Get or create profile for current user
export const getOrCreateProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    // Try to find existing profile
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing;
    }

    // Return null if no profile exists (will be created on first update)
    return null;
  },
});

// Get profile by ID (for internal use)
export const getById = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    return await ctx.db.get(profileId);
  },
});

// Create profile for current user (called on first edit)
export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      userId,
      createdAt: now,
      updatedAt: now,
    });

    return profileId;
  },
});

// Update specific field(s) with timestamp
export const updateField = mutation({
  args: {
    profileId: v.id("profiles"),
    updates: v.object({
      name: v.optional(v.string()),
      pronouns: v.optional(v.string()),
      location: v.optional(v.string()),
      headline: v.optional(v.string()),
      education: v.optional(
        v.array(
          v.object({
            institution: v.string(),
            degree: v.optional(v.string()),
            field: v.optional(v.string()),
            startYear: v.optional(v.number()),
            endYear: v.optional(v.number()),
            current: v.optional(v.boolean()),
          })
        )
      ),
      workHistory: v.optional(
        v.array(
          v.object({
            organization: v.string(),
            title: v.string(),
            startDate: v.optional(v.number()),
            endDate: v.optional(v.number()),
            current: v.optional(v.boolean()),
            description: v.optional(v.string()),
          })
        )
      ),
      skills: v.optional(v.array(v.string())),
      careerGoals: v.optional(v.string()),
      aiSafetyInterests: v.optional(v.array(v.string())),
      seeking: v.optional(v.string()),
      enrichmentSummary: v.optional(v.string()),
      hasEnrichmentConversation: v.optional(v.boolean()),
      privacySettings: v.optional(
        v.object({
          defaultVisibility: v.union(
            v.literal("public"),
            v.literal("connections"),
            v.literal("private")
          ),
          sectionVisibility: v.optional(
            v.object({
              basicInfo: v.optional(v.string()),
              education: v.optional(v.string()),
              workHistory: v.optional(v.string()),
              skills: v.optional(v.string()),
              careerGoals: v.optional(v.string()),
            })
          ),
          hiddenFromOrgs: v.optional(v.array(v.string())),
        })
      ),
    }),
  },
  handler: async (ctx, { profileId, updates }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify ownership
    const profile = await ctx.db.get(profileId);
    if (!profile || profile.userId !== userId) {
      throw new Error("Profile not found or not authorized");
    }

    await ctx.db.patch(profileId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get completeness status for profile
export const getCompleteness = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.db.get(profileId);
    if (!profile) {
      return null;
    }

    const sections = COMPLETENESS_SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
      isComplete: section.check(profile as unknown as Record<string, unknown>),
    }));

    const completedCount = sections.filter((s) => s.isComplete).length;
    const totalCount = sections.length;

    return {
      sections,
      completedCount,
      totalCount,
      percentage: Math.round((completedCount / totalCount) * 100),
      isFullyComplete: completedCount === totalCount,
    };
  },
});

// Get completeness for current user's profile
export const getMyCompleteness = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      // Return empty completeness for non-existent profile
      return {
        sections: COMPLETENESS_SECTIONS.map((section) => ({
          id: section.id,
          label: section.label,
          isComplete: false,
        })),
        completedCount: 0,
        totalCount: COMPLETENESS_SECTIONS.length,
        percentage: 0,
        isFullyComplete: false,
      };
    }

    const sections = COMPLETENESS_SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
      isComplete: section.check(profile as unknown as Record<string, unknown>),
    }));

    const completedCount = sections.filter((s) => s.isComplete).length;
    const totalCount = sections.length;

    return {
      sections,
      completedCount,
      totalCount,
      percentage: Math.round((completedCount / totalCount) * 100),
      isFullyComplete: completedCount === totalCount,
    };
  },
});
