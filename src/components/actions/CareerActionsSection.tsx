import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ActionCard } from './ActionCard'
import { CompletedActionsSection } from './CompletedActionsSection'
import { CompletionChoiceDialog } from './CompletionChoiceDialog'
import { CompletionEnrichmentDialog } from './CompletionEnrichmentDialog'
import type { Id } from '../../../convex/_generated/dataModel'
import { AnimatedCard } from '~/components/animation/AnimatedCard'

// Action shape used for completion dialog state
interface ActionData {
  _id: Id<'careerActions'>
  type: string
  title: string
  description: string
  rationale: string
  status: string
}

export function CareerActionsSection() {
  const actionsData = useQuery(api.careerActions.queries.getMyActions)

  const saveAction = useMutation(api.careerActions.mutations.saveAction)
  const dismissAction = useMutation(api.careerActions.mutations.dismissAction)
  const startAction = useMutation(api.careerActions.mutations.startAction)
  const completeAction = useMutation(api.careerActions.mutations.completeAction)
  const unsaveAction = useMutation(api.careerActions.mutations.unsaveAction)
  const cancelAction = useMutation(api.careerActions.mutations.cancelAction)
  const markCompletionStarted = useMutation(
    api.careerActions.mutations.markCompletionStarted,
  )

  // Completion dialog state
  const [completingAction, setCompletingAction] = useState<ActionData | null>(
    null,
  )
  const [enrichmentAction, setEnrichmentAction] = useState<ActionData | null>(
    null,
  )
  const [isCompleting, setIsCompleting] = useState(false)

  // Don't render while loading
  if (actionsData === undefined || actionsData === null) return null

  const { active, inProgress, saved, completed, hasProfile, profileId } =
    actionsData

  // All displayable actions (active + saved + in_progress)
  const displayActions = [...active, ...saved, ...inProgress]
  const totalCount = displayActions.length + completed.length
  const hasAnyActions = totalCount > 0

  // Completion dialog handlers
  const handleJustDone = async () => {
    if (!completingAction) return
    setIsCompleting(true)
    try {
      await completeAction({ actionId: completingAction._id })
      setCompletingAction(null)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleTellUs = async () => {
    if (!completingAction) return
    setIsCompleting(true)
    try {
      await completeAction({ actionId: completingAction._id })
      await markCompletionStarted({ actionId: completingAction._id })
      setEnrichmentAction(completingAction)
      setCompletingAction(null)
    } finally {
      setIsCompleting(false)
    }
  }

  // Empty state: user has profile but no actions
  if (!hasAnyActions && hasProfile) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          Your Next Moves
        </h2>
        <p className="text-sm text-muted-foreground">
          Refresh your matches to generate personalized career actions.
        </p>
      </section>
    )
  }

  // No profile or no actions at all
  if (!hasAnyActions) return null

  return (
    <section className="mt-8">
      <h2 className="text-lg font-display font-semibold text-foreground mb-4">
        Your Next Moves
      </h2>

      {/* Active, saved, and in-progress actions grid */}
      {displayActions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayActions.map((action, index) => (
            <AnimatedCard key={action._id} index={index}>
              <ActionCard
                action={action}
                onSave={
                  action.status === 'active'
                    ? () => saveAction({ actionId: action._id })
                    : undefined
                }
                onDismiss={
                  action.status === 'active' || action.status === 'saved'
                    ? () => dismissAction({ actionId: action._id })
                    : undefined
                }
                onStart={
                  action.status === 'active' || action.status === 'saved'
                    ? () => startAction({ actionId: action._id })
                    : undefined
                }
                onComplete={
                  action.status === 'in_progress'
                    ? () => setCompletingAction(action)
                    : undefined
                }
                onUnsave={
                  action.status === 'saved'
                    ? () => unsaveAction({ actionId: action._id })
                    : undefined
                }
                onCancel={
                  action.status === 'in_progress'
                    ? () => cancelAction({ actionId: action._id })
                    : undefined
                }
              />
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Completed actions */}
      {completed.length > 0 && (
        <CompletedActionsSection actions={completed} totalCount={totalCount} />
      )}

      {/* Completion choice dialog */}
      <CompletionChoiceDialog
        open={completingAction !== null}
        onOpenChange={(open) => !open && setCompletingAction(null)}
        actionTitle={completingAction?.title ?? ''}
        onTellUs={handleTellUs}
        onJustDone={handleJustDone}
        isLoading={isCompleting}
      />

      {/* Completion enrichment dialog */}
      {enrichmentAction && profileId && (
        <CompletionEnrichmentDialog
          open
          onOpenChange={(open) => !open && setEnrichmentAction(null)}
          actionId={enrichmentAction._id}
          actionTitle={enrichmentAction.title}
          actionDescription={enrichmentAction.description}
          actionType={enrichmentAction.type}
          profileId={profileId}
        />
      )}
    </section>
  )
}
