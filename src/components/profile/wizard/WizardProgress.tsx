import { useQuery } from 'convex/react'
import { Check, Circle, Lock } from 'lucide-react'
import { api } from '../../../../convex/_generated/api'
import { cn } from '~/lib/utils'

type StepId =
  | 'basic'
  | 'education'
  | 'work'
  | 'goals'
  | 'skills'
  | 'enrichment'
  | 'privacy'

interface WizardProgressProps {
  currentStep: StepId
  onStepClick: (step: StepId) => void
}

const STEP_TO_SECTION: Record<StepId, string> = {
  basic: 'basicInfo',
  education: 'education',
  work: 'workHistory',
  goals: 'careerGoals',
  skills: 'skills',
  enrichment: 'enrichment',
  privacy: 'privacy',
}

const STEPS: Array<{ id: StepId; label: string; shortLabel: string }> = [
  { id: 'basic', label: 'Basic Information', shortLabel: 'Basic' },
  { id: 'education', label: 'Education', shortLabel: 'Education' },
  { id: 'work', label: 'Work History', shortLabel: 'Work' },
  { id: 'goals', label: 'Career Goals', shortLabel: 'Goals' },
  { id: 'skills', label: 'Skills', shortLabel: 'Skills' },
  { id: 'privacy', label: 'Privacy Settings', shortLabel: 'Privacy' },
  { id: 'enrichment', label: 'Profile Enrichment', shortLabel: 'Enrich' },
]

const UNLOCK_THRESHOLD = 4

export function WizardProgress({
  currentStep,
  onStepClick,
}: WizardProgressProps) {
  const completeness = useQuery(api.profiles.getMyCompleteness)

  const getSectionComplete = (stepId: StepId) => {
    if (!completeness) return false
    const sectionId = STEP_TO_SECTION[stepId]
    return (
      completeness.sections.find((s) => s.id === sectionId)?.isComplete ?? false
    )
  }

  const completedCount = completeness?.completedCount ?? 0
  const totalCount = completeness?.totalCount ?? 7
  const canUnlock = completedCount >= UNLOCK_THRESHOLD
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <>
      {/* Mobile: Horizontal step indicator */}
      <div className="md:hidden mb-6">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm font-medium text-foreground">
            Step {currentIndex + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} complete
          </span>
        </div>

        {/* Step pills - horizontally scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {STEPS.map((step, index) => {
            const isComplete = getSectionComplete(step.id)
            const isCurrent = currentStep === step.id

            return (
              <button
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-colors min-h-11 shrink-0',
                  isCurrent
                    ? 'bg-primary text-primary-foreground font-medium'
                    : isComplete
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {isComplete ? (
                  <Check className="size-3.5" />
                ) : (
                  <span className="size-5 flex items-center justify-center rounded-full bg-current/10 text-xs">
                    {index + 1}
                  </span>
                )}
                {step.shortLabel}
              </button>
            )
          })}
        </div>

        {/* Unlock status - compact */}
        <div
          className={cn(
            'mt-3 p-2.5 rounded-md text-sm flex items-center gap-2',
            canUnlock
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {canUnlock ? (
            <>
              <Check className="size-4" />
              <span>Smart matching unlocked!</span>
            </>
          ) : (
            <>
              <Lock className="size-4" />
              <span>
                {UNLOCK_THRESHOLD - completedCount} more to unlock matching
              </span>
            </>
          )}
        </div>
      </div>

      {/* Desktop: Sidebar (existing layout, refined) */}
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
              {STEPS.map((step) => {
                const isComplete = getSectionComplete(step.id)
                const isCurrent = currentStep === step.id

                return (
                  <button
                    key={step.id}
                    onClick={() => onStepClick(step.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors',
                      isCurrent
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {isComplete ? (
                      <Check className="size-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="size-4 text-slate-300 shrink-0" />
                    )}
                    <span>{step.label}</span>
                  </button>
                )
              })}
            </nav>

            <div
              className={cn(
                'mt-4 p-3 rounded-md text-sm',
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
          </div>
        </div>
      </div>
    </>
  )
}
