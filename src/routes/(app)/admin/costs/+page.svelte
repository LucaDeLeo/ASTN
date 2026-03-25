<script lang="ts">
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  type Range = '7d' | '30d' | '90d' | 'all'

  const rangeDays: Record<Range, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    all: 730,
  }

  const granularity: Record<Range, 'day' | 'week' | 'month'> = {
    '7d': 'day',
    '30d': 'day',
    '90d': 'week',
    all: 'month',
  }

  let range = $state<Range>('30d')

  const timeBounds = $derived.by(() => {
    const endTime = Date.now()
    return {
      startTime: endTime - rangeDays[range] * 86_400_000,
      endTime,
    }
  })

  const overall = useQuery(api.platformAdmin.llmCosts.getOverallStats, () => ({
    ...timeBounds,
  }))
  const byModel = useQuery(api.platformAdmin.llmCosts.getCostByModel, () => ({
    ...timeBounds,
  }))
  const byOperation = useQuery(api.platformAdmin.llmCosts.getCostByOperation, () => ({
    ...timeBounds,
  }))
  const timeSeries = useQuery(api.platformAdmin.llmCosts.getCostTimeSeries, () => ({
    ...timeBounds,
    granularity: granularity[range],
  }))

  const byModelEntries = $derived((byModel.data ?? []) as Array<any>)
  const byOperationEntries = $derived((byOperation.data ?? []) as Array<any>)
  const timeSeriesEntries = $derived((timeSeries.data ?? []) as Array<any>)

  const maxOperationCost = $derived(
    Math.max(1, ...byOperationEntries.map((entry) => Number(entry.costUsd ?? 0))),
  )
  const maxBucketCost = $derived(
    Math.max(1, ...timeSeriesEntries.map((entry) => Number(entry.totalCostUsd ?? 0))),
  )

  const formatUsd = (value: number | undefined) => `$${(value ?? 0).toFixed(2)}`
</script>

<section class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="font-display text-3xl text-slate-950">LLM costs</h1>
      <p class="mt-2 text-sm text-slate-600">Spend and usage across matching, chat, extraction, and admin workflows.</p>
    </div>
    <div class="flex gap-2 rounded-full border border-border bg-white p-1">
      {#each Object.keys(rangeDays) as option}
        <button
          type="button"
          class={`rounded-full px-3 py-1.5 text-sm transition ${
            range === option ? 'bg-slate-950 text-white' : 'text-slate-600'
          }`}
          onclick={() => (range = option as Range)}
        >
          {option}
        </button>
      {/each}
    </div>
  </div>

  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
      <p class="text-sm text-slate-500">Total spend</p>
      <p class="mt-3 text-3xl font-semibold text-slate-950">{formatUsd(overall.data?.totalCostUsd)}</p>
    </div>
    <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
      <p class="text-sm text-slate-500">Calls</p>
      <p class="mt-3 text-3xl font-semibold text-slate-950">{overall.data?.totalCalls ?? 0}</p>
    </div>
    <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
      <p class="text-sm text-slate-500">Avg cost / call</p>
      <p class="mt-3 text-3xl font-semibold text-slate-950">{formatUsd(overall.data?.avgCostPerCallUsd)}</p>
    </div>
    <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
      <p class="text-sm text-slate-500">Top operation</p>
      <p class="mt-3 text-lg font-semibold text-slate-950">{overall.data?.mostExpensiveOperation ?? '—'}</p>
      <p class="mt-1 text-sm text-slate-500">{formatUsd(overall.data?.mostExpensiveOperationCostUsd)}</p>
    </div>
  </div>

  <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <h2 class="text-lg font-semibold text-slate-950">Cost over time</h2>
      <div class="mt-5 space-y-3">
        {#each timeSeriesEntries as bucket (bucket.periodStart)}
          <div>
            <div class="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>{bucket.periodLabel}</span>
              <span>{formatUsd(bucket.totalCostUsd)}</span>
            </div>
            <div class="h-3 rounded-full bg-slate-100">
              <div class="h-3 rounded-full bg-coral-500" style={`width:${Math.max(4, (bucket.totalCostUsd / maxBucketCost) * 100)}%`}></div>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <h2 class="text-lg font-semibold text-slate-950">By model</h2>
      <div class="mt-5 space-y-3">
        {#each byModelEntries as model (model.model)}
          <div class="rounded-2xl bg-slate-50 px-4 py-3">
            <div class="flex items-center justify-between gap-3">
              <p class="font-medium text-slate-950">{model.displayName}</p>
              <p class="text-sm text-slate-600">{formatUsd(model.costUsd)}</p>
            </div>
            <p class="mt-1 text-xs text-slate-500">{model.callCount} calls · {model.totalInputTokens + model.totalOutputTokens} tokens</p>
          </div>
        {/each}
      </div>
    </section>
  </div>

  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <h2 class="text-lg font-semibold text-slate-950">By operation</h2>
    <div class="mt-5 space-y-3">
      {#each byOperationEntries as operation (operation.operation)}
        <div>
          <div class="mb-1 flex items-center justify-between text-sm text-slate-700">
            <span>{operation.label}</span>
            <span>{formatUsd(operation.costUsd)}</span>
          </div>
          <div class="h-3 rounded-full bg-slate-100">
            <div class="h-3 rounded-full bg-slate-900" style={`width:${Math.max(4, (operation.costUsd / maxOperationCost) * 100)}%`}></div>
          </div>
        </div>
      {/each}
    </div>
  </section>
</section>
