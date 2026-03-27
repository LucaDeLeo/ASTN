<script lang="ts">
  import {
    Bookmark,
    BookmarkMinus,
    Check,
    Clock3,
    X,
  } from 'lucide-svelte'
  import {
    computeGlobalFitScore,
    getFitScoreColor,
  } from '$lib/matchScoring'
  import { formatLocation } from '$lib/formatLocation'
  import {
    formatDeadline,
    formatPostedAt,
    getDeadlineUrgency,
    getPostedAtColor,
  } from '$lib/formatDeadline'
  import { ROLE_TYPE_COLORS } from '$lib/roleTypes'
  import type { MatchSummary } from './types'

  const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior',
    lead: 'Lead',
  }

  let {
    match,
    isSaved = false,
    onSave,
    onUnsave,
    onDismiss,
  }: {
    match: MatchSummary
    isSaved?: boolean
    onSave?: () => void | Promise<void>
    onUnsave?: () => void | Promise<void>
    onDismiss?: () => void | Promise<void>
  } = $props()

  const roleColorClass = $derived(
    ROLE_TYPE_COLORS[match.opportunity.roleType] ?? ROLE_TYPE_COLORS.other,
  )
  const fitScore = $derived(computeGlobalFitScore(match.tier, match.score))

  const stopAndRun = async (
    event: MouseEvent,
    work?: () => void | Promise<void>,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    await work?.()
  }
</script>

<a
  href={`/matches/${match._id}`}
  class="group block rounded-[1.5rem] border border-border/70 bg-white/92 p-4 shadow-warm-sm transition duration-200 hover:-translate-y-0.5 hover:border-coral-200 hover:shadow-md"
>
  <div class="mb-3 flex flex-wrap items-center gap-2">
    <span class={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${roleColorClass}`}>
      {match.opportunity.roleType}
    </span>

    {#if match.opportunity.isRemote}
      <span class="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
        Remote
      </span>
    {/if}

    {#if isSaved}
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        onclick={(event) => stopAndRun(event, onUnsave)}
      >
        <BookmarkMinus class="size-3.5" />
        Saved
      </button>
    {:else if onSave}
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        onclick={(event) => stopAndRun(event, onSave)}
      >
        <Bookmark class="size-3.5" />
        Save
      </button>
    {/if}

    {#if match.isNew}
      <span class="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">
        New
      </span>
    {/if}

    {#if match.appliedAt}
      <span class="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
        <Check class="size-3.5" />
        Applied
      </span>
    {/if}

    <span class={`ml-auto text-xs font-semibold tabular-nums ${getFitScoreColor(fitScore)}`}>
      {fitScore}% fit
    </span>
  </div>

  <h3 class="text-lg font-semibold text-slate-950 transition group-hover:text-coral-700">
    {match.opportunity.title}
  </h3>
  <p class="mt-1 text-sm text-slate-600">
    {match.opportunity.organization} · {formatLocation(match.opportunity.location)}
  </p>

  {#if match.explanation.strengths[0]}
    <p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
      {match.explanation.strengths[0]}
    </p>
  {/if}

  <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
    {#if match.opportunity.deadline}
      <span class={`flex items-center gap-1.5 font-medium ${getDeadlineUrgency(match.opportunity.deadline)}`}>
        <Clock3 class="size-4" />
        {formatDeadline(match.opportunity.deadline)}
      </span>
    {:else if match.opportunity.postedAt && match.opportunity.opportunityType !== 'event'}
      <span class={`flex items-center gap-1.5 ${getPostedAtColor(match.opportunity.postedAt)}`}>
        <Clock3 class="size-4" />
        {formatPostedAt(match.opportunity.postedAt)}
      </span>
    {/if}

    {#if match.opportunity.salaryRange && match.opportunity.salaryRange !== 'Not Found'}
      <span class="text-slate-600">{match.opportunity.salaryRange}</span>
    {/if}

    {#if match.opportunity.experienceLevel && EXPERIENCE_LEVEL_LABELS[match.opportunity.experienceLevel]}
      <span class="text-slate-600">
        {EXPERIENCE_LEVEL_LABELS[match.opportunity.experienceLevel]}
      </span>
    {/if}
  </div>

  {#if onDismiss}
    <div class="mt-4 flex justify-end">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
        onclick={(event) => stopAndRun(event, onDismiss)}
      >
        <X class="size-3.5" />
        Dismiss
      </button>
    </div>
  {/if}
</a>
