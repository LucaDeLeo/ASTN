<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import OpportunityDetail from '~/components/opportunities/opportunity-detail.svelte'

  const opportunity = useQuery(api.opportunities.get, () => ({
    id: page.params.id as Id<'opportunities'>,
  }))
</script>

<svelte:head>
  <title>Opportunity | ASTN</title>
</svelte:head>

<GradientBg variant="subtle">
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if opportunity.isLoading}
      <div class="flex min-h-[50vh] items-center justify-center">
        <div class="size-6 animate-spin rounded-full border-2 border-border border-t-coral-500"></div>
      </div>
    {:else if opportunity.data}
      <OpportunityDetail opportunity={opportunity.data} />
    {:else}
      <div class="mx-auto max-w-2xl rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <h1 class="font-display text-3xl text-slate-950">Opportunity not found</h1>
        <p class="mt-3 text-slate-600">
          This listing may have been removed or the link is incorrect.
        </p>
        <a
          href="/opportunities"
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          Browse opportunities
        </a>
      </div>
    {/if}
  </main>
</GradientBg>
