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

    // Notification preferences (for email alerts and digests)
    notificationPreferences: v.optional(
      v.object({
        matchAlerts: v.object({
          enabled: v.boolean(),
        }),
        weeklyDigest: v.object({
          enabled: v.boolean(),
        }),
        timezone: v.string(), // IANA timezone, e.g., "America/New_York"
      })
    ),

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
    .index("by_slug", ["slug"])
    .searchIndex("search_name", {
      searchField: "name",
    }),

  // Organization memberships
  orgMemberships: defineTable({
    userId: v.string(),
    orgId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("member")),
    directoryVisibility: v.union(v.literal("visible"), v.literal("hidden")),
    joinedAt: v.number(),
    invitedBy: v.optional(v.id("orgMemberships")),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"])
    .index("by_org_role", ["orgId", "role"]),

  // Organization invite links
  orgInviteLinks: defineTable({
    orgId: v.id("organizations"),
    token: v.string(), // Unique invite token (UUID)
    createdBy: v.id("orgMemberships"),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()), // Optional expiration
  })
    .index("by_token", ["token"])
    .index("by_org", ["orgId"]),

  // Match results (per CONTEXT.md: tier labels, not percentages)
  matches: defineTable({
    profileId: v.id("profiles"),
    opportunityId: v.id("opportunities"),

    // Scoring (tier labels not percentages per CONTEXT.md)
    tier: v.union(
      v.literal("great"),
      v.literal("good"),
      v.literal("exploring")
    ),
    score: v.number(), // 0-100 internal score for sorting within tier

    // Explanation (MATCH-02: bullet points with strengths + actionable gap)
    explanation: v.object({
      strengths: v.array(v.string()), // 2-4 bullet points on why this fits
      gap: v.optional(v.string()), // One actionable thing to strengthen application
    }),

    // Probability (MATCH-03: dual framing with experimental label)
    probability: v.object({
      interviewChance: v.string(), // "Strong chance", "Good chance", "Moderate chance"
      ranking: v.string(), // "Top 10%", "Top 20%", etc.
      confidence: v.string(), // "HIGH", "MEDIUM", "LOW"
    }),

    // Recommendations (MATCH-04: 1 specific + 1-2 general per match)
    recommendations: v.array(
      v.object({
        type: v.union(
          v.literal("specific"),
          v.literal("skill"),
          v.literal("experience")
        ),
        action: v.string(),
        priority: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
      })
    ),

    // Metadata
    isNew: v.boolean(), // For "new high-fit" prioritization
    computedAt: v.number(),
    modelVersion: v.string(), // Track which model version generated this
  })
    .index("by_profile", ["profileId"])
    .index("by_profile_tier", ["profileId", "tier"])
    .index("by_opportunity", ["opportunityId"])
    .index("by_profile_new", ["profileId", "isNew"]),

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
