import { useEffect, useId, useState } from 'react'
import { Check } from 'lucide-react'
import type { Doc } from '../../../../../convex/_generated/dataModel'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'

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
  const id = useId()
  const locationHelpId = `${id}-location-help`
  const headlineHelpId = `${id}-headline-help`

  const [name, setName] = useState(profile?.name ?? '')
  const [pronouns, setPronouns] = useState(profile?.pronouns ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [headline, setHeadline] = useState(profile?.headline ?? '')

  // Sync local state with profile when it changes
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setPronouns(profile.pronouns ?? '')
      setLocation(profile.location ?? '')
      setHeadline(profile.headline ?? '')
    }
  }, [profile])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Basic Information
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us a bit about yourself. This helps others find and connect with
          you.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveField('name', name)}
            placeholder="Your full name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input
            id="pronouns"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            onBlur={() => saveField('pronouns', pronouns)}
            placeholder="e.g., they/them, she/her, he/him"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">
            Location <span className="text-red-500">*</span>
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={() => saveField('location', location)}
            placeholder="e.g., San Francisco, CA"
            aria-describedby={locationHelpId}
          />
          <p id={locationHelpId} className="text-xs text-muted-foreground">
            City and country/region helps with opportunity matching
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="headline">Headline</Label>
          <Textarea
            id="headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            onBlur={() => saveField('headline', headline)}
            placeholder="A brief tagline about yourself, e.g., 'ML researcher focused on interpretability'"
            rows={2}
            aria-describedby={headlineHelpId}
          />
          <p id={headlineHelpId} className="text-xs text-muted-foreground">
            A short summary that appears on your profile card
          </p>
        </div>
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
