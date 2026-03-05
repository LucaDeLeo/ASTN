import { z } from 'zod'
import { tool } from '@anthropic-ai/claude-agent-sdk'
import type { ConvexClient } from 'convex/browser'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'

export function createAvailabilityTools(
  convex: ConvexClient,
  orgId: Id<'organizations'>,
) {
  return [
    tool(
      'get_availability_poll',
      'Get the availability poll for an opportunity, including its configuration (dates, time range, slot duration, status). Call list_opportunities first to get the opportunityId.',
      {
        opportunityId: z
          .string()
          .describe(
            'The Convex document ID of the opportunity from list_opportunities',
          ),
      },
      async (args) => {
        console.log('[tool] get_availability_poll', args.opportunityId)
        try {
          const poll = await convex.query(
            api.availabilityPolls.getPollByOpportunity,
            {
              opportunityId: args.opportunityId as Id<'orgOpportunities'>,
            },
          )

          if (!poll) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No availability poll found for this opportunity.',
                },
              ],
            }
          }

          const startTime = formatMinutes(poll.startMinutes)
          const endTime = formatMinutes(poll.endMinutes)

          const text = [
            `## Availability Poll: ${poll.title}`,
            `**Poll ID:** ${poll._id}`,
            `**Status:** ${poll.status}`,
            `**Timezone:** ${poll.timezone}`,
            `**Date range:** ${poll.startDate} to ${poll.endDate}`,
            `**Daily window:** ${startTime} – ${endTime}`,
            `**Slot duration:** ${poll.slotDurationMinutes} minutes`,
            poll.finalizedSlot
              ? `**Finalized slot:** ${poll.finalizedSlot.date} ${formatMinutes(poll.finalizedSlot.startMinutes)} – ${formatMinutes(poll.finalizedSlot.endMinutes)}`
              : '',
          ]
            .filter(Boolean)
            .join('\n')

          return { content: [{ type: 'text' as const, text }] }
        } catch (e: any) {
          console.error('[tool] get_availability_poll ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_poll_results',
      'Get all availability responses for a poll. Returns each respondent\'s name and their slot availability (date + time → "available" or "maybe"). Use get_availability_poll first to get the pollId. Slot keys are formatted as "YYYY-MM-DD|minutesFromMidnight".',
      {
        pollId: z.string().describe('The poll ID from get_availability_poll'),
      },
      async (args) => {
        console.log('[tool] get_poll_results', args.pollId)
        try {
          const { poll, responses } = await convex.query(
            api.availabilityPolls.getPollResults,
            {
              pollId: args.pollId as Id<'availabilityPolls'>,
            },
          )

          if (responses.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `No responses yet for poll "${poll.title}".`,
                },
              ],
            }
          }

          // Build a structured summary for the LLM
          const lines: string[] = [
            `## Poll Results: ${poll.title}`,
            `**Responses:** ${responses.length}`,
            `**Timezone:** ${poll.timezone}`,
            '',
          ]

          // Per-respondent summary
          for (const resp of responses) {
            const availableSlots = Object.entries(resp.slots).filter(
              ([, v]) => v === 'available',
            )
            const maybeSlots = Object.entries(resp.slots).filter(
              ([, v]) => v === 'maybe',
            )

            lines.push(
              `### ${resp.respondentName}`,
              `- Available: ${availableSlots.length} slots | Maybe: ${maybeSlots.length} slots`,
            )

            // Group by date for readability
            const byDate = new Map<string, string[]>()
            for (const [key, value] of Object.entries(resp.slots)) {
              const [date, mins] = key.split('|')
              const time = formatMinutes(Number(mins))
              if (!byDate.has(date)) byDate.set(date, [])
              byDate.get(date)!.push(`${time} (${value})`)
            }

            for (const [date, times] of byDate) {
              lines.push(`  - **${date}:** ${times.join(', ')}`)
            }
            lines.push('')
          }

          // Slot-level aggregation: which time blocks have most availability
          const slotCounts = new Map<
            string,
            { available: number; maybe: number; names: string[] }
          >()
          for (const resp of responses) {
            for (const [key, value] of Object.entries(resp.slots)) {
              if (!slotCounts.has(key)) {
                slotCounts.set(key, { available: 0, maybe: 0, names: [] })
              }
              const entry = slotCounts.get(key)!
              if (value === 'available') {
                entry.available++
                entry.names.push(resp.respondentName)
              } else {
                entry.maybe++
              }
            }
          }

          // Find best time blocks (most available respondents)
          const sorted = [...slotCounts.entries()].sort(
            (a, b) =>
              b[1].available +
              b[1].maybe * 0.5 -
              (a[1].available + a[1].maybe * 0.5),
          )

          lines.push('## Slot Popularity (top 20)')
          for (const [key, counts] of sorted.slice(0, 20)) {
            const [date, mins] = key.split('|')
            const time = formatMinutes(Number(mins))
            lines.push(
              `- **${date} ${time}**: ${counts.available} available, ${counts.maybe} maybe — [${counts.names.join(', ')}]`,
            )
          }

          return {
            content: [{ type: 'text' as const, text: lines.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] get_poll_results ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'get_respondent_application_map',
      'Get the mapping between poll respondents and their application IDs. Use this to cross-reference availability responses with application data (quality, status, etc.).',
      {
        pollId: z.string().describe('The poll ID from get_availability_poll'),
      },
      async (args) => {
        console.log('[tool] get_respondent_application_map', args.pollId)
        try {
          const links = await convex.query(
            api.availabilityPolls.getRespondentLinks,
            {
              pollId: args.pollId as Id<'availabilityPolls'>,
            },
          )

          if (links.length === 0) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: 'No respondents linked to this poll.',
                },
              ],
            }
          }

          const lines = [
            `## Respondent → Application Mapping (${links.length} respondents)`,
            '',
            ...links.map(
              (l) =>
                `- **${l.respondentName}** → Application ID: ${l.applicationId}`,
            ),
          ]

          return {
            content: [{ type: 'text' as const, text: lines.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] get_respondent_application_map ERROR:', e)
          return {
            content: [{ type: 'text' as const, text: `Error: ${e.message}` }],
            isError: true,
          }
        }
      },
    ),

    tool(
      'analyze_fixed_schedule',
      'Analyze which fixed daily time block maximizes attendance across all days. Given a block duration (e.g. 150 minutes = 2.5 hours), it evaluates every possible start time and ranks them by total attendance, showing per-day breakdown and who can/cannot make it.',
      {
        pollId: z.string().describe('The poll ID from get_availability_poll'),
        blockDurationMinutes: z
          .number()
          .describe(
            'Duration of the daily session in minutes (e.g. 150 for 2.5 hours)',
          ),
      },
      async (args) => {
        console.log(
          '[tool] analyze_fixed_schedule',
          args.pollId,
          args.blockDurationMinutes,
        )
        try {
          const [{ poll, responses }, respondentLinks] = await Promise.all([
            convex.query(api.availabilityPolls.getPollResults, {
              pollId: args.pollId as Id<'availabilityPolls'>,
            }),
            convex.query(api.availabilityPolls.getRespondentLinks, {
              pollId: args.pollId as Id<'availabilityPolls'>,
            }),
          ])

          // Build name → quality weight map (unscored respondents default to 50)
          const qualityWeights = new Map<string, number>()
          for (const link of respondentLinks) {
            qualityWeights.set(
              link.respondentName,
              (link.qualityScore ?? 50) / 100,
            )
          }

          if (responses.length === 0) {
            return {
              content: [
                { type: 'text' as const, text: 'No responses to analyze.' },
              ],
            }
          }

          const slotDuration = poll.slotDurationMinutes
          const blockSlots = Math.ceil(args.blockDurationMinutes / slotDuration)

          // Collect all dates in the poll
          const allDates = new Set<string>()
          for (const resp of responses) {
            for (const key of Object.keys(resp.slots)) {
              allDates.add(key.split('|')[0])
            }
          }
          const dates = [...allDates].sort()

          // Find all possible start times from slot keys
          const allStartMinutes = new Set<number>()
          for (const resp of responses) {
            for (const key of Object.keys(resp.slots)) {
              allStartMinutes.add(Number(key.split('|')[1]))
            }
          }
          const startTimes = [...allStartMinutes].sort((a, b) => a - b)

          // For each possible start time, check if a full block fits
          type BlockAnalysis = {
            startMinutes: number
            endMinutes: number
            perDay: Map<
              string,
              { available: string[]; maybe: string[]; unavailable: string[] }
            >
            totalAvailable: number
            totalMaybe: number
            minDayAttendance: number
          }

          const blocks: BlockAnalysis[] = []

          for (const start of startTimes) {
            const end = start + args.blockDurationMinutes
            // Generate all slot keys needed for this block
            const blockSlotMinutes: number[] = []
            for (let i = 0; i < blockSlots; i++) {
              blockSlotMinutes.push(start + i * slotDuration)
            }

            const perDay = new Map<
              string,
              { available: string[]; maybe: string[]; unavailable: string[] }
            >()
            let totalAvailable = 0
            let totalMaybe = 0
            let minDayAttendance = Infinity

            for (const date of dates) {
              const dayResult = {
                available: [] as string[],
                maybe: [] as string[],
                unavailable: [] as string[],
              }

              for (const resp of responses) {
                const weight = qualityWeights.get(resp.respondentName) ?? 0.5
                // Check if respondent is available for ALL slots in the block on this day
                const slotStatuses = blockSlotMinutes.map(
                  (mins) => resp.slots[`${date}|${mins}`],
                )
                const allAvailable = slotStatuses.every(
                  (s) => s === 'available',
                )
                const allAvailableOrMaybe = slotStatuses.every(
                  (s) => s === 'available' || s === 'maybe',
                )

                if (allAvailable) {
                  dayResult.available.push(resp.respondentName)
                  totalAvailable += weight
                } else if (allAvailableOrMaybe) {
                  dayResult.maybe.push(resp.respondentName)
                  totalMaybe += weight
                } else {
                  dayResult.unavailable.push(resp.respondentName)
                }
              }

              const dayAttendance =
                dayResult.available.length + dayResult.maybe.length
              if (dayAttendance < minDayAttendance)
                minDayAttendance = dayAttendance

              perDay.set(date, dayResult)
            }

            blocks.push({
              startMinutes: start,
              endMinutes: end,
              perDay,
              totalAvailable,
              totalMaybe,
              minDayAttendance,
            })
          }

          // Sort by: total available (primary), then minimum day attendance (secondary)
          blocks.sort((a, b) => {
            const scoreA = a.totalAvailable + a.totalMaybe * 0.5
            const scoreB = b.totalAvailable + b.totalMaybe * 0.5
            if (scoreB !== scoreA) return scoreB - scoreA
            return b.minDayAttendance - a.minDayAttendance
          })

          // Format output
          const scoredCount = respondentLinks.filter(
            (l) => l.qualityScore !== undefined,
          ).length
          const lines: string[] = [
            `## Fixed Schedule Analysis (Quality-Weighted)`,
            `**Block duration:** ${args.blockDurationMinutes} minutes (${(args.blockDurationMinutes / 60).toFixed(1)} hours)`,
            `**Days:** ${dates.length} (${dates[0]} to ${dates[dates.length - 1]})`,
            `**Respondents:** ${responses.length} (${scoredCount} with quality scores, ${responses.length - scoredCount} defaulting to 50)`,
            `**Timezone:** ${poll.timezone}`,
            `**Note:** Scores are weighted by applicant quality (0–100 → 0–1.0 multiplier)`,
            '',
          ]

          // Show top 5 options
          const top = blocks.slice(0, 5)
          for (let rank = 0; rank < top.length; rank++) {
            const block = top[rank]
            const startStr = formatMinutes(block.startMinutes)
            const endStr = formatMinutes(block.endMinutes)
            const score = block.totalAvailable + block.totalMaybe * 0.5

            lines.push(
              `### ${rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`} ${startStr} – ${endStr} (score: ${score.toFixed(1)})`,
              `Worst day: ${block.minDayAttendance}/${responses.length} can attend`,
              '',
            )

            for (const [date, day] of block.perDay) {
              const total = day.available.length + day.maybe.length
              lines.push(
                `**${date}** — ${total}/${responses.length} can attend`,
              )
              if (day.available.length > 0)
                lines.push(`  ✅ Available: ${day.available.join(', ')}`)
              if (day.maybe.length > 0)
                lines.push(`  ❓ Maybe: ${day.maybe.join(', ')}`)
              if (day.unavailable.length > 0)
                lines.push(`  ❌ Unavailable: ${day.unavailable.join(', ')}`)
            }
            lines.push('')
          }

          return {
            content: [{ type: 'text' as const, text: lines.join('\n') }],
          }
        } catch (e: any) {
          console.error('[tool] analyze_fixed_schedule ERROR:', e)
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
