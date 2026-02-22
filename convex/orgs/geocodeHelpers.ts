import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

/** Internal query to fetch org data for geocoding. */
export const getOrgForGeocode = internalQuery({
  args: { orgId: v.id('organizations') },
  returns: v.union(
    v.object({
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    }),
    v.null(),
  ),
  handler: async (ctx, { orgId }) => {
    const org = await ctx.db.get('organizations', orgId)
    if (!org) return null
    return {
      city: org.city,
      country: org.country,
      coordinates: org.coordinates,
    }
  },
})

/** Internal mutation to set coordinates on an org. */
export const setCoordinates = internalMutation({
  args: {
    orgId: v.id('organizations'),
    coordinates: v.object({ lat: v.number(), lng: v.number() }),
  },
  returns: v.null(),
  handler: async (ctx, { orgId, coordinates }) => {
    await ctx.db.patch('organizations', orgId, { coordinates })
    return null
  },
})

/** Get org IDs that need geocoding. */
export const getOrgsWithoutCoordinates = internalQuery({
  args: {},
  returns: v.array(v.id('organizations')),
  handler: async (ctx) => {
    const orgs = await ctx.db.query('organizations').collect()
    return orgs.filter((o) => o.city && !o.coordinates).map((o) => o._id)
  },
})
