<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import Empty from '~/components/ui/empty.svelte'
  import OpportunityCard from './opportunity-card.svelte'

  type Opportunity = {
    _id: Id<'opportunities'>
    title: string
    organization: string
    location: string
    isRemote: boolean
    roleType: string
    experienceLevel?: string
    salaryRange?: string
    deadline?: number
    opportunityType?: string
    eventType?: string
    startDate?: number
  }

  let {
    opportunities = [],
    isLoading = false,
    hasFilters = false,
    emptyAction,
  }: {
    opportunities?: Opportunity[]
    isLoading?: boolean
    hasFilters?: boolean
    emptyAction?: Snippet
  } = $props()
</script>

{#if isLoading}
  <div class="space-y-4">
    {#each Array.from({ length: 5 }) as _, index}
      <div
        class="animate-pulse rounded-2xl border border-slate-200 bg-white/85 p-5"
        style={`animation-delay: ${index * 80}ms;`}
      >
        <div class="mb-3 flex gap-2">
          <div class="h-5 w-20 rounded-full bg-slate-200"></div>
          <div class="h-5 w-16 rounded-full bg-slate-200"></div>
        </div>
        <div class="h-5 w-3/4 rounded bg-slate-200"></div>
        <div class="mt-2 h-4 w-1/2 rounded bg-slate-200"></div>
        <div class="mt-4 h-4 w-2/3 rounded bg-slate-200"></div>
      </div>
    {/each}
  </div>
{:else if opportunities.length === 0}
  <Empty
    variant={hasFilters ? 'no-results' : 'no-opportunities'}
    class="rounded-[2rem] border border-border/70 bg-white/88 py-16 shadow-warm-sm"
  >
    {#if hasFilters && emptyAction}
      {#snippet children()}
        {@render emptyAction()}
      {/snippet}
    {/if}
  </Empty>
{:else}
  <div class="space-y-4">
    {#each opportunities as opportunity, index (opportunity._id)}
      <div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <OpportunityCard {opportunity} {index} />
      </div>
    {/each}
  </div>
{/if}
