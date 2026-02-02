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
