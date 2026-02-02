import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query } from "./_generated/server";
import { auth } from "./auth";

// List active opportunities with optional filters
export const list = query({
  args: {
    roleType: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 1000;

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

// List active opportunities with pagination
export const listPaginated = query({
  args: {
    roleType: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.roleType) {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_role_type", (q) =>
          q.eq("roleType", args.roleType!).eq("status", "active")
        )
        .paginate(args.paginationOpts);
    } else if (args.isRemote !== undefined) {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_location", (q) =>
          q.eq("isRemote", args.isRemote!).eq("status", "active")
        )
        .paginate(args.paginationOpts);
    } else {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .paginate(args.paginationOpts);
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
        let searchBuilder = q.search("title", args.searchTerm);
        searchBuilder = searchBuilder.eq("status", "active");
        if (args.roleType) searchBuilder = searchBuilder.eq("roleType", args.roleType);
        if (args.isRemote !== undefined)
          searchBuilder = searchBuilder.eq("isRemote", args.isRemote);
        return searchBuilder;
      });

    return await searchQuery.take(limit);
  },
});

// Search opportunities with pagination (uses search index)
export const searchPaginated = query({
  args: {
    searchTerm: v.string(),
    roleType: v.optional(v.string()),
    isRemote: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("opportunities")
      .withSearchIndex("search_title", (q) => {
        let sq = q.search("title", args.searchTerm);
        sq = sq.eq("status", "active");
        if (args.roleType) sq = sq.eq("roleType", args.roleType);
        if (args.isRemote !== undefined) sq = sq.eq("isRemote", args.isRemote);
        return sq;
      })
      .paginate(args.paginationOpts);
  },
});

// List all opportunities for admin (including archived)
export const listAll = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Admin auth check (returns [] for unauthenticated/non-admin)
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const adminMembership = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    if (!adminMembership) return [];

    if (args.includeArchived) {
      return await ctx.db.query("opportunities").collect();
    }
    return await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});
