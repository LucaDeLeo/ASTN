import { useMutation, useQuery } from 'convex/react'
import { format, getDay, isBefore, startOfDay } from 'date-fns'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
} from 'lucide-react'
import { useId, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { DayButtonProps } from 'react-day-picker'
import { TimeRangePicker } from '~/components/space/TimeRangePicker'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'

interface SpaceInfo {
  spaceId: Id<'coworkingSpaces'>
  spaceName: string
  orgId: Id<'organizations'>
  orgName: string
  orgSlug?: string
  capacity: number
  timezone: string
  operatingHours: Array<{
    dayOfWeek: number
    openMinutes: number
    closeMinutes: number
    isClosed: boolean
  }>
  customVisitFields: Array<{
    fieldId: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'checkbox'
    required: boolean
    options?: Array<string>
    placeholder?: string
  }>
}

interface VisitApplicationFormProps {
  spaceInfo: SpaceInfo
}

export function VisitApplicationForm({ spaceInfo }: VisitApplicationFormProps) {
  const formId = useId()

  // Get existing guest profile to pre-fill form
  const existingGuestProfile = useQuery(api.guestProfiles.getGuestProfile)

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [startMinutes, setStartMinutes] = useState(540) // 9 AM default
  const [endMinutes, setEndMinutes] = useState(1020) // 5 PM default
  const [consentChecked, setConsentChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Guest info form state
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestOrganization, setGuestOrganization] = useState('')
  const [guestTitle, setGuestTitle] = useState('')

  // Custom field responses
  const [customResponses, setCustomResponses] = useState<
    Record<string, string>
  >({})

  // Mutation
  const submitApplication = useMutation(
    api.guestBookings.submitVisitApplication,
  )

  // Pre-fill from existing guest profile
  const hasPreFilled = existingGuestProfile !== undefined
  if (
    existingGuestProfile &&
    !guestName &&
    !guestEmail &&
    existingGuestProfile.name
  ) {
    setGuestName(existingGuestProfile.name)
    setGuestEmail(existingGuestProfile.email)
    if (existingGuestProfile.phone) setGuestPhone(existingGuestProfile.phone)
    if (existingGuestProfile.organization)
      setGuestOrganization(existingGuestProfile.organization)
    if (existingGuestProfile.title) setGuestTitle(existingGuestProfile.title)
  }

  // Get closed days from operating hours
  const closedDays = spaceInfo.operatingHours
    .filter((h) => h.isClosed)
    .map((h) => h.dayOfWeek)

  const today = startOfDay(new Date())

  // Disabled date matcher
  const isDisabled = (date: Date) => {
    if (isBefore(date, today)) return true
    return closedDays.includes(getDay(date))
  }

  // Get operating hours for selected date
  const selectedDayOfWeek = selectedDate ? getDay(selectedDate) : undefined
  const selectedDayHours =
    selectedDayOfWeek !== undefined
      ? spaceInfo.operatingHours.find((h) => h.dayOfWeek === selectedDayOfWeek)
      : undefined

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const dayOfWeek = getDay(date)
      const dayHours = spaceInfo.operatingHours.find(
        (h) => h.dayOfWeek === dayOfWeek,
      )
      if (dayHours && !dayHours.isClosed) {
        setStartMinutes(dayHours.openMinutes)
        setEndMinutes(dayHours.closeMinutes)
      }
    }
  }

  // Handle custom field change
  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomResponses((prev) => ({ ...prev, [fieldId]: value }))
  }

  // Custom DayButton component
  function CustomDayButton(props: DayButtonProps) {
    const { day, modifiers, ...buttonProps } = props
    const date = day.date

    return (
      <button
        {...buttonProps}
        className={cn(
          'relative inline-flex size-9 flex-col items-center justify-center rounded-md p-0 font-normal',
          'hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          modifiers.selected &&
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
          modifiers.today &&
            !modifiers.selected &&
            'bg-accent text-accent-foreground',
          modifiers.disabled &&
            'cursor-not-allowed text-muted-foreground opacity-50',
        )}
      >
        <span>{date.getDate()}</span>
      </button>
    )
  }

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !consentChecked || !guestName || !guestEmail) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate required custom fields
    for (const field of spaceInfo.customVisitFields) {
      const response = customResponses[field.fieldId]
      if (field.required && (!response || !response.trim())) {
        toast.error(`Please fill in "${field.label}"`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await submitApplication({
        spaceId: spaceInfo.spaceId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startMinutes,
        endMinutes,
        consentToProfileSharing: consentChecked,
        customFieldResponses: Object.entries(customResponses).map(
          ([fieldId, value]) => ({
            fieldId,
            value,
          }),
        ),
        guestInfo: {
          name: guestName,
          email: guestEmail,
          phone: guestPhone || undefined,
          organization: guestOrganization || undefined,
          title: guestTitle || undefined,
        },
      })

      setIsSuccess(true)
      toast.success('Visit application submitted!')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit application',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-display text-foreground">
            Application Submitted
          </h2>
          <p className="text-slate-600">
            Your visit request for {spaceInfo.spaceName} is pending review.
            We&apos;ll notify you when it&apos;s approved.
          </p>
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Visit Date</p>
            <p className="font-medium">
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // Loading state for pre-fill
  if (!hasPreFilled) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <Card className="mb-6 p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display text-foreground">
              Visit {spaceInfo.orgName}
            </h1>
            <p className="flex items-center gap-2 text-slate-600">
              <MapPin className="size-4" />
              {spaceInfo.spaceName}
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Select a Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDisabled}
                showOutsideDays={false}
                components={{ DayButton: CustomDayButton }}
                classNames={{
                  root: 'p-3',
                  months: 'flex flex-col sm:flex-row gap-4',
                  month: 'space-y-4',
                  month_caption:
                    'flex justify-center pt-1 relative items-center',
                  caption_label: 'text-sm font-medium',
                  nav: 'flex items-center gap-1',
                  button_previous:
                    'absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground',
                  button_next:
                    'absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent hover:text-accent-foreground',
                  month_grid: 'w-full border-collapse space-y-1',
                  weekdays: 'flex',
                  weekday:
                    'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
                  week: 'flex w-full mt-2',
                  day: cn(
                    'size-9 text-center text-sm p-0 relative',
                    'focus-within:relative focus-within:z-20',
                  ),
                  selected:
                    'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
                  today: 'bg-accent text-accent-foreground rounded-md',
                  outside:
                    'text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                  disabled:
                    'text-muted-foreground opacity-50 cursor-not-allowed',
                  hidden: 'invisible',
                }}
              />
            </CardContent>
          </Card>

          {/* Right column: Form fields */}
          <div className="space-y-6">
            {selectedDate ? (
              <>
                {/* Date and time */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="size-5" />
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <TimeRangePicker
                      startMinutes={startMinutes}
                      endMinutes={endMinutes}
                      onChange={(start, end) => {
                        setStartMinutes(start)
                        setEndMinutes(end)
                      }}
                      operatingHours={selectedDayHours}
                    />
                  </CardContent>
                </Card>

                {/* Guest info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${formId}-name`}>Name *</Label>
                        <Input
                          id={`${formId}-name`}
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${formId}-email`}>Email *</Label>
                        <Input
                          id={`${formId}-email`}
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          required
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${formId}-phone`}>Phone</Label>
                        <Input
                          id={`${formId}-phone`}
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${formId}-org`}>Organization</Label>
                        <Input
                          id={`${formId}-org`}
                          value={guestOrganization}
                          onChange={(e) => setGuestOrganization(e.target.value)}
                          placeholder="Your company/institution"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${formId}-title`}>Title/Role</Label>
                      <Input
                        id={`${formId}-title`}
                        value={guestTitle}
                        onChange={(e) => setGuestTitle(e.target.value)}
                        placeholder="e.g., Research Scientist, Student"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Custom fields */}
                {spaceInfo.customVisitFields.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {spaceInfo.customVisitFields.map((field) => (
                        <CustomFieldRenderer
                          key={field.fieldId}
                          field={field}
                          value={customResponses[field.fieldId] ?? ''}
                          onChange={(value) =>
                            handleCustomFieldChange(field.fieldId, value)
                          }
                          formId={formId}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Consent and submit */}
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
                      <Checkbox
                        id={`${formId}-consent`}
                        checked={consentChecked}
                        onCheckedChange={(checked) =>
                          setConsentChecked(checked === true)
                        }
                      />
                      <Label
                        htmlFor={`${formId}-consent`}
                        className="cursor-pointer text-sm font-normal leading-relaxed"
                      >
                        I agree that my name and basic info may be shared with
                        other visitors on the same day *
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      disabled={!consentChecked || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 size-4" />
                          Submit Application
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="flex min-h-[300px] items-center justify-center">
                <div className="p-6 text-center">
                  <Calendar className="mx-auto mb-4 size-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Select a date to continue
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

// Render custom form fields dynamically
interface CustomFieldRendererProps {
  field: {
    fieldId: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'checkbox'
    required: boolean
    options?: Array<string>
    placeholder?: string
  }
  value: string
  onChange: (value: string) => void
  formId: string
}

function CustomFieldRenderer({
  field,
  value,
  onChange,
  formId,
}: CustomFieldRendererProps) {
  const id = `${formId}-${field.fieldId}`

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {field.label} {field.required && '*'}
          </Label>
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        </div>
      )

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {field.label} {field.required && '*'}
          </Label>
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {field.label} {field.required && '*'}
          </Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id={id}>
              <SelectValue placeholder={field.placeholder ?? 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'checkbox':
      return (
        <div className="flex items-start gap-3">
          <Checkbox
            id={id}
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
          />
          <Label htmlFor={id} className="cursor-pointer font-normal">
            {field.label} {field.required && '*'}
          </Label>
        </div>
      )

    default:
      return null
  }
}
