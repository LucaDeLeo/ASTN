import { useQuery } from 'convex/react'
import { Check, Circle, Lock, Sparkles } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { useAgentSidebar } from '~/components/agent-sidebar/AgentSidebarProvider'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

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

const SECTIONS: Array<{ id: SectionId; label: string; shortLabel: string }> = [
  { id: 'basic', label: 'Basic Information', shortLabel: 'Basic' },
  { id: 'education', label: 'Education', shortLabel: 'Education' },
  { id: 'work', label: 'Work History', shortLabel: 'Work' },
  { id: 'goals', label: 'Career Goals', shortLabel: 'Goals' },
  { id: 'skills', label: 'Skills', shortLabel: 'Skills' },
  { id: 'preferences', label: 'Match Preferences', shortLabel: 'Preferences' },
  { id: 'privacy', label: 'Privacy Settings', shortLabel: 'Privacy' },
]

const UNLOCK_THRESHOLD = 5

interface ProfileNavProps {
  editingSection: SectionId | null
  onSectionClick: (section: SectionId) => void
}

export function ProfileNav({
  editingSection,
  onSectionClick,
}: ProfileNavProps) {
  const completeness = useQuery(api.profiles.getMyCompleteness)
  const { open } = useAgentSidebar()

  const isSectionComplete = (sectionId: SectionId) => {
    if (!completeness) return false
    const key = SECTION_TO_COMPLETENESS[sectionId]
    return completeness.sections.find((s) => s.id === key)?.isComplete ?? false
  }

  const completedCount = completeness?.completedCount ?? 0
  const totalCount = completeness?.totalCount ?? 7
  const canUnlock = completedCount >= UNLOCK_THRESHOLD

  const handleClick = (sectionId: SectionId) => {
    onSectionClick(sectionId)
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {/* Mobile: Horizontal pills */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm font-medium text-foreground">
            {completedCount}/{totalCount} complete
          </span>
          {canUnlock ? (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="size-3.5" />
              Matching unlocked
            </span>
          ) : (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Lock className="size-3.5" />
              {UNLOCK_THRESHOLD - completedCount} more to unlock
            </span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {SECTIONS.map((section) => {
            const isComplete = isSectionComplete(section.id)
            const isActive = editingSection === section.id

            return (
              <button
                key={section.id}
                onClick={() => handleClick(section.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors min-h-11 shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : isComplete
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {isComplete && <Check className="size-3.5" />}
                {section.shortLabel}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop: Sticky sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="sticky top-8">
          <div className="bg-white dark:bg-card rounded-lg border p-4 space-y-4">
            <div className="text-sm font-medium text-foreground">
              Profile Completeness
            </div>

            <div className="text-2xl font-semibold text-foreground">
              {completedCount}{' '}
              <span className="text-base font-normal text-muted-foreground">
                of {totalCount} complete
              </span>
            </div>

            <nav className="space-y-1">
              {SECTIONS.map((section) => {
                const isComplete = isSectionComplete(section.id)
                const isActive = editingSection === section.id

                return (
                  <button
                    key={section.id}
                    onClick={() => handleClick(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {isComplete ? (
                      <Check className="size-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="size-4 text-slate-300 shrink-0" />
                    )}
                    <span>{section.label}</span>
                  </button>
                )
              })}
            </nav>

            <div
              className={cn(
                'p-3 rounded-md text-sm',
                canUnlock
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {canUnlock ? (
                <div className="flex items-center gap-2">
                  <Check className="size-4" />
                  <span>Smart matching unlocked!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="size-4" />
                  <span>
                    Complete {UNLOCK_THRESHOLD - completedCount} more section
                    {UNLOCK_THRESHOLD - completedCount !== 1 ? 's' : ''} to
                    unlock smart matching
                  </span>
                </div>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={open}>
              <Sparkles className="size-4 mr-2" />
              Open Agent
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
