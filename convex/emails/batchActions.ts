"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { renderMatchAlert, renderWeeklyDigest } from "./templates";
import type { Id, Doc } from "../_generated/dataModel";

// Target hour for match alert emails (8 AM user local time)
const MATCH_ALERT_TARGET_HOUR = 8;

// Batch size for processing users (to avoid timeout)
const BATCH_SIZE = 10;

// All sections for completeness check
const ALL_SECTIONS = [
  "basicInfo",
  "education",
  "workHistory",
  "careerGoals",
  "skills",
  "enrichment",
  "privacy",
];

// Types for query results
type Match = Doc<"matches">;
type Opportunity = Doc<"opportunities">;

interface AlertUser {
  userId: string;
  email: string;
  timezone: string;
  profileId: Id<"profiles">;
  userName: string;
}

interface DigestUser {
  userId: string;
  email: string;
  profileId: Id<"profiles">;
  userName: string;
  completedSections: string[];
  hasEnrichmentConversation: boolean;
}

/**
 * Process match alert emails for users in the current timezone bucket
 * Runs hourly to catch users whose local time is 8 AM
 */
export const processMatchAlertBatch: ReturnType<typeof internalAction> = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting match alert batch processing...");

    // Get users whose local hour is 8 AM
    const users: AlertUser[] = await ctx.runQuery(
      internal.emails.send.getUsersForMatchAlertBatch,
      { targetLocalHour: MATCH_ALERT_TARGET_HOUR }
    );

    if (users.length === 0) {
      console.log("No users in the 8 AM timezone bucket");
      return { processed: 0, emailsSent: 0 };
    }

    console.log(`Processing ${users.length} users for match alerts`);

    let emailsSent = 0;

    // Process in batches
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      for (const user of batch) {
        // Get new great-tier matches for this user
        const matches: Match[] = await ctx.runQuery(
          internal.emails.send.getNewGreatMatches,
          { profileId: user.profileId }
        );

        if (matches.length === 0) {
          continue;
        }

        // Get opportunity details for each match
        const matchesWithOpportunities = await Promise.all(
          matches.map(async (match: Match) => {
            const opportunity: Opportunity | null = await ctx.runQuery(
              internal.emails.send.getOpportunity,
              { opportunityId: match.opportunityId }
            );
            return { match, opportunity };
          })
        );

        // Filter out any null opportunities
        const validMatches = matchesWithOpportunities.filter(
          (m): m is { match: Match; opportunity: Opportunity } =>
            m.opportunity !== null
        );

        if (validMatches.length === 0) {
          continue;
        }

        // Render email
        const emailContent = await renderMatchAlert({
          userName: user.userName,
          matches: validMatches.map(({ match, opportunity }) => ({
            title: opportunity.title,
            org: opportunity.organization,
            tier: match.tier,
            explanation: match.explanation.strengths.join(". "),
            recommendations: match.recommendations
              .filter(
                (r: { type: string; action: string; priority: string }) =>
                  r.priority === "high"
              )
              .map(
                (r: { type: string; action: string; priority: string }) =>
                  r.action
              ),
          })),
        });

        // Send email
        await ctx.runMutation(internal.emails.send.sendMatchAlert, {
          to: user.email,
          subject: `${validMatches.length} new great-fit ${validMatches.length === 1 ? "opportunity" : "opportunities"} on ASTN`,
          html: emailContent,
        });

        // Mark matches as no longer new
        await ctx.runMutation(internal.emails.send.markMatchesNotNew, {
          matchIds: matches.map((m: Match) => m._id),
        });

        emailsSent++;
      }
    }

    console.log(`Match alert batch complete: ${emailsSent} emails sent`);
    return { processed: users.length, emailsSent };
  },
});

/**
 * Process weekly digest emails for users with digest enabled
 * Runs Sunday evening UTC
 */
export const processWeeklyDigestBatch = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; emailsSent: number }> => {
    console.log("Starting weekly digest batch processing...");

    // Get users with weekly digest enabled
    const users: DigestUser[] = await ctx.runQuery(
      internal.emails.send.getUsersForWeeklyDigestBatch,
      {}
    );

    if (users.length === 0) {
      console.log("No users have weekly digest enabled");
      return { processed: 0, emailsSent: 0 };
    }

    console.log(`Processing ${users.length} users for weekly digest`);

    let emailsSent = 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Process in batches
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);

      for (const user of batch) {
        // Get new matches from past week
        const recentMatches: Match[] = await ctx.runQuery(
          internal.emails.send.getRecentMatches,
          { profileId: user.profileId, since: oneWeekAgo }
        );

        // Get top 3 opportunities (by score within great/good tiers)
        const topMatches = recentMatches
          .filter((m: Match) => m.tier === "great" || m.tier === "good")
          .sort((a: Match, b: Match) => {
            // Sort by tier (great first), then by score
            if (a.tier !== b.tier) {
              return a.tier === "great" ? -1 : 1;
            }
            return b.score - a.score;
          })
          .slice(0, 3);

        // Get opportunity details for top matches
        const topOpportunities = await Promise.all(
          topMatches.map(async (match: Match) => {
            const opportunity: Opportunity | null = await ctx.runQuery(
              internal.emails.send.getOpportunity,
              { opportunityId: match.opportunityId }
            );
            return {
              title: opportunity?.title || "Unknown",
              org: opportunity?.organization || "Unknown",
              tier: match.tier,
            };
          })
        );

        // Generate profile nudges
        const profileNudges: string[] = [];

        // Check for incomplete sections
        const missingSections = ALL_SECTIONS.filter(
          (s) => !user.completedSections.includes(s)
        );
        if (missingSections.length > 0) {
          if (missingSections.includes("enrichment")) {
            profileNudges.push(
              "Complete your profile enrichment conversation to help us find better matches"
            );
          } else if (missingSections.length === 1) {
            profileNudges.push(
              `Complete your ${missingSections[0]} section to unlock more matches`
            );
          } else {
            profileNudges.push(
              `You have ${missingSections.length} incomplete profile sections`
            );
          }
        }

        // Render email
        const emailContent = await renderWeeklyDigest({
          userName: user.userName,
          newMatchesCount: recentMatches.length,
          topOpportunities,
          profileNudges,
        });

        // Send email
        await ctx.runMutation(internal.emails.send.sendWeeklyDigest, {
          to: user.email,
          subject: "Your Weekly AI Safety Opportunities Digest",
          html: emailContent,
        });

        emailsSent++;
      }
    }

    console.log(`Weekly digest batch complete: ${emailsSent} emails sent`);
    return { processed: users.length, emailsSent };
  },
});
