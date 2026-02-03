import { Copy } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'

export interface DayHours {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  openMinutes: number // Minutes from midnight
  closeMinutes: number // Minutes from midnight
  isClosed: boolean
}

interface OperatingHoursEditorProps {
  value: Array<DayHours>
  onChange: (hours: Array<DayHours>) => void
}

// Day names starting from Monday (more natural for business hours)
const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
]

// Generate time options (6:00 AM to 12:00 AM in 30-minute increments)
const TIME_OPTIONS: Array<{ value: number; label: string }> = []
for (let hour = 6; hour <= 24; hour++) {
  for (const minute of [0, 30]) {
    if (hour === 24 && minute === 30) break
    const totalMinutes = hour * 60 + minute
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const ampm = hour < 12 ? 'AM' : hour === 24 ? 'AM' : 'PM'
    const label = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
    TIME_OPTIONS.push({ value: totalMinutes, label })
  }
}

// Default operating hours (Mon-Fri 9 AM - 6 PM, Sat-Sun closed)
export function getDefaultOperatingHours(): Array<DayHours> {
  return [
    { dayOfWeek: 0, openMinutes: 540, closeMinutes: 1080, isClosed: true }, // Sunday
    { dayOfWeek: 1, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Monday
    { dayOfWeek: 2, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Tuesday
    { dayOfWeek: 3, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Wednesday
    { dayOfWeek: 4, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Thursday
    { dayOfWeek: 5, openMinutes: 540, closeMinutes: 1080, isClosed: false }, // Friday
    { dayOfWeek: 6, openMinutes: 540, closeMinutes: 1080, isClosed: true }, // Saturday
  ]
}

export function OperatingHoursEditor({
  value,
  onChange,
}: OperatingHoursEditorProps) {
  // Sort by display order (Mon-Sun)
  const sortedByDisplay = DAYS.map(
    (day) =>
      value.find((h) => h.dayOfWeek === day.value) || {
        dayOfWeek: day.value,
        openMinutes: 540,
        closeMinutes: 1080,
        isClosed: true,
      },
  )

  const updateDay = (dayOfWeek: number, updates: Partial<DayHours>) => {
    const newHours = value.map((h) =>
      h.dayOfWeek === dayOfWeek ? { ...h, ...updates } : h,
    )
    onChange(newHours)
  }

  const copyToWeekdays = () => {
    const monday = value.find((h) => h.dayOfWeek === 1)
    if (!monday) return

    const newHours = value.map((h) => {
      // Apply to Mon-Fri (1-5)
      if (h.dayOfWeek >= 1 && h.dayOfWeek <= 5) {
        return {
          ...h,
          openMinutes: monday.openMinutes,
          closeMinutes: monday.closeMinutes,
          isClosed: monday.isClosed,
        }
      }
      return h
    })
    onChange(newHours)
  }

  const copyToAll = () => {
    const monday = value.find((h) => h.dayOfWeek === 1)
    if (!monday) return

    const newHours = value.map((h) => ({
      ...h,
      openMinutes: monday.openMinutes,
      closeMinutes: monday.closeMinutes,
      isClosed: monday.isClosed,
    }))
    onChange(newHours)
  }

  return (
    <div className="space-y-4">
      {/* Convenience buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyToWeekdays}
        >
          <Copy className="size-4 mr-2" />
          Copy Mon to weekdays
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={copyToAll}>
          <Copy className="size-4 mr-2" />
          Copy Mon to all
        </Button>
      </div>

      {/* Hours grid */}
      <div className="space-y-3">
        {DAYS.map((day, index) => {
          const hours = sortedByDisplay[index]
          return (
            <div
              key={day.value}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                hours.isClosed ? 'bg-slate-50' : 'bg-white'
              }`}
            >
              {/* Day name */}
              <div className="w-24 font-medium text-sm">{day.label}</div>

              {/* Closed toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id={`closed-${day.value}`}
                  checked={!hours.isClosed}
                  onCheckedChange={(checked) =>
                    updateDay(day.value, { isClosed: !checked })
                  }
                />
                <Label
                  htmlFor={`closed-${day.value}`}
                  className="text-sm text-muted-foreground"
                >
                  {hours.isClosed ? 'Closed' : 'Open'}
                </Label>
              </div>

              {/* Time selects */}
              {!hours.isClosed && (
                <>
                  <Select
                    value={hours.openMinutes.toString()}
                    onValueChange={(v) =>
                      updateDay(day.value, { openMinutes: parseInt(v) })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value.toString()}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-muted-foreground">to</span>

                  <Select
                    value={hours.closeMinutes.toString()}
                    onValueChange={(v) =>
                      updateDay(day.value, { closeMinutes: parseInt(v) })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.filter(
                        (opt) => opt.value > hours.openMinutes,
                      ).map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value.toString()}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
