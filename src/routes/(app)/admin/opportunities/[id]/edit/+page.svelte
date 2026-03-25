<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import OpportunityEditor from '~/components/platform-admin/OpportunityEditor.svelte'

  const id = $derived(page.params.id as any)
  const opportunity = useQuery(api.opportunities.get, () => ({ id }))
</script>

<section class="space-y-6">
  <div>
    <h1 class="font-display text-3xl text-slate-950">Edit opportunity</h1>
    <p class="mt-2 text-sm text-slate-600">Update the opportunity record and archive status.</p>
  </div>

  {#if opportunity.data}
    <OpportunityEditor mode="edit" initialData={opportunity.data} />
  {:else if opportunity.isLoading}
    <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">Loading opportunity…</div>
  {:else}
    <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">Opportunity not found.</div>
  {/if}
</section>
