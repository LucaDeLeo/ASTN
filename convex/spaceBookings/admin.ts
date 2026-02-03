import { v } from 'convex/values'
import { mutation, query } from '../_generated/server'
import {
  getDayOfWeekFromDateString,
  getTodayInTimezone,
  isValidDateString,
  validateBookingTime,
} from '../lib/bookingValidation'
import { requireSpaceAdmin } from '../lib/auth'
import type { Id } from '../_generated/dataModel'

// ---------- Queries ----------

/**
 * Get today's confirmed bookings with profile data (ADMIN-01).
 * Returns both member and guest bookings for the current date.
 */
export const getTodaysBookings = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
  },
  handler: async (ctx, { spaceId }) => {
    const { space } = await requireSpaceAdmin(ctx, spaceId)

    // Get today's date in the space's timezone
    const today = getTodayInTimezone(space.timezone)

    // Get confirmed bookings for today
    const bookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) =>
        q.eq('spaceId', spaceId).eq('date', today),
      )
      .filter((q) => q.eq(q.field('status'), 'confirmed'))
      .collect()

    // Enrich with profile data
    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        if (booking.bookingType === 'guest') {
          // Fetch from guestProfiles
          const guestProfile = await ctx.db
            .query('guestProfiles')
            .withIndex('by_user', (q) => q.eq('userId', booking.userId))
            .first()

          return {
            ...booking,
            profile: guestProfile
              ? {
                  name: guestProfile.name,
                  headline: guestProfile.title ?? guestProfile.organization,
                  organization: guestProfile.organization,
                  title: guestProfile.title,
                  skills: [] as Array<string>,
                  isGuest: true,
                }
              : null,
          }
        }

        // Member booking - fetch from profiles
        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', booking.userId))
          .first()

        return {
          ...booking,
          profile: profile
            ? {
                name: profile.name,
                headline: profile.headline,
                organization: null,
                title: null,
                skills: profile.skills ?? [],
                isGuest: false,
              }
            : null,
        }
      }),
    )

    // Sort by startMinutes ascending
    return enriched.sort((a, b) => a.startMinutes - b.startMinutes)
  },
})

/**
 * Get bookings for a date range with pagination (ADMIN-02, ADMIN-04).
 * Supports filtering by status and includes profile + custom field data.
 */
export const getAdminBookingsForDateRange = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
    startDate: v.string(),
    endDate: v.string(),
    status: v.optional(
      v.union(
        v.literal('all'),
        v.literal('confirmed'),
        v.literal('cancelled'),
        v.literal('pending'),
        v.literal('rejected'),
      ),
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { spaceId, startDate, endDate, status, limit, cursor },
  ) => {
    await requireSpaceAdmin(ctx, spaceId)

    // Validate date formats
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD')
    }

    const pageLimit = Math.min(limit ?? 50, 100) // Max 100 per page

    // Build base query
    let bookingsQuery = ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) => q.eq('spaceId', spaceId))
      .filter((q) =>
        q.and(
          q.gte(q.field('date'), startDate),
          q.lte(q.field('date'), endDate),
        ),
      )

    // Apply status filter if not 'all'
    if (status && status !== 'all') {
      bookingsQuery = bookingsQuery.filter((q) =>
        q.eq(q.field('status'), status),
      )
    }

    // Collect all matching bookings (pagination happens after enrichment)
    const allBookings = await bookingsQuery.collect()

    // Sort by date descending, then by startMinutes ascending
    allBookings.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return a.startMinutes - b.startMinutes
    })

    // Apply cursor-based pagination
    let startIndex = 0
    if (cursor) {
      const cursorIndex = allBookings.findIndex((b) => b._id === cursor)
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1
      }
    }

    const paginatedBookings = allBookings.slice(
      startIndex,
      startIndex + pageLimit,
    )

    // Enrich with profile and custom field data
    const enriched = await Promise.all(
      paginatedBookings.map(async (booking) => {
        // Get profile data
        let profile: {
          name: string | undefined
          headline: string | undefined
          organization: string | undefined
          title: string | undefined
          email: string | undefined
          isGuest: boolean
        } | null = null

        if (booking.bookingType === 'guest') {
          const guestProfile = await ctx.db
            .query('guestProfiles')
            .withIndex('by_user', (q) => q.eq('userId', booking.userId))
            .first()

          if (guestProfile) {
            profile = {
              name: guestProfile.name,
              headline: guestProfile.title ?? guestProfile.organization,
              organization: guestProfile.organization,
              title: guestProfile.title,
              email: guestProfile.email,
              isGuest: true,
            }
          }
        } else {
          const memberProfile = await ctx.db
            .query('profiles')
            .withIndex('by_user', (q) => q.eq('userId', booking.userId))
            .first()

          // Get email from users table
          const user = await ctx.db.get('users', booking.userId as Id<'users'>)

          if (memberProfile) {
            profile = {
              name: memberProfile.name,
              headline: memberProfile.headline,
              organization: undefined,
              title: undefined,
              email: user?.email,
              isGuest: false,
            }
          }
        }

        // Get custom field responses for guest bookings
        let customFieldResponses: Array<{
          fieldId: string
          value: string
        }> = []

        if (booking.bookingType === 'guest') {
          const responses = await ctx.db
            .query('visitApplicationResponses')
            .withIndex('by_booking', (q) => q.eq('spaceBookingId', booking._id))
            .collect()

          customFieldResponses = responses.map((r) => ({
            fieldId: r.fieldId,
            value: r.value,
          }))
        }

        // Get approver name if approved
        let approvedByName: string | undefined
        if (booking.approvedBy) {
          const approverMembership = await ctx.db.get(
            'orgMemberships',
            booking.approvedBy,
          )
          if (approverMembership) {
            const approverProfile = await ctx.db
              .query('profiles')
              .withIndex('by_user', (q) =>
                q.eq('userId', approverMembership.userId),
              )
              .first()
            approvedByName = approverProfile?.name ?? undefined
          }
        }

        return {
          ...booking,
          profile,
          customFieldResponses,
          approvedByName,
        }
      }),
    )

    const hasMore = startIndex + pageLimit < allBookings.length
    const nextCursor = hasMore
      ? paginatedBookings[paginatedBookings.length - 1]?._id
      : undefined

    return {
      bookings: enriched,
      nextCursor,
      hasMore,
    }
  },
})

/**
 * Get space utilization statistics (ADMIN-07).
 * Returns aggregated metrics for a date range.
 */
export const getSpaceUtilizationStats = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { spaceId, startDate, endDate }) => {
    const { space } = await requireSpaceAdmin(ctx, spaceId)

    // Validate date formats
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD')
    }

    // Get confirmed bookings in the date range
    const bookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) => q.eq('spaceId', spaceId))
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'confirmed'),
          q.gte(q.field('date'), startDate),
          q.lte(q.field('date'), endDate),
        ),
      )
      .collect()

    // Calculate days in range
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysInRange = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    )

    // Total bookings
    const totalBookings = bookings.length

    // Average daily
    const averageDaily = totalBookings / daysInRange

    // Utilization rate (bookings / (capacity * days) * 100)
    const maxCapacity = space.capacity * daysInRange
    const utilizationRate =
      maxCapacity > 0 ? (totalBookings / maxCapacity) * 100 : 0

    // Peak days (day of week distribution)
    const dayOfWeekCounts: Record<number, number> = {}
    for (const booking of bookings) {
      // Use helper that correctly parses date string without timezone issues
      const dayOfWeek = getDayOfWeekFromDateString(booking.date)
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
    }

    const peakDays = Object.entries(dayOfWeekCounts)
      .map(([day, count]) => ({
        dayOfWeek: parseInt(day),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    // Member vs Guest breakdown
    let memberCount = 0
    let guestCount = 0
    for (const booking of bookings) {
      if (booking.bookingType === 'member') {
        memberCount++
      } else {
        guestCount++
      }
    }

    return {
      totalBookings,
      averageDaily: Math.round(averageDaily * 10) / 10, // Round to 1 decimal
      utilizationRate: Math.round(utilizationRate * 10) / 10, // Round to 1 decimal
      peakDays,
      memberVsGuest: {
        memberCount,
        guestCount,
      },
      daysInRange,
      capacity: space.capacity,
    }
  },
})

/**
 * Get guest conversion statistics (ADMIN-08).
 * Returns metrics on guests who became members.
 */
export const getGuestConversionStats = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
  },
  handler: async (ctx, { spaceId }) => {
    await requireSpaceAdmin(ctx, spaceId)

    // Get all guest bookings for this space (to identify guests who visited)
    const guestBookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) => q.eq('spaceId', spaceId))
      .filter((q) =>
        q.and(
          q.eq(q.field('bookingType'), 'guest'),
          q.eq(q.field('status'), 'confirmed'),
        ),
      )
      .collect()

    // Get unique guest userIds
    const guestUserIds = [...new Set(guestBookings.map((b) => b.userId))]

    if (guestUserIds.length === 0) {
      return {
        totalGuests: 0,
        convertedGuests: 0,
        conversionRate: 0,
      }
    }

    // Check how many of these guests became members
    let convertedCount = 0
    for (const userId of guestUserIds) {
      const guestProfile = await ctx.db
        .query('guestProfiles')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .first()

      if (guestProfile?.becameMember) {
        convertedCount++
      }
    }

    const totalGuests = guestUserIds.length
    const conversionRate =
      totalGuests > 0 ? (convertedCount / totalGuests) * 100 : 0

    return {
      totalGuests,
      convertedGuests: convertedCount,
      conversionRate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal
    }
  },
})

// ---------- Mutations ----------

/**
 * Create a booking on behalf of a member (ADMIN-06).
 * Only org admins can use this to book for members.
 */
export const adminCreateBooking = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
    userId: v.string(),
    date: v.string(),
    startMinutes: v.number(),
    endMinutes: v.number(),
    workingOn: v.optional(v.string()),
    interestedInMeeting: v.optional(v.string()),
    consentToProfileSharing: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    {
      spaceId,
      userId,
      date,
      startMinutes,
      endMinutes,
      workingOn,
      interestedInMeeting,
      consentToProfileSharing,
    },
  ) => {
    const { space } = await requireSpaceAdmin(ctx, spaceId)

    // Validate date format
    if (!isValidDateString(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD')
    }

    // Validate time range
    if (startMinutes >= endMinutes) {
      throw new Error('End time must be after start time')
    }

    // Validate against operating hours and past dates
    const validation = validateBookingTime(
      date,
      startMinutes,
      endMinutes,
      space.operatingHours,
      space.timezone,
    )
    if (!validation.valid) {
      throw new Error(validation.reason)
    }

    // Validate tag lengths
    if (workingOn && workingOn.length > 140) {
      throw new Error('Working on description must be 140 characters or less')
    }
    if (interestedInMeeting && interestedInMeeting.length > 140) {
      throw new Error(
        'Interested in meeting description must be 140 characters or less',
      )
    }

    // Verify the target user is a member of this org
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), space.orgId))
      .first()

    if (!membership) {
      throw new Error('User is not a member of this organization')
    }

    // Check for existing booking on this date for that user
    const existingBooking = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_user', (q) =>
        q.eq('spaceId', spaceId).eq('userId', userId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('date'), date),
          q.or(
            q.eq(q.field('status'), 'confirmed'),
            q.eq(q.field('status'), 'pending'),
          ),
        ),
      )
      .first()

    if (existingBooking) {
      throw new Error('This member already has a booking for this date')
    }

    // Count confirmed bookings for capacity check
    const confirmedBookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) =>
        q.eq('spaceId', spaceId).eq('date', date),
      )
      .filter((q) => q.eq(q.field('status'), 'confirmed'))
      .collect()

    const bookingCount = confirmedBookings.length

    // Determine capacity warning (soft warning, doesn't block)
    let capacityWarning: 'at_capacity' | 'nearing' | undefined
    if (bookingCount >= space.capacity) {
      capacityWarning = 'at_capacity'
    } else if (bookingCount >= space.capacity * 0.8) {
      capacityWarning = 'nearing'
    }

    const now = Date.now()
    const bookingId = await ctx.db.insert('spaceBookings', {
      spaceId,
      userId,
      date,
      startMinutes,
      endMinutes,
      bookingType: 'member',
      status: 'confirmed',
      workingOn,
      interestedInMeeting,
      consentToProfileSharing: consentToProfileSharing ?? false, // Default to private unless explicitly consented
      createdAt: now,
      updatedAt: now,
    })

    return { bookingId, capacityWarning }
  },
})

/**
 * Cancel any booking (ADMIN-06).
 * Admins can cancel both member and guest bookings.
 */
export const adminCancelBooking = mutation({
  args: {
    bookingId: v.id('spaceBookings'),
  },
  handler: async (ctx, { bookingId }) => {
    const booking = await ctx.db.get('spaceBookings', bookingId)
    if (!booking) throw new Error('Booking not found')

    // Verify admin access via the booking's space
    await requireSpaceAdmin(ctx, booking.spaceId)

    // Can cancel any booking except already cancelled ones
    if (booking.status === 'cancelled') {
      throw new Error('Booking is already cancelled')
    }

    const now = Date.now()
    await ctx.db.patch('spaceBookings', bookingId, {
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    })

    return { success: true }
  },
})
