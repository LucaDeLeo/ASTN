<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { Search, X } from 'lucide-svelte'
  import {
    getCategoryOptions,
    LOCATION_OPTIONS,
    readOpportunitySearchParams,
    TYPE_OPTIONS,
    type OpportunitySearchParams,
  } from './filters'

  const search = $derived(readOpportunitySearchParams(page.url))
  const typeFilter = $derived(search.type ?? 'all')
  const roleFilter = $derived(search.role ?? 'all')
  const locationFilter = $derived(search.location ?? 'all')
  const searchTerm = $derived(search.q ?? '')
  const categoryOptions = $derived(
    getCategoryOptions(typeFilter !== 'all' ? typeFilter : undefined),
  )
  const hasActiveFilters = $derived(
    typeFilter !== 'all' ||
      roleFilter !== 'all' ||
      locationFilter !== 'all' ||
      searchTerm.trim() !== '',
  )

  const navigateWith = async (
    mutate: (params: URLSearchParams) => void,
  ) => {
    const params = new URLSearchParams(page.url.searchParams)
    mutate(params)

    const query = params.toString()
    await goto(query ? `/opportunities?${query}` : '/opportunities', {
      keepFocus: true,
      noScroll: true,
      replaceState: true,
    })
  }

  const updateFilter = async (
    key: keyof OpportunitySearchParams,
    value: string,
  ) => {
    await navigateWith((params) => {
      if (value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }

      if (key === 'type') {
        params.delete('role')
      }
    })
  }

  const clearFilters = async () => {
    await goto('/opportunities', {
      keepFocus: true,
      noScroll: true,
      replaceState: true,
    })
  }
</script>

<section class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
  <div class="container mx-auto px-4 py-4">
    <div class="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_180px_180px_auto] md:items-end">
      <label class="block">
        <span class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Search
        </span>
        <div class="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
          <Search class="size-4 text-muted-foreground" />
          <input
            type="search"
            value={searchTerm}
            placeholder="Search opportunities..."
            class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            oninput={(event) =>
              updateFilter('q', (event.currentTarget as HTMLInputElement).value)}
          />
        </div>
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Type
        </span>
        <select
          value={typeFilter}
          class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
          onchange={(event) =>
            updateFilter('type', (event.currentTarget as HTMLSelectElement).value)}
        >
          {#each TYPE_OPTIONS as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="block">
        <span class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Category
        </span>
        <select
          value={roleFilter}
          class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
          onchange={(event) =>
            updateFilter('role', (event.currentTarget as HTMLSelectElement).value)}
        >
          {#each categoryOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </label>

      <div class="grid gap-3 sm:grid-cols-[1fr_auto] md:grid-cols-[1fr_auto]">
        <label class="block">
          <span class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Location
          </span>
          <select
            value={locationFilter}
            class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
            onchange={(event) =>
              updateFilter('location', (event.currentTarget as HTMLSelectElement).value)}
          >
            {#each LOCATION_OPTIONS as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>

        <div class="flex items-end">
          {#if hasActiveFilters}
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-accent hover:text-foreground md:w-auto"
              onclick={clearFilters}
            >
              <X class="size-4" />
              Clear
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</section>
