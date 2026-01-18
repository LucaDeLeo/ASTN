import { v } from "convex/values";
import { query } from "./_generated/server";

// List active opportunities with optional filters
export const list = query({
  args: {
    roleType: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    if (args.roleType) {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_role_type", (q) =>
          q.eq("roleType", args.roleType!).eq("status", "active")
        )
        .take(limit);
    } else if (args.isRemote !== undefined) {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_location", (q) =>
          q.eq("isRemote", args.isRemote!).eq("status", "active")
        )
        .take(limit);
    } else {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .take(limit);
    }
  },
});

// Get single opportunity by ID
export const get = query({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db.get("opportunities", args.id);
  },
});

// Search opportunities by title (uses search index)
export const search = query({
  args: {
    searchTerm: v.string(),
    roleType: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const searchQuery = ctx.db
      .query("opportunities")
      .withSearchIndex("search_title", (q) => {
        let search = q.search("title", args.searchTerm);
        search = search.eq("status", "active");
        if (args.roleType) search = search.eq("roleType", args.roleType);
        if (args.isRemote !== undefined)
          search = search.eq("isRemote", args.isRemote);
        return search;
      });

    return await searchQuery.take(limit);
  },
});

// List all opportunities for admin (including archived)
export const listAll = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.includeArchived) {
      return await ctx.db.query("opportunities").collect();
    }
    return await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});
