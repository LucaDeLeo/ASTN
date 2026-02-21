import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import {
  Briefcase,
  Edit,
  GraduationCap,
  MapPin,
  Target,
  User,
  Wrench,
} from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'

export function LiveProfileView() {
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const completeness = useQuery(api.profiles.getMyCompleteness)
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const prevProfile = useRef(profile)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    if (!prevProfile.current || !profile) {
      prevProfile.current = profile
      return
    }
    const changed = new Set<string>()
    const prev = prevProfile.current
    // Basic info
    if (
      prev.name !== profile.name ||
      prev.location !== profile.location ||
      prev.headline !== profile.headline ||
      prev.pronouns !== profile.pronouns
    ) {
      changed.add('basicInfo')
    }
    // Education
    if (JSON.stringify(prev.education) !== JSON.stringify(profile.education)) {
      changed.add('education')
    }
    // Work history
    if (
      JSON.stringify(prev.workHistory) !== JSON.stringify(profile.workHistory)
    ) {
      changed.add('workHistory')
    }
    // Career goals (includes aiSafetyInterests + seeking)
    if (
      prev.careerGoals !== profile.careerGoals ||
      JSON.stringify(prev.aiSafetyInterests) !==
        JSON.stringify(profile.aiSafetyInterests) ||
      prev.seeking !== profile.seeking
    ) {
      changed.add('careerGoals')
    }
    // Skills
    if (JSON.stringify(prev.skills) !== JSON.stringify(profile.skills)) {
      changed.add('skills')
    }
    if (changed.size > 0) {
      setHighlighted(changed)
      // Scroll the first changed section into view
      const sectionOrder = [
        'basicInfo',
        'education',
        'workHistory',
        'careerGoals',
        'skills',
      ]
      const firstChanged = sectionOrder.find((key) => changed.has(key))
      if (firstChanged) {
        const el = sectionRefs.current.get(firstChanged)
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
      setTimeout(() => setHighlighted(new Set()), 1500)
    }
    prevProfile.current = profile
  }, [profile])

  const setSectionRef = (key: string) => (el: HTMLDivElement | null) => {
    if (el) sectionRefs.current.set(key, el)
    else sectionRefs.current.delete(key)
  }

  if (profile === undefined || completeness === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  if (profile === null) {
    return (
      <div className="flex items-center justify-center h-full text-center p-8">
        <div>
          <User className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Your profile will appear here as you chat
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Completeness */}
        {completeness && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  Profile Completeness
                </span>
                <span className="text-sm text-muted-foreground">
                  {completeness.percentage}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <ProfileSection
          ref={setSectionRef('basicInfo')}
          icon={<User className="size-4 text-coral-400" />}
          title="Basic Information"
          editStep="basic"
          filled={Boolean(profile.name || profile.location)}
          highlighted={highlighted.has('basicInfo')}
        >
          {profile.name || profile.location || profile.headline ? (
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
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="size-3.5" />
                  {profile.location}
                </div>
              )}
              {profile.headline && (
                <p className="text-sm text-slate-600">{profile.headline}</p>
              )}
            </div>
          ) : (
            <EmptyState>No basic information yet</EmptyState>
          )}
        </ProfileSection>

        {/* Education */}
        <ProfileSection
          ref={setSectionRef('education')}
          icon={<GraduationCap className="size-4 text-coral-400" />}
          title="Education"
          editStep="education"
          filled={Boolean(profile.education?.length)}
          highlighted={highlighted.has('education')}
        >
          {profile.education && profile.education.length > 0 ? (
            <div className="space-y-3">
              {profile.education.map((edu, i) => (
                <div key={i} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm font-medium text-foreground">
                    {edu.degree && `${edu.degree} `}
                    {edu.field && `in ${edu.field}`}
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
            <EmptyState>No education added yet</EmptyState>
          )}
        </ProfileSection>

        {/* Work History */}
        <ProfileSection
          ref={setSectionRef('workHistory')}
          icon={<Briefcase className="size-4 text-coral-400" />}
          title="Work History"
          editStep="work"
          filled={Boolean(profile.workHistory?.length)}
          highlighted={highlighted.has('workHistory')}
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
            <EmptyState>No work history added yet</EmptyState>
          )}
        </ProfileSection>

        {/* Career Goals */}
        <ProfileSection
          ref={setSectionRef('careerGoals')}
          icon={<Target className="size-4 text-coral-400" />}
          title="Career Goals"
          editStep="goals"
          filled={Boolean(profile.careerGoals)}
          highlighted={highlighted.has('careerGoals')}
        >
          {profile.careerGoals ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {profile.careerGoals}
              </p>
              {profile.aiSafetyInterests &&
                profile.aiSafetyInterests.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-1.5">
                      Areas of Interest
                    </p>
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
                  </div>
                )}
              {profile.seeking && (
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1">
                    Looking for
                  </p>
                  <p className="text-sm text-slate-600">{profile.seeking}</p>
                </div>
              )}
            </div>
          ) : (
            <EmptyState>No career goals described yet</EmptyState>
          )}
        </ProfileSection>

        {/* Skills */}
        <ProfileSection
          ref={setSectionRef('skills')}
          icon={<Wrench className="size-4 text-coral-400" />}
          title="Skills"
          editStep="skills"
          filled={Boolean(profile.skills?.length)}
          highlighted={highlighted.has('skills')}
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
            <EmptyState>No skills added yet</EmptyState>
          )}
        </ProfileSection>
      </div>
    </div>
  )
}

function ProfileSection({
  ref,
  icon,
  title,
  editStep,
  filled,
  highlighted,
  children,
}: {
  ref?: React.Ref<HTMLDivElement>
  icon: React.ReactNode
  title: string
  editStep: string
  filled: boolean
  highlighted?: boolean
  children: React.ReactNode
}) {
  return (
    <Card
      ref={ref}
      className={cn(
        'p-4 transition-all duration-500',
        !filled && 'border-dashed',
        highlighted && 'ring-2 ring-primary/30',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-display font-semibold text-foreground">
            {title}
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
          <Link to="/profile/edit" search={{ step: editStep as 'basic' }}>
            <Edit className="size-3 mr-1" />
            Edit
          </Link>
        </Button>
      </div>
      {children}
    </Card>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400 italic">{children}</p>
}
