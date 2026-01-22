import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Common AI safety organizations for privacy selector
const AI_SAFETY_ORGANIZATIONS = [
  {
    name: "BAISH (Buenos Aires AI Safety Hub)",
    slug: "baish",
    description: "AI safety research and community hub in Latin America focused on alignment and safety research.",
    city: "Buenos Aires",
    country: "Argentina",
    isGlobal: false,
  },
  {
    name: "Anthropic",
    slug: "anthropic",
    description: "AI safety company building reliable, interpretable, and steerable AI systems.",
    city: "San Francisco",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "OpenAI",
    slug: "openai",
    description: "AI research organization focused on ensuring artificial general intelligence benefits humanity.",
    city: "San Francisco",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "DeepMind",
    slug: "deepmind",
    description: "AI research lab with dedicated safety teams working on alignment and interpretability.",
    city: "London",
    country: "United Kingdom",
    isGlobal: false,
  },
  {
    name: "Redwood Research",
    slug: "redwood-research",
    description: "Nonprofit research organization focused on applied alignment research and interpretability.",
    city: "Berkeley",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "MIRI (Machine Intelligence Research Institute)",
    slug: "miri",
    description: "Research nonprofit focused on mathematical foundations of AI alignment.",
    city: "Berkeley",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "Center for AI Safety",
    slug: "center-for-ai-safety",
    description: "Nonprofit focused on reducing societal-scale risks from AI through research and field-building.",
    city: "San Francisco",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "AI Safety Camp",
    slug: "ai-safety-camp",
    description: "Intensive research programs connecting aspiring researchers with AI safety mentors.",
    isGlobal: true,
  },
  {
    name: "BERI (Berkeley Existential Risk Initiative)",
    slug: "beri",
    description: "Supports university research groups working on existential risk reduction.",
    city: "Berkeley",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "80,000 Hours",
    slug: "80000-hours",
    description: "Career advice nonprofit helping people find high-impact careers, including AI safety.",
    city: "London",
    country: "United Kingdom",
    isGlobal: true,
  },
  {
    name: "Open Philanthropy",
    slug: "open-philanthropy",
    description: "Major funder of AI safety research and organizations globally.",
    city: "San Francisco",
    country: "United States",
    isGlobal: true,
  },
  {
    name: "Alignment Forum",
    slug: "alignment-forum",
    description: "Online community for AI alignment researchers to discuss technical research.",
    isGlobal: true,
  },
  {
    name: "Conjecture",
    slug: "conjecture",
    description: "AI safety company working on alignment research and safe AI development.",
    city: "London",
    country: "United Kingdom",
    isGlobal: false,
  },
  {
    name: "ARC (Alignment Research Center)",
    slug: "arc",
    description: "Nonprofit conducting AI alignment research and model evaluations.",
    city: "Berkeley",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "EleutherAI",
    slug: "eleutherai",
    description: "Grassroots collective of researchers focused on open-source AI and interpretability.",
    isGlobal: true,
  },
  {
    name: "FAR AI",
    slug: "far-ai",
    description: "Research organization working on trustworthy AI through robustness and alignment.",
    city: "Berkeley",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "CHAI (Center for Human-Compatible AI)",
    slug: "chai",
    description: "UC Berkeley research center focused on developing provably beneficial AI systems.",
    city: "Berkeley",
    country: "United States",
    isGlobal: false,
  },
  {
    name: "Apollo Research",
    slug: "apollo-research",
    description: "Research organization focused on evaluating and detecting deceptive AI behavior.",
    city: "London",
    country: "United Kingdom",
    isGlobal: false,
  },
  {
    name: "Model Evaluation and Threat Research (METR)",
    slug: "metr",
    description: "Organization conducting evaluations of AI systems for dangerous capabilities.",
    city: "Berkeley",
    country: "United States",
    isGlobal: false,
  },
];

// Internal mutation to seed organizations (not exposed to clients directly)
export const seedOrganizations = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if organizations already exist
    const existing = await ctx.db.query("organizations").first();
    if (existing) {
      return { seeded: false, message: "Organizations already exist" };
    }

    // Insert all AI safety organizations
    for (const org of AI_SAFETY_ORGANIZATIONS) {
      await ctx.db.insert("organizations", {
        name: org.name,
        slug: org.slug,
        description: org.description,
        city: org.city,
        country: org.country,
        isGlobal: org.isGlobal,
      });
    }

    return { seeded: true, count: AI_SAFETY_ORGANIZATIONS.length };
  },
});

// List all organizations (for browse mode)
export const listOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const organizations = await ctx.db.query("organizations").collect();
    // Sort alphabetically by name
    return organizations.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Search organizations by name (for search mode)
export const searchOrganizations = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchQuery }) => {
    if (!searchQuery.trim()) {
      return [];
    }

    const results = await ctx.db
      .query("organizations")
      .withSearchIndex("search_name", (q) => q.search("name", searchQuery))
      .take(10);

    return results;
  },
});

// Create invite link for an org (bootstrap, run from dashboard)
export const createInviteLinkInternal = internalMutation({
  args: {
    orgSlug: v.string(),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, { orgSlug, expiresInDays }) => {
    const org = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("slug"), orgSlug))
      .first();

    if (!org) {
      throw new Error(`Organization not found with slug: ${orgSlug}`);
    }

    // Get an admin membership to use as createdBy
    const adminMembership = await ctx.db
      .query("orgMemberships")
      .withIndex("by_org_role", (q) =>
        q.eq("orgId", org._id).eq("role", "admin")
      )
      .first();

    if (!adminMembership) {
      throw new Error("No admin found for this organization");
    }

    const token = crypto.randomUUID();
    const expiresAt = expiresInDays
      ? Date.now() + expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    await ctx.db.insert("orgInviteLinks", {
      orgId: org._id,
      token,
      createdBy: adminMembership._id,
      createdAt: Date.now(),
      expiresAt,
    });

    return {
      token,
      url: `/org/${orgSlug}/join?token=${token}`,
      expiresAt,
    };
  },
});

// Add missing BAISH org (one-time fix)
export const addBaishOrg = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("slug"), "baish"))
      .first();

    if (existing) {
      return { action: "already_exists", orgId: existing._id };
    }

    const orgId = await ctx.db.insert("organizations", {
      name: "BAISH (Buenos Aires AI Safety Hub)",
      slug: "baish",
      description:
        "AI safety research and community hub in Latin America focused on alignment and safety research.",
      city: "Buenos Aires",
      country: "Argentina",
      isGlobal: false,
    });

    return { action: "created", orgId };
  },
});

// Bootstrap: Make a user admin of an org (one-time setup, run from dashboard)
export const bootstrapOrgAdmin = internalMutation({
  args: {
    userEmail: v.string(),
    orgSlug: v.string(),
  },
  handler: async (ctx, { userEmail, orgSlug }) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), userEmail))
      .first();

    if (!user) {
      throw new Error(`User not found with email: ${userEmail}`);
    }

    // Find org by slug
    const org = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("slug"), orgSlug))
      .first();

    if (!org) {
      throw new Error(`Organization not found with slug: ${orgSlug}`);
    }

    // Check if already a member
    const existing = await ctx.db
      .query("orgMemberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("orgId"), org._id))
      .first();

    if (existing) {
      // Update to admin if not already
      if (existing.role !== "admin") {
        await ctx.db.patch("orgMemberships", existing._id, { role: "admin" });
        return { action: "promoted", userId: user._id, orgId: org._id };
      }
      return { action: "already_admin", userId: user._id, orgId: org._id };
    }

    // Create admin membership
    await ctx.db.insert("orgMemberships", {
      userId: user._id,
      orgId: org._id,
      role: "admin",
      directoryVisibility: "visible",
      joinedAt: Date.now(),
    });

    return { action: "created", userId: user._id, orgId: org._id };
  },
});

// Ensure organizations are seeded (called on first access to org selector)
export const ensureOrganizationsSeeded = action({
  args: {},
  handler: async (ctx): Promise<{ action: string }> => {
    // Check if organizations exist by querying the count
    const organizations = await ctx.runQuery(
      api.organizations.listOrganizations
    );

    if (organizations.length === 0) {
      // Seed the organizations
      await ctx.runMutation(internal.organizations.seedOrganizations);
      return { action: "seeded" };
    }

    return { action: "already_seeded" };
  },
});
