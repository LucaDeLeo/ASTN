import { v } from "convex/values";
import { query } from "../_generated/server";
import { auth } from "../auth";
import type { Doc } from "../_generated/dataModel";

// Helper to parse city from user's location string
function parseCity(location: string | undefined): string | null {
  if (!location) return null;
  // Simple parsing: assume "City, Country" or just "City" format
  const parts = location.split(",").map((s) => s.trim());
  return parts[0] || null;
}

/**
 * Get suggested organizations for current user based on location.
 *
 * Behavior:
 * - Returns empty array for unauthenticated users
 * - Respects locationDiscoverable privacy setting (opt-in)
 * - If location discovery disabled or no location: returns global orgs only
 * - If location enabled: returns local orgs first, fills with global orgs
 * - Excludes orgs user has already joined
 * - Maximum 5 suggestions
 */
export const getSuggestedOrgs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Get user's existing memberships to exclude
    const memberships = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const joinedOrgIds = new Set(memberships.map((m) => m.orgId.toString()));

    // If location discovery disabled or no location, return global orgs only
    if (!profile?.privacySettings?.locationDiscoverable || !profile?.location) {
      const globalOrgs = await ctx.db
        .query("organizations")
        .filter((q) => q.eq(q.field("isGlobal"), true))
        .collect();

      return globalOrgs
        .filter((org) => !joinedOrgIds.has(org._id.toString()))
        .slice(0, 5);
    }

    // Parse user city
    const userCity = parseCity(profile.location);

    // 1. Get local orgs (same city)
    let localOrgs: Array<Doc<"organizations">> = [];
    if (userCity) {
      localOrgs = await ctx.db
        .query("organizations")
        .filter((q) =>
          q.and(
            q.eq(q.field("city"), userCity),
            q.neq(q.field("isGlobal"), true)
          )
        )
        .collect();
    }

    // 2. Get global orgs to fill remaining slots
    const globalOrgs = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("isGlobal"), true))
      .collect();

    // 3. Combine, filter out joined, take 5
    const combined = [...localOrgs, ...globalOrgs];
    const filtered = combined.filter(
      (org) => !joinedOrgIds.has(org._id.toString())
    );

    return filtered.slice(0, 5);
  },
});

/**
 * Get all organizations with optional filtering by country and search.
 * Returns orgs with computed member counts, sorted alphabetically.
 */
export const getAllOrgs = query({
  args: {
    country: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, { country, searchQuery }) => {
    let orgs;

    // If search query provided, use search index
    if (searchQuery && searchQuery.trim()) {
      orgs = await ctx.db
        .query("organizations")
        .withSearchIndex("search_name", (q) => q.search("name", searchQuery))
        .collect();
    }
    // If country filter, use index
    else if (country) {
      orgs = await ctx.db
        .query("organizations")
        .withIndex("by_country", (q) => q.eq("country", country))
        .collect();
    }
    // Otherwise get all
    else {
      orgs = await ctx.db.query("organizations").collect();
    }

    // For each org, get member count
    const orgsWithCounts = await Promise.all(
      orgs.map(async (org) => {
        const memberCount = await ctx.db
          .query("orgMemberships")
          .withIndex("by_org", (q) => q.eq("orgId", org._id))
          .collect()
          .then((m) => m.length);

        return {
          ...org,
          memberCount,
        };
      })
    );

    // Sort alphabetically by name
    return orgsWithCounts.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get unique countries from all organizations for filter dropdown.
 */
export const getOrgCountries = query({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    const countries = [...new Set(orgs.map((o) => o.country).filter(Boolean))];
    return countries.sort() as Array<string>;
  },
});
