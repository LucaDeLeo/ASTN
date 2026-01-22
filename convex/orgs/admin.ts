import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { auth } from "../auth";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// Helper: Require current user is an admin of the given org
async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
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

// Remove a member from the organization
export const removeMember = mutation({
  args: {
    orgId: v.id("organizations"),
    membershipId: v.id("orgMemberships"),
  },
  handler: async (ctx, { orgId, membershipId }) => {
    const adminMembership = await requireOrgAdmin(ctx, orgId);

    // Get the target membership
    const targetMembership = await ctx.db.get("orgMemberships", membershipId);
    if (!targetMembership) {
      throw new Error("Membership not found");
    }

    // Verify the membership is for this org
    if (targetMembership.orgId !== orgId) {
      throw new Error("Membership is not for this organization");
    }

    // Cannot remove yourself (use leaveOrg instead)
    if (targetMembership._id === adminMembership._id) {
      throw new Error(
        "Cannot remove yourself. Use the leave organization option instead."
      );
    }

    // Delete the membership
    await ctx.db.delete("orgMemberships", membershipId);

    return { success: true };
  },
});

// Promote a member to admin
export const promoteToAdmin = mutation({
  args: {
    orgId: v.id("organizations"),
    membershipId: v.id("orgMemberships"),
  },
  handler: async (ctx, { orgId, membershipId }) => {
    await requireOrgAdmin(ctx, orgId);

    // Get the target membership
    const targetMembership = await ctx.db.get("orgMemberships", membershipId);
    if (!targetMembership) {
      throw new Error("Membership not found");
    }

    // Verify the membership is for this org
    if (targetMembership.orgId !== orgId) {
      throw new Error("Membership is not for this organization");
    }

    // Update role to admin
    await ctx.db.patch("orgMemberships", membershipId, {
      role: "admin",
    });

    return { success: true };
  },
});

// Demote an admin to member
export const demoteToMember = mutation({
  args: {
    orgId: v.id("organizations"),
    membershipId: v.id("orgMemberships"),
  },
  handler: async (ctx, { orgId, membershipId }) => {
    const adminMembership = await requireOrgAdmin(ctx, orgId);

    // Get the target membership
    const targetMembership = await ctx.db.get("orgMemberships", membershipId);
    if (!targetMembership) {
      throw new Error("Membership not found");
    }

    // Verify the membership is for this org
    if (targetMembership.orgId !== orgId) {
      throw new Error("Membership is not for this organization");
    }

    // Cannot demote yourself if you're the last admin
    if (targetMembership._id === adminMembership._id) {
      const otherAdmins = await ctx.db
        .query("orgMemberships")
        .withIndex("by_org_role", (q) => q.eq("orgId", orgId).eq("role", "admin"))
        .collect();

      // Filter out current user
      const remainingAdmins = otherAdmins.filter(
        (m) => m._id !== adminMembership._id
      );

      if (remainingAdmins.length === 0) {
        throw new Error(
          "Cannot demote yourself as the last admin. Promote another member to admin first."
        );
      }
    }

    // Update role to member
    await ctx.db.patch("orgMemberships", membershipId, {
      role: "member",
    });

    return { success: true };
  },
});

// Create an invite link for the organization
export const createInviteLink = mutation({
  args: {
    orgId: v.id("organizations"),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, expiresInDays }) => {
    const adminMembership = await requireOrgAdmin(ctx, orgId);

    // Generate a unique token
    const token = crypto.randomUUID();

    // Calculate expiration if provided
    const expiresAt = expiresInDays
      ? Date.now() + expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    // Insert invite link
    await ctx.db.insert("orgInviteLinks", {
      orgId,
      token,
      createdBy: adminMembership._id,
      createdAt: Date.now(),
      expiresAt,
    });

    return { token };
  },
});

// Get all invite links for the organization
export const getInviteLinks = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await requireOrgAdmin(ctx, orgId);

    const inviteLinks = await ctx.db
      .query("orgInviteLinks")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Filter out expired links and add metadata
    const now = Date.now();
    return inviteLinks
      .filter((link) => !link.expiresAt || link.expiresAt > now)
      .map((link) => ({
        ...link,
        isExpired: link.expiresAt ? link.expiresAt < now : false,
      }));
  },
});

// Revoke an invite link
export const revokeInviteLink = mutation({
  args: { inviteLinkId: v.id("orgInviteLinks") },
  handler: async (ctx, { inviteLinkId }) => {
    // Get the invite link to check its orgId
    const inviteLink = await ctx.db.get("orgInviteLinks", inviteLinkId);
    if (!inviteLink) {
      throw new Error("Invite link not found");
    }

    // Verify admin access to this org
    await requireOrgAdmin(ctx, inviteLink.orgId);

    // Delete the invite link
    await ctx.db.delete("orgInviteLinks", inviteLinkId);

    return { success: true };
  },
});

// Get all members with their full profiles (for admin dashboard and export)
// Per CONTEXT.md: Admins see full profiles (joining means consent)
export const getAllMembersWithProfiles = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await requireOrgAdmin(ctx, orgId);

    // Get all memberships for this org
    const memberships = await ctx.db
      .query("orgMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Fetch full profile and user email for each membership
    const membersWithProfiles = await Promise.all(
      memberships.map(async (membership) => {
        // Get profile
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", membership.userId))
          .first();

        // Get user email from auth users table
        // userId is the string representation of the user's Id
        const user = await ctx.db.get("users", membership.userId as Id<"users">);
        const email = user?.email ?? null;

        // Calculate profile completeness
        let completeness = 0;
        if (profile) {
          const sections = [
            Boolean(profile.name) && Boolean(profile.location),
            Array.isArray(profile.education) && profile.education.length > 0,
            Array.isArray(profile.workHistory) && profile.workHistory.length > 0,
            Boolean(profile.careerGoals),
            Array.isArray(profile.skills) && profile.skills.length > 0,
            profile.hasEnrichmentConversation === true,
            profile.privacySettings !== undefined &&
              typeof profile.privacySettings === "object" &&
              "defaultVisibility" in profile.privacySettings,
          ];
          completeness = Math.round(
            (sections.filter(Boolean).length / sections.length) * 100
          );
        }

        return {
          membership,
          profile,
          email,
          completeness,
        };
      })
    );

    return membersWithProfiles;
  },
});

// Update lu.ma configuration for the organization
export const updateLumaConfig = mutation({
  args: {
    orgId: v.id("organizations"),
    lumaCalendarUrl: v.optional(v.string()),
    lumaApiKey: v.optional(v.string()),
  },
  handler: async (ctx, { orgId, lumaCalendarUrl, lumaApiKey }) => {
    await requireOrgAdmin(ctx, orgId);

    // Get current org to verify it exists
    const org = await ctx.db.get("organizations", orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Update lu.ma config fields
    await ctx.db.patch("organizations", orgId, {
      lumaCalendarUrl: lumaCalendarUrl || undefined,
      lumaApiKey: lumaApiKey || undefined,
    });

    return { success: true };
  },
});

// Get lu.ma configuration for an organization (admin only)
export const getLumaConfig = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    await requireOrgAdmin(ctx, orgId);

    const org = await ctx.db.get("organizations", orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    return {
      lumaCalendarUrl: org.lumaCalendarUrl,
      lumaApiKey: org.lumaApiKey,
      eventsLastSynced: org.eventsLastSynced,
    };
  },
});
