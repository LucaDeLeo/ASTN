import { query, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

// Common AI safety organizations for privacy selector
const AI_SAFETY_ORGANIZATIONS = [
  { name: "Anthropic", slug: "anthropic" },
  { name: "OpenAI", slug: "openai" },
  { name: "DeepMind", slug: "deepmind" },
  { name: "Redwood Research", slug: "redwood-research" },
  { name: "MIRI (Machine Intelligence Research Institute)", slug: "miri" },
  { name: "Center for AI Safety", slug: "center-for-ai-safety" },
  { name: "AI Safety Camp", slug: "ai-safety-camp" },
  { name: "BERI (Berkeley Existential Risk Initiative)", slug: "beri" },
  { name: "80,000 Hours", slug: "80000-hours" },
  { name: "Open Philanthropy", slug: "open-philanthropy" },
  { name: "Alignment Forum", slug: "alignment-forum" },
  { name: "Conjecture", slug: "conjecture" },
  { name: "ARC (Alignment Research Center)", slug: "arc" },
  { name: "EleutherAI", slug: "eleutherai" },
  { name: "FAR AI", slug: "far-ai" },
  { name: "CHAI (Center for Human-Compatible AI)", slug: "chai" },
  { name: "Apollo Research", slug: "apollo-research" },
  { name: "Model Evaluation and Threat Research (METR)", slug: "metr" },
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
  handler: async (ctx, { query }) => {
    if (!query.trim()) {
      return [];
    }

    const results = await ctx.db
      .query("organizations")
      .withSearchIndex("search_name", (q) => q.search("name", query))
      .take(10);

    return results;
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
