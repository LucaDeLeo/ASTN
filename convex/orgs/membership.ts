import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { auth } from "../auth";

// Get current user's membership for a given org
export const getMembership = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .first();
  },
});

// Get all orgs the current user belongs to
export const getUserMemberships = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Fetch org details for each membership
    const membershipsWithOrgs = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get("organizations", membership.orgId);
        return {
          ...membership,
          org,
        };
      })
    );

    return membershipsWithOrgs;
  },
});

// Join an organization
export const joinOrg = mutation({
  args: {
    orgId: v.id("organizations"),
    inviteToken: v.optional(v.string()),
    directoryVisibility: v.union(v.literal("visible"), v.literal("hidden")),
  },
  handler: async (ctx, { orgId, inviteToken, directoryVisibility }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check org exists
    const org = await ctx.db.get("organizations", orgId);
    if (!org) {
      throw new Error("Organization not found");
    }

    // Check user not already a member
    const existingMembership = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .first();

    if (existingMembership) {
      throw new Error("Already a member of this organization");
    }

    // If invite token provided, validate it
    let inviteMembership: { _id: import("../_generated/dataModel").Id<"orgMemberships"> } | null = null;
    if (inviteToken) {
      const invite = await ctx.db
        .query("orgInviteLinks")
        .withIndex("by_token", (q) => q.eq("token", inviteToken))
        .first();

      if (!invite) {
        throw new Error("Invalid invite link");
      }

      if (invite.orgId !== orgId) {
        throw new Error("Invite link is for a different organization");
      }

      // Check expiration
      if (invite.expiresAt && invite.expiresAt < Date.now()) {
        throw new Error("Invite link has expired");
      }

      // Get the membership that created this invite for the invitedBy field
      inviteMembership = await ctx.db.get("orgMemberships", invite.createdBy);
    }

    // Check if this is the first member (becomes admin per CONTEXT.md)
    const existingMembers = await ctx.db
      .query("orgMemberships")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();

    const role = existingMembers ? "member" : "admin";

    // Insert membership
    const membershipId = await ctx.db.insert("orgMemberships", {
      userId,
      orgId,
      role,
      directoryVisibility,
      joinedAt: Date.now(),
      invitedBy: inviteMembership?._id,
    });

    return await ctx.db.get("orgMemberships", membershipId);
  },
});

// Leave an organization
export const leaveOrg = mutation({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's membership
    const membership = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .first();

    if (!membership) {
      throw new Error("Not a member of this organization");
    }

    // If user is an admin, check there are other admins
    if (membership.role === "admin") {
      const otherAdmins = await ctx.db
        .query("orgMemberships")
        .withIndex("by_org_role", (q) => q.eq("orgId", orgId).eq("role", "admin"))
        .collect();

      // Filter out current user
      const remainingAdmins = otherAdmins.filter((m) => m.userId !== userId);

      if (remainingAdmins.length === 0) {
        throw new Error(
          "Cannot leave organization as the last admin. Promote another member to admin first."
        );
      }
    }

    // Delete membership
    await ctx.db.delete("orgMemberships", membership._id);

    return { success: true };
  },
});

// Update directory visibility
export const setDirectoryVisibility = mutation({
  args: {
    orgId: v.id("organizations"),
    visibility: v.union(v.literal("visible"), v.literal("hidden")),
  },
  handler: async (ctx, { orgId, visibility }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's membership
    const membership = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("orgId"), orgId))
      .first();

    if (!membership) {
      throw new Error("Not a member of this organization");
    }

    // Update visibility
    await ctx.db.patch("orgMemberships", membership._id, {
      directoryVisibility: visibility,
    });

    return { success: true };
  },
});
