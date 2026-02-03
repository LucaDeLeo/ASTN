import { useMutation, useQuery } from 'convex/react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { BellOff, Calendar } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'

type Frequency = 'all' | 'daily' | 'weekly' | 'none'

const FREQUENCY_OPTIONS: Array<{
  value: Frequency
  label: string
  description: string
}> = [
  {
    value: 'all',
    label: 'All new events',
    description: 'Get notified immediately (rate limited)',
  },
  {
    value: 'daily',
    label: 'Daily digest',
    description: 'One email per day summarizing new events',
  },
  {
    value: 'weekly',
    label: 'Weekly digest',
    description: 'One email per week summarizing new events',
  },
  { value: 'none', label: 'None', description: 'No event notifications' },
]

export function EventNotificationPrefsForm() {
  const preferences = useQuery(api.profiles.getEventNotificationPreferences)
  const memberships = useQuery(api.orgs.membership.getUserMemberships)
  const updatePreferences = useMutation(
    api.profiles.updateEventNotificationPreferences,
  )

  const formId = useId()
  const frequencyHelpId = `${formId}-frequency-help`
  const remindersHelpId = `${formId}-reminders-help`

  // Local state for form
  const [frequency, setFrequency] = useState<Frequency>('weekly')
  const [oneWeekBefore, setOneWeekBefore] = useState(false)
  const [oneDayBefore, setOneDayBefore] = useState(true)
  const [oneHourBefore, setOneHourBefore] = useState(true)
  const [mutedOrgIds, setMutedOrgIds] = useState<Array<Id<'organizations'>>>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync local state with loaded preferences
  useEffect(() => {
    if (preferences) {
      setFrequency(preferences.frequency)
      if (preferences.reminderTiming) {
        setOneWeekBefore(preferences.reminderTiming.oneWeekBefore)
        setOneDayBefore(preferences.reminderTiming.oneDayBefore)
        setOneHourBefore(preferences.reminderTiming.oneHourBefore)
      }
      setMutedOrgIds(preferences.mutedOrgIds as Array<Id<'organizations'>>)
      setHasChanges(false)
    }
  }, [preferences])

  // Track changes
  const handleFrequencyChange = (value: Frequency) => {
    setFrequency(value)
    setHasChanges(true)
  }

  const handleReminderChange =
    (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
    (checked: boolean) => {
      setter(checked)
      setHasChanges(true)
    }

  const handleOrgMuteToggle = (orgId: Id<'organizations'>) => {
    setMutedOrgIds((current) => {
      const isMuted = current.includes(orgId)
      const updated = isMuted
        ? current.filter((id) => id !== orgId)
        : [...current, orgId]
      setHasChanges(true)
      return updated
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updatePreferences({
        frequency,
        reminderTiming: {
          oneWeekBefore,
          oneDayBefore,
          oneHourBefore,
        },
        mutedOrgIds,
      })
      setHasChanges(false)
      toast.success('Event notification preferences saved')
    } catch (error) {
      toast.error('Failed to save preferences')
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  // Show loading state
  if (preferences === undefined || memberships === undefined) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5" />
          Event Notifications
        </CardTitle>
        <CardDescription>
          Control how you receive updates about events from organizations
          you&apos;ve joined.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency Select */}
        <div className="space-y-2">
          <Label htmlFor="frequency" className="text-base font-medium">
            Notification Frequency
          </Label>
          <p id={frequencyHelpId} className="text-sm text-slate-500 mb-2">
            How often should we notify you about new events?
          </p>
          <Select value={frequency} onValueChange={handleFrequencyChange}>
            <SelectTrigger
              className="w-full"
              aria-describedby={frequencyHelpId}
            >
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-slate-500">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reminder Timing Checkboxes */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Event Reminders</Label>
          <p id={remindersHelpId} className="text-sm text-slate-500">
            Receive reminders before events you&apos;ve viewed
          </p>

          <div
            className="space-y-3 pt-2"
            role="group"
            aria-describedby={remindersHelpId}
            aria-label="Reminder timing options"
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id="one-week"
                checked={oneWeekBefore}
                onCheckedChange={handleReminderChange(setOneWeekBefore)}
              />
              <Label
                htmlFor="one-week"
                className="text-sm font-normal cursor-pointer"
              >
                1 week before
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="one-day"
                checked={oneDayBefore}
                onCheckedChange={handleReminderChange(setOneDayBefore)}
              />
              <Label
                htmlFor="one-day"
                className="text-sm font-normal cursor-pointer"
              >
                1 day before
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="one-hour"
                checked={oneHourBefore}
                onCheckedChange={handleReminderChange(setOneHourBefore)}
              />
              <Label
                htmlFor="one-hour"
                className="text-sm font-normal cursor-pointer"
              >
                1 hour before
              </Label>
            </div>
          </div>
        </div>

        {/* Org Muting Section */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <BellOff className="size-4" />
            Organization Notifications
          </Label>
          <p className="text-sm text-slate-500">
            Toggle notifications for specific organizations
          </p>

          {memberships.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">
              No organizations joined yet. Join an organization to manage
              notifications.
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              {memberships.map((membership) => {
                if (!membership.org) return null
                const isMuted = mutedOrgIds.includes(membership.orgId)

                return (
                  <div
                    key={membership._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {membership.org.logoUrl ? (
                        <img
                          src={membership.org.logoUrl}
                          alt={membership.org.name}
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {membership.org.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium">
                        {membership.org.name}
                      </span>
                    </div>
                    <Switch
                      checked={!isMuted}
                      onCheckedChange={() =>
                        handleOrgMuteToggle(membership.orgId)
                      }
                      aria-label={`Toggle notifications for ${membership.org.name}`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Spinner className="size-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
