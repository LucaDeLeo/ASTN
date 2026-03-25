"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Geocode an organization's city/country to lat/lng coordinates using
 * OpenStreetMap Nominatim (free, no API key required).
 */
export const geocodeOrg = internalAction({
  args: { orgId: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, { orgId }) => {
    const org: {
      city?: string;
      country?: string;
      coordinates?: { lat: number; lng: number };
    } | null = await ctx.runQuery(internal.orgs.geocodeHelpers.getOrgForGeocode, { orgId });
    if (!org || !org.city || !org.country) return null;
    if (org.coordinates) return null; // Already geocoded

    const query = encodeURIComponent(`${org.city}, ${org.country}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": "ASTN/1.0 (AI Safety Talent Network)" },
    });

    if (!res.ok) {
      console.error(`Geocoding failed for ${org.city}, ${org.country}: ${res.status}`);
      return null;
    }

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!results.length) {
      console.warn(`No geocoding results for ${org.city}, ${org.country}`);
      return null;
    }

    const { lat, lon } = results[0];
    await ctx.runMutation(internal.orgs.geocodeHelpers.setCoordinates, {
      orgId,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lon) },
    });

    return null;
  },
});

/**
 * Backfill: geocode all organizations that don't have coordinates yet.
 */
export const backfillAllCoordinates = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const orgIds: Array<string> = await ctx.runQuery(
      internal.orgs.geocodeHelpers.getOrgsWithoutCoordinates,
    );

    for (const orgId of orgIds) {
      await ctx.scheduler.runAfter(0, internal.orgs.geocode.geocodeOrg, {
        orgId: orgId as Id<"organizations">,
      });
    }

    return null;
  },
});
