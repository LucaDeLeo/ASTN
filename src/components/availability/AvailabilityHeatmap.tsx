import { useMemo, useState } from 'react'
import {
  eachDayOfInterval,
  format,
  parseISO,
} from 'date-fns'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvailabilityResponse {
  _id: string
  respondentName: string
  slots: Record<string, 'available' | 'maybe'>
}

export interface AvailabilityHeatmapProps {
  startDate: string
  endDate: string
  startMinutes: number
  endMinutes: number
  slotDurationMinutes: number
  timezone: string
  responses: Array<AvailabilityResponse>
  totalRespondents: number
  onCellClick?: (date: string, startMinutes: number) => void
  selectedSlot?: { date: string; startMinutes: number; endMinutes: number } | null
  finalizedSlot?: { date: string; startMinutes: number; endMinutes: number } | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format total minutes (e.g. 810) to 12-hour time string (e.g. "1:30 PM"). */
function formatMinutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
}

/** Build the list of slot start-minutes for the day. */
function buildTimeSlots(
  startMinutes: number,
  endMinutes: number,
  slotDurationMinutes: number,
): Array<number> {
  const slots: Array<number> = []
  for (let m = startMinutes; m < endMinutes; m += slotDurationMinutes) {
    slots.push(m)
  }
  return slots
}

/** Build the list of date strings (YYYY-MM-DD) for the range. */
function buildDates(startDate: string, endDate: string): Array<string> {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))
}

/** Produce a slot key matching the format used in AvailabilityResponse.slots. */
function slotKey(date: string, startMinutes: number): string {
  return `${date}|${startMinutes}`
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

interface CellData {
  score: number
  available: Array<string>
  maybe: Array<string>
  unavailable: Array<string>
}

function aggregateCell(
  key: string,
  responses: Array<AvailabilityResponse>,
  totalRespondents: number,
  allRespondentNames: Array<string>,
): CellData {
  const available: Array<string> = []
  const maybe: Array<string> = []
  const respondedNames = new Set<string>()

  for (const r of responses) {
    if (!(key in r.slots)) continue
    if (r.slots[key] === 'available') {
      available.push(r.respondentName)
      respondedNames.add(r.respondentName)
    } else {
      maybe.push(r.respondentName)
      respondedNames.add(r.respondentName)
    }
  }

  const unavailable = allRespondentNames.filter((n) => !respondedNames.has(n))

  const score =
    totalRespondents > 0
      ? (available.length + maybe.length * 0.5) / totalRespondents
      : 0

  return { score, available, maybe, unavailable }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AvailabilityHeatmap({
  startDate,
  endDate,
  startMinutes,
  endMinutes,
  slotDurationMinutes,
  responses,
  totalRespondents,
  onCellClick,
  selectedSlot,
  finalizedSlot,
}: AvailabilityHeatmapProps) {
  const dates = useMemo(() => buildDates(startDate, endDate), [startDate, endDate])
  const timeSlots = useMemo(
    () => buildTimeSlots(startMinutes, endMinutes, slotDurationMinutes),
    [startMinutes, endMinutes, slotDurationMinutes],
  )

  const allRespondentNames = useMemo(
    () => responses.map((r) => r.respondentName),
    [responses],
  )

  // Pre-compute all cell data so we don't recalculate on every render
  const cellDataMap = useMemo(() => {
    const map = new Map<string, CellData>()
    for (const date of dates) {
      for (const slot of timeSlots) {
        const key = slotKey(date, slot)
        map.set(key, aggregateCell(key, responses, totalRespondents, allRespondentNames))
      }
    }
    return map
  }, [dates, timeSlots, responses, totalRespondents, allRespondentNames])

  // Track hovered cell for tooltip
  const [hoveredCell, setHoveredCell] = useState<{
    key: string
    x: number
    y: number
  } | null>(null)

  const hoveredData = hoveredCell ? cellDataMap.get(hoveredCell.key) : null

  function isSelected(date: string, slotStart: number): boolean {
    if (!selectedSlot) return false
    return selectedSlot.date === date && selectedSlot.startMinutes === slotStart
  }

  function isFinalized(date: string, slotStart: number): boolean {
    if (!finalizedSlot) return false
    return finalizedSlot.date === date && finalizedSlot.startMinutes === slotStart
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="text-sm text-slate-600">
        {responses.length} of {totalRespondents} responded
      </div>

      {/* Scrollable grid */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="border-collapse w-max min-w-full">
          <thead>
            <tr>
              {/* Top-left corner */}
              <th className="sticky left-0 z-10 bg-white border-b border-r px-3 py-2 text-xs font-medium text-slate-500 min-w-[80px]" />
              {dates.map((date) => {
                const parsed = parseISO(date)
                return (
                  <th
                    key={date}
                    className="border-b border-r px-2 py-2 text-center text-xs font-medium text-slate-700 min-w-[80px]"
                  >
                    <div>{format(parsed, 'EEE')}</div>
                    <div className="text-slate-500 font-normal">
                      {format(parsed, 'MMM d')}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot}>
                {/* Row header: time label */}
                <td className="sticky left-0 z-10 bg-white border-b border-r px-3 py-1 text-xs text-slate-500 whitespace-nowrap text-right">
                  {formatMinutesToTime(slot)}
                </td>

                {dates.map((date) => {
                  const key = slotKey(date, slot)
                  const cell = cellDataMap.get(key)!
                  const selected = isSelected(date, slot)
                  const finalized = isFinalized(date, slot)

                  // Background color
                  const bgStyle: React.CSSProperties =
                    cell.score > 0
                      ? { backgroundColor: `rgba(22, 163, 74, ${cell.score})` }
                      : {}

                  // Build title text for native tooltip
                  const titleParts: Array<string> = []
                  if (cell.available.length > 0) {
                    titleParts.push(`Available: ${cell.available.join(', ')}`)
                  }
                  if (cell.maybe.length > 0) {
                    titleParts.push(`Maybe: ${cell.maybe.join(', ')}`)
                  }
                  if (cell.unavailable.length > 0) {
                    titleParts.push(`Unavailable: ${cell.unavailable.join(', ')}`)
                  }

                  return (
                    <td
                      key={key}
                      className={[
                        'border-b border-r relative',
                        cell.score === 0 ? 'bg-slate-50' : '',
                        onCellClick ? 'cursor-pointer' : '',
                        selected ? 'ring-2 ring-blue-600 ring-inset' : '',
                        finalized
                          ? 'ring-2 ring-blue-600 ring-inset bg-blue-100'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={finalized ? {} : bgStyle}
                      title={titleParts.join('\n')}
                      onClick={() => onCellClick?.(date, slot)}
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect()
                        setHoveredCell({
                          key,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        })
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Fixed cell height */}
                      <div className="h-10 w-full min-w-[80px]" />
                      {finalized && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-blue-700">
                          Finalized
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover tooltip overlay */}
      {hoveredCell && hoveredData && (
        <div
          className="fixed z-50 pointer-events-none bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs max-w-[240px]"
          style={{
            left: hoveredCell.x,
            top: hoveredCell.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {hoveredData.available.length > 0 && (
            <div className="mb-1">
              <span className="font-semibold text-green-700">Available: </span>
              {hoveredData.available.join(', ')}
            </div>
          )}
          {hoveredData.maybe.length > 0 && (
            <div className="mb-1">
              <span className="font-semibold text-amber-600">Maybe: </span>
              {hoveredData.maybe.join(', ')}
            </div>
          )}
          {hoveredData.unavailable.length > 0 && (
            <div>
              <span className="font-semibold text-slate-500">Unavailable: </span>
              {hoveredData.unavailable.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
