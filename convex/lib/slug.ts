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

  // Check for uniqueness (limit iterations to prevent infinite loop)
  let slug = baseSlug

  for (let counter = 1; counter <= 1000; counter++) {
    const existing = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter + 1}`
  }

  // Fallback: append timestamp if somehow 1000 variants exist
  return `${baseSlug}-${Date.now()}`
}
