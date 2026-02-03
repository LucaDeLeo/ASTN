import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { auth } from './auth'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

// Helper: Require current user is a member of the org that owns the space
async function requireOrgMember(
  ctx: QueryCtx | MutationCtx,
  spaceId: Id<'coworkingSpaces'>,
) {
  const userId = await auth.getUserId(ctx)
  if (!userId) throw new Error('Not authenticated')

  const space = await ctx.db.get('coworkingSpaces', spaceId)
  if (!space) throw new Error('Space not found')

  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('orgId'), space.orgId))
    .first()

  if (!membership) throw new Error('Not a member of this organization')

  return { userId, space, membership }
}

// Validate ISO date string format (YYYY-MM-DD)
function isValidDateString(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) return false
  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

// Create a member booking
export const createMemberBooking = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
    date: v.string(),
    startMinutes: v.number(),
    endMinutes: v.number(),
    workingOn: v.optional(v.string()),
    interestedInMeeting: v.optional(v.string()),
    consentToProfileSharing: v.boolean(),
  },
  handler: async (
    ctx,
    {
      spaceId,
      date,
      startMinutes,
      endMinutes,
      workingOn,
      interestedInMeeting,
      consentToProfileSharing,
    },
  ) => {
    const { userId, space } = await requireOrgMember(ctx, spaceId)

    // Validate consent
    if (!consentToProfileSharing) {
      throw new Error('Consent is required to book')
    }

    // Validate date format
    if (!isValidDateString(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD')
    }

    // Validate time range
    if (startMinutes >= endMinutes) {
      throw new Error('End time must be after start time')
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

    // Check for existing booking on this date
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
      throw new Error('You already have a booking for this date')
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

    // Determine capacity warning
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
      consentToProfileSharing,
      createdAt: now,
      updatedAt: now,
    })

    return { bookingId, capacityWarning }
  },
})

// Cancel a booking
export const cancelBooking = mutation({
  args: {
    bookingId: v.id('spaceBookings'),
  },
  handler: async (ctx, { bookingId }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const booking = await ctx.db.get('spaceBookings', bookingId)
    if (!booking) throw new Error('Booking not found')

    // Verify ownership
    if (booking.userId !== userId) {
      throw new Error('You can only cancel your own bookings')
    }

    // Verify status
    if (booking.status !== 'confirmed') {
      throw new Error('Only confirmed bookings can be cancelled')
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

// Update booking tags
export const updateBookingTags = mutation({
  args: {
    bookingId: v.id('spaceBookings'),
    workingOn: v.optional(v.string()),
    interestedInMeeting: v.optional(v.string()),
  },
  handler: async (ctx, { bookingId, workingOn, interestedInMeeting }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const booking = await ctx.db.get('spaceBookings', bookingId)
    if (!booking) throw new Error('Booking not found')

    // Verify ownership
    if (booking.userId !== userId) {
      throw new Error('You can only update your own bookings')
    }

    // Verify status
    if (booking.status !== 'confirmed') {
      throw new Error('Only confirmed bookings can be updated')
    }

    // Validate tag lengths
    if (workingOn !== undefined && workingOn.length > 140) {
      throw new Error('Working on description must be 140 characters or less')
    }
    if (interestedInMeeting !== undefined && interestedInMeeting.length > 140) {
      throw new Error(
        'Interested in meeting description must be 140 characters or less',
      )
    }

    // Build patch object
    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (workingOn !== undefined) patch.workingOn = workingOn
    if (interestedInMeeting !== undefined)
      patch.interestedInMeeting = interestedInMeeting

    await ctx.db.patch('spaceBookings', bookingId, patch)

    return { success: true }
  },
})

// Get all bookings for a specific date (org member access)
export const getBookingsForDate = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
    date: v.string(),
  },
  handler: async (ctx, { spaceId, date }) => {
    await requireOrgMember(ctx, spaceId)

    const bookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) =>
        q.eq('spaceId', spaceId).eq('date', date),
      )
      .collect()

    return bookings
  },
})

// Get the current user's bookings for a space
export const getMyBookings = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
  },
  handler: async (ctx, { spaceId }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return []

    const bookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_user', (q) =>
        q.eq('spaceId', spaceId).eq('userId', userId),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'confirmed'),
          q.eq(q.field('status'), 'pending'),
        ),
      )
      .collect()

    // Sort by date ascending
    return bookings.sort((a, b) => a.date.localeCompare(b.date))
  },
})

// Get attendees for a date with consented profile data
export const getBookingAttendees = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
    date: v.string(),
  },
  handler: async (ctx, { spaceId, date }) => {
    await requireOrgMember(ctx, spaceId)

    // Get confirmed bookings with profile sharing consent
    const bookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) =>
        q.eq('spaceId', spaceId).eq('date', date),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'confirmed'),
          q.eq(q.field('consentToProfileSharing'), true),
        ),
      )
      .collect()

    // Fetch profile data for each booking
    const attendees = await Promise.all(
      bookings.map(async (booking) => {
        const profile = await ctx.db
          .query('profiles')
          .withIndex('by_user', (q) => q.eq('userId', booking.userId))
          .first()

        return {
          bookingId: booking._id,
          userId: booking.userId,
          date: booking.date,
          startMinutes: booking.startMinutes,
          endMinutes: booking.endMinutes,
          workingOn: booking.workingOn,
          interestedInMeeting: booking.interestedInMeeting,
          profile: profile
            ? {
                name: profile.name,
                headline: profile.headline,
                skills: profile.skills,
              }
            : null,
        }
      }),
    )

    return attendees
  },
})

// Get capacity status for a date range (for calendar view)
export const getCapacityForDateRange = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { spaceId, startDate, endDate }) => {
    const { space } = await requireOrgMember(ctx, spaceId)

    // Get all confirmed bookings in the date range
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

    // Group by date and count
    const dateCountMap: Record<string, number> = {}
    for (const booking of bookings) {
      dateCountMap[booking.date] = (dateCountMap[booking.date] || 0) + 1
    }

    // Build result with status per date
    const dates: Record<
      string,
      { count: number; status: 'available' | 'nearing' | 'at_capacity' }
    > = {}

    for (const [date, count] of Object.entries(dateCountMap)) {
      let status: 'available' | 'nearing' | 'at_capacity' = 'available'
      if (count >= space.capacity) {
        status = 'at_capacity'
      } else if (count >= space.capacity * 0.7) {
        status = 'nearing'
      }
      dates[date] = { count, status }
    }

    return {
      capacity: space.capacity,
      dates,
    }
  },
})
