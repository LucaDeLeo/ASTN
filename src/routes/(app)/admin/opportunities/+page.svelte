<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { formatDistanceToNow } from 'date-fns'

  const convex = useConvexClient()
  const opportunities = useQuery(api.opportunities.listAll, () => ({ includeArchived: true }))

  const archiveOpportunity = async (id: string) => {
    try {
      await convex.mutation(api.admin.archiveOpportunity, { id: id as any })
      toast.success('Opportunity archived')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to archive')
    }
  }

  const deleteOpportunity = async (id: string) => {
    if (!window.confirm('Delete this opportunity?')) return
    try {
      await convex.mutation(api.admin.deleteOpportunity, { id: id as any })
      toast.success('Opportunity deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    }
  }
</script>

<section class="space-y-6">
  <div class="flex items-end justify-between gap-4">
    <div>
      <h1 class="font-display text-3xl text-slate-950">Platform opportunities</h1>
      <p class="mt-2 text-sm text-slate-600">Manual opportunity entries managed across the platform.</p>
    </div>
    <a href="/admin/opportunities/new" class="rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-coral-600">
      Add opportunity
    </a>
  </div>

  <div class="space-y-3">
    {#each opportunities.data ?? [] as opportunity (opportunity._id)}
      <article class={`rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm ${opportunity.status === 'archived' ? 'opacity-60' : ''}`}>
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-slate-950">{opportunity.title}</h2>
              <span class="rounded-full border border-border px-3 py-1 text-xs font-medium text-slate-600">{opportunity.status}</span>
              <span class="rounded-full border border-border px-3 py-1 text-xs font-medium text-slate-600">{opportunity.source}</span>
            </div>
            <p class="mt-2 text-sm text-slate-600">
              {opportunity.organization} · {opportunity.location}{opportunity.isRemote ? ' · Remote' : ''}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Last verified {formatDistanceToNow(opportunity.lastVerified, { addSuffix: true })}
            </p>
          </div>
          <div class="flex gap-2">
            <a href={`/admin/opportunities/${opportunity._id}/edit`} class="rounded-full border border-border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Edit
            </a>
            {#if opportunity.status === 'active'}
              <button type="button" class="rounded-full border border-border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onclick={() => archiveOpportunity(opportunity._id)}>
                Archive
              </button>
            {/if}
            <button type="button" class="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white" onclick={() => deleteOpportunity(opportunity._id)}>
              Delete
            </button>
          </div>
        </div>
      </article>
    {/each}
  </div>
</section>
