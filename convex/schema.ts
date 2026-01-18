import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Profile tables
  profiles: defineTable({
    userId: v.string(),

    // Basic info
    name: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    location: v.optional(v.string()),
    headline: v.optional(v.string()),

    // Education (array of entries)
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

    // Work history (array of entries)
    workHistory: v.optional(
      v.array(
        v.object({
          organization: v.string(),
          title: v.string(),
          startDate: v.optional(v.number()), // Unix timestamp
          endDate: v.optional(v.number()), // Unix timestamp
          current: v.optional(v.boolean()),
          description: v.optional(v.string()),
        })
      )
    ),

    // Skills (from taxonomy)
    skills: v.optional(v.array(v.string())),

    // Career goals and interests
    careerGoals: v.optional(v.string()),
    aiSafetyInterests: v.optional(v.array(v.string())),
    seeking: v.optional(v.string()),

    // LLM-generated content
    enrichmentSummary: v.optional(v.string()),
    hasEnrichmentConversation: v.optional(v.boolean()),

    // Privacy settings (section-level)
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

    // Completeness tracking
    completedSections: v.optional(v.array(v.string())),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Enrichment conversation messages
  enrichmentMessages: defineTable({
    profileId: v.id("profiles"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_profile", ["profileId", "createdAt"]),

  // Extractions from enrichment (pending review)
  enrichmentExtractions: defineTable({
    profileId: v.id("profiles"),
    field: v.string(),
    extractedValue: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("edited")
    ),
    editedValue: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_profile", ["profileId"]),

  // Skills taxonomy
  skillsTaxonomy: defineTable({
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())),
  })
    .index("by_category", ["category"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category"],
    }),

  // Organizations (for privacy selection and future features)
  organizations: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
    }),

  // Opportunities
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
