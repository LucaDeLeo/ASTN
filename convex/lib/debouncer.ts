import type { FunctionReference, GenericMutationCtx } from 'convex/server'
import type { DataModel } from '../_generated/dataModel'

type MutationCtx = GenericMutationCtx<DataModel>

/**
 * Schedule a debounced function call using cancel-and-reschedule.
 *
 * - **sliding** (default): Cancels existing timer, starts a new one.
 *   The function only fires after `delay` ms of inactivity.
 * - **fixed**: Keeps the original timer. Subsequent calls are absorbed
 *   until the timer fires.
 *
 * Uses the `debouncedJobs` table to track pending scheduled functions.
 */
export async function debouncedSchedule(
  ctx: MutationCtx,
  namespace: string,
  key: string,
  fn: FunctionReference<'mutation' | 'action', 'internal'>,
  args: Record<string, unknown>,
  options?: { delay?: number; mode?: 'sliding' | 'fixed' },
): Promise<void> {
  const { delay = 3000, mode = 'sliding' } = options ?? {}

  const existing = await ctx.db
    .query('debouncedJobs')
    .withIndex('by_namespace_and_key', (q) =>
      q.eq('namespace', namespace).eq('key', key),
    )
    .unique()

  if (existing) {
    if (mode === 'fixed') {
      return // Keep original timer
    }
    // Sliding: cancel old timer, schedule new one
    await ctx.scheduler.cancel(existing.scheduledFunctionId)
    const scheduledFunctionId = await (
      ctx.scheduler.runAfter as CallableFunction
    )(delay, fn, args)
    await ctx.db.patch('debouncedJobs', existing._id, {
      scheduledFunctionId,
      scheduledFor: Date.now() + delay,
    })
    return
  }

  // No existing entry — schedule and track
  const scheduledFunctionId = await (
    ctx.scheduler.runAfter as CallableFunction
  )(delay, fn, args)
  await ctx.db.insert('debouncedJobs', {
    namespace,
    key,
    scheduledFunctionId,
    scheduledFor: Date.now() + delay,
  })
}
