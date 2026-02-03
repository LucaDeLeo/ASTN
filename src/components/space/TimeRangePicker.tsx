import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Label } from '~/components/ui/label'

interface OperatingHours {
  dayOfWeek: number
  openMinutes: number
  closeMinutes: number
  isClosed: boolean
}

interface TimeRangePickerProps {
  startMinutes: number
  endMinutes: number
  onChange: (start: number, end: number) => void
  operatingHours: OperatingHours | undefined
}

// Generate time options in 30-minute increments
function generateTimeOptions(openMinutes: number, closeMinutes: number) {
  const options: Array<{ value: number; label: string }> = []
  for (let minutes = openMinutes; minutes <= closeMinutes; minutes += 30) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    const label = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`
    options.push({ value: minutes, label })
  }
  return options
}

export function TimeRangePicker({
  startMinutes,
  endMinutes,
  onChange,
  operatingHours,
}: TimeRangePickerProps) {
  // If no operating hours or closed, show nothing
  if (!operatingHours || operatingHours.isClosed) {
    return (
      <div className="text-sm text-muted-foreground">
        Space is closed on this day
      </div>
    )
  }

  const timeOptions = generateTimeOptions(
    operatingHours.openMinutes,
    operatingHours.closeMinutes,
  )

  // Filter start options to exclude last slot (need room for end)
  const startOptions = timeOptions.slice(0, -1)
  // Filter end options to be after start time
  const endOptions = timeOptions.filter((opt) => opt.value > startMinutes)

  const handleStartChange = (value: string) => {
    const newStart = parseInt(value, 10)
    // If end is not after new start, adjust end to next slot
    if (endMinutes <= newStart) {
      const nextEnd = Math.min(newStart + 30, operatingHours.closeMinutes)
      onChange(newStart, nextEnd)
    } else {
      onChange(newStart, endMinutes)
    }
  }

  const handleEndChange = (value: string) => {
    onChange(startMinutes, parseInt(value, 10))
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 space-y-2">
        <Label htmlFor="start-time">Start Time</Label>
        <Select
          value={startMinutes.toString()}
          onValueChange={handleStartChange}
        >
          <SelectTrigger id="start-time">
            <SelectValue placeholder="Select start time" />
          </SelectTrigger>
          <SelectContent>
            {startOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 space-y-2">
        <Label htmlFor="end-time">End Time</Label>
        <Select value={endMinutes.toString()} onValueChange={handleEndChange}>
          <SelectTrigger id="end-time">
            <SelectValue placeholder="Select end time" />
          </SelectTrigger>
          <SelectContent>
            {endOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
