import type { MutationCtx } from '../_generated/server'

/**
 * Generate a URL-safe slug from an organization name.
 *
 * - Lowercases the input
 * - Replaces spaces and special characters with hyphens
 * - Removes consecutive hyphens
 * - Trims leading/trailing hyphens
 * - Checks for uniqueness against the organizations table
 * - Appends -2, -3, etc. if slug already exists
 */
export async function generateSlug(
  ctx: MutationCtx,
  name: string,
): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/[\s-]+/g, '-') // Replace spaces and hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens

  // Check for uniqueness
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()

    if (!existing) {
      return slug
    }

    counter++
    slug = `${baseSlug}-${counter}`
  }
}
