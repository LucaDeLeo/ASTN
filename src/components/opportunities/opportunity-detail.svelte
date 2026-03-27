<script lang="ts">
  import { format, formatDistanceToNow } from 'date-fns'
  import {
    BadgeCheck,
    Briefcase,
    Building2,
    Calendar,
    Clock3,
    ExternalLink,
    MapPin,
    Wallet,
  } from 'lucide-svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import { formatLocation } from '$lib/formatLocation'
  import { renderMarkdown } from '$lib/render-markdown'
  import { ROLE_TYPE_COLORS } from '$lib/roleTypes'

  type Opportunity = {
    _id: Id<'opportunities'>
    title: string
    organization: string
    organizationLogoUrl?: string
    location: string
    isRemote: boolean
    roleType: string
    experienceLevel?: string
    description: string
    requirements?: string[]
    salaryRange?: string
    deadline?: number
    sourceUrl: string
    source: '80k_hours' | 'aisafety_com' | 'aisafety_events' | 'manual'
    alternateSources?: Array<{
      sourceId: string
      source: string
      sourceUrl: string
    }>
    lastVerified: number
    createdAt: number
  }

  const SOURCE_NAMES: Record<string, string> = {
    '80k_hours': '80,000 Hours',
    aisafety_com: 'aisafety.com',
    aisafety_events: 'aisafety.com (Events)',
    manual: 'Direct submission',
  }

  let { opportunity }: { opportunity: Opportunity } = $props()

  const roleColorClass = $derived(
    ROLE_TYPE_COLORS[opportunity.roleType] ?? ROLE_TYPE_COLORS.other,
  )
  const descriptionHtml = $derived(renderMarkdown(opportunity.description))
</script>

<div class="mx-auto max-w-4xl">
  <section class="mb-6 rounded-[2rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm sm:p-6">
    <div class="flex flex-col gap-5 sm:flex-row">
      {#if opportunity.organizationLogoUrl}
        <img
          src={opportunity.organizationLogoUrl}
          alt={`${opportunity.organization} logo`}
          class="size-16 rounded-2xl border border-border bg-muted object-contain"
        />
      {:else}
        <div class="grid size-16 place-items-center rounded-2xl border border-border bg-muted">
          <Building2 class="size-8 text-muted-foreground" />
        </div>
      {/if}

      <div class="min-w-0 flex-1">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <h1 class="font-display text-3xl leading-tight text-slate-950">
              {opportunity.title}
            </h1>
            <p class="mt-1 text-lg text-slate-600">{opportunity.organization}</p>
          </div>

          <span class={`inline-flex self-start rounded-full border px-3 py-1 text-xs font-medium capitalize ${roleColorClass}`}>
            {opportunity.roleType}
          </span>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
          <span class="flex items-center gap-1.5">
            <MapPin class="size-4" />
            {formatLocation(opportunity.location)}
          </span>

          {#if opportunity.isRemote}
            <span class="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
              Remote
            </span>
          {/if}

          {#if opportunity.experienceLevel}
            <span class="flex items-center gap-1.5">
              <Briefcase class="size-4" />
              {opportunity.experienceLevel.charAt(0).toUpperCase() +
                opportunity.experienceLevel.slice(1)} level
            </span>
          {/if}

          {#if opportunity.salaryRange && opportunity.salaryRange !== 'Not Found'}
            <span class="flex items-center gap-1.5">
              <Wallet class="size-4" />
              {opportunity.salaryRange}
            </span>
          {/if}

          {#if opportunity.deadline}
            <span class="flex items-center gap-1.5">
              <Clock3 class="size-4" />
              Deadline: {format(opportunity.deadline, 'MMM d, yyyy')}
            </span>
          {/if}
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
          >
            Apply now
            <ExternalLink class="size-4" />
          </a>
          <a
            href="/opportunities"
            class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Back to opportunities
          </a>
        </div>
      </div>
    </div>
  </section>

  <section class="mb-6 rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <h2 class="mb-4 text-xl font-semibold text-slate-950">About this role</h2>
    <div class="prose prose-slate max-w-none text-slate-700">
      {@html descriptionHtml}
    </div>
  </section>

  {#if opportunity.requirements?.length}
    <section class="mb-6 rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <h2 class="mb-4 text-xl font-semibold text-slate-950">Requirements</h2>
      <ul class="space-y-3 text-slate-700">
        {#each opportunity.requirements as requirement}
          <li class="flex gap-3">
            <BadgeCheck class="mt-0.5 size-4 shrink-0 text-coral-600" />
            <span>{requirement}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="rounded-[2rem] border border-border/70 bg-white/92 p-5 text-sm text-slate-600 shadow-warm-sm">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2">
        <Calendar class="size-4 shrink-0" />
        Last verified {formatDistanceToNow(opportunity.lastVerified, { addSuffix: true })}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span>Source:</span>
        <a
          href={opportunity.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-coral-700 hover:underline"
        >
          {SOURCE_NAMES[opportunity.source] ?? opportunity.source}
        </a>

        {#if opportunity.alternateSources?.length}
          <span class="text-slate-300">|</span>
          <span>Also on:</span>
          {#each opportunity.alternateSources as source}
            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-coral-700 hover:underline"
            >
              {SOURCE_NAMES[source.source] ?? source.source}
            </a>
          {/each}
        {/if}
      </div>
    </div>
  </section>
</div>
