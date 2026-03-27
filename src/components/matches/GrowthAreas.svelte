<script lang="ts">
  import { BookOpen, Briefcase, TrendingUp, Wrench } from 'lucide-svelte'
  import type { GrowthArea } from './types'

  const themeIcons: Record<string, any> = {
    'Skills to build': Wrench,
    'Experience to gain': Briefcase,
    'Knowledge to deepen': BookOpen,
  }

  let {
    areas = [],
    hideHeader = false,
  }: {
    areas?: GrowthArea[]
    hideHeader?: boolean
  } = $props()
</script>

{#if areas.length > 0}
  <section class="rounded-[1.75rem] border border-border/70 bg-slate-50 p-6 shadow-warm-sm">
    {#if !hideHeader}
      <div class="mb-4 flex items-center gap-2">
        <TrendingUp class="size-5 text-coral-600" />
        <h2 class="text-lg font-semibold text-slate-950">Your Growth Areas</h2>
      </div>
      <p class="mb-4 text-sm text-slate-600">
        Based on your matches, these are the areas worth strengthening next.
      </p>
    {/if}

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each areas as area}
        {@const Icon = themeIcons[area.theme] ?? TrendingUp}
        <div class="rounded-2xl border border-border/70 bg-white p-4">
          <div class="mb-2 flex items-center gap-2">
            <Icon class="size-4 text-slate-400" />
            <h3 class="font-medium text-slate-950">{area.theme}</h3>
          </div>

          <ul class="space-y-2 text-sm leading-6 text-slate-600">
            {#each area.items as item}
              <li class="flex items-start gap-2">
                <span class="text-coral-500">-</span>
                <span>{item}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </section>
{/if}
