import { internalQuery, query } from '../_generated/server'

/**
 * Get all organizations that have Lu.ma API keys configured.
 * Used by sync action to know which orgs to sync events from.
 */
export const getOrgsWithLumaConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query('organizations').collect()

    // Filter to orgs with lu.ma API key configured
    return orgs.filter((org) => org.lumaApiKey)
  },
})

/**
 * Get events for dashboard - prioritize user's orgs.
 * Returns events from orgs user has joined first, then other org events for discovery.
 */
export const getDashboardEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { userOrgEvents: [], otherOrgEvents: [] }
    }

    const userId = identity.subject

    // Get user's org memberships
    const memberships = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const userOrgIds = new Set(memberships.map((m) => m.orgId.toString()))

    // Get upcoming events (next 30 days)
    const now = Date.now()
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000

    // Fetch all upcoming events
    const allEvents = await ctx.db
      .query('events')
      .filter((q) =>
        q.and(
          q.gte(q.field('startAt'), now),
          q.lte(q.field('startAt'), thirtyDaysFromNow),
        ),
      )
      .order('asc')
      .take(50)

    // Get org details for each event
    const orgsData = await Promise.all(
      allEvents.map((event) => ctx.db.get('organizations', event.orgId)),
    )

    // Create org map using string keys for reliable comparison
    const orgMap: Record<
      string,
      { name: string; slug?: string; logoUrl?: string } | undefined
    > = {}
    for (let i = 0; i < allEvents.length; i++) {
      const org = orgsData[i]
      if (org) {
        orgMap[allEvents[i].orgId.toString()] = {
          name: org.name,
          slug: org.slug,
          logoUrl: org.logoUrl,
        }
      }
    }

    // Enrich events with org info (only include events where we found the org)
    const enrichedEvents = allEvents
      .map((event) => {
        const org = orgMap[event.orgId.toString()]
        return org
          ? {
              ...event,
              org,
            }
          : null
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)

    // Split by membership
    const userOrgEvents = enrichedEvents.filter((e) =>
      userOrgIds.has(e.orgId.toString()),
    )
    const otherOrgEvents = enrichedEvents.filter(
      (e) => !userOrgIds.has(e.orgId.toString()),
    )

    return {
      userOrgEvents,
      otherOrgEvents,
    }
  },
})
