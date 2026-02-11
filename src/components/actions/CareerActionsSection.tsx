import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { ActionCard } from './ActionCard'
import { CompletedActionsSection } from './CompletedActionsSection'
import { AnimatedCard } from '~/components/animation/AnimatedCard'

export function CareerActionsSection() {
  const actionsData = useQuery(api.careerActions.queries.getMyActions)

  const saveAction = useMutation(api.careerActions.mutations.saveAction)
  const dismissAction = useMutation(api.careerActions.mutations.dismissAction)
  const startAction = useMutation(api.careerActions.mutations.startAction)
  const completeAction = useMutation(api.careerActions.mutations.completeAction)
  const unsaveAction = useMutation(api.careerActions.mutations.unsaveAction)
  const cancelAction = useMutation(api.careerActions.mutations.cancelAction)

  // Don't render while loading
  if (actionsData === undefined || actionsData === null) return null

  const { active, inProgress, saved, completed, hasProfile } = actionsData

  // All displayable actions (active + saved + in_progress)
  const displayActions = [...active, ...saved, ...inProgress]
  const totalCount = displayActions.length + completed.length
  const hasAnyActions = totalCount > 0

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
                    ? () => completeAction({ actionId: action._id })
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
    </section>
  )
}
