import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { isSimilarOpportunity } from "./dedup";

const opportunityValidator = v.object({
  sourceId: v.string(),
  source: v.union(
    v.literal("80k_hours"),
    v.literal("aisafety_com"),
    v.literal("manual")
  ),
  title: v.string(),
  organization: v.string(),
  location: v.string(),
  isRemote: v.boolean(),
  roleType: v.string(),
  experienceLevel: v.optional(v.string()),
  description: v.string(),
  requirements: v.optional(v.array(v.string())),
  salaryRange: v.optional(v.string()),
  deadline: v.optional(v.number()),
  sourceUrl: v.string(),
  postedAt: v.optional(v.number()),
});

export const upsertOpportunities = internalMutation({
  args: {
    opportunities: v.array(opportunityValidator),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let merged = 0;

    for (const opp of args.opportunities) {
      // Check for exact source match first
      const existing = await ctx.db
        .query("opportunities")
        .withIndex("by_source_id", (q) => q.eq("sourceId", opp.sourceId))
        .unique();

      if (existing) {
        // Update existing opportunity
        await ctx.db.patch("opportunities", existing._id, {
          title: opp.title,
          organization: opp.organization,
          location: opp.location,
          isRemote: opp.isRemote,
          roleType: opp.roleType,
          experienceLevel: opp.experienceLevel,
          description: opp.description,
          requirements: opp.requirements,
          salaryRange: opp.salaryRange,
          deadline: opp.deadline,
          sourceUrl: opp.sourceUrl,
          lastVerified: Date.now(),
          updatedAt: Date.now(),
        });
        updated++;
      } else {
        // Check for fuzzy duplicate from different source
        const sameOrg = await ctx.db
          .query("opportunities")
          .withIndex("by_organization", (q) =>
            q.eq("organization", opp.organization)
          )
          .collect();

        const duplicate = sameOrg.find((existing) =>
          isSimilarOpportunity(
            { title: existing.title, organization: existing.organization },
            { title: opp.title, organization: opp.organization }
          )
        );

        if (duplicate) {
          // Add as alternate source
          const alternateSources = duplicate.alternateSources || [];
          const alreadyListed = alternateSources.some(
            (s) => s.sourceId === opp.sourceId
          );

          if (!alreadyListed) {
            await ctx.db.patch("opportunities", duplicate._id, {
              alternateSources: [
                ...alternateSources,
                {
                  sourceId: opp.sourceId,
                  source: opp.source,
                  sourceUrl: opp.sourceUrl,
                },
              ],
              lastVerified: Date.now(),
              updatedAt: Date.now(),
            });
            merged++;
          }
        } else {
          // Insert new opportunity
          await ctx.db.insert("opportunities", {
            sourceId: opp.sourceId,
            source: opp.source,
            title: opp.title,
            organization: opp.organization,
            location: opp.location,
            isRemote: opp.isRemote,
            roleType: opp.roleType,
            experienceLevel: opp.experienceLevel,
            description: opp.description,
            requirements: opp.requirements,
            salaryRange: opp.salaryRange,
            deadline: opp.deadline,
            sourceUrl: opp.sourceUrl,
            status: "active",
            lastVerified: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          inserted++;
        }
      }
    }

    console.log(
      `Upsert complete: ${inserted} inserted, ${updated} updated, ${merged} merged`
    );
  },
});

export const archiveMissing = internalMutation({
  args: {
    currentSourceIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const sourceIdSet = new Set(args.currentSourceIds);

    // Get all active non-manual opportunities
    const activeOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let archived = 0;
    for (const opp of activeOpportunities) {
      // Don't archive manual entries or opportunities still in source
      if (opp.source === "manual" || sourceIdSet.has(opp.sourceId)) {
        continue;
      }

      // Also check if any alternate source is still active
      const hasActiveAlternate = opp.alternateSources?.some((alt) =>
        sourceIdSet.has(alt.sourceId)
      );

      if (!hasActiveAlternate) {
        await ctx.db.patch("opportunities", opp._id, {
          status: "archived",
          updatedAt: Date.now(),
        });
        archived++;
      }
    }

    if (archived > 0) {
      console.log(`Archived ${archived} opportunities no longer in sources`);
    }
  },
});
