import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface PollCreationFormProps {
  opportunityId: string // Id<'orgOpportunities'>
  onCreated?: () => void
}

const timeOptions: Array<{ value: number; label: string }> = []
for (let m = 360; m <= 1320; m += 30) {
  const h = Math.floor(m / 60)
  const min = m % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const label =
    min === 0
      ? `${h12}:00 ${period}`
      : `${h12}:${String(min).padStart(2, '0')} ${period}`
  timeOptions.push({ value: m, label })
}

const TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Pacific/Auckland',
] as const

const SLOT_DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
] as const

function getDefaultTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if ((TIMEZONES as ReadonlyArray<string>).includes(tz)) {
      return tz
    }
  } catch {
    // Fallback below
  }
  return 'America/Argentina/Buenos_Aires'
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffMs = end.getTime() - start.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function PollCreationForm({
  opportunityId,
  onCreated,
}: PollCreationFormProps) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState(540)
  const [endTime, setEndTime] = useState(1080)
  const [slotDuration, setSlotDuration] = useState(30)
  const [timezone, setTimezone] = useState(getDefaultTimezone)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createPoll = useMutation(api.availabilityPolls.createPoll)

  const isFormValid =
    title.trim() !== '' &&
    startDate !== '' &&
    endDate !== '' &&
    endDate >= startDate &&
    endTime > startTime &&
    daysBetween(startDate, endDate) <= 14

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isFormValid) return

    if (endDate < startDate) {
      toast.error('End date must be on or after start date')
      return
    }

    if (endTime <= startTime) {
      toast.error('End time must be after start time')
      return
    }

    if (daysBetween(startDate, endDate) > 14) {
      toast.error('Date range cannot exceed 14 days')
      return
    }

    setIsSubmitting(true)
    try {
      await createPoll({
        opportunityId: opportunityId as Id<'orgOpportunities'>,
        title: title.trim(),
        startDate,
        endDate,
        startMinutes: startTime,
        endMinutes: endTime,
        slotDurationMinutes: slotDuration,
        timezone,
      })
      toast.success('Poll created')
      onCreated?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create poll',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Availability Poll</CardTitle>
        <CardDescription>
          Set up a new availability poll for participants to indicate their
          preferred times.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="poll-title">Title</Label>
            <Input
              id="poll-title"
              type="text"
              required
              placeholder="e.g. Course schedule availability"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Date fields - two columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poll-start-date">Start Date</Label>
              <Input
                id="poll-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poll-end-date">End Date</Label>
              <Input
                id="poll-end-date"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Time fields - two columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select
                value={String(startTime)}
                onValueChange={(v) => setStartTime(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Select
                value={String(endTime)}
                onValueChange={(v) => setEndTime(Number(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Slot Duration */}
          <div className="space-y-2">
            <Label>Slot Duration</Label>
            <Select
              value={String(slotDuration)}
              onValueChange={(v) => setSlotDuration(Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select slot duration" />
              </SelectTrigger>
              <SelectContent>
                {SLOT_DURATIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Creating...
              </>
            ) : (
              'Create Poll'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
