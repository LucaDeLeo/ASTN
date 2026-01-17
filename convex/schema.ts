import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  opportunities: defineTable({
    // Identity
    sourceId: v.string(), // Unique per source: "80k-123", "aisafety-abc", "manual-uuid"
    source: v.union(
      v.literal("80k_hours"),
      v.literal("aisafety_com"),
      v.literal("manual")
    ),

    // Core fields
    title: v.string(),
    organization: v.string(),
    organizationLogoUrl: v.optional(v.string()),
    location: v.string(),
    isRemote: v.boolean(),
    roleType: v.string(), // "research", "engineering", "operations", "policy", "other"
    experienceLevel: v.optional(v.string()), // "entry", "mid", "senior", "lead"
    description: v.string(),
    requirements: v.optional(v.array(v.string())),
    salaryRange: v.optional(v.string()),
    deadline: v.optional(v.number()), // Unix timestamp

    // Source tracking
    sourceUrl: v.string(),
    alternateSources: v.optional(
      v.array(
        v.object({
          sourceId: v.string(),
          source: v.string(),
          sourceUrl: v.string(),
        })
      )
    ),

    // Status and timestamps
    status: v.union(v.literal("active"), v.literal("archived")),
    lastVerified: v.number(), // For freshness indicator (OPPS-06)
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_source_id", ["sourceId"])
    .index("by_organization", ["organization"])
    .index("by_status", ["status"])
    .index("by_role_type", ["roleType", "status"])
    .index("by_location", ["isRemote", "status"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status", "roleType", "isRemote"],
    }),
});
