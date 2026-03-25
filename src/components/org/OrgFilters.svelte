<script lang="ts">
  import { useQuery } from 'convex-svelte'
  import { MapPin, Search, X } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'

  let {
    searchQuery,
    onSearchChange,
    country,
    onCountryChange,
  }: {
    searchQuery: string
    onSearchChange: (value: string) => void
    country?: string
    onCountryChange: (value: string | undefined) => void
  } = $props()

  const countries = useQuery(api.orgs.discovery.getOrgCountries, () => ({}))
  const hasFilters = $derived(Boolean(searchQuery || country))
</script>

<div class="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
  <label
    class="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border/70 bg-white/90 px-4 py-3 shadow-warm-sm"
  >
    <Search class="size-4 shrink-0 text-slate-400" />
    <input
      type="text"
      value={searchQuery}
      placeholder="Search organizations..."
      class="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
      oninput={(event) =>
        onSearchChange((event.currentTarget as HTMLInputElement).value)}
    />
  </label>

  <label
    class="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/90 px-4 py-3 shadow-warm-sm lg:w-60"
  >
    <MapPin class="size-4 shrink-0 text-slate-400" />
    <select
      class="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
      value={country ?? ''}
      onchange={(event) => {
        const value = (event.currentTarget as HTMLSelectElement).value
        onCountryChange(value || undefined)
      }}
    >
      <option value="">All countries</option>
      {#each countries.data ?? [] as item}
        <option value={item}>{item}</option>
      {/each}
    </select>
  </label>

  {#if hasFilters}
    <button
      type="button"
      class="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-white/90 px-4 text-sm font-medium text-slate-700 shadow-warm-sm transition-colors hover:border-coral-300 hover:bg-coral-50 hover:text-coral-800"
      onclick={() => {
        onSearchChange('')
        onCountryChange(undefined)
      }}
    >
      <X class="size-4" />
      Clear
    </button>
  {/if}
</div>

