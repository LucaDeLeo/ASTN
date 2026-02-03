import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, Globe, Lock, PartyPopper, Shield, Users } from 'lucide-react'
import { SectionVisibility } from '../../privacy/SectionVisibility'
import { OrgSelector } from '../../privacy/OrgSelector'
import type { Doc } from '../../../../../convex/_generated/dataModel'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'

interface PrivacyStepProps {
  profile: Doc<'profiles'> | null
  saveFieldImmediate: (field: string, value: unknown) => Promise<void>
  isSaving: boolean
  lastSaved: Date | null
}

type VisibilityLevel = 'public' | 'connections' | 'private'

interface SectionVisibilitySettings {
  basicInfo?: string
  education?: string
  workHistory?: string
  skills?: string
  careerGoals?: string
}

interface PrivacySettings {
  defaultVisibility: VisibilityLevel
  sectionVisibility?: SectionVisibilitySettings
  hiddenFromOrgs?: Array<string>
}

const VISIBILITY_OPTIONS: Array<{
  value: VisibilityLevel
  label: string
  description: string
  icon: typeof Globe
}> = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can see your profile',
    icon: Globe,
  },
  {
    value: 'connections',
    label: 'Connections Only',
    description: 'Only people you connect with can see your profile',
    icon: Users,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can see your profile',
    icon: Lock,
  },
]

const SECTIONS = [
  { id: 'basicInfo', label: 'Basic Information' },
  { id: 'education', label: 'Education' },
  { id: 'workHistory', label: 'Work History' },
  { id: 'skills', label: 'Skills' },
  { id: 'careerGoals', label: 'Career Goals' },
]

export function PrivacyStep({
  profile,
  saveFieldImmediate,
  isSaving,
  lastSaved,
}: PrivacyStepProps) {
  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(false)

  // Initialize from profile or defaults
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    defaultVisibility:
      profile?.privacySettings?.defaultVisibility ?? 'connections',
    sectionVisibility: profile?.privacySettings?.sectionVisibility ?? {},
    hiddenFromOrgs: profile?.privacySettings?.hiddenFromOrgs ?? [],
  })

  // Sync with profile when it changes
  useEffect(() => {
    if (profile?.privacySettings) {
      setPrivacySettings({
        defaultVisibility: profile.privacySettings.defaultVisibility,
        sectionVisibility: profile.privacySettings.sectionVisibility ?? {},
        hiddenFromOrgs: profile.privacySettings.hiddenFromOrgs ?? [],
      })
    }
  }, [profile])

  // Save helper - updates local state and persists
  const updateSettings = async (updates: Partial<PrivacySettings>) => {
    const newSettings = { ...privacySettings, ...updates }
    setPrivacySettings(newSettings)
    await saveFieldImmediate('privacySettings', newSettings)
  }

  // Handle default visibility change
  const handleDefaultVisibilityChange = (value: VisibilityLevel) => {
    updateSettings({ defaultVisibility: value })
  }

  // Handle section visibility change
  const handleSectionVisibilityChange = (
    section: string,
    value: string | undefined,
  ) => {
    const newSectionVisibility = {
      ...privacySettings.sectionVisibility,
      [section]: value,
    }

    // Remove undefined values
    if (value === undefined) {
      delete newSectionVisibility[section as keyof SectionVisibilitySettings]
    }

    updateSettings({ sectionVisibility: newSectionVisibility })
  }

  // Handle hidden orgs change
  const handleHiddenOrgsChange = (orgs: Array<string>) => {
    updateSettings({ hiddenFromOrgs: orgs })
  }

  // Handle complete profile
  const handleComplete = async () => {
    // Ensure settings are saved
    await saveFieldImmediate('privacySettings', privacySettings)

    // Show success state briefly
    setShowSuccess(true)

    // Navigate to profile view after delay
    setTimeout(() => {
      navigate({ to: '/profile' })
    }, 1500)
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="size-16 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <PartyPopper className="size-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Profile Complete!
        </h2>
        <p className="text-slate-500">Redirecting to your profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Privacy Settings
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Control who can see your profile and its sections.
        </p>
      </div>

      {/* Default Visibility Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="size-5 text-primary" />
          <Label className="text-base font-medium">
            Default Profile Visibility
          </Label>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Who can see your profile by default?
        </p>

        <div className="grid gap-3">
          {VISIBILITY_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected =
              privacySettings.defaultVisibility === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDefaultVisibilityChange(option.value)}
                className={`flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-primary text-white' : 'bg-slate-100'
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {option.label}
                    </span>
                    {isSelected && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Section Visibility */}
      <Card className="p-6">
        <Label className="text-base font-medium mb-1 block">
          Section Visibility
        </Label>
        <p className="text-sm text-slate-500 mb-4">
          Override visibility for specific sections of your profile.
        </p>

        <div>
          {SECTIONS.map((section) => (
            <SectionVisibility
              key={section.id}
              label={section.label}
              value={
                privacySettings.sectionVisibility?.[
                  section.id as keyof SectionVisibilitySettings
                ]
              }
              onChange={(value) =>
                handleSectionVisibilityChange(section.id, value)
              }
              defaultVisibility={privacySettings.defaultVisibility}
            />
          ))}
        </div>
      </Card>

      {/* Hidden from Organizations */}
      <Card className="p-6">
        <Label className="text-base font-medium mb-1 block">
          Hide from Organizations
        </Label>
        <p className="text-sm text-slate-500 mb-4">
          Select organizations that should not see your profile.
        </p>

        <OrgSelector
          selectedOrgs={privacySettings.hiddenFromOrgs ?? []}
          onOrgsChange={handleHiddenOrgsChange}
        />
      </Card>

      {/* Save indicator */}
      <div className="h-6 flex items-center">
        {isSaving ? (
          <span className="text-sm text-slate-500">Saving...</span>
        ) : lastSaved ? (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="size-3" />
            Saved
          </span>
        ) : null}
      </div>

      {/* Complete Profile Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={handleComplete}
          className="w-full"
          size="lg"
          disabled={isSaving}
        >
          <PartyPopper className="size-4 mr-2" />
          Complete Profile
        </Button>
        <p className="text-xs text-slate-500 text-center mt-2">
          You can always come back to edit your profile later.
        </p>
      </div>
    </div>
  )
}
