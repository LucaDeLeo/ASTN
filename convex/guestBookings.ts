import { v } from 'convex/values'
import { internal } from './_generated/api'
import { mutation, query } from './_generated/server'
import { requireAuth, requireSpaceAdmin } from './lib/auth'
import type { Id } from './_generated/dataModel'

// Validate ISO date string format (YYYY-MM-DD)
function isValidDateString(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) return false
  const parsed = new Date(date)
  return !isNaN(parsed.getTime())
}

// ---------- Mutations ----------

/**
 * Submit a guest visit application (GUEST-03).
 * Creates a pending booking and guest profile.
 */
export const submitVisitApplication = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
    date: v.string(),
    startMinutes: v.number(),
    endMinutes: v.number(),
    consentToProfileSharing: v.boolean(),
    customFieldResponses: v.array(
      v.object({
        fieldId: v.string(),
        value: v.string(),
      }),
    ),
    guestInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      organization: v.optional(v.string()),
      title: v.optional(v.string()),
    }),
  },
  handler: async (
    ctx,
    {
      spaceId,
      date,
      startMinutes,
      endMinutes,
      consentToProfileSharing,
      customFieldResponses,
      guestInfo,
    },
  ) => {
    const userId = await requireAuth(ctx)

    // Get space and validate guest access
    const space = await ctx.db.get('coworkingSpaces', spaceId)
    if (!space) throw new Error('Space not found')
    if (!space.guestAccessEnabled) {
      throw new Error('Guest access is not enabled for this space')
    }

    // Validate consent
    if (!consentToProfileSharing) {
      throw new Error('Consent to profile sharing is required')
    }

    // Validate date format
    if (!isValidDateString(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD')
    }

    // Validate time range
    if (startMinutes >= endMinutes) {
      throw new Error('End time must be after start time')
    }

    // Validate required custom fields
    const customFields = space.customVisitFields ?? []
    const requiredFields = customFields.filter((f) => f.required)
    for (const field of requiredFields) {
      const response = customFieldResponses.find(
        (r) => r.fieldId === field.fieldId,
      )
      if (!response || !response.value.trim()) {
        throw new Error(`Field "${field.label}" is required`)
      }
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
      throw new Error(
        'You already have a booking or pending application for this date',
      )
    }

    // Get or create guest profile (inline implementation)
    let guestProfileId: Id<'guestProfiles'>
    const existingProfile = await ctx.db
      .query('guestProfiles')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (existingProfile) {
      guestProfileId = existingProfile._id
    } else {
      guestProfileId = await ctx.db.insert('guestProfiles', {
        userId,
        name: guestInfo.name,
        email: guestInfo.email,
        phone: guestInfo.phone,
        organization: guestInfo.organization,
        title: guestInfo.title,
        visitCount: 0,
        becameMember: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }

    // Create booking
    const now = Date.now()
    const bookingId = await ctx.db.insert('spaceBookings', {
      spaceId,
      userId,
      date,
      startMinutes,
      endMinutes,
      bookingType: 'guest',
      status: 'pending',
      consentToProfileSharing,
      createdAt: now,
      updatedAt: now,
    })

    // Create visit application responses for custom fields
    for (const response of customFieldResponses) {
      await ctx.db.insert('visitApplicationResponses', {
        spaceBookingId: bookingId,
        fieldId: response.fieldId,
        value: response.value,
        createdAt: now,
      })
    }

    // Get org for notification
    const org = await ctx.db.get('organizations', space.orgId)
    const orgName = org?.name ?? 'the organization'

    // Schedule notification to guest
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.mutations.createNotification,
      {
        userId,
        type: 'guest_visit_pending',
        spaceBookingId: bookingId,
        title: 'Visit application submitted',
        body: `Your visit application for ${orgName} on ${date} is pending review.`,
        actionUrl: '/visits',
      },
    )

    return { bookingId, guestProfileId }
  },
})

/**
 * Approve a guest visit application (GUEST-04).
 * Updates booking status and sends notification to guest.
 */
export const approveGuestVisit = mutation({
  args: {
    bookingId: v.id('spaceBookings'),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { bookingId, message }) => {
    const booking = await ctx.db.get('spaceBookings', bookingId)
    if (!booking) throw new Error('Booking not found')

    const { membership, space } = await requireSpaceAdmin(ctx, booking.spaceId)

    // Verify booking is guest type and pending
    if (booking.bookingType !== 'guest') {
      throw new Error('Only guest bookings can be approved')
    }
    if (booking.status !== 'pending') {
      throw new Error('Only pending bookings can be approved')
    }

    const now = Date.now()

    // Update booking
    await ctx.db.patch('spaceBookings', bookingId, {
      status: 'confirmed',
      approvedBy: membership._id,
      approvedAt: now,
      updatedAt: now,
    })

    // Update guest profile visit tracking
    const guestProfile = await ctx.db
      .query('guestProfiles')
      .withIndex('by_user', (q) => q.eq('userId', booking.userId))
      .first()

    if (guestProfile) {
      const updates: Record<string, unknown> = {
        visitCount: guestProfile.visitCount + 1,
        lastVisitDate: booking.date,
        updatedAt: now,
      }
      if (!guestProfile.firstVisitDate) {
        updates.firstVisitDate = booking.date
      }
      await ctx.db.patch('guestProfiles', guestProfile._id, updates)
    }

    // Get org for notification
    const org = await ctx.db.get('organizations', space.orgId)
    const orgName = org?.name ?? 'the organization'

    // Schedule notification to guest
    const body = message
      ? `Your visit to ${orgName} on ${booking.date} has been approved. Message: ${message}`
      : `Your visit to ${orgName} on ${booking.date} has been approved.`

    await ctx.scheduler.runAfter(
      0,
      internal.notifications.mutations.createNotification,
      {
        userId: booking.userId,
        type: 'guest_visit_approved',
        spaceBookingId: bookingId,
        title: 'Visit approved',
        body,
        actionUrl: '/visits',
      },
    )

    return { success: true }
  },
})

/**
 * Reject a guest visit application (GUEST-04).
 * Updates booking status and sends notification with reason.
 */
export const rejectGuestVisit = mutation({
  args: {
    bookingId: v.id('spaceBookings'),
    rejectionReason: v.string(),
  },
  handler: async (ctx, { bookingId, rejectionReason }) => {
    const booking = await ctx.db.get('spaceBookings', bookingId)
    if (!booking) throw new Error('Booking not found')

    const { membership, space } = await requireSpaceAdmin(ctx, booking.spaceId)

    // Verify booking is guest type and pending
    if (booking.bookingType !== 'guest') {
      throw new Error('Only guest bookings can be rejected')
    }
    if (booking.status !== 'pending') {
      throw new Error('Only pending bookings can be rejected')
    }

    const now = Date.now()

    // Update booking
    await ctx.db.patch('spaceBookings', bookingId, {
      status: 'rejected',
      approvedBy: membership._id,
      approvedAt: now,
      rejectionReason,
      updatedAt: now,
    })

    // Get org for notification
    const org = await ctx.db.get('organizations', space.orgId)
    const orgName = org?.name ?? 'the organization'

    // Schedule notification to guest
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.mutations.createNotification,
      {
        userId: booking.userId,
        type: 'guest_visit_rejected',
        spaceBookingId: bookingId,
        title: 'Visit not approved',
        body: `Your visit application for ${orgName} on ${booking.date} was not approved. Reason: ${rejectionReason}`,
        actionUrl: '/visits',
      },
    )

    return { success: true }
  },
})

/**
 * Batch approve multiple guest visit applications (GUEST-10).
 * Returns results for each booking.
 */
export const batchApproveGuestVisits = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
    bookingIds: v.array(v.id('spaceBookings')),
  },
  handler: async (ctx, { spaceId, bookingIds }) => {
    const { membership, space } = await requireSpaceAdmin(ctx, spaceId)

    // Get org for notifications
    const org = await ctx.db.get('organizations', space.orgId)
    const orgName = org?.name ?? 'the organization'

    const now = Date.now()
    const results: Array<{
      bookingId: Id<'spaceBookings'>
      success: boolean
      error?: string
    }> = []

    for (const bookingId of bookingIds) {
      try {
        const booking = await ctx.db.get('spaceBookings', bookingId)
        if (!booking) {
          results.push({
            bookingId,
            success: false,
            error: 'Booking not found',
          })
          continue
        }

        // Verify booking belongs to this space
        if (booking.spaceId !== spaceId) {
          results.push({
            bookingId,
            success: false,
            error: 'Booking does not belong to this space',
          })
          continue
        }

        // Verify booking is guest type and pending
        if (booking.bookingType !== 'guest') {
          results.push({
            bookingId,
            success: false,
            error: 'Not a guest booking',
          })
          continue
        }
        if (booking.status !== 'pending') {
          results.push({
            bookingId,
            success: false,
            error: 'Booking is not pending',
          })
          continue
        }

        // Update booking
        await ctx.db.patch('spaceBookings', bookingId, {
          status: 'confirmed',
          approvedBy: membership._id,
          approvedAt: now,
          updatedAt: now,
        })

        // Update guest profile visit tracking
        const guestProfile = await ctx.db
          .query('guestProfiles')
          .withIndex('by_user', (q) => q.eq('userId', booking.userId))
          .first()

        if (guestProfile) {
          const updates: Record<string, unknown> = {
            visitCount: guestProfile.visitCount + 1,
            lastVisitDate: booking.date,
            updatedAt: now,
          }
          if (!guestProfile.firstVisitDate) {
            updates.firstVisitDate = booking.date
          }
          await ctx.db.patch('guestProfiles', guestProfile._id, updates)
        }

        // Schedule notification
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.mutations.createNotification,
          {
            userId: booking.userId,
            type: 'guest_visit_approved',
            spaceBookingId: bookingId,
            title: 'Visit approved',
            body: `Your visit to ${orgName} on ${booking.date} has been approved.`,
            actionUrl: '/visits',
          },
        )

        results.push({ bookingId, success: true })
      } catch (error) {
        results.push({
          bookingId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return results
  },
})

// ---------- Queries ----------

/**
 * Get pending guest applications for admin review queue.
 */
export const getPendingGuestApplications = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
  },
  handler: async (ctx, { spaceId }) => {
    await requireSpaceAdmin(ctx, spaceId)

    // Get pending guest bookings
    const pendingBookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) => q.eq('spaceId', spaceId))
      .filter((q) =>
        q.and(
          q.eq(q.field('bookingType'), 'guest'),
          q.eq(q.field('status'), 'pending'),
        ),
      )
      .collect()

    // Enrich with guest profile and custom field responses
    const enriched = await Promise.all(
      pendingBookings.map(async (booking) => {
        const guestProfile = await ctx.db
          .query('guestProfiles')
          .withIndex('by_user', (q) => q.eq('userId', booking.userId))
          .first()

        const responses = await ctx.db
          .query('visitApplicationResponses')
          .withIndex('by_booking', (q) => q.eq('spaceBookingId', booking._id))
          .collect()

        return {
          ...booking,
          guestProfile,
          customFieldResponses: responses,
        }
      }),
    )

    // Sort by date ascending, then by createdAt
    return enriched.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.createdAt - b.createdAt
    })
  },
})

/**
 * Get guest visit history for an org (GUEST-09).
 * Optionally filter by specific guest.
 */
export const getGuestVisitHistory = query({
  args: {
    spaceId: v.id('coworkingSpaces'),
    guestUserId: v.optional(v.string()),
  },
  handler: async (ctx, { spaceId, guestUserId }) => {
    await requireSpaceAdmin(ctx, spaceId)

    // Get confirmed or rejected guest bookings
    const bookingsQuery = ctx.db
      .query('spaceBookings')
      .withIndex('by_space_date', (q) => q.eq('spaceId', spaceId))
      .filter((q) =>
        q.and(
          q.eq(q.field('bookingType'), 'guest'),
          q.or(
            q.eq(q.field('status'), 'confirmed'),
            q.eq(q.field('status'), 'rejected'),
          ),
        ),
      )

    const bookings = await bookingsQuery.collect()

    // Filter by guestUserId if provided
    const filteredBookings = guestUserId
      ? bookings.filter((b) => b.userId === guestUserId)
      : bookings

    // Enrich with guest profile
    const enriched = await Promise.all(
      filteredBookings.map(async (booking) => {
        const guestProfile = await ctx.db
          .query('guestProfiles')
          .withIndex('by_user', (q) => q.eq('userId', booking.userId))
          .first()

        return {
          ...booking,
          guestProfile,
        }
      }),
    )

    // Sort by date descending (most recent first)
    return enriched.sort((a, b) => b.date.localeCompare(a.date))
  },
})

/**
 * Get the current user's visit applications.
 */
export const getMyVisitApplications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx)

    const bookings = await ctx.db
      .query('spaceBookings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('bookingType'), 'guest'))
      .collect()

    // Enrich with space and org info
    const enriched = await Promise.all(
      bookings.map(async (booking) => {
        const space = await ctx.db.get('coworkingSpaces', booking.spaceId)
        const org = space
          ? await ctx.db.get('organizations', space.orgId)
          : null

        return {
          ...booking,
          spaceName: space?.name,
          orgName: org?.name,
          orgSlug: org?.slug,
        }
      }),
    )

    // Sort by date descending
    return enriched.sort((a, b) => b.date.localeCompare(a.date))
  },
})
