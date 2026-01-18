import { query, mutation } from "../_generated/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { auth } from "../auth";
import type { Id, Doc } from "../_generated/dataModel";

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
    const targetMembership = await ctx.db.get(membershipId);
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
    await ctx.db.delete(membershipId);

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
    const targetMembership = await ctx.db.get(membershipId);
    if (!targetMembership) {
      throw new Error("Membership not found");
    }

    // Verify the membership is for this org
    if (targetMembership.orgId !== orgId) {
      throw new Error("Membership is not for this organization");
    }

    // Update role to admin
    await ctx.db.patch(membershipId, {
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
    const targetMembership = await ctx.db.get(membershipId);
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
    await ctx.db.patch(membershipId, {
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
    const inviteLink = await ctx.db.get(inviteLinkId);
    if (!inviteLink) {
      throw new Error("Invite link not found");
    }

    // Verify admin access to this org
    await requireOrgAdmin(ctx, inviteLink.orgId);

    // Delete the invite link
    await ctx.db.delete(inviteLinkId);

    return { success: true };
  },
});
