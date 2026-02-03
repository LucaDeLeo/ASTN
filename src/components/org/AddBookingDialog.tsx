import { useMutation, useQuery } from 'convex/react'
import { format, isBefore, startOfDay } from 'date-fns'
import { CalendarIcon, Plus } from 'lucide-react'
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'

interface AddBookingDialogProps {
  spaceId: Id<'coworkingSpaces'>
  orgId: Id<'organizations'>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// Generate time options from 6 AM to 10 PM in 30-minute increments
function generateTimeOptions(): Array<{ label: string; value: number }> {
  const options: Array<{ label: string; value: number }> = []
  for (let hour = 6; hour <= 22; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const minutes = hour * 60 + min
      const displayHour = hour % 12 || 12
      const period = hour >= 12 ? 'PM' : 'AM'
      const label =
        min === 0 ? `${displayHour} ${period}` : `${displayHour}:30 ${period}`
      options.push({ label, value: minutes })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export function AddBookingDialog({
  spaceId,
  orgId,
  open,
  onOpenChange,
  onSuccess,
}: AddBookingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [startMinutes, setStartMinutes] = useState<string>('')
  const [endMinutes, setEndMinutes] = useState<string>('')
  const [workingOn, setWorkingOn] = useState('')
  const [interestedInMeeting, setInterestedInMeeting] = useState('')
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Fetch org members
  const members = useQuery(api.orgs.admin.getAllMembersWithProfiles, { orgId })

  const adminCreateBooking = useMutation(
    api.spaceBookings.admin.adminCreateBooking,
  )

  const resetForm = () => {
    setSelectedUserId('')
    setSelectedDate(undefined)
    setStartMinutes('')
    setEndMinutes('')
    setWorkingOn('')
    setInterestedInMeeting('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!selectedUserId) {
      toast.error('Please select a member')
      return
    }
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    if (!startMinutes) {
      toast.error('Please select a start time')
      return
    }
    if (!endMinutes) {
      toast.error('Please select an end time')
      return
    }

    const startMins = parseInt(startMinutes, 10)
    const endMins = parseInt(endMinutes, 10)

    if (endMins <= startMins) {
      toast.error('End time must be after start time')
      return
    }

    if (workingOn.length > 140) {
      toast.error('Working on must be 140 characters or less')
      return
    }
    if (interestedInMeeting.length > 140) {
      toast.error('Interested in meeting must be 140 characters or less')
      return
    }

    setIsSubmitting(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      const result = await adminCreateBooking({
        spaceId,
        userId: selectedUserId,
        date: dateStr,
        startMinutes: startMins,
        endMinutes: endMins,
        workingOn: workingOn.trim() || undefined,
        interestedInMeeting: interestedInMeeting.trim() || undefined,
      })

      // Show capacity warning if returned
      if (result.capacityWarning === 'at_capacity') {
        toast.warning('Booking created. Note: Space is now at capacity.')
      } else if (result.capacityWarning === 'nearing') {
        toast.success('Booking created. Note: Space is nearing capacity.')
      } else {
        toast.success('Booking created successfully')
      }

      resetForm()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create booking:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create booking',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const today = startOfDay(new Date())

  // Filter end time options to only show times after start time
  const filteredEndTimeOptions = startMinutes
    ? TIME_OPTIONS.filter((opt) => opt.value > parseInt(startMinutes, 10))
    : TIME_OPTIONS

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5" />
            Add Booking
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member selector */}
          <div className="space-y-2">
            <Label htmlFor="member">Member *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="member">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {members?.map((m) => (
                  <SelectItem
                    key={m.membership.userId}
                    value={m.membership.userId}
                  >
                    {m.profile?.name || m.email || 'Unknown member'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setDatePickerOpen(false)
                  }}
                  disabled={(date) => isBefore(date, today)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Select value={startMinutes} onValueChange={setStartMinutes}>
                <SelectTrigger id="startTime">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Select value={endMinutes} onValueChange={setEndMinutes}>
                <SelectTrigger id="endTime">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEndTimeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Working on */}
          <div className="space-y-2">
            <Label htmlFor="workingOn">Working on (optional)</Label>
            <Textarea
              id="workingOn"
              value={workingOn}
              onChange={(e) => setWorkingOn(e.target.value.slice(0, 140))}
              placeholder="What will they be working on?"
              rows={2}
            />
            <p className="text-xs text-muted-foreground text-right">
              {workingOn.length}/140
            </p>
          </div>

          {/* Interested in meeting */}
          <div className="space-y-2">
            <Label htmlFor="interestedInMeeting">
              Interested in meeting (optional)
            </Label>
            <Textarea
              id="interestedInMeeting"
              value={interestedInMeeting}
              onChange={(e) =>
                setInterestedInMeeting(e.target.value.slice(0, 140))
              }
              placeholder="Who would they like to meet?"
              rows={2}
            />
            <p className="text-xs text-muted-foreground text-right">
              {interestedInMeeting.length}/140
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="size-4 mr-2" /> : null}
              Create Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
