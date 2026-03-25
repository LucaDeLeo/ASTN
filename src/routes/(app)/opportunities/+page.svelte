<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { useIsMobile } from '$lib/stores/media-query.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import MobileShell from '~/components/layout/mobile-shell.svelte'
  import OpportunityFilters from '~/components/opportunities/opportunity-filters.svelte'
  import OpportunityList from '~/components/opportunities/opportunity-list.svelte'
  import PullToRefresh from '~/components/ui/pull-to-refresh.svelte'
  import {
    getFilterParams,
    readOpportunitySearchParams,
  } from '~/components/opportunities/filters'

  const LIST_LIMIT = 50
  const SEARCH_LIMIT = 50

  type SearchOpportunity = {
    opportunityType?: string
    eventType?: string
    roleType: string
    isRemote: boolean
    title: string
  }

  const clerkContext = getClerkContext()
  const isMobile = useIsMobile()

  const search = $derived(readOpportunitySearchParams(page.url))
  const filters = $derived(getFilterParams(search))
  const searchTerm = $derived(search.q?.trim() ?? '')
  const hasFilters = $derived(
    Boolean(searchTerm || search.type || search.role || search.location),
  )
  const searchRoleType = $derived(
    search.type === 'event' ? undefined : filters.roleType,
  )
  const mobileUser = $derived(
    clerkContext.currentUser
      ? {
          name:
            clerkContext.currentUser.firstName ??
            clerkContext.currentUser.fullName ??
            'User',
        }
      : null,
  )

  const listQuery = useQuery(api.opportunities.list, () =>
    searchTerm
      ? 'skip'
      : {
          ...filters,
          limit: LIST_LIMIT,
        },
  )

  const searchQuery = useQuery(api.opportunities.search, () =>
    searchTerm
      ? {
          searchTerm,
          roleType: searchRoleType,
          isRemote: filters.isRemote,
          limit: SEARCH_LIMIT,
        }
      : 'skip',
  )

  const opportunities = $derived.by(() => {
    const base = searchTerm ? searchQuery.data ?? [] : listQuery.data ?? []

    if (!searchTerm) {
      return base
    }

    return base.filter((opportunity: SearchOpportunity) => {
      if (
        filters.opportunityType === 'job' &&
        opportunity.opportunityType === 'event'
      ) {
        return false
      }

      if (
        filters.opportunityType === 'event' &&
        opportunity.opportunityType !== 'event'
      ) {
        return false
      }

      if (filters.eventType && opportunity.eventType !== filters.eventType) {
        return false
      }

      return true
    })
  })

  const isLoading = $derived(searchTerm ? searchQuery.isLoading : listQuery.isLoading)

  const clearFilters = async () => {
    await goto('/opportunities')
  }

  const handleRefresh = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
</script>

<svelte:head>
  <title>Opportunities | ASTN</title>
</svelte:head>

{#snippet listEmptyAction()}
  <button
    type="button"
    class="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
    onclick={clearFilters}
  >
    Clear filters
  </button>
{/snippet}

{#snippet content()}
  <OpportunityFilters />

  <main class="container mx-auto px-4 py-8">
    <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="font-display text-3xl text-slate-950">Opportunities</h1>
        <p class="mt-1 text-sm text-slate-600">
          {opportunities.length}
          {' '}
          {opportunities.length === 1 ? 'opportunity' : 'opportunities'}
          {#if searchTerm}
            {' '}matching "{searchTerm}"
          {/if}
        </p>
      </div>
    </div>

    <PullToRefresh onRefresh={handleRefresh} class="min-h-[200px]">
      <OpportunityList
        {isLoading}
        opportunities={opportunities}
        {hasFilters}
        emptyAction={listEmptyAction}
      />
    </PullToRefresh>
  </main>
{/snippet}

{#if $isMobile}
  <MobileShell user={mobileUser}>
    <GradientBg variant="subtle">
      {@render content()}
    </GradientBg>
  </MobileShell>
{:else}
  <GradientBg variant="subtle">
    <AuthHeader />
    {@render content()}
  </GradientBg>
{/if}
