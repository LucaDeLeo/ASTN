import { v } from 'convex/values'
import { query } from '../_generated/server'
import { getUserId } from '../lib/auth'
import { log } from '../lib/logging'
import type { QueryCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'

/**
 * Build a Map from parallel-fetched results for O(1) lookup.
 * Pairs each ID with its fetched document, skipping nulls (deleted docs).
 */
function buildLookupMap<T extends { _id: string }>(
  ids: Array<string>,
  docs: Array<T | null>,
): Map<string, T> {
  const map = new Map<string, T>()
  for (let i = 0; i < ids.length; i++) {
    const doc = docs[i]
    if (doc) map.set(ids[i], doc)
  }
  return map
}

/**
 * Batch-fetch events and orgs for a set of IDs, returning lookup Maps.
 */
async function batchFetchEventsAndOrgs(
  ctx: QueryCtx,
  eventIds: Set<Id<'events'>>,
  orgIds: Set<Id<'organizations'>>,
): Promise<{
  eventMap: Map<string, Doc<'events'>>
  orgMap: Map<string, Doc<'organizations'>>
  eventCount: number
  orgCount: number
}> {
  const eventIdArr = [...eventIds]
  const orgIdArr = [...orgIds]
  const [events, orgs] = await Promise.all([
    Promise.all(eventIdArr.map((id) => ctx.db.get('events', id))),
    Promise.all(orgIdArr.map((id) => ctx.db.get('organizations', id))),
  ])
  return {
    eventMap: buildLookupMap(eventIdArr, events),
    orgMap: buildLookupMap(orgIdArr, orgs),
    eventCount: eventIdArr.length,
    orgCount: orgIdArr.length,
  }
}

/**
 * Get current user's attendance history
 * Returns attendance records enriched with event and org details
 * Uses two-pass batch pattern: collect IDs -> batch fetch -> Map lookup
 */
export const getMyAttendanceHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    const userId = await getUserId(ctx)
    if (!userId) return []

    const attendance = await ctx.db
      .query('attendance')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(limit)

    if (attendance.length === 0) return []

    // Collect unique IDs
    const eventIds = new Set<Id<'events'>>()
    const orgIds = new Set<Id<'organizations'>>()
    for (const record of attendance) {
      eventIds.add(record.eventId)
      orgIds.add(record.orgId)
    }

    // Batch fetch and build lookup Maps
    const { eventMap, orgMap, eventCount, orgCount } =
      await batchFetchEventsAndOrgs(ctx, eventIds, orgIds)

    log('info', 'getMyAttendanceHistory', {
      records: attendance.length,
      batchedEventReads: eventCount,
      batchedOrgReads: orgCount,
    })

    // Enrich with Map lookups
    const enriched = attendance.map((record) => {
      const event = eventMap.get(record.eventId)
      const org = orgMap.get(record.orgId)

      if (!event) return null

      return {
        ...record,
        event: {
          title: event.title,
          startAt: event.startAt,
          location: event.location,
          isVirtual: event.isVirtual,
        },
        org: org
          ? {
              name: org.name,
              logoUrl: org.logoUrl,
            }
          : null,
      }
    })

    // Filter out null records (deleted events)
    return enriched.filter(
      (record): record is NonNullable<typeof record> => record !== null,
    )
  },
})

/**
 * Get pending attendance prompts for current user
 * Returns unread attendance_prompt notifications enriched with event/org details
 * Uses two-pass batch pattern: collect IDs -> batch fetch -> Map lookup
 */
export const getPendingPrompts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) return []

    const prompts = await ctx.db
      .query('notifications')
      .withIndex('by_user_read', (q) =>
        q.eq('userId', userId).eq('read', false),
      )
      .filter((q) => q.eq(q.field('type'), 'attendance_prompt'))
      .order('desc')
      .collect()

    if (prompts.length === 0) return []

    // Collect unique IDs
    const eventIds = new Set<Id<'events'>>()
    const orgIds = new Set<Id<'organizations'>>()
    for (const prompt of prompts) {
      if (prompt.eventId) eventIds.add(prompt.eventId)
      if (prompt.orgId) orgIds.add(prompt.orgId)
    }

    // Batch fetch and build lookup Maps
    const { eventMap, orgMap, eventCount, orgCount } =
      await batchFetchEventsAndOrgs(ctx, eventIds, orgIds)

    log('info', 'getPendingPrompts', {
      prompts: prompts.length,
      batchedEventReads: eventCount,
      batchedOrgReads: orgCount,
    })

    // Enrich with Map lookups
    const enriched = prompts.map((prompt) => {
      if (!prompt.eventId) return null

      const event = eventMap.get(prompt.eventId)
      if (!event) return null

      const org = prompt.orgId ? (orgMap.get(prompt.orgId) ?? null) : null

      return {
        ...prompt,
        event: {
          title: event.title,
          startAt: event.startAt,
          location: event.location,
          isVirtual: event.isVirtual,
        },
        org: org
          ? {
              name: org.name,
              logoUrl: org.logoUrl,
            }
          : null,
      }
    })

    return enriched.filter(
      (prompt): prompt is NonNullable<typeof prompt> => prompt !== null,
    )
  },
})

/**
 * Get attendance privacy defaults for current user
 * Returns the user's default privacy settings for attendance records
 */
export const getAttendancePrivacyDefaults = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) return null

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    // Return defaults from profile, or system defaults if not set
    const defaults = profile?.privacySettings?.attendancePrivacyDefaults
    return {
      showOnProfile: defaults?.showOnProfile ?? true,
      showToOtherOrgs: defaults?.showToOtherOrgs ?? false,
    }
  },
})

/**
 * Get attendance summary for current user
 * Returns total count, attended count, and last 3 attendance records
 * Uses two-pass batch pattern for recent records enrichment
 */
export const getMyAttendanceSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) return null

    // Get all attendance records for counting
    const allAttendance = await ctx.db
      .query('attendance')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    // Get last 3 records for recent list
    const recentRecords = await ctx.db
      .query('attendance')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(3)

    // Count attended (attended + partial)
    const attendedCount = allAttendance.filter(
      (r) => r.status === 'attended' || r.status === 'partial',
    ).length

    if (recentRecords.length === 0) {
      return {
        total: allAttendance.length,
        attended: attendedCount,
        recent: [],
      }
    }

    // Collect unique IDs from recent records
    const eventIds = new Set<Id<'events'>>()
    const orgIds = new Set<Id<'organizations'>>()
    for (const record of recentRecords) {
      eventIds.add(record.eventId)
      orgIds.add(record.orgId)
    }

    // Batch fetch and build lookup Maps
    const { eventMap, orgMap, eventCount, orgCount } =
      await batchFetchEventsAndOrgs(ctx, eventIds, orgIds)

    log('info', 'getMyAttendanceSummary', {
      totalRecords: allAttendance.length,
      recentRecords: recentRecords.length,
      batchedEventReads: eventCount,
      batchedOrgReads: orgCount,
    })

    // Enrich recent records with Map lookups
    const recent = recentRecords.map((record) => {
      const event = eventMap.get(record.eventId)
      const org = orgMap.get(record.orgId)

      if (!event) return null

      return {
        _id: record._id,
        status: record.status,
        event: {
          title: event.title,
          startAt: event.startAt,
        },
        org: org
          ? {
              name: org.name,
            }
          : null,
      }
    })

    return {
      total: allAttendance.length,
      attended: attendedCount,
      recent: recent.filter((r): r is NonNullable<typeof r> => r !== null),
    }
  },
})
