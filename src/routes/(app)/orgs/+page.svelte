<script lang="ts">
  import { Building2, Compass, Globe2, MapPinned } from 'lucide-svelte'
  import { useQuery } from 'convex-svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import { api } from '$convex/_generated/api'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import OrgCard from '~/components/org/OrgCard.svelte'
  import OrgFilters from '~/components/org/OrgFilters.svelte'
  import OrgMap from '~/components/org/OrgMap.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  let searchQuery = $state('')
  let country = $state<string | undefined>(undefined)
  let selectedOrgId = $state<Id<'organizations'> | null>(null)

  const effectiveSearch = $derived(
    searchQuery.trim().length >= 2 ? searchQuery.trim() : undefined,
  )

  const orgs = useQuery(api.orgs.discovery.getAllOrgs, () => ({
    country,
    searchQuery: effectiveSearch,
  }))

  const orgList = $derived(orgs.data ?? [])
  const orgCountLabel = $derived(
    `${orgList.length} ${orgList.length === 1 ? 'organization' : 'organizations'}`,
  )
  const hasFilters = $derived(Boolean(searchQuery || country))

  $effect(() => {
    if (!orgList.length) {
      selectedOrgId = null
      return
    }

    if (!selectedOrgId || !orgList.some((org) => org._id === selectedOrgId)) {
      selectedOrgId = orgList[0]._id
    }
  })
</script>

<svelte:head>
  <title>Organizations | ASTN</title>
  <meta
    name="description"
    content="Discover AI safety organizations around the world through the ASTN directory."
  />
</svelte:head>

<GradientBg variant="subtle">
  <AuthHeader />

  <main class="container mx-auto px-4 py-6 lg:py-8">
    <section
      class="mb-6 overflow-hidden rounded-[2rem] border border-border/70 bg-white/88 shadow-warm-sm backdrop-blur"
    >
      <div class="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div class="relative p-6 md:p-8">
          <div
            class="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-coral-300 to-transparent"
          ></div>
          <div class="max-w-3xl">
            <p class="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-coral-600">
              Organization directory
            </p>
            <h1 class="font-display text-3xl text-slate-950 md:text-5xl">
              Find the hubs, labs, and communities shaping AI safety work.
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Browse the global network, narrow by country, and use the map to
              orient yourself before jumping into each organization’s page.
            </p>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <div class="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3">
              <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-coral-700">
                <Compass class="size-3.5" />
                Showing
              </div>
              <div class="mt-1 text-lg font-semibold text-slate-950">{orgCountLabel}</div>
            </div>
            <div class="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
              <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-teal-700">
                <Globe2 class="size-3.5" />
                Search tip
              </div>
              <div class="mt-1 text-sm font-medium text-slate-800">
                Search activates after 2 characters
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.72))] p-6 lg:border-t-0 lg:border-l md:p-8">
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-sm font-medium text-slate-700">
              <MapPinned class="size-4 text-coral-600" />
              Explore the network
            </div>
            <p class="text-sm leading-6 text-slate-600">
              Select an organization from the list to highlight it on the map.
              Use the “View organization” button to open the full public page.
            </p>
            {#if selectedOrgId}
              <div class="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm text-slate-600">
                Active selection:
                <span class="font-medium text-slate-900">
                  {orgList.find((org) => org._id === selectedOrgId)?.name ?? 'None'}
                </span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,38%)] xl:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
      <div class="order-2 min-w-0 lg:order-1">
        <OrgFilters
          {searchQuery}
          onSearchChange={(value) => {
            searchQuery = value
          }}
          {country}
          onCountryChange={(value) => {
            country = value
          }}
        />

        {#if orgs.isLoading}
          <div
            class="flex min-h-72 items-center justify-center rounded-[2rem] border border-border/70 bg-white/88 shadow-warm-sm"
          >
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <Spinner />
              Loading organizations...
            </div>
          </div>
        {:else if orgList.length === 0}
          <div
            class="rounded-[2rem] border border-dashed border-border/70 bg-white/80 px-6 py-14 text-center shadow-warm-sm"
          >
            <div
              class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-coral-50 text-coral-500"
            >
              <Building2 class="size-8" />
            </div>
            <h2 class="font-display text-xl text-slate-950">
              {hasFilters ? 'No organizations found' : 'No organizations yet'}
            </h2>
            <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              {#if hasFilters}
                Try a broader search or clear the country filter to widen the
                results.
              {:else}
                Organizations will appear here once they are added to the
                directory.
              {/if}
            </p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each orgList as org (org._id)}
              <OrgCard
                {org}
                variant="list"
                selected={selectedOrgId === org._id}
                onselect={(selectedOrg) => {
                  selectedOrgId = selectedOrg._id
                }}
              />
            {/each}
          </div>
        {/if}
      </div>

      <aside class="order-1 lg:order-2">
        <div class="sticky top-20 space-y-3">
          <div class="hidden lg:block">
            <OrgMap
              orgs={orgList}
              {selectedOrgId}
              onOrgSelect={(id) => {
                selectedOrgId = id
              }}
            />
          </div>

          <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-4 text-sm text-slate-600 shadow-warm-sm">
            <p class="font-medium text-slate-900">Map notes</p>
            <p class="mt-2 leading-6">
              Only organizations with saved coordinates appear on the map. The
              list still shows the full directory.
            </p>
          </div>
        </div>
      </aside>
    </section>
  </main>
</GradientBg>
