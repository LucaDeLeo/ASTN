import { usePostHog } from '@posthog/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import {
  Briefcase,
  Globe,
  GraduationCap,
  Lock,
  MapPin,
  Shield,
  SlidersHorizontal,
  Target,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { ProfileSectionCard } from './ProfileSectionCard'
import { ProfileNav } from './ProfileNav'
import { BasicInfoStep } from './wizard/steps/BasicInfoStep'
import { EducationStep } from './wizard/steps/EducationStep'
import { WorkHistoryStep } from './wizard/steps/WorkHistoryStep'
import { GoalsStep } from './wizard/steps/GoalsStep'
import { SkillsStep } from './wizard/steps/SkillsStep'
import { MatchPreferencesStep } from './wizard/steps/MatchPreferencesStep'
import { PrivacyStep } from './wizard/steps/PrivacyStep'
import { useAutoSave } from './wizard/hooks/useAutoSave'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Spinner } from '~/components/ui/spinner'

type SectionId =
  | 'basic'
  | 'education'
  | 'work'
  | 'goals'
  | 'skills'
  | 'preferences'
  | 'privacy'

const SECTION_TO_COMPLETENESS: Partial<Record<SectionId, string>> = {
  basic: 'basicInfo',
  education: 'education',
  work: 'workHistory',
  goals: 'careerGoals',
  skills: 'skills',
  privacy: 'privacy',
}

interface UnifiedProfileProps {
  initialSection?: string
}

export function UnifiedProfile({ initialSection }: UnifiedProfileProps) {
  const posthog = usePostHog()
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const completeness = useQuery(api.profiles.getMyCompleteness)
  const createProfile = useMutation(api.profiles.create)

  const [editingSection, setEditingSection] = useState<SectionId | null>(
    isValidSection(initialSection) ? initialSection : null,
  )

  // Refs for tracking completeness transitions
  const prevSectionStatusRef = useRef<Record<string, boolean>>({})
  const prevCompletenessRef = useRef<number | null>(null)
  const matchReadyFiredRef = useRef(false)

  // Create profile if it doesn't exist
  useEffect(() => {
    if (profile === null) {
      void createProfile({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    }
  }, [profile, createProfile])

  const { saveField, saveFieldImmediate, isSaving, lastSaved } = useAutoSave(
    profile?._id ?? null,
  )

  // Auto-scroll to section from URL param on first load
  useEffect(() => {
    if (initialSection && profile) {
      const el = document.getElementById(initialSection)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
  }, [initialSection, profile !== undefined && profile !== null])

  // Auto-expand first section for new/empty profiles
  useEffect(() => {
    if (profile && !initialSection && editingSection === null) {
      if (!profile.name && !profile.location) {
        setEditingSection('basic')
      }
    }
  }, [profile?._id])

  const handleToggleSection = useCallback(
    (sectionId: SectionId) => {
      setEditingSection((prev) => {
        if (prev !== sectionId) {
          posthog.capture('profile_section_opened', { section: sectionId })
        }
        return prev === sectionId ? null : sectionId
      })
    },
    [posthog],
  )

  const handleNavSectionClick = useCallback((sectionId: SectionId) => {
    setEditingSection(sectionId)
  }, [])

  const isSectionComplete = (sectionId: SectionId) => {
    if (!completeness) return false
    const key = SECTION_TO_COMPLETENESS[sectionId]
    if (!key) return false // preferences section has no completeness mapping
    return completeness.sections.find((s) => s.id === key)?.isComplete ?? false
  }

  // Track section completeness transitions and overall completeness changes
  useEffect(() => {
    if (!completeness) return

    // Track individual section complete transitions (false → true)
    for (const section of completeness.sections) {
      const wasComplete = prevSectionStatusRef.current[section.id]
      if (wasComplete === false && section.isComplete) {
        posthog.capture('profile_section_completed', {
          section: section.id,
          completeness_pct: completeness.percentage,
        })
      }
    }
    // Update ref with current status
    const statusMap: Record<string, boolean> = {}
    for (const section of completeness.sections) {
      statusMap[section.id] = section.isComplete
    }
    prevSectionStatusRef.current = statusMap

    // Track overall completeness % changes
    if (
      prevCompletenessRef.current !== null &&
      prevCompletenessRef.current !== completeness.percentage
    ) {
      posthog.capture('profile_completeness_changed', {
        percentage: completeness.percentage,
        completed_count: completeness.completedCount,
        total_count: completeness.totalCount,
      })
    }
    prevCompletenessRef.current = completeness.percentage

    // Track match_ready_unlocked (threshold: 5/7 + careerGoals)
    const careerGoalsComplete =
      completeness.sections.find((s) => s.id === 'careerGoals')?.isComplete ??
      false
    const isMatchReady = completeness.completedCount >= 5 && careerGoalsComplete
    if (isMatchReady && !matchReadyFiredRef.current) {
      matchReadyFiredRef.current = true
      posthog.capture('match_ready_unlocked', {
        percentage: completeness.percentage,
      })
    }
  }, [completeness, posthog])

  // Loading
  if (profile === undefined || completeness === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  // Profile being created
  if (profile === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row md:gap-8">
      <ProfileNav
        editingSection={editingSection}
        onSectionClick={handleNavSectionClick}
      />

      <div className="flex-1 md:min-w-0 space-y-4">
        {/* Completeness banner */}
        {completeness && completeness.percentage < 100 && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="font-medium text-amber-900">
              Your profile is {completeness.percentage}% complete
            </p>
            <p className="text-sm text-amber-700">
              Complete more sections to improve your opportunity matches
            </p>
          </Card>
        )}

        {/* Basic Information */}
        <ProfileSectionCard
          id="basic"
          title="Basic Information"
          icon={<User className="size-5 text-coral-400" />}
          isComplete={isSectionComplete('basic')}
          isEditing={editingSection === 'basic'}
          onToggleEdit={() => handleToggleSection('basic')}
          editContent={
            <BasicInfoStep
              profile={profile}
              saveField={saveField}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          }
        >
          <div className="space-y-2">
            {profile.name && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {profile.name}
                </span>
                {profile.pronouns && (
                  <span className="text-slate-500">({profile.pronouns})</span>
                )}
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="size-4" />
                {profile.location}
              </div>
            )}
            {profile.headline && (
              <p className="text-sm text-slate-600">{profile.headline}</p>
            )}
            {!profile.name && !profile.location && (
              <p className="text-sm text-slate-400 italic">
                No basic information added yet
              </p>
            )}
          </div>
        </ProfileSectionCard>

        {/* Education */}
        <ProfileSectionCard
          id="education"
          title="Education"
          icon={<GraduationCap className="size-5 text-coral-400" />}
          isComplete={isSectionComplete('education')}
          isEditing={editingSection === 'education'}
          onToggleEdit={() => handleToggleSection('education')}
          editContent={
            <EducationStep
              profile={profile}
              saveFieldImmediate={saveFieldImmediate}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          }
        >
          {profile.education && profile.education.length > 0 ? (
            <div className="space-y-3">
              {profile.education.map((edu, i) => (
                <div key={i} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm font-medium text-foreground">
                    {edu.degree && `${edu.degree} in `}
                    {edu.field || 'Unknown Field'}
                  </p>
                  <p className="text-sm text-slate-600">{edu.institution}</p>
                  {(edu.startYear || edu.endYear || edu.current) && (
                    <p className="text-xs text-slate-500">
                      {edu.startYear}
                      {edu.startYear && (edu.endYear || edu.current)
                        ? ' - '
                        : ''}
                      {edu.current ? 'Present' : edu.endYear}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No education added yet
            </p>
          )}
        </ProfileSectionCard>

        {/* Work History */}
        <ProfileSectionCard
          id="work"
          title="Work History"
          icon={<Briefcase className="size-5 text-coral-400" />}
          isComplete={isSectionComplete('work')}
          isEditing={editingSection === 'work'}
          onToggleEdit={() => handleToggleSection('work')}
          editContent={
            <WorkHistoryStep
              profile={profile}
              saveFieldImmediate={saveFieldImmediate}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          }
        >
          {profile.workHistory && profile.workHistory.length > 0 ? (
            <div className="space-y-3">
              {profile.workHistory.map((work, i) => (
                <div key={i} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm font-medium text-foreground">
                    {work.title}
                  </p>
                  <p className="text-sm text-slate-600">{work.organization}</p>
                  {work.startDate && (
                    <p className="text-xs text-slate-500">
                      {new Date(work.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' - '}
                      {work.current
                        ? 'Present'
                        : work.endDate
                          ? new Date(work.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                    </p>
                  )}
                  {work.description && (
                    <p className="text-xs text-slate-600 mt-1">
                      {work.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No work history added yet
            </p>
          )}
        </ProfileSectionCard>

        {/* Career Goals */}
        <ProfileSectionCard
          id="goals"
          title="Career Goals"
          icon={<Target className="size-5 text-coral-400" />}
          isComplete={isSectionComplete('goals')}
          isEditing={editingSection === 'goals'}
          onToggleEdit={() => handleToggleSection('goals')}
          editContent={
            <GoalsStep
              profile={profile}
              saveField={saveField}
              saveFieldImmediate={saveFieldImmediate}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          }
        >
          {profile.careerGoals ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">
                {profile.careerGoals}
              </p>
              {profile.aiSafetyInterests &&
                profile.aiSafetyInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.aiSafetyInterests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        className="text-xs"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              {profile.seeking && (
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1">
                    Looking for
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {profile.seeking}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No career goals described yet
            </p>
          )}
        </ProfileSectionCard>

        {/* Skills */}
        <ProfileSectionCard
          id="skills"
          title="Skills"
          icon={<Wrench className="size-5 text-coral-400" />}
          isComplete={isSectionComplete('skills')}
          isEditing={editingSection === 'skills'}
          onToggleEdit={() => handleToggleSection('skills')}
          editContent={
            <SkillsStep
              profile={profile}
              saveFieldImmediate={saveFieldImmediate}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          }
        >
          {profile.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No skills added yet</p>
          )}
        </ProfileSectionCard>

        {/* Match Preferences */}
        <ProfileSectionCard
          id="preferences"
          title="Match Preferences"
          icon={<SlidersHorizontal className="size-5 text-coral-400" />}
          isComplete={false}
          isEditing={editingSection === 'preferences'}
          onToggleEdit={() => handleToggleSection('preferences')}
          editContent={
            <MatchPreferencesStep
              profile={profile}
              saveFieldImmediate={saveFieldImmediate}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          }
        >
          {profile.matchPreferences ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {profile.matchPreferences.remotePreference &&
                  profile.matchPreferences.remotePreference !==
                    'no_preference' && (
                    <Badge variant="secondary" className="text-xs">
                      {profile.matchPreferences.remotePreference.replace(
                        /_/g,
                        ' ',
                      )}
                    </Badge>
                  )}
                {profile.matchPreferences.roleTypes?.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
                {profile.matchPreferences.experienceLevels?.map((level) => (
                  <Badge key={level} variant="secondary" className="text-xs">
                    {level}
                  </Badge>
                ))}
                {profile.matchPreferences.commitmentTypes?.map((ct) => (
                  <Badge key={ct} variant="secondary" className="text-xs">
                    {ct.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
              {profile.matchPreferences.minimumSalaryUSD && (
                <p className="text-sm text-slate-600">
                  Min salary: $
                  {profile.matchPreferences.minimumSalaryUSD.toLocaleString()}
                </p>
              )}
              {profile.matchPreferences.availability && (
                <p className="text-sm text-slate-600">
                  Available:{' '}
                  {profile.matchPreferences.availability.replace(/_/g, ' ')}
                </p>
              )}
              {profile.matchPreferences.workAuthorization && (
                <p className="text-sm text-slate-600">
                  Authorization: {profile.matchPreferences.workAuthorization}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">
              No match preferences set
            </p>
          )}
        </ProfileSectionCard>

        {/* Privacy Settings */}
        <ProfileSectionCard
          id="privacy"
          title="Privacy Settings"
          icon={<Shield className="size-5 text-coral-400" />}
          isComplete={isSectionComplete('privacy')}
          isEditing={editingSection === 'privacy'}
          onToggleEdit={() => handleToggleSection('privacy')}
          editContent={
            <PrivacyStep
              profile={profile}
              saveFieldImmediate={saveFieldImmediate}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          }
        >
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {profile.privacySettings?.defaultVisibility === 'public' ? (
              <>
                <Globe className="size-4" />
                <span>Public profile</span>
              </>
            ) : profile.privacySettings?.defaultVisibility === 'private' ? (
              <>
                <Lock className="size-4" />
                <span>Private profile</span>
              </>
            ) : (
              <>
                <Users className="size-4" />
                <span>Visible to connections only</span>
              </>
            )}
          </div>
        </ProfileSectionCard>
      </div>
    </div>
  )
}

function isValidSection(s: string | undefined): s is SectionId {
  return (
    s === 'basic' ||
    s === 'education' ||
    s === 'work' ||
    s === 'goals' ||
    s === 'skills' ||
    s === 'preferences' ||
    s === 'privacy'
  )
}
