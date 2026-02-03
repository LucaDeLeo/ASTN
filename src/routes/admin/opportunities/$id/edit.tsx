import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { OpportunityForm } from '~/components/admin/opportunity-form'

export const Route = createFileRoute('/admin/opportunities/$id/edit')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.opportunities.get, {
        id: params.id as Id<'opportunities'>,
      }),
    )
  },
  component: EditOpportunityPage,
})

function EditOpportunityPage() {
  const { id } = Route.useParams()

  const { data: opportunity } = useSuspenseQuery(
    convexQuery(api.opportunities.get, { id: id as Id<'opportunities'> }),
  )

  if (opportunity === null) {
    return <div className="text-red-600">Opportunity not found</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-display text-foreground mb-6">
        Edit Opportunity
      </h1>
      <OpportunityForm
        mode="edit"
        initialData={{
          ...opportunity,
          requirements: opportunity.requirements || undefined,
          deadline: opportunity.deadline || undefined,
        }}
      />
    </div>
  )
}
