<script lang="ts">
  import { format } from 'date-fns'
  import {
    Bookmark,
    Building2,
    Calendar,
    Check,
    Clock,
    MapPin,
    Play,
    Sparkles,
    Target,
    Users,
    Video,
  } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import { formatDeadline, formatPostedAt } from '$lib/formatDeadline'
  import { formatLocation } from '$lib/formatLocation'
  import { computeGlobalFitScore, getFitScoreColor } from '$lib/matchScoring'
  import { ROLE_TYPE_COLORS } from '$lib/roleTypes'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'

  const clerkContext = getClerkContext()
  const convex = useConvexClient()

  const suggestedOrgs = useQuery(api.orgs.discovery.getSuggestedOrgs, () =>
    clerkContext.currentUser ? {} : 'skip',
  )
  const locationPrivacy = useQuery(api.profiles.getLocationPrivacy, () =>
    clerkContext.currentUser ? {} : 'skip',
  )
  const dashboardEvents = useQuery(api.events.queries.getDashboardEvents, () =>
    clerkContext.currentUser ? {} : 'skip',
  )
  const matchesData = useQuery(api.matches.getMyMatches, () =>
    clerkContext.currentUser ? {} : 'skip',
  )
  const actionsData = useQuery(api.careerActions.queries.getMyActions, () =>
    clerkContext.currentUser ? {} : 'skip',
  )

  const savedMatches = $derived(matchesData.data?.savedMatches ?? [])
  const topMatches = $derived(
    [
      ...(matchesData.data?.matches.great ?? []),
      ...(matchesData.data?.matches.good ?? []),
    ].slice(0, 3),
  )
  const topActions = $derived(actionsData.data?.active.slice(0, 2) ?? [])
  const locationEnabled = $derived(
    locationPrivacy.data?.locationDiscoverable ?? false,
  )
  const userOrgEvents = $derived(dashboardEvents.data?.userOrgEvents ?? [])
  const otherOrgEvents = $derived(dashboardEvents.data?.otherOrgEvents ?? [])
  const displayName = $derived(
    clerkContext.currentUser?.firstName ??
      clerkContext.currentUser?.fullName ??
      'there',
  )

  let dashboardTracked = $state(false)

  $effect(() => {
    if (!matchesData.data || dashboardTracked) {
      return
    }

    dashboardTracked = true
    const allMatches = [
      ...matchesData.data.matches.great,
      ...matchesData.data.matches.good,
      ...matchesData.data.matches.exploring,
    ]

    posthogStore.capture('dashboard_viewed', {
      match_count: allMatches.length,
      saved_match_count: matchesData.data.savedMatches.length,
    })
  })

  const actionTypeMeta = {
    build_tools: 'Build Tools',
    collaborate: 'Find Collaborators',
    develop_skills: 'Develop Skills',
    identify_gaps: 'Identify Gaps',
    replicate: 'Replicate Research',
    start_org: 'Start Initiative',
    teach_write: 'Teach or Write',
    volunteer: 'Volunteer',
  } as const

  const runMutation = async (
    work: () => Promise<unknown>,
    errorMessage: string,
  ) => {
    try {
      await work()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage)
    }
  }

  const groupEventsByOrg = <T extends { org: { name: string } }>(events: T[]) => {
    const grouped: Record<string, T[]> = {}

    for (const event of events) {
      const orgName = event.org.name
      grouped[orgName] ??= []
      grouped[orgName].push(event)
    }

    return Object.entries(grouped)
  }
</script>

<GradientBg variant="subtle">
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    <section class="mb-8 rounded-[2rem] border border-border/70 bg-white/88 p-6 shadow-warm-sm backdrop-blur">
      <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div class="space-y-3">
          <p class="text-sm font-medium uppercase tracking-[0.2em] text-coral-600">
            Dashboard
          </p>
          <div>
            <h1 class="font-display text-3xl text-slate-950 md:text-4xl">
              Welcome back, {displayName}.
            </h1>
            <p class="mt-2 max-w-2xl text-slate-600">
              Your profile, top matches, recommended actions, organizations, and
              upcoming events are all here. Detail routes are still being
              migrated, so this page favors useful previews over dead links.
            </p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3">
            <div class="text-xs uppercase tracking-wide text-coral-700">Saved matches</div>
            <div class="mt-1 text-2xl font-semibold text-slate-950">{savedMatches.length}</div>
          </div>
          <div class="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
            <div class="text-xs uppercase tracking-wide text-teal-700">Active actions</div>
            <div class="mt-1 text-2xl font-semibold text-slate-950">
              {actionsData.data?.active.length ?? 0}
            </div>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div class="text-xs uppercase tracking-wide text-slate-600">Upcoming events</div>
            <div class="mt-1 text-2xl font-semibold text-slate-950">
              {userOrgEvents.length + otherOrgEvents.length}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-8">
      <div class="mb-4 flex items-center gap-2">
        <Target class="size-5 text-coral-600" />
        <h2 class="font-display text-2xl text-slate-950">Top matches</h2>
      </div>

      {#if matchesData.isLoading}
        <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-sm text-muted-foreground shadow-warm-sm">
          Loading match previews...
        </div>
      {:else if savedMatches.length === 0 && topMatches.length === 0}
        <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-sm text-slate-600 shadow-warm-sm">
          Your dashboard will populate after match computation runs on your
          profile.
        </div>
      {:else}
        <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {#each savedMatches.slice(0, 2) as match}
            <article class="rounded-[1.5rem] border border-emerald-200 bg-white/92 p-5 shadow-warm-sm">
              <div class="mb-3 flex items-start gap-2">
                <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <Bookmark class="size-3 fill-current" />
                  Saved
                </span>
                <span class="ml-auto text-sm font-semibold text-emerald-700">
                  {computeGlobalFitScore(match.tier, match.score)}% fit
                </span>
              </div>
              <div class="mb-3 flex flex-wrap gap-2">
                <span class={`rounded-full border px-2.5 py-1 text-xs font-medium ${ROLE_TYPE_COLORS[match.opportunity.roleType] ?? ROLE_TYPE_COLORS.other}`}>
                  {match.opportunity.roleType}
                </span>
                {#if match.opportunity.isRemote}
                  <span class="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                    Remote
                  </span>
                {/if}
                {#if match.isNew}
                  <span class="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                    New
                  </span>
                {/if}
              </div>
              <h3 class="text-lg font-semibold text-slate-950">
                {match.opportunity.title}
              </h3>
              <p class="mt-1 text-sm text-slate-600">
                {match.opportunity.organization} · {formatLocation(match.opportunity.location)}
              </p>
              {#if match.explanation.strengths[0]}
                <p class="mt-3 text-sm leading-6 text-slate-600">
                  {match.explanation.strengths[0]}
                </p>
              {/if}
            </article>
          {/each}

          {#each topMatches as match}
            <article class="rounded-[1.5rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm">
              <div class="mb-3 flex items-start gap-2">
                <span class={`rounded-full border px-2.5 py-1 text-xs font-medium ${ROLE_TYPE_COLORS[match.opportunity.roleType] ?? ROLE_TYPE_COLORS.other}`}>
                  {match.opportunity.roleType}
                </span>
                <span
                  class={`ml-auto text-sm font-semibold ${getFitScoreColor(
                    computeGlobalFitScore(match.tier, match.score),
                  )}`}
                >
                  {computeGlobalFitScore(match.tier, match.score)}% fit
                </span>
              </div>
              <h3 class="text-lg font-semibold text-slate-950">
                {match.opportunity.title}
              </h3>
              <p class="mt-1 text-sm text-slate-600">
                {match.opportunity.organization} · {formatLocation(match.opportunity.location)}
              </p>
              {#if match.opportunity.deadline}
                <p class="mt-3 flex items-center gap-1.5 text-sm text-coral-700">
                  <Clock class="size-3.5" />
                  {formatDeadline(match.opportunity.deadline)}
                </p>
              {:else if match.opportunity.postedAt}
                <p class="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                  <Clock class="size-3.5" />
                  {formatPostedAt(match.opportunity.postedAt)}
                </p>
              {/if}
              {#if match.explanation.strengths[0]}
                <p class="mt-3 text-sm leading-6 text-slate-600">
                  {match.explanation.strengths[0]}
                </p>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="mb-8">
      <div class="mb-4 flex items-center gap-2">
        <Sparkles class="size-5 text-violet-600" />
        <h2 class="font-display text-2xl text-slate-950">Your next moves</h2>
      </div>

      {#if actionsData.isLoading}
        <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-sm text-muted-foreground shadow-warm-sm">
          Loading action recommendations...
        </div>
      {:else if topActions.length === 0}
        <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-sm text-slate-600 shadow-warm-sm">
          Refresh your matches after updating your profile to generate more
          tailored career actions.
        </div>
      {:else}
        <div class="grid gap-4 lg:grid-cols-2">
          {#each topActions as action}
            <article class="rounded-[1.5rem] border border-violet-200 bg-white/92 p-5 shadow-warm-sm">
              <div class="mb-3 flex items-start gap-3">
                <span class="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
                  {actionTypeMeta[action.type] ?? action.type}
                </span>
                <span class="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {action.status.replace('_', ' ')}
                </span>
              </div>
              <h3 class="text-lg font-semibold text-slate-950">{action.title}</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">
                {action.description}
              </p>
              <p class="mt-3 text-xs uppercase tracking-wide text-violet-700">
                Based on
              </p>
              <p class="mt-1 text-sm text-slate-600">{action.rationale}</p>
              <div class="mt-4 flex flex-wrap gap-2">
                {#if action.status === 'active'}
                  <button
                    type="button"
                    onclick={() =>
                      runMutation(
                        () =>
                          convex.mutation(api.careerActions.mutations.startAction, {
                            actionId: action._id,
                          }),
                        'Failed to start action',
                      )}
                    class="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                  >
                    <Play class="size-4" />
                    Start
                  </button>
                  <button
                    type="button"
                    onclick={() =>
                      runMutation(
                        () =>
                          convex.mutation(api.careerActions.mutations.saveAction, {
                            actionId: action._id,
                          }),
                        'Failed to save action',
                      )}
                    class="rounded-xl border border-border px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Save
                  </button>
                {:else if action.status === 'saved'}
                  <button
                    type="button"
                    onclick={() =>
                      runMutation(
                        () =>
                          convex.mutation(api.careerActions.mutations.startAction, {
                            actionId: action._id,
                          }),
                        'Failed to start action',
                      )}
                    class="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                  >
                    <Play class="size-4" />
                    Start
                  </button>
                  <button
                    type="button"
                    onclick={() =>
                      runMutation(
                        () =>
                          convex.mutation(api.careerActions.mutations.unsaveAction, {
                            actionId: action._id,
                          }),
                        'Failed to unsave action',
                      )}
                    class="rounded-xl border border-border px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Unsave
                  </button>
                {:else if action.status === 'in_progress'}
                  <button
                    type="button"
                    onclick={() =>
                      runMutation(
                        () =>
                          convex.mutation(api.careerActions.mutations.completeAction, {
                            actionId: action._id,
                          }),
                        'Failed to complete action',
                      )}
                    class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <Check class="size-4" />
                    Mark done
                  </button>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="mb-8">
      <div class="mb-4 flex items-center gap-2">
        <Building2 class="size-5 text-teal-600" />
        <h2 class="font-display text-2xl text-slate-950">
          Suggested organizations
        </h2>
      </div>

      {#if suggestedOrgs.isLoading}
        <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-sm text-muted-foreground shadow-warm-sm">
          Loading organization suggestions...
        </div>
      {:else if suggestedOrgs.data?.length}
        <div class="flex gap-4 overflow-x-auto pb-2">
          {#each suggestedOrgs.data as org}
            <article class="w-72 shrink-0 rounded-[1.5rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm">
              <div class="mb-4 flex items-start gap-3">
                {#if org.logoUrl}
                  <img
                    src={org.logoUrl}
                    alt={`${org.name} logo`}
                    class="size-12 rounded-xl object-cover"
                  />
                {:else}
                  <div class="flex size-12 items-center justify-center rounded-xl bg-slate-100">
                    <Building2 class="size-5 text-slate-400" />
                  </div>
                {/if}
                <div class="min-w-0">
                  <h3 class="truncate text-lg font-semibold text-slate-950">
                    {org.name}
                  </h3>
                  <p class="mt-1 flex items-center gap-1 text-sm text-slate-600">
                    <MapPin class="size-3.5 shrink-0" />
                    <span class="truncate">
                      {[org.city, org.country].filter(Boolean).join(', ') || 'Global'}
                    </span>
                  </p>
                </div>
              </div>

              {#if org.description}
                <p class="line-clamp-3 text-sm leading-6 text-slate-600">
                  {org.description}
                </p>
              {/if}

              <div class="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                {#if org.memberCount}
                  <span class="inline-flex items-center gap-1">
                    <Users class="size-3.5" />
                    {org.memberCount} members
                  </span>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 shadow-warm-sm">
          <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-cream-100">
            <MapPin class="size-5 text-coral-500" />
          </div>
          <h3 class="text-lg font-semibold text-slate-950">
            {locationEnabled
              ? 'No organizations near you yet'
              : 'Location-based suggestions are off'}
          </h3>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            {locationEnabled
              ? 'We are still growing the network in your area. Check back as new organizations join ASTN.'
              : 'Suggested organizations become more relevant once location sharing is configured during the settings migration.'}
          </p>
        </div>
      {/if}
    </section>

    <section>
      <div class="mb-4 flex items-center gap-2">
        <Calendar class="size-5 text-coral-600" />
        <h2 class="font-display text-2xl text-slate-950">Upcoming events</h2>
      </div>

      {#if dashboardEvents.isLoading}
        <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-sm text-muted-foreground shadow-warm-sm">
          Loading event feed...
        </div>
      {:else if userOrgEvents.length > 0}
        <div class="space-y-6">
          {#each groupEventsByOrg(userOrgEvents) as [orgName, events]}
            <section>
              <h3 class="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
                {orgName}
              </h3>
              <div class="grid gap-4 lg:grid-cols-2">
                {#each events.slice(0, 4) as event}
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block rounded-[1.5rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm transition-transform hover:-translate-y-0.5 hover:shadow-warm-lg"
                  >
                    <div class="flex items-start gap-4">
                      {#if event.coverUrl}
                        <img
                          src={event.coverUrl}
                          alt={event.title}
                          class="size-14 rounded-xl object-cover"
                        />
                      {:else if event.org.logoUrl}
                        <img
                          src={event.org.logoUrl}
                          alt={`${event.org.name} logo`}
                          class="size-14 rounded-xl object-cover"
                        />
                      {:else}
                        <div class="flex size-14 items-center justify-center rounded-xl bg-slate-100">
                          <Calendar class="size-5 text-slate-400" />
                        </div>
                      {/if}
                      <div class="min-w-0 flex-1">
                        <h4 class="truncate text-lg font-semibold text-slate-950">
                          {event.title}
                        </h4>
                        <p class="mt-1 text-sm text-slate-600">
                          {format(event.startAt, "EEE, MMM d 'at' h:mm a")}
                        </p>
                        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          {#if event.isVirtual}
                            <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              <Video class="size-3" />
                              Online
                            </span>
                          {:else if event.location}
                            <span class="inline-flex items-center gap-1">
                              <MapPin class="size-3.5" />
                              {event.location}
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </a>
                {/each}
              </div>
            </section>
          {/each}
        </div>
      {:else if otherOrgEvents.length > 0}
        <div class="space-y-4">
          <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-sm leading-6 text-slate-600 shadow-warm-sm">
            You do not have events from joined organizations yet, but the
            network still has activity you can browse.
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            {#each otherOrgEvents.slice(0, 4) as event}
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                class="block rounded-[1.5rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm transition-transform hover:-translate-y-0.5 hover:shadow-warm-lg"
              >
                <p class="text-xs uppercase tracking-wide text-slate-500">
                  {event.org.name}
                </p>
                <h3 class="mt-2 text-lg font-semibold text-slate-950">
                  {event.title}
                </h3>
                <p class="mt-1 text-sm text-slate-600">
                  {format(event.startAt, "EEE, MMM d 'at' h:mm a")}
                </p>
                {#if event.location}
                  <p class="mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
                    <MapPin class="size-3.5" />
                    {event.location}
                  </p>
                {/if}
              </a>
            {/each}
          </div>
        </div>
      {:else}
        <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-6 shadow-warm-sm">
          <div class="mb-3 flex size-12 items-center justify-center rounded-full bg-cream-100">
            <Calendar class="size-5 text-coral-500" />
          </div>
          <h3 class="text-lg font-semibold text-slate-950">No upcoming events</h3>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            Join organizations or check back later as events get published into
            the network.
          </p>
        </div>
      {/if}
    </section>
  </main>
</GradientBg>
