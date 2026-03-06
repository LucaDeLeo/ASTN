import { randomUUIDv7 } from 'bun'
import type { AdminAgentEvent } from '../../shared/admin-agent/types'

/**
 * Context passed to confirmable tools so they can request user approval
 * and emit events to the browser stream.
 */
export type ConfirmationContext = {
  emit: (event: AdminAgentEvent) => void
  requestConfirmation: (confirmId: string) => Promise<boolean>
}

/**
 * Request user confirmation for a destructive/write action.
 *
 * 1. Generates a unique confirmId
 * 2. Emits a `confirm_request` event to the browser
 * 3. Awaits user response (or 2-minute timeout → rejected)
 * 4. Returns whether the user approved
 *
 * Usage in a tool handler:
 * ```ts
 * const approved = await confirmAction(ctx, {
 *   action: 'enroll_participant',
 *   description: 'Enroll Alice into Reading Group',
 *   details: { userId: '...', programId: '...' },
 * })
 * if (!approved) return { content: [{ type: 'text', text: 'Action rejected by user.' }] }
 * // ... execute mutation
 * ```
 */
export async function confirmAction(
  ctx: ConfirmationContext,
  opts: {
    action: string
    description: string
    details: Record<string, unknown>
  },
): Promise<boolean> {
  const confirmId = randomUUIDv7()

  // Send confirmation request to browser
  ctx.emit({
    type: 'confirm_request',
    confirmId,
    action: opts.action,
    description: opts.description,
    details: opts.details,
  })

  // Wait for user response (resolves true/false, times out as false)
  const approved = await ctx.requestConfirmation(confirmId)

  // Send result back to browser to update the card
  ctx.emit({
    type: 'action_result',
    confirmId,
    success: approved,
    message: approved ? 'Action approved' : 'Action rejected by user',
  })

  return approved
}
