import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { Doc } from '../../../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'

const ROLE_TYPES = ['Research', 'Engineering', 'Operations', 'Policy', 'Other']
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead']
const COMMITMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'internship', label: 'Internship' },
  { value: 'volunteer', label: 'Volunteer' },
] as const

interface MatchPreferencesStepProps {
  profile: Doc<'profiles'> | null
  saveFieldImmediate: (field: string, value: unknown) => Promise<void>
  isSaving: boolean
  lastSaved: Date | null
}

type MatchPreferences = NonNullable<Doc<'profiles'>['matchPreferences']>

export function MatchPreferencesStep({
  profile,
  saveFieldImmediate,
  isSaving,
  lastSaved,
}: MatchPreferencesStepProps) {
  const [prefs, setPrefs] = useState<MatchPreferences>(
    profile?.matchPreferences ?? {},
  )

  useEffect(() => {
    if (profile) {
      setPrefs(profile.matchPreferences ?? {})
    }
  }, [profile])

  const save = (updated: MatchPreferences) => {
    setPrefs(updated)
    void saveFieldImmediate('matchPreferences', updated)
  }

  const toggleBadge = (
    field: 'roleTypes' | 'experienceLevels',
    value: string,
  ) => {
    const current = prefs[field] ?? []
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    save({ ...prefs, [field]: updated })
  }

  const toggleCommitment = (value: string) => {
    const current = (prefs.commitmentTypes ?? []) as Array<string>
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    save({
      ...prefs,
      commitmentTypes: updated as MatchPreferences['commitmentTypes'],
    })
  }

  return (
    <div className="space-y-8">
      {/* Programmatic Filters */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground">
          Matching Filters
        </h3>
        <p className="text-xs text-muted-foreground -mt-3">
          These filters are applied automatically before AI matching.
        </p>

        {/* Remote preference */}
        <div className="space-y-2">
          <Label className="text-sm">Remote preference</Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'no_preference', label: 'No preference' },
                { value: 'remote_only', label: 'Remote only' },
                { value: 'on_site_ok', label: 'On-site OK' },
              ] as const
            ).map((opt) => (
              <Badge
                key={opt.value}
                variant={
                  prefs.remotePreference === opt.value ? 'default' : 'outline'
                }
                className="cursor-pointer select-none"
                onClick={() => save({ ...prefs, remotePreference: opt.value })}
              >
                {prefs.remotePreference === opt.value && (
                  <Check className="size-3 mr-1" />
                )}
                {opt.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Role types */}
        <div className="space-y-2">
          <Label className="text-sm">Preferred role types</Label>
          <p className="text-xs text-muted-foreground">
            {(prefs.roleTypes ?? []).length === 0
              ? 'No filter — all role types will be shown'
              : 'Only selected types will be shown'}
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLE_TYPES.map((role) => {
              const val = role.toLowerCase()
              const selected = (prefs.roleTypes ?? []).includes(val)
              return (
                <Badge
                  key={val}
                  variant={selected ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => toggleBadge('roleTypes', val)}
                >
                  {selected && <Check className="size-3 mr-1" />}
                  {role}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Experience levels */}
        <div className="space-y-2">
          <Label className="text-sm">Experience levels</Label>
          <p className="text-xs text-muted-foreground">
            {(prefs.experienceLevels ?? []).length === 0
              ? 'No filter — all levels will be shown'
              : 'Only selected levels will be shown'}
          </p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((level) => {
              const val = level.toLowerCase()
              const selected = (prefs.experienceLevels ?? []).includes(val)
              return (
                <Badge
                  key={val}
                  variant={selected ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => toggleBadge('experienceLevels', val)}
                >
                  {selected && <Check className="size-3 mr-1" />}
                  {level}
                </Badge>
              )
            })}
          </div>
        </div>
      </div>

      {/* LLM-Enforced Constraints */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground">
          Additional Constraints
        </h3>
        <p className="text-xs text-muted-foreground -mt-3">
          These are enforced by AI during matching. Opportunities that clearly
          violate them are excluded.
        </p>

        {/* Willing to relocate */}
        <div className="flex items-center justify-between">
          <Label className="text-sm">Willing to relocate</Label>
          <Switch
            checked={prefs.willingToRelocate ?? false}
            onCheckedChange={(checked) =>
              save({ ...prefs, willingToRelocate: checked })
            }
          />
        </div>

        {/* Work authorization */}
        <div className="space-y-2">
          <Label className="text-sm">Work authorization</Label>
          <Input
            placeholder="e.g., US citizen, Need visa sponsorship"
            value={prefs.workAuthorization ?? ''}
            onChange={(e) =>
              save({
                ...prefs,
                workAuthorization: e.target.value || undefined,
              })
            }
          />
        </div>

        {/* Minimum salary */}
        <div className="space-y-2">
          <Label className="text-sm">Minimum salary (USD/year)</Label>
          <Input
            type="number"
            placeholder="e.g., 80000"
            value={prefs.minimumSalaryUSD ?? ''}
            onChange={(e) =>
              save({
                ...prefs,
                minimumSalaryUSD: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
        </div>

        {/* Availability */}
        <div className="space-y-2">
          <Label className="text-sm">Availability</Label>
          <Select
            value={prefs.availability ?? ''}
            onValueChange={(val) =>
              save({
                ...prefs,
                availability: (val ||
                  undefined) as MatchPreferences['availability'],
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">Immediately</SelectItem>
              <SelectItem value="within_1_month">Within 1 month</SelectItem>
              <SelectItem value="within_3_months">Within 3 months</SelectItem>
              <SelectItem value="within_6_months">Within 6 months</SelectItem>
              <SelectItem value="not_available">Not available</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Commitment types */}
        <div className="space-y-2">
          <Label className="text-sm">Commitment types</Label>
          <p className="text-xs text-muted-foreground">
            {((prefs.commitmentTypes ?? []) as Array<string>).length === 0
              ? 'No filter — all commitment types will be considered'
              : 'Only selected types will be considered'}
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMITMENT_TYPES.map((ct) => {
              const selected = (
                (prefs.commitmentTypes ?? []) as Array<string>
              ).includes(ct.value)
              return (
                <Badge
                  key={ct.value}
                  variant={selected ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => toggleCommitment(ct.value)}
                >
                  {selected && <Check className="size-3 mr-1" />}
                  {ct.label}
                </Badge>
              )
            })}
          </div>
        </div>
      </div>

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
    </div>
  )
}
