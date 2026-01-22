import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

// AI Safety Skills Taxonomy
const SKILLS_TAXONOMY = [
  // Research Areas
  { name: "Alignment Research", category: "Research Areas" },
  { name: "Interpretability", category: "Research Areas" },
  { name: "Mechanistic Interpretability", category: "Research Areas" },
  { name: "AI Governance and Policy", category: "Research Areas" },
  { name: "AI Safety Evaluation", category: "Research Areas" },
  { name: "Robustness and Security", category: "Research Areas" },
  { name: "Multi-Agent Safety", category: "Research Areas" },
  { name: "Scalable Oversight", category: "Research Areas" },
  { name: "Value Learning", category: "Research Areas" },
  { name: "RLHF", category: "Research Areas" },
  { name: "Deceptive Alignment Detection", category: "Research Areas" },
  { name: "Constitutional AI", category: "Research Areas" },
  { name: "Red Teaming", category: "Research Areas" },

  // Technical Skills
  { name: "Machine Learning Engineering", category: "Technical Skills" },
  { name: "Deep Learning", category: "Technical Skills" },
  { name: "Neural Networks", category: "Technical Skills" },
  { name: "Natural Language Processing", category: "Technical Skills" },
  { name: "Reinforcement Learning", category: "Technical Skills" },
  { name: "Python", category: "Technical Skills" },
  { name: "PyTorch", category: "Technical Skills" },
  { name: "JAX", category: "Technical Skills" },
  { name: "TensorFlow", category: "Technical Skills" },
  { name: "Statistical Analysis", category: "Technical Skills" },
  { name: "Formal Verification", category: "Technical Skills" },
  { name: "Causal Inference", category: "Technical Skills" },

  // Domain Knowledge
  { name: "AI Risk Assessment", category: "Domain Knowledge" },
  { name: "Existential Risk", category: "Domain Knowledge" },
  { name: "AI Ethics", category: "Domain Knowledge" },
  { name: "Technology Policy", category: "Domain Knowledge" },
  { name: "International Coordination", category: "Domain Knowledge" },
  { name: "Regulatory Frameworks", category: "Domain Knowledge" },

  // Soft Skills
  { name: "Technical Writing", category: "Soft Skills" },
  { name: "Research Communication", category: "Soft Skills" },
  { name: "Cross-functional Collaboration", category: "Soft Skills" },
  { name: "Stakeholder Engagement", category: "Soft Skills" },
  { name: "Project Management", category: "Soft Skills" },
];

// Internal mutation to seed taxonomy (called by ensureTaxonomySeeded action)
export const seedTaxonomy = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("skillsTaxonomy").first();
    if (existing) {
      return { seeded: false, message: "Taxonomy already seeded" };
    }

    // Insert all skills
    for (const skill of SKILLS_TAXONOMY) {
      await ctx.db.insert("skillsTaxonomy", {
        name: skill.name,
        category: skill.category,
      });
    }

    return { seeded: true, count: SKILLS_TAXONOMY.length };
  },
});

// Action to ensure taxonomy is seeded (safe to call multiple times)
export const ensureTaxonomySeeded = action({
  args: {},
  handler: async (ctx): Promise<{ seeded: boolean; message?: string; count?: number }> => {
    return await ctx.runMutation(internal.skills.seedTaxonomy);
  },
});

// Get all skills from taxonomy, ordered by category then name
export const getTaxonomy = query({
  args: {},
  handler: async (ctx) => {
    const skills = await ctx.db.query("skillsTaxonomy").collect();

    // Sort by category, then by name
    const categoryOrder = [
      "Research Areas",
      "Technical Skills",
      "Domain Knowledge",
      "Soft Skills",
    ];

    return skills.sort((a, b) => {
      const categoryDiff =
        categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (categoryDiff !== 0) return categoryDiff;
      return a.name.localeCompare(b.name);
    });
  },
});

// Search skills by name (case-insensitive contains matching)
export const searchSkills = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchQuery }) => {
    if (!searchQuery.trim()) {
      return [];
    }

    const lowerQuery = searchQuery.toLowerCase();

    // Get all skills and filter (search index would be better for large datasets)
    const skills = await ctx.db.query("skillsTaxonomy").collect();

    return skills.filter((skill) => {
      // Match name
      if (skill.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Match aliases if present
      if (skill.aliases?.some((alias) => alias.toLowerCase().includes(lowerQuery))) {
        return true;
      }
      return false;
    });
  },
});
