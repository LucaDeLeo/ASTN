import { ConvexError, v } from 'convex/values'
import { internalQuery, mutation, query } from './_generated/server'
import { getUserId } from './lib/auth'

const opportunityReturnValidator = v.object({
  _id: v.id('orgOpportunities'),
  _creationTime: v.number(),
  orgId: v.id('organizations'),
  title: v.string(),
  description: v.string(),
  type: v.union(
    v.literal('course'),
    v.literal('fellowship'),
    v.literal('job'),
    v.literal('other'),
  ),
  status: v.union(v.literal('active'), v.literal('closed'), v.literal('draft')),
  deadline: v.optional(v.number()),
  externalUrl: v.optional(v.string()),
  featured: v.boolean(),
  formFields: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

// Get an opportunity by ID
export const get = query({
  args: { id: v.id('orgOpportunities') },
  returns: v.union(opportunityReturnValidator, v.null()),
  handler: async (ctx, { id }) => {
    const opp = await ctx.db.get('orgOpportunities', id)
    if (!opp) return null

    // Active opportunities are public
    if (opp.status === 'active') return opp

    // Draft/closed require org admin
    const userId = await getUserId(ctx)
    if (!userId) return null

    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), opp.orgId))
      .first()

    if (!membership || membership.role !== 'admin') return null
    return opp
  },
})

// List active opportunities for an org
export const listByOrg = query({
  args: { orgId: v.id('organizations') },
  returns: v.array(opportunityReturnValidator),
  handler: async (ctx, { orgId }) => {
    return await ctx.db
      .query('orgOpportunities')
      .withIndex('by_org_and_status', (q) =>
        q.eq('orgId', orgId).eq('status', 'active'),
      )
      .collect()
  },
})

// Get featured opportunity for an org
export const getFeatured = query({
  args: { orgId: v.id('organizations') },
  returns: v.union(opportunityReturnValidator, v.null()),
  handler: async (ctx, { orgId }) => {
    return await ctx.db
      .query('orgOpportunities')
      .withIndex('by_org_and_featured', (q) =>
        q.eq('orgId', orgId).eq('featured', true),
      )
      .first()
  },
})

// Admin: list all opportunities for an org (all statuses)
export const listAllByOrg = query({
  args: { orgId: v.id('organizations') },
  returns: v.array(opportunityReturnValidator),
  handler: async (ctx, { orgId }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), orgId))
      .first()

    if (!membership || membership.role !== 'admin') {
      throw new ConvexError('Admin access required')
    }

    // Fetch all statuses by querying without the status filter
    const active = await ctx.db
      .query('orgOpportunities')
      .withIndex('by_org_and_status', (q) =>
        q.eq('orgId', orgId).eq('status', 'active'),
      )
      .collect()
    const closed = await ctx.db
      .query('orgOpportunities')
      .withIndex('by_org_and_status', (q) =>
        q.eq('orgId', orgId).eq('status', 'closed'),
      )
      .collect()
    const draft = await ctx.db
      .query('orgOpportunities')
      .withIndex('by_org_and_status', (q) =>
        q.eq('orgId', orgId).eq('status', 'draft'),
      )
      .collect()

    return [...active, ...closed, ...draft]
  },
})

// Internal: get opportunity by ID (for use by export action etc.)
export const getInternal = internalQuery({
  args: { id: v.id('orgOpportunities') },
  returns: v.union(opportunityReturnValidator, v.null()),
  handler: async (ctx, { id }) => {
    return await ctx.db.get('orgOpportunities', id)
  },
})

// Create an opportunity (org admin only)
export const create = mutation({
  args: {
    orgId: v.id('organizations'),
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal('course'),
      v.literal('fellowship'),
      v.literal('job'),
      v.literal('other'),
    ),
    status: v.union(
      v.literal('active'),
      v.literal('closed'),
      v.literal('draft'),
    ),
    deadline: v.optional(v.number()),
    externalUrl: v.optional(v.string()),
    featured: v.boolean(),
    formFields: v.optional(v.any()),
  },
  returns: v.id('orgOpportunities'),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    // Verify admin role
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), args.orgId))
      .first()

    if (!membership || membership.role !== 'admin') {
      throw new ConvexError('Admin access required')
    }

    const now = Date.now()
    return await ctx.db.insert('orgOpportunities', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update an opportunity (org admin only)
export const update = mutation({
  args: {
    id: v.id('orgOpportunities'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('course'),
        v.literal('fellowship'),
        v.literal('job'),
        v.literal('other'),
      ),
    ),
    status: v.optional(
      v.union(v.literal('active'), v.literal('closed'), v.literal('draft')),
    ),
    deadline: v.optional(v.number()),
    externalUrl: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    formFields: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...updates }) => {
    const userId = await getUserId(ctx)
    if (!userId) throw new ConvexError('Not authenticated')

    const opportunity = await ctx.db.get('orgOpportunities', id)
    if (!opportunity) throw new ConvexError('Opportunity not found')

    // Verify admin role
    const membership = await ctx.db
      .query('orgMemberships')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('orgId'), opportunity.orgId))
      .first()

    if (!membership || membership.role !== 'admin') {
      throw new ConvexError('Admin access required')
    }

    await ctx.db.patch('orgOpportunities', id, {
      ...updates,
      updatedAt: Date.now(),
    })
    return null
  },
})
