import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUserId } from './lib/auth'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

// Helper: Require current user is an admin of the given org
async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'organizations'>,
) {
  const userId = await getUserId(ctx)
  if (!userId) throw new Error('Not authenticated')

  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('orgId'), orgId))
    .first()

  if (!membership || membership.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return membership
}

// Get the co-working space for an org (one per org for v1.5)
export const getSpaceByOrg = query({
  args: { orgId: v.id('organizations') },
  handler: async (ctx, { orgId }) => {
    await requireOrgAdmin(ctx, orgId)

    return await ctx.db
      .query('coworkingSpaces')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .first()
  },
})

// Get space by org without admin check (for member booking pages)
export const getSpaceByOrgPublic = query({
  args: { orgId: v.id('organizations') },
  handler: async (ctx, { orgId }) => {
    const userId = await getUserId(ctx)
    if (!userId) return null

    // Verify user is at least a member of this org
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), orgId))
      .first()

    if (!membership) return null

    return await ctx.db
      .query('coworkingSpaces')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .first()
  },
})

// Get space by org slug (public, no auth required - for guest visit page)
export const getSpaceBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    // Find org by slug
    const org = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()

    if (!org) return null

    // Find space for this org
    const space = await ctx.db
      .query('coworkingSpaces')
      .withIndex('by_org', (q) => q.eq('orgId', org._id))
      .first()

    if (!space || !space.guestAccessEnabled) return null

    return {
      spaceId: space._id,
      spaceName: space.name,
      orgId: org._id,
      orgName: org.name,
      orgSlug: org.slug,
      capacity: space.capacity,
      timezone: space.timezone,
      operatingHours: space.operatingHours,
      customVisitFields: space.customVisitFields ?? [],
    }
  },
})

// Operating hours validator
const operatingHoursValidator = v.array(
  v.object({
    dayOfWeek: v.number(),
    openMinutes: v.number(),
    closeMinutes: v.number(),
    isClosed: v.boolean(),
  }),
)

// Create a co-working space
export const createSpace = mutation({
  args: {
    orgId: v.id('organizations'),
    name: v.string(),
    capacity: v.number(),
    timezone: v.string(),
    operatingHours: operatingHoursValidator,
    guestAccessEnabled: v.optional(v.boolean()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    addressNote: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    houseRules: v.optional(v.string()),
  },
  returns: v.object({ spaceId: v.id('coworkingSpaces') }),
  handler: async (
    ctx,
    {
      orgId,
      name,
      capacity,
      timezone,
      operatingHours,
      guestAccessEnabled,
      description,
      address,
      addressNote,
      amenities,
      houseRules,
    },
  ) => {
    await requireOrgAdmin(ctx, orgId)

    // Validate: no existing space for this org (one per org limit)
    const existingSpace = await ctx.db
      .query('coworkingSpaces')
      .withIndex('by_org', (q) => q.eq('orgId', orgId))
      .first()

    if (existingSpace) {
      throw new Error(
        'This organization already has a co-working space configured',
      )
    }

    // Validate: operatingHours has exactly 7 entries, one per day (0-6)
    if (operatingHours.length !== 7) {
      throw new Error(
        'Operating hours must have exactly 7 entries (one per day)',
      )
    }

    const daysPresent = new Set(operatingHours.map((h) => h.dayOfWeek))
    if (
      daysPresent.size !== 7 ||
      ![0, 1, 2, 3, 4, 5, 6].every((d) => daysPresent.has(d))
    ) {
      throw new Error('Operating hours must include each day of the week (0-6)')
    }

    // Validate: capacity > 0
    if (capacity <= 0) {
      throw new Error('Capacity must be greater than 0')
    }

    // Validate: closeMinutes > openMinutes for open days
    for (const hours of operatingHours) {
      if (!hours.isClosed && hours.closeMinutes <= hours.openMinutes) {
        throw new Error(
          `Close time must be after open time for day ${hours.dayOfWeek}`,
        )
      }
    }

    const now = Date.now()
    const spaceId = await ctx.db.insert('coworkingSpaces', {
      orgId,
      name,
      capacity,
      timezone,
      operatingHours,
      guestAccessEnabled: guestAccessEnabled ?? false,
      description: description || undefined,
      address: address || undefined,
      addressNote: addressNote || undefined,
      amenities: amenities && amenities.length > 0 ? amenities : undefined,
      houseRules: houseRules || undefined,
      createdAt: now,
      updatedAt: now,
    })

    // Update org's hasCoworkingSpace flag
    await ctx.db.patch('organizations', orgId, {
      hasCoworkingSpace: true,
    })

    return { spaceId }
  },
})

// Update an existing co-working space
export const updateSpace = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
    name: v.optional(v.string()),
    capacity: v.optional(v.number()),
    timezone: v.optional(v.string()),
    operatingHours: v.optional(operatingHoursValidator),
    guestAccessEnabled: v.optional(v.boolean()),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    addressNote: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    houseRules: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { spaceId, ...updates }) => {
    const space = await ctx.db.get('coworkingSpaces', spaceId)
    if (!space) throw new Error('Space not found')

    await requireOrgAdmin(ctx, space.orgId)

    // Validate capacity if provided
    if (updates.capacity !== undefined && updates.capacity <= 0) {
      throw new Error('Capacity must be greater than 0')
    }

    // Validate operatingHours if provided
    if (updates.operatingHours !== undefined) {
      if (updates.operatingHours.length !== 7) {
        throw new Error(
          'Operating hours must have exactly 7 entries (one per day)',
        )
      }

      const daysPresent = new Set(
        updates.operatingHours.map((h) => h.dayOfWeek),
      )
      if (
        daysPresent.size !== 7 ||
        ![0, 1, 2, 3, 4, 5, 6].every((d) => daysPresent.has(d))
      ) {
        throw new Error(
          'Operating hours must include each day of the week (0-6)',
        )
      }

      for (const hours of updates.operatingHours) {
        if (!hours.isClosed && hours.closeMinutes <= hours.openMinutes) {
          throw new Error(
            `Close time must be after open time for day ${hours.dayOfWeek}`,
          )
        }
      }
    }

    // Build patch object
    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.capacity !== undefined) patch.capacity = updates.capacity
    if (updates.timezone !== undefined) patch.timezone = updates.timezone
    if (updates.operatingHours !== undefined)
      patch.operatingHours = updates.operatingHours
    if (updates.guestAccessEnabled !== undefined)
      patch.guestAccessEnabled = updates.guestAccessEnabled
    if (updates.description !== undefined)
      patch.description = updates.description
    if (updates.address !== undefined) patch.address = updates.address
    if (updates.addressNote !== undefined)
      patch.addressNote = updates.addressNote
    if (updates.amenities !== undefined) patch.amenities = updates.amenities
    if (updates.houseRules !== undefined) patch.houseRules = updates.houseRules

    await ctx.db.patch('coworkingSpaces', spaceId, patch)

    return { success: true }
  },
})

// Delete a co-working space
export const deleteSpace = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
  },
  handler: async (ctx, { spaceId }) => {
    const space = await ctx.db.get('coworkingSpaces', spaceId)
    if (!space) throw new Error('Space not found')

    await requireOrgAdmin(ctx, space.orgId)

    // Delete the space
    await ctx.db.delete('coworkingSpaces', spaceId)

    // Update org's hasCoworkingSpace flag
    await ctx.db.patch('organizations', space.orgId, {
      hasCoworkingSpace: false,
    })

    return { success: true }
  },
})

// Update the custom visit application fields
export const updateCustomVisitFields = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
    customVisitFields: v.array(
      v.object({
        fieldId: v.string(),
        label: v.string(),
        type: v.union(
          v.literal('text'),
          v.literal('textarea'),
          v.literal('select'),
          v.literal('checkbox'),
        ),
        required: v.boolean(),
        options: v.optional(v.array(v.string())),
        placeholder: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { spaceId, customVisitFields }) => {
    const space = await ctx.db.get('coworkingSpaces', spaceId)
    if (!space) throw new Error('Space not found')

    await requireOrgAdmin(ctx, space.orgId)

    // Validate fields
    const fieldIds = new Set<string>()
    for (const field of customVisitFields) {
      if (!field.fieldId.trim()) throw new Error('Field ID cannot be empty')
      if (!field.label.trim()) throw new Error('Field label cannot be empty')
      if (fieldIds.has(field.fieldId)) {
        throw new Error(`Duplicate field ID: ${field.fieldId}`)
      }
      fieldIds.add(field.fieldId)

      if (
        field.type === 'select' &&
        (!field.options || field.options.length === 0)
      ) {
        throw new Error(
          `Select field "${field.label}" must have at least one option`,
        )
      }
    }

    await ctx.db.patch('coworkingSpaces', spaceId, {
      customVisitFields,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

// Public landing page query — no auth required
export const getSpaceLanding = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      spaceId: v.id('coworkingSpaces'),
      spaceName: v.string(),
      orgId: v.id('organizations'),
      orgName: v.string(),
      orgSlug: v.optional(v.string()),
      orgLogoUrl: v.optional(v.string()),
      capacity: v.number(),
      timezone: v.string(),
      operatingHours: v.array(
        v.object({
          dayOfWeek: v.number(),
          openMinutes: v.number(),
          closeMinutes: v.number(),
          isClosed: v.boolean(),
        }),
      ),
      guestAccessEnabled: v.boolean(),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      addressNote: v.optional(v.string()),
      coverImageUrl: v.optional(v.string()),
      amenities: v.optional(v.array(v.string())),
      houseRules: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, { slug }) => {
    const org = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()

    if (!org) return null

    const space = await ctx.db
      .query('coworkingSpaces')
      .withIndex('by_org', (q) => q.eq('orgId', org._id))
      .first()

    if (!space) return null

    // Resolve cover image URL from storage
    let coverImageUrl = space.coverImageUrl
    if (space.coverImageStorageId) {
      const url = await ctx.storage.getUrl(space.coverImageStorageId)
      if (url) coverImageUrl = url
    }

    // Resolve org logo URL from storage
    let orgLogoUrl = org.logoUrl
    if (org.logoStorageId) {
      const url = await ctx.storage.getUrl(org.logoStorageId)
      if (url) orgLogoUrl = url
    }

    return {
      spaceId: space._id,
      spaceName: space.name,
      orgId: org._id,
      orgName: org.name,
      orgSlug: org.slug,
      orgLogoUrl: orgLogoUrl ?? undefined,
      capacity: space.capacity,
      timezone: space.timezone,
      operatingHours: space.operatingHours,
      guestAccessEnabled: space.guestAccessEnabled,
      description: space.description,
      address: space.address,
      addressNote: space.addressNote,
      coverImageUrl: coverImageUrl ?? undefined,
      amenities: space.amenities,
      houseRules: space.houseRules,
    }
  },
})

// Save uploaded cover image for a space (admin only)
export const saveSpaceCoverImage = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
    storageId: v.id('_storage'),
  },
  returns: v.object({
    success: v.boolean(),
    coverImageUrl: v.optional(v.string()),
  }),
  handler: async (ctx, { spaceId, storageId }) => {
    const space = await ctx.db.get('coworkingSpaces', spaceId)
    if (!space) throw new Error('Space not found')

    await requireOrgAdmin(ctx, space.orgId)

    // Delete old cover image from storage if it exists
    if (space.coverImageStorageId) {
      await ctx.storage.delete(space.coverImageStorageId)
    }

    // Resolve the URL for the new image
    const coverImageUrl = await ctx.storage.getUrl(storageId)

    await ctx.db.patch('coworkingSpaces', spaceId, {
      coverImageStorageId: storageId,
      coverImageUrl: coverImageUrl ?? undefined,
      updatedAt: Date.now(),
    })

    return { success: true, coverImageUrl: coverImageUrl ?? undefined }
  },
})

// Remove cover image from a space (admin only)
export const removeSpaceCoverImage = mutation({
  args: {
    spaceId: v.id('coworkingSpaces'),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { spaceId }) => {
    const space = await ctx.db.get('coworkingSpaces', spaceId)
    if (!space) throw new Error('Space not found')

    await requireOrgAdmin(ctx, space.orgId)

    // Delete from storage if it exists
    if (space.coverImageStorageId) {
      await ctx.storage.delete(space.coverImageStorageId)
    }

    await ctx.db.patch('coworkingSpaces', spaceId, {
      coverImageStorageId: undefined,
      coverImageUrl: undefined,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})
