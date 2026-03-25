<script lang="ts">
  import { page } from '$app/state'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    ArrowRight,
    Briefcase,
    CalendarCheck2,
    CheckCircle2,
    Copy,
    FileText,
    FolderKanban,
    MapPin,
    Settings,
    UserPlus,
    Users,
    Wrench,
  } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'
  import AdminSection from '~/components/org-admin/core/AdminSection.svelte'

  type TimeRange = '7d' | '30d' | '90d' | 'all'

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  let timeRange = $state<TimeRange>('30d')
  let inviteActionPending = $state(false)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const membership = useQuery(api.orgs.membership.getMembership, () =>
    org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const onboarding = useQuery(api.orgs.admin.getOnboardingProgress, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const stats = useQuery(api.orgs.stats.getEnhancedOrgStats, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
          timeRange,
        }
      : 'skip',
  )

  const space = useQuery(api.coworkingSpaces.getSpaceByOrg, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const applicationCount = useQuery(api.opportunityApplications.getOrgApplicationCount, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const inviteLinks = useQuery(api.orgs.admin.getInviteLinks, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const activeInviteUrl = $derived.by(() => {
    if (!inviteLinks.data?.length || !slug || typeof window === 'undefined') {
      return null
    }

    return `${window.location.origin}/org/${slug}/join?token=${inviteLinks.data[0].token}`
  })

  const engagementEntries = $derived.by(() =>
    stats.data?.engagementDistribution
      ? Object.entries(stats.data.engagementDistribution).filter(([, count]) => count > 0)
      : [],
  )

  const topSkills = $derived(stats.data?.skillsDistribution ?? [])

  const adminState = $derived.by(() => {
    if (org.isLoading || membership.isLoading) return 'loading'
    if (!org.data) return 'missing'
    if (membership.data?.role !== 'admin') return 'forbidden'
    return 'ready'
  })

  const handleInviteAction = async () => {
    if (!org.data) return

    try {
      inviteActionPending = true

      if (activeInviteUrl) {
        await navigator.clipboard.writeText(activeInviteUrl)
        toast.success('Invite link copied')
        return
      }

      const result = await convex.mutation(api.orgs.admin.getOrCreateInviteLink, {
        orgId: org.data._id,
      })

      const url = `${window.location.origin}/org/${slug}/join?token=${result.token}`
      await navigator.clipboard.writeText(url)
      toast.success('Invite link created and copied')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to manage invite link')
    } finally {
      inviteActionPending = false
    }
  }
</script>

{#if adminState === 'loading'}
  <div class="space-y-6">
    <div class="h-32 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
    <div class="grid gap-4 md:grid-cols-3">
      {#each Array.from({ length: 3 }) as _, index (index)}
        <div class="h-32 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
      {/each}
    </div>
  </div>
{:else if adminState === 'missing'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">
      The organization for this admin workspace could not be found.
    </p>
    <a
      href="/orgs"
      class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
    >
      Browse organizations
    </a>
  </div>
{:else if adminState === 'forbidden'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Admin access required</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">
      You need to be an organization admin to use this dashboard.
    </p>
    <a
      href={`/org/${slug}`}
      class="mt-6 inline-flex rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      Back to organization
    </a>
  </div>
{:else}
  <div class="space-y-6">
    <section class="overflow-hidden rounded-[1.75rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(255,255,255,0.96))] shadow-warm-sm">
      <div class="grid gap-4 px-6 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-coral-600">
            Admin overview
          </p>
          <h1 class="mt-2 font-display text-3xl text-slate-950 md:text-4xl">
            {org.data?.name}
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Track members, keep onboarding moving, and jump into operational work
            without leaving the org workspace.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onclick={handleInviteAction}
            disabled={inviteActionPending}
          >
            <Copy class="size-4" />
            <span>{activeInviteUrl ? 'Copy invite link' : 'Create invite link'}</span>
          </button>
          <a
            href={`/org/${slug}`}
            class="inline-flex items-center gap-2 rounded-xl border border-border bg-white/85 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            View public page
            <ArrowRight class="size-4" />
          </a>
        </div>
      </div>
    </section>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500">Members</span>
          <Users class="size-4 text-slate-400" />
        </div>
        <div class="mt-3 text-3xl font-semibold text-slate-950">
          {stats.data?.memberCount ?? '—'}
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500">Admins</span>
          <UserPlus class="size-4 text-slate-400" />
        </div>
        <div class="mt-3 text-3xl font-semibold text-slate-950">
          {stats.data?.adminCount ?? '—'}
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500">New in range</span>
          <CheckCircle2 class="size-4 text-slate-400" />
        </div>
        <div class="mt-3 text-3xl font-semibold text-slate-950">
          {stats.data?.joinedThisMonth ?? '—'}
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500">Applications</span>
          <FileText class="size-4 text-slate-400" />
        </div>
        <div class="mt-3 text-3xl font-semibold text-slate-950">
          {applicationCount.data ?? '—'}
        </div>
      </div>

      <div class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500">Event attendance</span>
          <CalendarCheck2 class="size-4 text-slate-400" />
        </div>
        <div class="mt-3 text-3xl font-semibold text-slate-950">
          {stats.data?.eventMetrics.attendanceRate ?? 0}%
        </div>
      </div>
    </div>

    <AdminSection
      title="Quick actions"
      subtitle="Jump directly into the most common admin tasks."
    >
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <a href={`/org/${slug}/admin/members`} class="rounded-2xl border border-border p-4 transition hover:border-slate-300 hover:bg-slate-50">
          <Users class="size-5 text-coral-500" />
          <h3 class="mt-3 font-medium text-slate-950">Members</h3>
          <p class="mt-1 text-sm text-slate-600">Manage roles, review profiles, and keep the directory healthy.</p>
        </a>
        <a href={`/org/${slug}/admin/applications`} class="rounded-2xl border border-border p-4 transition hover:border-slate-300 hover:bg-slate-50">
          <FileText class="size-5 text-coral-500" />
          <h3 class="mt-3 font-medium text-slate-950">Applications</h3>
          <p class="mt-1 text-sm text-slate-600">Review incoming opportunity applications and export responses.</p>
        </a>
        <a href={`/org/${slug}/admin/opportunities`} class="rounded-2xl border border-border p-4 transition hover:border-slate-300 hover:bg-slate-50">
          <Briefcase class="size-5 text-coral-500" />
          <h3 class="mt-3 font-medium text-slate-950">Opportunities</h3>
          <p class="mt-1 text-sm text-slate-600">Publish openings, edit forms, and monitor applicant funnels.</p>
        </a>
        <a href={`/org/${slug}/admin/setup`} class="rounded-2xl border border-border p-4 transition hover:border-slate-300 hover:bg-slate-50">
          <Wrench class="size-5 text-coral-500" />
          <h3 class="mt-3 font-medium text-slate-950">Setup</h3>
          <p class="mt-1 text-sm text-slate-600">Tune branding, invitations, and basic org information.</p>
        </a>
        <a href={`/org/${slug}/admin/programs`} class="rounded-2xl border border-border p-4 transition hover:border-slate-300 hover:bg-slate-50">
          <FolderKanban class="size-5 text-coral-500" />
          <h3 class="mt-3 font-medium text-slate-950">Programs</h3>
          <p class="mt-1 text-sm text-slate-600">Run cohorts, track attendance, and coordinate sessions.</p>
        </a>
        <a href={`/org/${slug}/admin/space`} class="rounded-2xl border border-border p-4 transition hover:border-slate-300 hover:bg-slate-50">
          <MapPin class="size-5 text-coral-500" />
          <h3 class="mt-3 font-medium text-slate-950">Space</h3>
          <p class="mt-1 text-sm text-slate-600">Configure co-working details and manage visit workflows.</p>
        </a>
        <a href={`/org/${slug}/admin/bookings`} class="rounded-2xl border border-border p-4 transition hover:border-slate-300 hover:bg-slate-50">
          <CalendarCheck2 class="size-5 text-coral-500" />
          <h3 class="mt-3 font-medium text-slate-950">Bookings</h3>
          <p class="mt-1 text-sm text-slate-600">Track reservation volume and daily usage for the workspace.</p>
        </a>
        <a href={`/org/${slug}/admin/settings`} class="rounded-2xl border border-border p-4 transition hover:border-slate-300 hover:bg-slate-50">
          <Settings class="size-5 text-coral-500" />
          <h3 class="mt-3 font-medium text-slate-950">Settings</h3>
          <p class="mt-1 text-sm text-slate-600">Connect Lu.ma and other integrations that power the org page.</p>
        </a>
      </div>
    </AdminSection>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <AdminSection
        title="Onboarding progress"
        subtitle="The highest leverage setup steps for getting the org fully live."
      >
        {#if onboarding.data}
          <div class="space-y-4">
            <div class="rounded-2xl border border-border bg-slate-50 px-4 py-4">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-medium text-slate-900">
                    {onboarding.data.completedCount} of {onboarding.data.totalCount} steps complete
                  </p>
                  <p class="mt-1 text-sm text-slate-600">
                    {onboarding.data.isComplete
                      ? 'Your organization setup is complete.'
                      : 'Finish the remaining steps to unlock a smoother member experience.'}
                  </p>
                </div>
                <div class="text-3xl font-semibold text-slate-950">
                  {onboarding.data.percentage}%
                </div>
              </div>
              <div class="mt-4 h-2 rounded-full bg-slate-200">
                <div
                  class="h-2 rounded-full bg-coral-500 transition-[width]"
                  style={`width:${onboarding.data.percentage}%`}
                ></div>
              </div>
            </div>

            <div class="grid gap-3">
              {#each onboarding.data.steps as step}
                <a
                  href={`/org/${slug}/admin/${step.route}`}
                  class={`flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                    step.complete
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-border bg-white hover:bg-slate-50'
                  }`}
                >
                  <div class={`mt-0.5 flex size-6 items-center justify-center rounded-full ${
                    step.complete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {#if step.complete}
                      <CheckCircle2 class="size-4" />
                    {:else}
                      <span class="text-xs font-semibold">•</span>
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-slate-900">{step.label}</p>
                    <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {step.route}
                    </p>
                  </div>
                </a>
              {/each}
            </div>
          </div>
        {:else}
          <p class="text-sm text-slate-500">Loading setup progress…</p>
        {/if}
      </AdminSection>

      <AdminSection
        title="Community snapshot"
        subtitle="A lightweight view of engagement and profile quality."
      >
        {#snippet actions()}
          <div class="inline-flex rounded-full border border-border bg-slate-50 p-1 text-xs">
            {#each (['7d', '30d', '90d', 'all'] as TimeRange[]) as range}
              <button
                type="button"
                class={`rounded-full px-3 py-1.5 transition ${
                  timeRange === range
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
                onclick={() => {
                  timeRange = range
                }}
              >
                {range}
              </button>
            {/each}
          </div>
        {/snippet}
        <div class="space-y-5">
          <div>
            <div class="mb-2 flex items-center justify-between text-sm text-slate-600">
              <span>Profile completeness</span>
              <span>{stats.data ? `${stats.data.completenessDistribution.high} high` : '—'}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                <div class="text-xl font-semibold text-emerald-700">
                  {stats.data?.completenessDistribution.high ?? 0}
                </div>
                <div class="mt-1 text-emerald-700/80">High</div>
              </div>
              <div class="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
                <div class="text-xl font-semibold text-amber-700">
                  {stats.data?.completenessDistribution.medium ?? 0}
                </div>
                <div class="mt-1 text-amber-700/80">Medium</div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div class="text-xl font-semibold text-slate-700">
                  {stats.data?.completenessDistribution.low ?? 0}
                </div>
                <div class="mt-1 text-slate-700/80">Low</div>
              </div>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-900">Engagement mix</p>
            <div class="mt-3 space-y-2">
              {#if engagementEntries.length}
                {#each engagementEntries as [label, count]}
                  <div>
                    <div class="mb-1 flex items-center justify-between text-sm text-slate-600">
                      <span>{label.replaceAll('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                    <div class="h-2 rounded-full bg-slate-200">
                      <div
                        class="h-2 rounded-full bg-slate-950"
                        style={`width:${stats.data?.memberCount ? Math.max((count / stats.data.memberCount) * 100, 6) : 0}%`}
                      ></div>
                    </div>
                  </div>
                {/each}
              {:else}
                <p class="text-sm text-slate-500">No engagement data yet.</p>
              {/if}
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-900">Top skills</p>
            <div class="mt-3 flex flex-wrap gap-2">
              {#if topSkills.length}
                {#each topSkills as skill}
                  <span class="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    {skill.name} · {skill.count}
                  </span>
                {/each}
              {:else}
                <p class="text-sm text-slate-500">No skills captured yet.</p>
              {/if}
            </div>
          </div>

          <div class="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span class="font-medium text-slate-900">Space status:</span>
            {space.data ? ` ${space.data.name} is configured for member bookings.` : ' No co-working space is configured yet.'}
          </div>
        </div>
      </AdminSection>
    </div>
  </div>
{/if}
