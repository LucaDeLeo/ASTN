import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new opportunity (manual entry)
export const createOpportunity = mutation({
  args: {
    title: v.string(),
    organization: v.string(),
    organizationLogoUrl: v.optional(v.string()),
    location: v.string(),
    isRemote: v.boolean(),
    roleType: v.string(),
    experienceLevel: v.optional(v.string()),
    description: v.string(),
    requirements: v.optional(v.array(v.string())),
    salaryRange: v.optional(v.string()),
    deadline: v.optional(v.number()),
    sourceUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sourceId = `manual-${crypto.randomUUID()}`;

    return await ctx.db.insert("opportunities", {
      ...args,
      sourceId,
      source: "manual",
      status: "active",
      lastVerified: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing opportunity
export const updateOpportunity = mutation({
  args: {
    id: v.id("opportunities"),
    title: v.optional(v.string()),
    organization: v.optional(v.string()),
    organizationLogoUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    roleType: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    description: v.optional(v.string()),
    requirements: v.optional(v.array(v.string())),
    salaryRange: v.optional(v.string()),
    deadline: v.optional(v.number()),
    sourceUrl: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

// Delete an opportunity
export const deleteOpportunity = mutation({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Archive an opportunity (soft delete)
export const archiveOpportunity = mutation({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "archived",
      updatedAt: Date.now(),
    });
  },
});
