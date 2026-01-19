"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchLumaEvents } from "./lumaClient";

/**
 * Sync events for a single organization from Lu.ma.
 * Fetches events and upserts them to the database.
 */
export const syncOrgEvents = internalAction({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    // Get org's lu.ma config
    const org = await ctx.runQuery(internal.orgs.queries.getById, { orgId });
    if (!org?.lumaApiKey) {
      console.log(`Org ${orgId} has no lu.ma API key, skipping`);
      return;
    }

    console.log(`Syncing events for ${org.name}...`);

    // Fetch events from lu.ma API
    // Get events from 30 days ago to 90 days in the future
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAhead = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const lumaEvents = await fetchLumaEvents(org.lumaApiKey, {
      after: thirtyDaysAgo,
      before: ninetyDaysAhead,
    });

    console.log(`Fetched ${lumaEvents.length} events from lu.ma for ${org.name}`);

    // Transform lu.ma events to our schema format
    const events = lumaEvents.map((entry) => ({
      lumaEventId: entry.event.api_id,
      title: entry.event.name,
      description: entry.event.description_md ?? entry.event.description ?? undefined,
      startAt: new Date(entry.event.start_at).getTime(),
      endAt: entry.event.end_at ? new Date(entry.event.end_at).getTime() : undefined,
      timezone: entry.event.timezone,
      coverUrl: entry.event.cover_url ?? undefined,
      url: entry.event.url,
      location: entry.event.geo_address_json?.address ?? undefined,
      isVirtual: !!entry.event.meeting_url,
    }));

    // Upsert events to database
    if (events.length > 0) {
      await ctx.runMutation(internal.events.mutations.upsertEvents, {
        orgId,
        events,
      });
    }

    // Update org's sync timestamp
    await ctx.runMutation(internal.events.mutations.updateOrgSyncTimestamp, {
      orgId,
      timestamp: Date.now(),
    });

    console.log(`Synced ${events.length} events for ${org.name}`);
  },
});

/**
 * Run full event sync for all organizations with Lu.ma configured.
 * Called by daily cron job.
 */
export const runFullEventSync = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Starting lu.ma event sync...");

    // Get all orgs with lu.ma API keys configured
    const orgsWithLuma = await ctx.runQuery(
      internal.events.queries.getOrgsWithLumaConfig
    );

    console.log(`Found ${orgsWithLuma.length} orgs with lu.ma config`);

    // Sync each org's events (staggered to avoid rate limits)
    for (const org of orgsWithLuma) {
      try {
        await ctx.runAction(internal.events.sync.syncOrgEvents, {
          orgId: org._id,
        });

        // 1 second delay between orgs to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to sync ${org.name}:`, error);
        // Continue with other orgs even if one fails
      }
    }

    console.log("Event sync complete");
  },
});
