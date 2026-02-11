import { useEffect, useState } from 'react'
import { CheckCircle2, ChevronDown } from 'lucide-react'
import { ActionCard } from './ActionCard'
import type { Id } from '../../../convex/_generated/dataModel'
import { AnimatedCard } from '~/components/animation/AnimatedCard'
import { cn } from '~/lib/utils'

const COMPLETED_SECTION_EXPANDED_KEY = 'completed-actions-expanded'

interface CompletedActionsSectionProps {
  actions: Array<{
    _id: Id<'careerActions'>
    type:
      | 'replicate'
      | 'collaborate'
      | 'start_org'
      | 'identify_gaps'
      | 'volunteer'
      | 'build_tools'
      | 'teach_write'
      | 'develop_skills'
    title: string
    description: string
    rationale: string
    status: 'active' | 'saved' | 'dismissed' | 'in_progress' | 'done'
    completedAt?: number
    completionConversationStarted?: boolean
  }>
  totalCount: number
}

export function CompletedActionsSection({
  actions,
  totalCount,
}: CompletedActionsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(COMPLETED_SECTION_EXPANDED_KEY) === 'true'
  })

  // Sync expanded state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(COMPLETED_SECTION_EXPANDED_KEY, String(isExpanded))
  }, [isExpanded])

  if (actions.length === 0) return null

  return (
    <section className="mt-6">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between gap-2 p-3 rounded-lg',
          'bg-violet-50 border border-violet-200',
          'hover:bg-violet-100 transition-colors',
          'text-left',
        )}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-violet-600" />
          <span className="font-medium text-violet-800">
            {actions.length} Completed
          </span>
          <span className="text-sm text-violet-600">
            ({actions.length} of {totalCount} completed)
          </span>
        </div>
        <ChevronDown
          suppressHydrationWarning
          className={cn(
            'size-5 text-violet-600 transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {/* Expandable content */}
      <div
        suppressHydrationWarning
        className={cn(
          'grid mt-4 will-change-[grid-template-rows]',
          'transition-[grid-template-rows] duration-200 ease-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-1">
            {actions.map((action, index) => (
              <AnimatedCard key={action._id} index={index}>
                <ActionCard action={action} />
              </AnimatedCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
