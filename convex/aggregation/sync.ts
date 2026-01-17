"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const runFullSync = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting full opportunity sync...");

    // Fetch from both sources in parallel
    const [eightyKJobs, aisafetyJobs] = await Promise.all([
      ctx.runAction(internal.aggregation.eightyK.fetchOpportunities, {}),
      ctx.runAction(internal.aggregation.aisafety.fetchOpportunities, {}),
    ]);

    console.log(
      `Fetched: ${eightyKJobs.length} from 80K Hours, ${aisafetyJobs.length} from aisafety.com`
    );

    // Combine all jobs
    const allJobs = [...eightyKJobs, ...aisafetyJobs];

    if (allJobs.length === 0) {
      console.log("No opportunities fetched from any source");
      return;
    }

    // Upsert opportunities with deduplication
    await ctx.runMutation(internal.aggregation.syncMutations.upsertOpportunities, {
      opportunities: allJobs,
    });

    // Archive opportunities that disappeared from sources
    await ctx.runMutation(internal.aggregation.syncMutations.archiveMissing, {
      currentSourceIds: allJobs.map((j) => j.sourceId),
    });

    console.log("Sync complete");
  },
});

// Manual trigger for testing
export const triggerSync = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.aggregation.sync.runFullSync, {});
  },
});
