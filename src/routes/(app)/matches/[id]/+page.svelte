<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { format } from 'date-fns'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    AlertTriangle,
    ArrowLeft,
    Bookmark,
    Check,
    CheckCircle2,
    Clock3,
    Compass,
    ExternalLink,
    Lightbulb,
    MapPin,
    Sparkles,
    ThumbsUp,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import { formatDeadline, formatPostedAt } from '$lib/formatDeadline'
  import { renderMarkdown } from '$lib/render-markdown'
  import { formatLocation } from '$lib/formatLocation'
  import type { MatchDetail } from '~/components/matches/types'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import { ROLE_TYPE_COLORS } from '$lib/roleTypes'

  const clerkContext = getClerkContext()
  const convex = useConvexClient()

  const tierConfig = {
    great: {
      label: 'Great match',
      color: 'bg-emerald-100 text-emerald-800',
      icon: Sparkles,
    },
    good: {
      label: 'Good match',
      color: 'bg-blue-100 text-blue-800',
      icon: ThumbsUp,
    },
    exploring: {
      label: 'Worth exploring',
      color: 'bg-amber-100 text-amber-800',
      icon: Compass,
    },
  } as const

  const matchQuery = useQuery(api.matches.getMatchById, () => ({
    matchId: page.params.id as Id<'matches'>,
  }))

  const match = $derived(matchQuery.data as MatchDetail | null | undefined)
  const descriptionHtml = $derived(match ? renderMarkdown(match.opportunity.description) : '')
  const roleColorClass = $derived(
    match
      ? (ROLE_TYPE_COLORS[match.opportunity.roleType] ?? ROLE_TYPE_COLORS.other)
      : ROLE_TYPE_COLORS.other,
  )

  $effect(() => {
    if (clerkContext.isClerkLoaded && !clerkContext.currentUser) {
      void goto('/login')
    }
  })

  $effect(() => {
    if (!match) {
      return
    }

    posthogStore.capture('match_detail_viewed', {
      match_id: match._id,
      opportunity_title: match.opportunity.title,
      organization: match.opportunity.organization,
      tier: match.tier,
      is_applied: Boolean(match.appliedAt),
      is_saved: match.status === 'saved',
    })
  })

  const toggleApplied = async () => {
    if (!match) return

    try {
      const wasApplied = Boolean(match.appliedAt)
      await convex.mutation(api.matches.markAsApplied, { matchId: match._id })

      if (!wasApplied) {
        toast.success('Application tracked')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update application status')
    }
  }

  const toggleSaved = async () => {
    if (!match) return

    try {
      await convex.mutation(api.matches.saveMatch, { matchId: match._id })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update saved state')
    }
  }
</script>

<svelte:head>
  <title>Match detail | ASTN</title>
</svelte:head>

<GradientBg variant="subtle">
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if !clerkContext.isClerkLoaded || matchQuery.isLoading}
      <div class="flex min-h-[50vh] items-center justify-center">
        <div class="size-6 animate-spin rounded-full border-2 border-border border-t-coral-500"></div>
      </div>
    {:else if !match}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
        <h1 class="font-display text-3xl text-slate-950">Match not found</h1>
        <p class="mt-3 text-slate-600">
          This match may have been updated or removed.
        </p>
        <a
          href="/matches"
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          Back to matches
        </a>
      </div>
    {:else}
      {@const tier = tierConfig[match.tier]}
      {@const TierIcon = tier.icon}
      <div class="mx-auto max-w-3xl">
        <a
          href="/matches"
          class="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft class="size-4" />
          Back to matches
        </a>

        <section class="mb-6 rounded-[2rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm sm:p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span class={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tier.color}`}>
                  <TierIcon class="size-3.5" />
                  {tier.label}
                </span>
                {#if match.isNew}
                  <span class="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800">
                    New
                  </span>
                {/if}
              </div>

              <h1 class="font-display text-3xl leading-tight text-slate-950">
                {match.opportunity.title}
              </h1>
              <p class="mt-1 text-lg text-slate-600">{match.opportunity.organization}</p>

              <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                <span class="flex items-center gap-1.5">
                  <MapPin class="size-4" />
                  {formatLocation(match.opportunity.location)}
                </span>
                {#if match.opportunity.isRemote}
                  <span class="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                    Remote
                  </span>
                {/if}
                {#if match.opportunity.salaryRange && match.opportunity.salaryRange !== 'Not Found'}
                  <span>{match.opportunity.salaryRange}</span>
                {/if}
                {#if match.opportunity.experienceLevel}
                  <span class={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${roleColorClass}`}>
                    {match.opportunity.experienceLevel}
                  </span>
                {/if}
              </div>
            </div>

            <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
              <a
                href={match.opportunity.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
              >
                <ExternalLink class="size-4" />
                Apply
              </a>
              <button
                type="button"
                class={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  match.appliedAt
                    ? 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100'
                    : 'border-border text-foreground hover:bg-accent'
                }`}
                onclick={toggleApplied}
              >
                <Check class="size-4" />
                {match.appliedAt ? 'Applied' : 'Mark as applied'}
              </button>
              <button
                type="button"
                class={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  match.status === 'saved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-border text-foreground hover:bg-accent'
                }`}
                onclick={toggleSaved}
              >
                <Bookmark class="size-4" />
                {match.status === 'saved' ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </section>

        {#if match.opportunity.deadline || match.opportunity.postedAt}
          <div class="mb-6 rounded-xl border border-border/70 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-warm-sm">
            {#if match.opportunity.deadline}
              <div class="flex items-center gap-2">
                <Clock3 class="size-4 shrink-0" />
                <span>
                  {formatDeadline(match.opportunity.deadline)} · {format(match.opportunity.deadline, 'EEEE, MMM d')}
                </span>
              </div>
            {:else if match.opportunity.postedAt}
              <div class="flex items-center gap-2">
                <Clock3 class="size-4 shrink-0" />
                <span>{formatPostedAt(match.opportunity.postedAt)}</span>
              </div>
            {/if}
          </div>
        {/if}

        <section class="mb-6 rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <h2 class="mb-4 text-xl font-semibold text-slate-950">About this opportunity</h2>
          <div class="prose prose-slate max-w-none">
            {@html descriptionHtml}
          </div>

          {#if match.opportunity.requirements?.length}
            <div class="mt-6 border-t border-border/70 pt-4">
              <h3 class="mb-3 font-medium text-slate-950">Requirements</h3>
              <ul class="space-y-2 text-slate-600">
                {#each match.opportunity.requirements as requirement}
                  <li class="flex items-start gap-2">
                    <span class="text-slate-400">-</span>
                    <span>{requirement}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </section>

        <section class="mb-6 rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-950">
            <CheckCircle2 class="size-5 text-emerald-500" />
            Why this fits you
          </h2>

          <ul class="space-y-3">
            {#each match.explanation.strengths as strength}
              <li class="flex items-start gap-3">
                <span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-600">
                  +
                </span>
                <span class="text-slate-700">{strength}</span>
              </li>
            {/each}
          </ul>

          {#if match.explanation.gap}
            <div class="mt-6 border-t border-border/70 pt-4">
              <h3 class="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <AlertTriangle class="size-4 text-amber-500" />
                To strengthen your application
              </h3>
              <p class="pl-6 text-slate-600">{match.explanation.gap}</p>
            </div>
          {/if}
        </section>

        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-950">
            <Lightbulb class="size-5 text-coral-600" />
            Recommendations
          </h2>

          <div class="space-y-4">
            {#each match.recommendations as recommendation}
              <div
                class={`flex items-start gap-3 rounded-xl p-3 ${
                  recommendation.type === 'specific' ? 'bg-coral-50' : 'bg-slate-50'
                }`}
              >
                <span
                  class={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${
                    recommendation.priority === 'high'
                      ? 'border-coral-300 text-coral-700'
                      : recommendation.priority === 'medium'
                        ? 'border-blue-300 text-blue-700'
                        : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {recommendation.type === 'specific'
                    ? 'For this role'
                    : recommendation.type}
                </span>
                <span class="text-slate-700">{recommendation.action}</span>
              </div>
            {/each}
          </div>
        </section>

        <div class="mt-6 rounded-xl border border-dashed border-border/70 bg-white/75 px-4 py-3 text-sm text-slate-600">
          <span class="font-medium text-slate-900">Deferred for later phase:</span>
          {' '}the AI discussion sidebar for match review still depends on the
          Svelte agent adapter work planned in Phase 6.
        </div>
      </div>
    {/if}
  </main>
</GradientBg>
