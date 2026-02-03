import { Check, Circle, CircleDot } from 'lucide-react'
import { cn } from '~/lib/utils'

type WizardStep = 'input' | 'review' | 'enrich'

interface WizardStepIndicatorProps {
  currentStep: WizardStep
  showReviewStep?: boolean
}

interface StepConfig {
  id: WizardStep
  label: string
  number: number
}

const ALL_STEPS: Array<StepConfig> = [
  { id: 'input', label: 'Input', number: 1 },
  { id: 'review', label: 'Review', number: 2 },
  { id: 'enrich', label: 'Enrich', number: 3 },
]

function getStepStatus(
  step: WizardStep,
  currentStep: WizardStep,
  steps: Array<StepConfig>,
): 'complete' | 'current' | 'future' {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)
  const stepIndex = steps.findIndex((s) => s.id === step)

  if (stepIndex < currentIndex) return 'complete'
  if (stepIndex === currentIndex) return 'current'
  return 'future'
}

export function WizardStepIndicator({
  currentStep,
  showReviewStep = true,
}: WizardStepIndicatorProps) {
  // Filter steps based on whether review step should be shown
  const steps = showReviewStep
    ? ALL_STEPS
    : ALL_STEPS.filter((s) => s.id !== 'review')

  // Renumber steps when review is hidden
  const displaySteps = steps.map((step, index) => ({
    ...step,
    number: index + 1,
  }))

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {displaySteps.map((step, index) => {
        const status = getStepStatus(step.id, currentStep, steps)
        const isLast = index === displaySteps.length - 1

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full transition-colors',
                  status === 'complete' && 'bg-green-100 text-green-600',
                  status === 'current' && 'bg-primary/10 text-primary',
                  status === 'future' && 'bg-slate-100 text-slate-400',
                )}
              >
                {status === 'complete' ? (
                  <Check className="size-4" />
                ) : status === 'current' ? (
                  <CircleDot className="size-4" />
                ) : (
                  <Circle className="size-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  status === 'complete' && 'text-green-600',
                  status === 'current' && 'text-primary',
                  status === 'future' && 'text-slate-400',
                )}
              >
                {step.number}. {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'h-0.5 w-6 sm:w-10 transition-colors',
                  status === 'complete' ? 'bg-green-300' : 'bg-slate-200',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
