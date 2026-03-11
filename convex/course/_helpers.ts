import { getUserId } from '../lib/auth'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'

/**
 * Require org admin for the given org.
 * Throws if not authenticated or not an admin.
 */
export async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<'organizations'>,
): Promise<Doc<'orgMemberships'>> {
  const userId = await getUserId(ctx)
  if (!userId) throw new Error('Not authenticated')

  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user_and_org', (q) =>
      q.eq('userId', userId).eq('orgId', orgId),
    )
    .first()

  if (!membership) throw new Error('Not a member of this organization')
  if (membership.role !== 'admin') throw new Error('Admin access required')

  return membership
}

/**
 * Check program access (enrolled/completed participant or org admin).
 * Returns access info or null if no access.
 */
export async function checkProgramAccess(
  ctx: QueryCtx,
  program: Doc<'programs'>,
): Promise<{
  userId: string
  isAdmin: boolean
  participation: Doc<'programParticipation'> | null
} | null> {
  const userId = await getUserId(ctx)
  if (!userId) return null

  // Check if org admin
  const membership = await ctx.db
    .query('orgMemberships')
    .withIndex('by_user_and_org', (q) =>
      q.eq('userId', userId).eq('orgId', program.orgId),
    )
    .first()

  if (membership?.role === 'admin') {
    return { userId, isAdmin: true, participation: null }
  }

  // Check if enrolled/completed participant
  const participation = await ctx.db
    .query('programParticipation')
    .withIndex('by_program_and_user', (q) =>
      q.eq('programId', program._id).eq('userId', userId),
    )
    .first()

  if (
    participation &&
    (participation.status === 'enrolled' ||
      participation.status === 'completed')
  ) {
    return { userId, isAdmin: false, participation }
  }

  return null
}

/**
 * Require program access. Throws if no access.
 */
export async function requireProgramAccess(
  ctx: QueryCtx,
  program: Doc<'programs'>,
): Promise<{
  userId: string
  isAdmin: boolean
  participation: Doc<'programParticipation'> | null
}> {
  const access = await checkProgramAccess(ctx, program)
  if (!access) throw new Error('Access denied')
  return access
}
