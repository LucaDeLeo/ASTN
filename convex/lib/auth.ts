import { auth } from "../auth";
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

/**
 * Require the current user to be authenticated.
 * Throws "Not authenticated" if no valid session exists.
 * Works with queries, mutations, and actions.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
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
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const membership = await ctx.db
    .query("orgMemberships")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("role"), "admin"))
    .first();

  if (!membership) {
    throw new Error("Admin access required");
  }

  return userId;
}
