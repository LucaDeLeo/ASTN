import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
    const profile = await ctx.db.get("profiles", profileId);
    if (!profile || profile.userId !== userId) {
      throw new Error("Profile not found or not authorized");
    }

    await ctx.db.patch("profiles", profileId, {
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
    const profile = await ctx.db.get("profiles", profileId);
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

// Get notification preferences for current user
export const getNotificationPreferences = query({
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
      return null;
    }

    return profile.notificationPreferences ?? null;
  },
});

// Update notification preferences for current user
export const updateNotificationPreferences = mutation({
  args: {
    matchAlertsEnabled: v.boolean(),
    weeklyDigestEnabled: v.boolean(),
    timezone: v.string(),
  },
  handler: async (ctx, { matchAlertsEnabled, weeklyDigestEnabled, timezone }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Basic IANA timezone validation (contains "/")
    if (!timezone.includes("/")) {
      throw new Error("Invalid timezone format. Expected IANA timezone (e.g., America/New_York)");
    }

    // Get or create profile
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      // Create profile if it doesn't exist
      const now = Date.now();
      const profileId = await ctx.db.insert("profiles", {
        userId,
        createdAt: now,
        updatedAt: now,
      });
      profile = (await ctx.db.get("profiles", profileId))!;
    }

    // Update notification preferences
    await ctx.db.patch("profiles", profile._id, {
      notificationPreferences: {
        matchAlerts: { enabled: matchAlertsEnabled },
        weeklyDigest: { enabled: weeklyDigestEnabled },
        timezone,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
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

// Convert YYYY-MM date string to Unix timestamp (first of month)
// Returns undefined for "present", empty string, or invalid format
function convertDateString(dateStr?: string): number | undefined {
  if (!dateStr || dateStr.toLowerCase() === "present") return undefined;
  const parts = dateStr.split("-");
  if (parts.length < 2) return undefined;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return undefined;
  return new Date(year, month - 1, 1).getTime();
}

// Apply extracted profile data from resume/CV
// Creates profile if user doesn't have one yet
export const applyExtractedProfile = mutation({
  args: {
    extractedData: v.object({
      name: v.optional(v.string()),
      location: v.optional(v.string()),
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
            startDate: v.optional(v.string()), // YYYY-MM string from extraction
            endDate: v.optional(v.string()), // YYYY-MM or "present"
            current: v.optional(v.boolean()),
            description: v.optional(v.string()),
          })
        )
      ),
      skills: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, { extractedData }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get or create profile
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (!profile) {
      // Create profile if it doesn't exist
      const profileId = await ctx.db.insert("profiles", {
        userId,
        createdAt: now,
        updatedAt: now,
      });
      profile = (await ctx.db.get("profiles", profileId))!;
    }

    // Build updates object with only provided fields
    const updates: Record<string, unknown> = {};

    if (extractedData.name !== undefined) {
      updates.name = extractedData.name;
    }

    if (extractedData.location !== undefined) {
      updates.location = extractedData.location;
    }

    // Education maps directly (uses year numbers, no conversion needed)
    if (extractedData.education !== undefined) {
      updates.education = extractedData.education;
    }

    // Work history needs date conversion from strings to timestamps
    if (extractedData.workHistory !== undefined) {
      updates.workHistory = extractedData.workHistory.map((work) => ({
        organization: work.organization,
        title: work.title,
        startDate: convertDateString(work.startDate),
        endDate: convertDateString(work.endDate),
        current: work.current,
        description: work.description,
      }));
    }

    if (extractedData.skills !== undefined) {
      updates.skills = extractedData.skills;
    }

    // Only update if there's something to update
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch("profiles", profile._id, {
        ...updates,
        updatedAt: now,
      });
    }

    return { success: true, profileId: profile._id };
  },
});

// Get location privacy setting for current user
export const getLocationPrivacy = query({
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
      return { locationDiscoverable: false };
    }

    return {
      locationDiscoverable: profile.privacySettings?.locationDiscoverable ?? false,
    };
  },
});

// Update location privacy setting for current user
export const updateLocationPrivacy = mutation({
  args: { locationDiscoverable: v.boolean() },
  handler: async (ctx, { locationDiscoverable }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Merge with existing privacy settings
    const existingSettings = profile.privacySettings ?? {
      defaultVisibility: "private" as const,
    };

    await ctx.db.patch("profiles", profile._id, {
      privacySettings: {
        ...existingSettings,
        locationDiscoverable,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Get event notification preferences for current user
export const getEventNotificationPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile?.eventNotificationPreferences) {
      // Return defaults for new users (weekly digest, 1 day + 1 hour reminders)
      return {
        frequency: "weekly" as const,
        reminderTiming: {
          oneWeekBefore: false,
          oneDayBefore: true,
          oneHourBefore: true,
        },
        mutedOrgIds: [] as Array<string>,
      };
    }

    return {
      ...profile.eventNotificationPreferences,
      mutedOrgIds: profile.eventNotificationPreferences.mutedOrgIds ?? [],
    };
  },
});

// Update event notification preferences for current user
export const updateEventNotificationPreferences = mutation({
  args: {
    frequency: v.union(
      v.literal("all"),
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("none")
    ),
    reminderTiming: v.object({
      oneWeekBefore: v.boolean(),
      oneDayBefore: v.boolean(),
      oneHourBefore: v.boolean(),
    }),
    mutedOrgIds: v.array(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch("profiles", profile._id, {
      eventNotificationPreferences: {
        frequency: args.frequency,
        reminderTiming: args.reminderTiming,
        mutedOrgIds: args.mutedOrgIds,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
