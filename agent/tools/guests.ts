import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createGuestTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
  userId: string,
) {
  // Helper: resolve the coworking space for this org
  async function getSpaceId(): Promise<Id<'coworkingSpaces'> | null> {
    try {
      const space = await convex.query(api.coworkingSpaces.getSpaceByOrg, {
        orgId,
      })
      return space?._id ?? null
    } catch {
      return null
    }
  }

  return [
    tool(
      'list_guest_visits',
      'List pending guest visit applications for the organization. Shows guest name, date, time, and status.',
      {},
      async () => {
        console.log('[tool] list_guest_visits')
        try {
          const spaceId = await getSpaceId()
          if (!spaceId) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No co-working space configured for this organization.',
                },
              ],
            }
          }

          const applications = await convex.query(
            api.guestBookings.getPendingGuestApplications,
            { spaceId },
          )

          if (!applications || applications.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No pending guest visit applications.',
                },
              ],
            }
          }

          const lines = applications.map((app: any) => {
            const name = app.guestProfile?.name || 'Unknown'
            const email = app.guestProfile?.email || 'N/A'
            const date = app.date || 'N/A'
            const start = formatMinutes(app.startMinutes)
            const end = formatMinutes(app.endMinutes)
            return `- **${name}** (${email}) | Date: ${date} | Time: ${start}–${end} | ID: ${app._id}`
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `## Pending Guest Visits (${applications.length})\n\n${lines.join('\n')}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] list_guest_visits ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'approve_guest_visit',
      'Approve a pending guest visit application. Call list_guest_visits first to get the bookingId.',
      {
        bookingId: z
          .string()
          .describe(
            'The Convex document ID of the booking from list_guest_visits',
          ),
        message: z
          .string()
          .optional()
          .describe('Optional message to include in the approval notification'),
      },
      async (args) => {
        console.log('[tool] approve_guest_visit', args.bookingId)
        try {
          await convex.mutation(api.guestBookings.approveGuestVisit, {
            bookingId: args.bookingId as Id<'spaceBookings'>,
            message: args.message,
          })

          await convex.mutation(api.agentActionLog.logAgentAction, {
            userId,
            orgId,
            toolName: 'approve_guest_visit',
            params: JSON.stringify({
              bookingId: args.bookingId,
              message: args.message,
            }),
            result: 'success',
            approvalStatus: 'auto' as const,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `Guest visit ${args.bookingId} approved.${args.message ? ` Message: ${args.message}` : ''}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] approve_guest_visit ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'reject_guest_visit',
      'Reject a pending guest visit application with a reason. Call list_guest_visits first to get the bookingId.',
      {
        bookingId: z
          .string()
          .describe(
            'The Convex document ID of the booking from list_guest_visits',
          ),
        reason: z
          .string()
          .describe('Reason for rejecting the visit application'),
      },
      async (args) => {
        console.log('[tool] reject_guest_visit', args.bookingId)
        try {
          await convex.mutation(api.guestBookings.rejectGuestVisit, {
            bookingId: args.bookingId as Id<'spaceBookings'>,
            rejectionReason: args.reason,
          })

          await convex.mutation(api.agentActionLog.logAgentAction, {
            userId,
            orgId,
            toolName: 'reject_guest_visit',
            params: JSON.stringify({
              bookingId: args.bookingId,
              reason: args.reason,
            }),
            result: 'success',
            approvalStatus: 'auto' as const,
          })

          return {
            content: [
              {
                type: 'text' as const,
                text: `Guest visit ${args.bookingId} rejected. Reason: ${args.reason}`,
              },
            ],
          }
        } catch (e: any) {
          console.error('[tool] reject_guest_visit ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),
  ]
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
}
