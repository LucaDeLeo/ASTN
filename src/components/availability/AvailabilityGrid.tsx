import { useCallback, useRef, useState } from 'react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

type SlotStatus = 'available' | 'maybe'
type PaintMode = SlotStatus | 'clear'

interface AvailabilityGridProps {
  startDate: string
  endDate: string
  startMinutes: number
  endMinutes: number
  slotDurationMinutes: number
  timezone: string
  slots: Record<string, SlotStatus>
  onSlotsChange: (slots: Record<string, SlotStatus>) => void
  readOnly?: boolean
  finalizedSlot?: { date: string; startMinutes: number; endMinutes: number }
}

const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function generateDates(startDate: string, endDate: string): Array<string> {
  const dates: Array<string> = []
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
  const start = new Date(startYear, startMonth - 1, startDay)
  const end = new Date(endYear, endMonth - 1, endDay)

  const current = new Date(start)
  while (current <= end) {
    const y = current.getFullYear()
    const mo = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    dates.push(`${y}-${mo}-${d}`)
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function generateTimeSlots(
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

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

function formatDateHeader(dateStr: string): { dayName: string; dayLabel: string } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return {
    dayName: SHORT_DAYS[date.getDay()],
    dayLabel: `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`,
  }
}

function isFinalized(
  dateStr: string,
  slotMinutes: number,
  slotDuration: number,
  finalizedSlot?: AvailabilityGridProps['finalizedSlot'],
): boolean {
  if (!finalizedSlot) return false
  if (dateStr !== finalizedSlot.date) return false
  const slotEnd = slotMinutes + slotDuration
  return slotMinutes >= finalizedSlot.startMinutes && slotEnd <= finalizedSlot.endMinutes
}

export function AvailabilityGrid({
  startDate,
  endDate,
  startMinutes,
  endMinutes,
  slotDurationMinutes,
  slots,
  onSlotsChange,
  readOnly = false,
  finalizedSlot,
}: AvailabilityGridProps) {
  const [paintMode, setPaintMode] = useState<PaintMode>('available')
  const paintModeRef = useRef<PaintMode>(paintMode)
  const isDraggingRef = useRef(false)
  const activePaintModeRef = useRef<PaintMode>('available')

  const dates = generateDates(startDate, endDate)
  const timeSlots = generateTimeSlots(startMinutes, endMinutes, slotDurationMinutes)

  const paintCell = useCallback(
    (key: string) => {
      const mode = activePaintModeRef.current
      const next = { ...slots }
      if (mode === 'clear') {
        delete next[key]
      } else {
        next[key] = mode
      }
      onSlotsChange(next)
    },
    [slots, onSlotsChange],
  )

  const handlePointerDown = useCallback(
    (key: string) => {
      if (readOnly) return
      isDraggingRef.current = true
      activePaintModeRef.current = paintModeRef.current
      paintCell(key)
    },
    [readOnly, paintCell],
  )

  const handlePointerEnter = useCallback(
    (key: string) => {
      if (readOnly || !isDraggingRef.current) return
      paintCell(key)
    },
    [readOnly, paintCell],
  )

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              paintMode === 'available' &&
                'bg-green-400 text-white hover:bg-green-500 hover:text-white',
            )}
            onClick={() => {
              setPaintMode('available')
              paintModeRef.current = 'available'
            }}
          >
            Available
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              paintMode === 'maybe' &&
                'bg-amber-300 text-black hover:bg-amber-400 hover:text-black',
            )}
            onClick={() => {
              setPaintMode('maybe')
              paintModeRef.current = 'maybe'
            }}
          >
            Maybe
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              paintMode === 'clear' &&
                'bg-slate-300 text-black hover:bg-slate-400 hover:text-black',
            )}
            onClick={() => {
              setPaintMode('clear')
              paintModeRef.current = 'clear'
            }}
          >
            Clear
          </Button>
        </div>
      )}

      <div
        className="select-none overflow-x-auto"
        style={{ touchAction: 'none' }}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background p-1" />
              {dates.map((dateStr) => {
                const { dayName, dayLabel } = formatDateHeader(dateStr)
                return (
                  <th
                    key={dateStr}
                    className="min-w-[60px] px-1 pb-1 text-center text-xs font-medium text-muted-foreground"
                  >
                    <div>{dayName}</div>
                    <div>{dayLabel}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((minutes) => (
              <tr key={minutes}>
                <td className="sticky left-0 z-10 bg-background pr-2 text-right text-xs whitespace-nowrap text-muted-foreground">
                  {formatTime(minutes)}
                </td>
                {dates.map((dateStr) => {
                  const key = `${dateStr}|${minutes}`
                  const hasSlot = key in slots
                  const finalized = isFinalized(
                    dateStr,
                    minutes,
                    slotDurationMinutes,
                    finalizedSlot,
                  )

                  let cellBg = 'bg-slate-100'
                  if (finalized) {
                    cellBg = 'bg-blue-400 ring-2 ring-blue-600'
                  } else if (hasSlot) {
                    cellBg = slots[key] === 'available' ? 'bg-green-400' : 'bg-amber-300'
                  }

                  return (
                    <td
                      key={key}
                      className={cn(
                        'h-[40px] min-w-[60px] border border-slate-200',
                        cellBg,
                        !readOnly && 'cursor-pointer',
                      )}
                      onPointerDown={
                        readOnly
                          ? undefined
                          : () => {
                              handlePointerDown(key)
                            }
                      }
                      onPointerEnter={
                        readOnly
                          ? undefined
                          : () => {
                              handlePointerEnter(key)
                            }
                      }
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
