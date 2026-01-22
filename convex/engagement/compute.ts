"use node";

import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  DEFAULT_THRESHOLDS,
  ENGAGEMENT_SYSTEM_PROMPT,
  buildEngagementContext,
  classifyEngagementTool,
} from "./prompts";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import type { EngagementResult, EngagementSignals } from "./prompts";

const MODEL_VERSION = "claude-haiku-4-5-20251001";

// Helper: Gather engagement signals for a member
async function getEngagementSignals(
  ctx: ActionCtx,
  userId: string,
  orgId: Id<"organizations">,
  joinedAt: number,
  profileUpdatedAt?: number
): Promise<EngagementSignals> {
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

  // Get attendance records for this user in this org
  // We need to query attendance table via internal query
  const attendanceData = await ctx.runQuery(
    internal.engagement.queries.getAttendanceForEngagement,
    { userId, orgId }
  );

  // Count attended/partial in last 90 days
  const attended90d = attendanceData.filter(
    (a: { status: string; respondedAt?: number; createdAt: number }) =>
      (a.status === "attended" || a.status === "partial") &&
      (a.respondedAt ?? a.createdAt) >= ninetyDaysAgo
  ).length;

  // Find last attendance
  const attendedRecords = attendanceData.filter(
    (a: { status: string }) => a.status === "attended" || a.status === "partial"
  );
  const lastAttendance = attendedRecords.length > 0
    ? Math.max(
        ...attendedRecords.map(
          (a: { respondedAt?: number; createdAt: number }) =>
            a.respondedAt ?? a.createdAt
        )
      )
    : undefined;

  // Get event views count (proxy for RSVPs) in last 90 days
  const eventViewsCount = await ctx.runQuery(
    internal.engagement.queries.getEventViewsCount,
    { userId, orgId, since: ninetyDaysAgo }
  );

  return {
    eventsAttended90d: attended90d,
    lastAttendedAt: lastAttendance,
    rsvpCount90d: eventViewsCount,
    profileUpdatedAt,
    joinedAt,
  };
}

// Small delay to avoid rate limiting
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compute engagement for a single member
 */
export const computeMemberEngagement = internalAction({
  args: {
    userId: v.string(),
    orgId: v.id("organizations"),
    orgName: v.string(),
    memberName: v.string(),
    joinedAt: v.number(),
    profileUpdatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, orgId, orgName, memberName, joinedAt, profileUpdatedAt } = args;

    // Gather signals
    const signals = await getEngagementSignals(
      ctx,
      userId,
      orgId,
      joinedAt,
      profileUpdatedAt
    );

    // Build context
    const context = buildEngagementContext(
      orgName,
      memberName,
      signals,
      DEFAULT_THRESHOLDS
    );

    // Call Claude with forced tool_choice
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: MODEL_VERSION,
      max_tokens: 500,
      tools: [classifyEngagementTool],
      tool_choice: { type: "tool", name: "classify_engagement" },
      system: ENGAGEMENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${context}\n\nClassify this member's engagement level and provide explanations.`,
        },
      ],
    });

    // Extract tool use result
    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse) {
      throw new Error("No tool use in LLM response");
    }

    const result = toolUse.input as EngagementResult;

    return {
      level: result.level,
      adminExplanation: result.adminExplanation,
      userExplanation: result.userExplanation,
      signals,
    };
  },
});

/**
 * Compute engagement for all members in an org
 */
export const computeOrgEngagement = internalAction({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    // Get org details
    const org = await ctx.runQuery(internal.engagement.queries.getOrgById, {
      orgId,
    });
    if (!org) {
      console.log(`Org ${orgId} not found, skipping`);
      return { processed: 0 };
    }

    // Get members needing computation
    const members = await ctx.runQuery(
      internal.engagement.queries.getOrgMembersForEngagement,
      { orgId, onlyStale: true }
    );

    console.log(`Processing ${members.length} members for org ${org.name}`);

    let processed = 0;
    const now = Date.now();

    for (const member of members) {
      // Check if member has unexpired override
      const existingEngagement = await ctx.runQuery(
        internal.engagement.queries.getMemberEngagementInternal,
        { userId: member.userId, orgId }
      );

      if (existingEngagement?.override) {
        // Check if override has expired
        if (
          existingEngagement.override.expiresAt &&
          existingEngagement.override.expiresAt < now
        ) {
          // Clear expired override
          await ctx.runMutation(
            internal.engagement.mutations.clearExpiredOverride,
            { engagementId: existingEngagement._id }
          );
          // Continue to recompute
        } else {
          // Override is still active, skip recomputation
          console.log(
            `Skipping ${member.profileName} - has active override`
          );
          continue;
        }
      }

      try {
        // Compute engagement
        const result = await ctx.runAction(
          internal.engagement.compute.computeMemberEngagement,
          {
            userId: member.userId,
            orgId,
            orgName: org.name,
            memberName: member.profileName,
            joinedAt: member.joinedAt,
            profileUpdatedAt: member.profileUpdatedAt,
          }
        );

        // Save result
        await ctx.runMutation(
          internal.engagement.mutations.saveEngagementScore,
          {
            userId: member.userId,
            orgId,
            level: result.level,
            adminExplanation: result.adminExplanation,
            userExplanation: result.userExplanation,
            signals: result.signals,
            modelVersion: MODEL_VERSION,
          }
        );

        processed++;
        console.log(
          `Classified ${member.profileName} as ${result.level}`
        );
      } catch (error) {
        console.error(
          `Error computing engagement for ${member.profileName}:`,
          error
        );
      }

      // Rate limiting: 100ms between calls
      await delay(100);
    }

    return { processed };
  },
});

/**
 * Run engagement batch for all orgs
 * Called by daily cron
 */
export const runEngagementBatch = internalAction({
  args: {},
  handler: async (ctx): Promise<{ totalProcessed: number; orgCount: number }> => {
    console.log("Starting daily engagement batch computation");

    // Get all active orgs
    const orgs: Array<{ _id: Id<"organizations">; name: string }> =
      await ctx.runQuery(internal.engagement.queries.getActiveOrgs);
    console.log(`Found ${orgs.length} active orgs`);

    let totalProcessed = 0;

    for (const org of orgs) {
      const result: { processed: number } = await ctx.runAction(
        internal.engagement.compute.computeOrgEngagement,
        { orgId: org._id }
      );
      totalProcessed += result.processed;

      // Small delay between orgs
      await delay(500);
    }

    console.log(
      `Engagement batch complete. Processed ${totalProcessed} members across ${orgs.length} orgs`
    );

    return { totalProcessed, orgCount: orgs.length };
  },
});
