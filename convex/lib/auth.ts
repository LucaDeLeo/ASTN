import { auth } from '../auth'
import type { ActionCtx, MutationCtx, QueryCtx } from '../_generated/server'

/**
 * Require the current user to be authenticated.
 * Throws "Not authenticated" if no valid session exists.
 * Works with queries, mutations, and actions.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string> {
  const userId = await auth.getUserId(ctx)
  if (!userId) {
    throw new Error('Not authenticated')
  }
  return userId
}

/**
 * Require the current user to be an admin of at least one organization.
 * Throws "Not authenticated" if no valid session exists.
 * Throws "Admin access required" if user is not an admin of any org.
 *
 * Use this for legacy admin endpoints that operate on global data
 * (e.g., opportunity CRUD) where no specific orgId is available.
 */
export async function requireAnyOrgAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const userId = await auth.getUserId(ctx)
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .filter((q) => q.eq(q.field('role'), 'admin'))
    .first()

  if (!membership) {
    throw new Error('Admin access required')
  }

  return userId
}

/**
 * Require the current user to be a platform admin.
 * Throws "Not authenticated" if no valid session exists.
 * Throws "Platform admin access required" if user is not a platform admin.
 *
 * Use this for platform-wide admin endpoints (e.g., reviewing org applications).
 */
export async function requirePlatformAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const userId = await auth.getUserId(ctx)
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const admin = await ctx.db
    .query('platformAdmins')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()

  if (!admin) {
    throw new Error('Platform admin access required')
  }

  return userId
}

/**
 * Check if the current user is a platform admin (non-throwing).
 * Returns false if not authenticated or not a platform admin.
 *
 * Use this for frontend gating (show/hide admin UI elements).
 */
export async function isPlatformAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<boolean> {
  const userId = await auth.getUserId(ctx)
  if (!userId) return false

  const admin = await ctx.db
    .query('platformAdmins')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()

  return !!admin
}
