"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";
import {
  MATCHING_SYSTEM_PROMPT,
  buildProfileContext,
  buildOpportunitiesContext,
  matchOpportunitiesTool,
  MatchingResult,
} from "./prompts";
import { Id } from "../_generated/dataModel";

const MODEL_VERSION = "claude-sonnet-4-5-20241022";
const BATCH_SIZE = 15; // Process up to 15 opportunities per LLM call

// Main compute action - scores all opportunities for a profile
export const computeMatchesForProfile = action({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, { profileId }) => {
    // 1. Get profile with all fields
    const profile = await ctx.runQuery(
      internal.matching.queries.getFullProfile,
      { profileId }
    );
    if (!profile) {
      throw new Error("Profile not found");
    }

    // 2. Get candidate opportunities (excluding hidden orgs, expired)
    const hiddenOrgs = profile.privacySettings?.hiddenFromOrgs || [];
    const opportunities = await ctx.runQuery(
      internal.matching.queries.getCandidateOpportunities,
      { hiddenOrgs, limit: 50 } // Cap at 50 for pilot
    );

    if (opportunities.length === 0) {
      // No opportunities to match - clear existing matches
      await ctx.runMutation(
        internal.matching.mutations.clearMatchesForProfile,
        { profileId }
      );
      return { matchCount: 0, message: "No active opportunities to match" };
    }

    // 3. Build context
    const profileContext = buildProfileContext(profile);

    // 4. Process in batches if needed
    const allMatches: MatchingResult["matches"] = [];
    let aggregatedGrowthAreas: MatchingResult["growthAreas"] = [];

    for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
      const batch = opportunities.slice(i, i + BATCH_SIZE);
      const opportunitiesContext = buildOpportunitiesContext(batch);

      // 5. Call Claude with forced tool_choice
      const anthropic = new Anthropic();
      const response = await anthropic.messages.create({
        model: MODEL_VERSION,
        max_tokens: 4096,
        tools: [matchOpportunitiesTool],
        tool_choice: { type: "tool", name: "score_opportunities" },
        system: MATCHING_SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `${profileContext}\n\n---\n\n${opportunitiesContext}\n\nScore all opportunities for this candidate. Include only opportunities with tier great, good, or exploring - skip any that have no reasonable fit.`
        }]
      });

      // 6. Extract tool use result
      const toolUse = response.content.find(block => block.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        console.error("No tool use in response for batch", i);
        continue;
      }

      const batchResult = toolUse.input as MatchingResult;

      // Map opportunityId strings back to actual Ids
      for (const match of batchResult.matches) {
        const oppId = match.opportunityId as Id<"opportunities">;
        // Verify the opportunity exists in our batch
        const validOpp = batch.find(o => o._id === oppId);
        if (validOpp) {
          allMatches.push({
            ...match,
            opportunityId: oppId,
          });
        }
      }

      // Keep growth areas from last batch (most comprehensive view)
      if (batchResult.growthAreas.length > 0) {
        aggregatedGrowthAreas = batchResult.growthAreas;
      }
    }

    // 7. Save all matches
    if (allMatches.length > 0) {
      await ctx.runMutation(
        internal.matching.mutations.saveMatches,
        {
          profileId,
          matches: allMatches.map(m => ({
            opportunityId: m.opportunityId as Id<"opportunities">,
            tier: m.tier,
            score: m.score,
            strengths: m.strengths,
            gap: m.gap,
            interviewChance: m.interviewChance,
            ranking: m.ranking,
            confidence: m.confidence,
            recommendations: m.recommendations,
          })),
          modelVersion: MODEL_VERSION,
        }
      );
    }

    return {
      matchCount: allMatches.length,
      tiers: {
        great: allMatches.filter(m => m.tier === "great").length,
        good: allMatches.filter(m => m.tier === "good").length,
        exploring: allMatches.filter(m => m.tier === "exploring").length,
      },
      growthAreas: aggregatedGrowthAreas,
    };
  },
});
