<script lang="ts">
  import { goto } from '$app/navigation'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    AlertTriangle,
    Bookmark,
    Check,
    Lock,
    RefreshCw,
    Sparkles,
    Target,
    TrendingUp,
    User,
  } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import { useIsMobile } from '$lib/stores/media-query.svelte'
  import { SORT_OPTIONS, sortMatches, type MatchSortOrder } from '$lib/matchScoring'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import MobileShell from '~/components/layout/mobile-shell.svelte'
  import SwipeableCard from '~/components/gestures/swipeable-card.svelte'
  import AppliedMatchesGrid from '~/components/matches/AppliedMatchesGrid.svelte'
  import GrowthAreas from '~/components/matches/GrowthAreas.svelte'
  import MatchCard from '~/components/matches/MatchCard.svelte'
  import SavedMatchesGrid from '~/components/matches/SavedMatchesGrid.svelte'
  import type { GrowthArea, MatchSummary } from '~/components/matches/types'
  import CollapsibleSection from '~/components/ui/collapsible-section.svelte'
  import Empty from '~/components/ui/empty.svelte'
  import PullToRefresh from '~/components/ui/pull-to-refresh.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  const STALE_PROGRESS_MS = 10 * 60 * 1000
  const PAGE_SIZE = 12

  type MatchProgress = {
    totalBatches: number
    completedBatches: number
    totalOpportunities: number
    startedAt: number
  }

  type MatchesData = {
    matches: {
      great: MatchSummary[]
      good: MatchSummary[]
      exploring: MatchSummary[]
    }
    savedMatches: MatchSummary[]
    appliedMatches?: MatchSummary[]
    allRecommendations?: Array<{ type: string; action: string }>
    computedAt?: number | null
    matchesStaleAt?: number | null
    needsProfile: boolean
    needsComputation?: boolean
    needsCompleteness?: boolean
    hasExistingMatches?: boolean
    completeness?: {
      completedCount: number
      totalCount: number
      missingRequired: string[]
      sectionsNeeded: number
    }
  } | null

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const isMobile = useIsMobile()

  const matchesData = useQuery(api.matches.getMyMatches)
  const matchProgress = useQuery(api.matches.getMatchProgress)

  let sortOrder = $state<MatchSortOrder>('combined')
  let visibleCount = $state(PAGE_SIZE)
  let isTriggering = $state(false)
  let computeError = $state<string | null>(null)
  let retryAfter = $state<number | null>(null)
  let hasAutoTriggered = $state(false)
  let hasMarkedViewed = $state(false)
  let now = $state(Date.now())

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

  const progress = $derived(matchProgress.data as MatchProgress | null | undefined)
  const data = $derived(matchesData.data as MatchesData | undefined)
  const savedMatches = $derived(data?.savedMatches ?? [])
  const appliedMatches = $derived(data?.appliedMatches ?? [])
  const allActiveMatches = $derived(
    data
      ? [...data.matches.great, ...data.matches.good, ...data.matches.exploring]
      : [],
  )
  const visibleMatches = $derived.by(() => {
    const excludeIds = new Set([
      ...savedMatches.map((match) => match._id),
      ...appliedMatches.map((match) => match._id),
    ])

    const sorted = sortMatches(
      allActiveMatches.filter((match) => !excludeIds.has(match._id)),
      sortOrder,
    )

    return sorted.slice(0, visibleCount)
  })
  const sortedMatches = $derived.by(() => {
    const excludeIds = new Set([
      ...savedMatches.map((match) => match._id),
      ...appliedMatches.map((match) => match._id),
    ])

    return sortMatches(
      allActiveMatches.filter((match) => !excludeIds.has(match._id)),
      sortOrder,
    )
  })
  const remainingCount = $derived(Math.max(0, sortedMatches.length - visibleMatches.length))
  const hasMatches = $derived(sortedMatches.length > 0)
  const hasSavedMatches = $derived(savedMatches.length > 0)
  const growthAreas = $derived(
    aggregateGrowthAreas(data?.allRecommendations) as GrowthArea[],
  )
  const isProgressStale = $derived(
    progress != null && now - progress.startedAt > STALE_PROGRESS_MS,
  )
  const isComputing = $derived(
    isTriggering || (progress != null && !isProgressStale),
  )
  const updatedLabel = $derived(
    data?.computedAt ? formatRelativeTime(data.computedAt) : null,
  )

  const parseRateLimitRetryAfter = (error: unknown): number | null => {
    try {
      if (
        error != null &&
        typeof error === 'object' &&
        'data' in error &&
        error.data != null &&
        typeof error.data === 'object' &&
        'kind' in error.data &&
        error.data.kind === 'RateLimited' &&
        'retryAfter' in error.data &&
        typeof error.data.retryAfter === 'number'
      ) {
        return error.data.retryAfter
      }

      const message = error instanceof Error ? error.message : String(error)
      const match = message.match(/"retryAfter"\s*:\s*([\d.]+)/)
      if (match) {
        return Number(match[1])
      }
    } catch {
      return null
    }

    return null
  }

  const handleCompute = async () => {
    isTriggering = true
    computeError = null
    retryAfter = null

    posthogStore.capture('match_computation_triggered', {
      existing_matches: allActiveMatches.length,
    })

    try {
      await convex.action(api.matches.triggerMatchComputation, {})
    } catch (error) {
      const retryMs = parseRateLimitRetryAfter(error)

      if (retryMs != null) {
        retryAfter = Math.ceil(retryMs / 1000)
      } else if (
        error != null &&
        typeof error === 'object' &&
        'data' in error &&
        error.data != null &&
        typeof error.data === 'object' &&
        'kind' in error.data &&
        error.data.kind === 'ProfileIncomplete'
      ) {
        // The reactive query will render the completeness gate.
      } else {
        computeError =
          error instanceof Error ? error.message : 'Failed to compute matches'
      }
    } finally {
      isTriggering = false
    }
  }

  const toggleSave = async (matchId: Id<'matches'>) => {
    try {
      await convex.mutation(api.matches.saveMatch, { matchId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update saved match')
    }
  }

  const dismiss = async (match: MatchSummary) => {
    try {
      await convex.mutation(api.matches.dismissMatch, { matchId: match._id })
      posthogStore.capture('match_dismissed', {
        match_id: match._id,
        opportunity_title: match.opportunity.title,
        organization: match.opportunity.organization,
        tier: match.tier,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to dismiss match')
    }
  }

  const handleRefresh = async () => {
    await handleCompute()
  }

  $effect(() => {
    if (clerkContext.isClerkLoaded && !clerkContext.currentUser) {
      void goto('/login')
    }
  })

  $effect(() => {
    if (retryAfter == null || retryAfter <= 0) {
      return
    }

    const timer = setTimeout(() => {
      retryAfter = retryAfter != null && retryAfter > 1 ? retryAfter - 1 : null
    }, 1000)

    return () => clearTimeout(timer)
  })

  $effect(() => {
    if (progress == null) {
      return
    }

    const interval = setInterval(() => {
      now = Date.now()
    }, 60_000)

    return () => clearInterval(interval)
  })

  $effect(() => {
    if (progress != null) {
      isTriggering = false
    }
  })

  $effect(() => {
    const current = data
    if (
      !current ||
      current.needsProfile ||
      current.needsCompleteness ||
      current.needsComputation ||
      hasMarkedViewed
    ) {
      return
    }

    hasMarkedViewed = true
    void convex.action(api.matches.markMatchesViewed, {}).catch(() => {
      hasMarkedViewed = false
    })
  })

  $effect(() => {
    if (data?.needsComputation && !isComputing && !hasAutoTriggered && retryAfter == null) {
      hasAutoTriggered = true
      void handleCompute()
    }

    if (!data?.needsComputation) {
      hasAutoTriggered = false
    }
  })

  $effect(() => {
    visibleCount = PAGE_SIZE
  })

  const sectionLabel = (count: number, noun: string) =>
    `${count} ${noun}${count === 1 ? '' : 's'}`
</script>

<svelte:head>
  <title>Matches | ASTN</title>
</svelte:head>

{#snippet noMatchesActions()}
  <div class="flex flex-wrap justify-center gap-3">
    <a
      href="/profile"
      class="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
    >
      Improve profile
    </a>
    <a
      href="/opportunities"
      class="inline-flex rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-coral-600"
    >
      Browse opportunities
    </a>
  </div>
{/snippet}

{#snippet pageContent()}
  {#if !clerkContext.isClerkLoaded || (!clerkContext.currentUser && data == null)}
    <div class="flex min-h-[calc(100vh-65px)] items-center justify-center">
      <Spinner />
    </div>
  {:else if data == null}
    <div class="flex min-h-[calc(100vh-65px)] items-center justify-center">
      <Spinner />
    </div>
  {:else if data.needsProfile}
    <main class="container mx-auto px-4 py-8">
      <section class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <User class="size-8 text-primary" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Create your profile first</h1>
        <p class="mt-3 text-slate-600">
          Complete your profile to get matched with AI safety opportunities
          tailored to your background and goals.
        </p>
        <a
          href="/profile"
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          Create profile
        </a>
      </section>
    </main>
  {:else if data.needsCompleteness && data.completeness}
    <main class="container mx-auto px-4 py-8">
      <section class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100">
          <Lock class="size-8 text-amber-600" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">
          Complete your profile to get matches
        </h1>
        <p class="mt-3 text-slate-600">
          We need a bit more information to find opportunities tailored to you.
        </p>

        <div class="mt-6 h-2.5 w-full rounded-full bg-muted">
          <div
            class="h-2.5 rounded-full bg-amber-500 transition-all duration-500"
            style={`width: ${(data.completeness.completedCount / data.completeness.totalCount) * 100}%`}
          ></div>
        </div>

        <p class="mt-3 text-sm text-slate-600">
          {data.completeness.completedCount} of {data.completeness.totalCount}
          {' '}sections complete
        </p>

        <div class="mt-5 rounded-2xl bg-slate-50 p-4 text-left text-sm">
          {#if data.completeness.missingRequired.length > 0}
            <p class="font-medium text-amber-700">
              Fill in your {data.completeness.missingRequired.join(', ')} to
              unlock matching.
            </p>
          {/if}
          {#if data.completeness.sectionsNeeded > 0}
            <p class="mt-2 text-slate-600">
              Complete {data.completeness.sectionsNeeded} more
              {' '}section{data.completeness.sectionsNeeded === 1 ? '' : 's'}
              {' '}(minimum 5 of 7).
            </p>
          {/if}
        </div>

        <a
          href="/profile"
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          Complete profile
        </a>
      </section>
    </main>
  {:else if retryAfter != null}
    <main class="container mx-auto px-4 py-8">
      <section class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100">
          <RefreshCw class="size-8 text-amber-600" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Too many requests</h1>
        <p class="mt-3 text-slate-600">
          Try again in
          <span class="font-medium tabular-nums">
            {' '}{Math.floor(retryAfter / 60)}:{String(retryAfter % 60).padStart(2, '0')}
          </span>
        </p>
        <button
          type="button"
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={retryAfter > 0}
          onclick={handleCompute}
        >
          Refresh matches
        </button>
      </section>
    </main>
  {:else if computeError}
    <main class="container mx-auto px-4 py-8">
      <section class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
        <h1 class="font-display text-3xl text-slate-950">Something went wrong</h1>
        <p class="mt-3 text-rose-600">{computeError}</p>
        <button
          type="button"
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
          onclick={handleCompute}
        >
          Try again
        </button>
      </section>
    </main>
  {:else if isComputing && !hasMatches && !hasSavedMatches}
    <main class="container mx-auto px-4 py-8">
      <section class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles class="size-8 animate-pulse text-primary" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Finding your matches</h1>
        <p class="mt-3 text-slate-600">
          Analyzing opportunities against your profile.
        </p>
        {#if progress}
          <div class="mt-6 h-2.5 w-full rounded-full bg-muted">
            <div
              class="h-2.5 rounded-full bg-coral-500 transition-all duration-500"
              style={`width: ${Math.max(5, (progress.completedBatches / progress.totalBatches) * 100)}%`}
            ></div>
          </div>
          <p class="mt-3 text-sm text-slate-600">
            {progress.completedBatches} of {progress.totalBatches} batches complete
          </p>
        {:else}
          <div class="mt-6 flex justify-center">
            <Spinner />
          </div>
        {/if}
      </section>
    </main>
  {:else}
    <main class="container mx-auto px-4 py-8">
      <div class="mx-auto max-w-6xl">
        <div class="mb-1 flex items-start justify-between gap-4">
          <h1 class="font-display text-3xl text-slate-950">Your matches</h1>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isComputing}
            onclick={handleCompute}
          >
            <RefreshCw class={`size-4 ${isComputing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <p class="mb-4 text-sm text-slate-600">
          {hasMatches ? `${sortedMatches.length} opportunities` : 'Opportunities matched to your profile'}
          {#if updatedLabel}
            {' '}· {updatedLabel}
          {/if}
        </p>

        <div class="mb-6 flex flex-wrap items-center gap-2">
          {#if savedMatches.length > 0}
            <span class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
              <Bookmark class="size-3.5" />
              {sectionLabel(savedMatches.length, 'saved')}
            </span>
          {/if}
          {#if appliedMatches.length > 0}
            <span class="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-800">
              <Check class="size-3.5" />
              {sectionLabel(appliedMatches.length, 'applied')}
            </span>
          {/if}

          <div class="ml-auto">
            <label class="flex items-center gap-2 text-sm text-slate-600">
              <span>Sort</span>
              <select
                bind:value={sortOrder}
                class="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              >
                {#each SORT_OPTIONS as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </label>
          </div>
        </div>

        {#if isComputing}
          <div class="mb-4 rounded-xl border border-coral-200 bg-coral-50 px-4 py-3">
            <div class="flex items-center gap-3">
              <Sparkles class="size-4 animate-pulse text-coral-600" />
              <p class="flex-1 text-sm font-medium text-slate-900">
                Refreshing your matches...
              </p>
              <span class="text-xs text-slate-500">Runs in background</span>
            </div>
            {#if progress}
              <div class="mt-3 h-2 w-full rounded-full bg-coral-100">
                <div
                  class="h-2 rounded-full bg-coral-500 transition-all duration-500"
                  style={`width: ${Math.max(5, (progress.completedBatches / progress.totalBatches) * 100)}%`}
                ></div>
              </div>
            {/if}
          </div>
        {/if}

        {#if isProgressStale && !isComputing}
          <div class="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle class="size-4 shrink-0" />
            <span>Your last match refresh did not complete. Click refresh to try again.</span>
          </div>
        {/if}

        {#if !isComputing && !isProgressStale && data.matchesStaleAt}
          <div class="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div class="flex items-center gap-3">
              <AlertTriangle class="size-4 shrink-0" />
              <span>Your profile has changed since these matches were computed.</span>
            </div>
            <button
              type="button"
              class="inline-flex rounded-lg border border-amber-300 px-3 py-1.5 font-medium transition hover:bg-amber-100"
              onclick={handleCompute}
            >
              Refresh
            </button>
          </div>
        {/if}

        <PullToRefresh
          onRefresh={handleRefresh}
          enabled={!isComputing}
          class="min-h-[200px]"
        >
          {#if !hasMatches && !hasSavedMatches}
            <section class="mb-8 rounded-[2rem] border border-border/70 bg-white/92 p-8 shadow-warm-sm">
              <Empty
                variant="no-matches"
                description="We could not find strong matches right now. Try completing more of your profile or check back when new opportunities are posted."
              >
                {#snippet children()}
                  {@render noMatchesActions()}
                {/snippet}
              </Empty>
            </section>
          {/if}

          <CollapsibleSection
            icon={Bookmark}
            title="Saved"
            count={savedMatches.length}
            subtitle="Opportunities you're interested in"
            variant="emerald"
            storageKey="saved-matches-expanded"
            itemCount={savedMatches.length}
            class="mb-6"
          >
            <SavedMatchesGrid
              matches={savedMatches}
              onToggleSave={toggleSave}
            />
          </CollapsibleSection>

          <CollapsibleSection
            icon={Check}
            title="Applied"
            count={appliedMatches.length}
            subtitle="Opportunities you've applied to"
            variant="violet"
            storageKey="applied-matches-expanded"
            itemCount={appliedMatches.length}
            class="mb-6"
          >
            <AppliedMatchesGrid matches={appliedMatches} />
          </CollapsibleSection>

          {#if hasMatches}
            <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {#each visibleMatches as match (match._id)}
                {#if $isMobile}
                  <SwipeableCard
                    onSwipeLeft={() => dismiss(match)}
                    onSwipeRight={() => toggleSave(match._id)}
                  >
                    {#snippet children()}
                      <MatchCard
                        {match}
                        onSave={() => toggleSave(match._id)}
                        onDismiss={() => dismiss(match)}
                      />
                    {/snippet}
                  </SwipeableCard>
                {:else}
                  <MatchCard
                    {match}
                    onSave={() => toggleSave(match._id)}
                    onDismiss={() => dismiss(match)}
                  />
                {/if}
              {/each}
            </div>

            {#if remainingCount > 0}
              <div class="mb-8 flex justify-center">
                <button
                  type="button"
                  class="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                  onclick={() => {
                    visibleCount += PAGE_SIZE
                  }}
                >
                  Show more ({remainingCount} remaining)
                </button>
              </div>
            {/if}
          {/if}

          {#if growthAreas.length > 0}
            <CollapsibleSection
              icon={TrendingUp}
              title="Your Growth Areas"
              subtitle="Focus areas to improve your fit"
              class="mb-6"
              defaultOpen
            >
              <GrowthAreas areas={growthAreas} hideHeader />
            </CollapsibleSection>
          {/if}
        </PullToRefresh>
      </div>
    </main>
  {/if}
{/snippet}

{#if $isMobile}
  <MobileShell user={mobileUser}>
    <GradientBg variant="subtle">
      {@render pageContent()}
    </GradientBg>
  </MobileShell>
{:else}
  <GradientBg variant="subtle">
    <AuthHeader />
    {@render pageContent()}
  </GradientBg>
{/if}

<script lang="ts" module>
  function aggregateGrowthAreas(
    recommendations: Array<{ type: string; action: string }> | undefined,
  ) {
    if (!recommendations || !Array.isArray(recommendations)) {
      return []
    }

    const grouped: Record<string, Set<string>> = {
      skill: new Set(),
      experience: new Set(),
    }

    for (const recommendation of recommendations) {
      if (
        recommendation.type === 'skill' ||
        recommendation.type === 'experience'
      ) {
        grouped[recommendation.type].add(recommendation.action)
      }
    }

    const areas = []

    if (grouped.skill.size > 0) {
      areas.push({
        theme: 'Skills to build',
        items: [...grouped.skill].slice(0, 5),
      })
    }

    if (grouped.experience.size > 0) {
      areas.push({
        theme: 'Experience to gain',
        items: [...grouped.experience].slice(0, 5),
      })
    }

    return areas
  }

  function formatRelativeTime(timestamp: number) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'Updated just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `Updated ${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Updated ${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Updated yesterday'
    return `Updated ${days}d ago`
  }
</script>
