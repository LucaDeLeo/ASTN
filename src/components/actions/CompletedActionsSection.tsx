import { CheckCircle2 } from 'lucide-react'
import { ActionCard } from './ActionCard'
import type { Id } from '../../../convex/_generated/dataModel'
import { AnimatedCard } from '~/components/animation/AnimatedCard'
import { CollapsibleSection } from '~/components/ui/collapsible-section'

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
  if (actions.length === 0) return null

  return (
    <CollapsibleSection
      icon={CheckCircle2}
      title="Completed"
      count={actions.length}
      subtitle={`(${actions.length} of ${totalCount} completed)`}
      variant="violet"
      storageKey="completed-actions-expanded"
      className="mt-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-1">
        {actions.map((action, index) => (
          <AnimatedCard key={action._id} index={index}>
            <ActionCard action={action} />
          </AnimatedCard>
        ))}
      </div>
    </CollapsibleSection>
  )
}
