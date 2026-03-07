import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { Doc } from '../../../../../convex/_generated/dataModel'
import { Field, FieldDescription, FieldLabel } from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'

interface BasicInfoStepProps {
  profile: Doc<'profiles'> | null
  saveField: (field: string, value: unknown) => void
  isSaving: boolean
  lastSaved: Date | null
}

export function BasicInfoStep({
  profile,
  saveField,
  isSaving,
  lastSaved,
}: BasicInfoStepProps) {
  const [name, setName] = useState(profile?.name ?? '')
  const [pronouns, setPronouns] = useState(profile?.pronouns ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [headline, setHeadline] = useState(profile?.headline ?? '')

  // Sync local state with profile — per-field to avoid resetting other fields mid-edit
  useEffect(() => {
    setName(profile?.name ?? '')
  }, [profile?.name])
  useEffect(() => {
    setPronouns(profile?.pronouns ?? '')
  }, [profile?.pronouns])
  useEffect(() => {
    setLocation(profile?.location ?? '')
  }, [profile?.location])
  useEffect(() => {
    setHeadline(profile?.headline ?? '')
  }, [profile?.headline])

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <Field>
          <FieldLabel htmlFor="name">
            Name <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveField('name', name)}
            placeholder="Your full name"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="pronouns">Pronouns</FieldLabel>
          <Input
            id="pronouns"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            onBlur={() => saveField('pronouns', pronouns)}
            placeholder="e.g., they/them, she/her, he/him"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="location">
            Location <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={() => saveField('location', location)}
            placeholder="e.g., San Francisco, CA"
          />
          <FieldDescription>
            City and country/region helps with opportunity matching
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="headline">Headline</FieldLabel>
          <Textarea
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            onBlur={() => saveField('headline', headline)}
            placeholder="A brief tagline about yourself, e.g., 'ML researcher focused on interpretability'"
            rows={2}
          />
          <FieldDescription>
            A short summary that appears on your profile card
          </FieldDescription>
        </Field>
      </div>

      {/* Save indicator */}
      <div className="h-6 flex items-center">
        {isSaving ? (
          <span className="text-sm text-muted-foreground">Saving...</span>
        ) : lastSaved ? (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="size-3" />
            Saved
          </span>
        ) : null}
      </div>
    </div>
  )
}
