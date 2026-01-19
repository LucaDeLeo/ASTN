import { v } from "convex/values";
import { query } from "../_generated/server";
import { auth } from "../auth";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

// Helper: Require current user is an admin of the given org
async function requireOrgAdmin(
  ctx: QueryCtx,
  orgId: Id<"organizations">
): Promise<Doc<"orgMemberships">> {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("orgMemberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("orgId"), orgId))
    .first();

  if (!membership) throw new Error("Not a member of this organization");
  if (membership.role !== "admin") throw new Error("Admin access required");

  return membership;
}

/**
 * Get member profile for admin view with privacy controls
 * CONTEXT.md: "Respect all member privacy settings - admins see exactly what member has made visible to their org"
 */
export const getMemberProfileForAdmin = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  handler: async (ctx, { orgId, userId }) => {
    await requireOrgAdmin(ctx, orgId);

    // Get profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    // Get membership
    const membership = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .first();

    if (!membership) return null;

    // Check if member has hidden themselves from this org
    const hiddenOrgs = profile.privacySettings?.hiddenFromOrgs ?? [];
    if (hiddenOrgs.includes(orgId.toString())) {
      return {
        restricted: true,
        reason: "Member has hidden their profile from this organization",
      };
    }

    // Apply section visibility (respect member's choices)
    const visibility = profile.privacySettings?.sectionVisibility ?? {};
    const defaultVis = profile.privacySettings?.defaultVisibility ?? "private";

    // Helper: check if section is visible to org admin
    // "public" or "connections" visible to org admin (org membership = connection)
    const isVisible = (section: string): boolean => {
      const sectionVis =
        (visibility as Record<string, string>)[section] ?? defaultVis;
      return sectionVis !== "private";
    };

    // Get user email
    const user = await ctx.db.get("users", userId as Id<"users">);
    const email = user?.email ?? null;

    return {
      restricted: false,
      profile: {
        name: profile.name, // Always visible (needed for identification)
        headline: isVisible("basicInfo") ? profile.headline : null,
        location: isVisible("basicInfo") ? profile.location : null,
        pronouns: isVisible("basicInfo") ? profile.pronouns : null,
        education: isVisible("education") ? profile.education : null,
        workHistory: isVisible("workHistory") ? profile.workHistory : null,
        skills: isVisible("skills") ? profile.skills : null,
        careerGoals: isVisible("careerGoals") ? profile.careerGoals : null,
        seeking: isVisible("careerGoals") ? profile.seeking : null,
        aiSafetyInterests: isVisible("careerGoals")
          ? profile.aiSafetyInterests
          : null,
        enrichmentSummary: isVisible("careerGoals")
          ? profile.enrichmentSummary
          : null,
      },
      email,
      membership: {
        _id: membership._id,
        joinedAt: membership.joinedAt,
        role: membership.role,
        directoryVisibility: membership.directoryVisibility,
      },
      visibleSections: {
        basicInfo: isVisible("basicInfo"),
        education: isVisible("education"),
        workHistory: isVisible("workHistory"),
        skills: isVisible("skills"),
        careerGoals: isVisible("careerGoals"),
      },
    };
  },
});
