<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import {
    Briefcase,
    GraduationCap,
    History,
    MapPin,
    Shield,
    Sparkles,
    Target,
    UserRound,
    Wrench,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import AdminSection from '~/components/org-admin/core/AdminSection.svelte'

  const slug = $derived(page.params.slug ?? null)
  const userId = $derived(page.params.userId ?? null)

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

  const memberProfile = useQuery(api.orgs.members.getMemberProfileForAdmin, () =>
    org.data && membership.data?.role === 'admin' && userId
      ? {
          orgId: org.data._id,
          userId,
        }
      : 'skip',
  )

  const attendanceHistory = useQuery(api.orgs.members.getMemberAttendanceHistory, () =>
    org.data && membership.data?.role === 'admin' && userId
      ? {
          orgId: org.data._id,
          userId,
        }
      : 'skip',
  )

  const engagementHistory = useQuery(api.orgs.members.getMemberEngagementHistory, () =>
    org.data && membership.data?.role === 'admin' && userId
      ? {
          orgId: org.data._id,
          userId,
        }
      : 'skip',
  )

  const adminState = $derived.by(() => {
    if (org.isLoading || membership.isLoading || memberProfile.isLoading) return 'loading'
    if (!org.data) return 'missing'
    if (membership.data?.role !== 'admin') return 'forbidden'
    if (!memberProfile.data) return 'member-missing'
    return 'ready'
  })

  const profile = $derived(memberProfile.data?.profile)
  const memberMembership = $derived(memberProfile.data?.membership)
  const visibleSections = $derived(memberProfile.data?.visibleSections)
</script>

{#if adminState === 'loading'}
  <div class="space-y-6">
    <div class="h-28 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
    <div class="h-96 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
  </div>
{:else if adminState === 'missing'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
  </div>
{:else if adminState === 'forbidden'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Admin access required</h1>
  </div>
{:else if adminState === 'member-missing'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Member not found</h1>
  </div>
{:else}
  <div class="space-y-6">
    <div class="flex items-center gap-2 text-sm text-slate-500">
      <a href={`/org/${slug}/admin/members`} class="transition-colors hover:text-slate-800">
        Members
      </a>
      <span>/</span>
      <span class="font-medium text-slate-800">{profile?.name ?? 'Member'}</span>
    </div>

    <section class="overflow-hidden rounded-[1.75rem] border border-border/70 bg-white/92 shadow-warm-sm">
      <div class="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div class="flex items-start gap-4">
          <div class="flex size-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
            <UserRound class="size-9" />
          </div>

          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-coral-600">Member profile</p>
            <h1 class="mt-2 font-display text-3xl text-slate-950">
              {profile?.name ?? 'Unnamed member'}
            </h1>
            {#if profile?.headline}
              <p class="mt-2 text-base text-slate-600">{profile.headline}</p>
            {/if}

            <div class="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
              {#if profile?.location}
                <span class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
                  <MapPin class="size-4" />
                  {profile.location}
                </span>
              {/if}

              {#if memberProfile.data?.email}
                <span class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
                  {memberProfile.data.email}
                </span>
              {/if}

              <span class={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${
                memberMembership?.role === 'admin'
                  ? 'bg-slate-950 text-white'
                  : 'border border-border text-slate-700'
              }`}>
                {memberMembership?.role}
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-[1.5rem] border border-border bg-slate-50 px-5 py-4 text-sm text-slate-600">
          <p class="font-medium text-slate-900">Membership</p>
          <p class="mt-2">Joined {memberMembership ? new Date(memberMembership.joinedAt).toLocaleDateString() : '—'}</p>
          <p class="mt-2">Directory visibility: {memberMembership?.directoryVisibility ?? 'default'}</p>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <AdminSection title="Profile details" subtitle="Visible information shared with the organization admin team.">
        <div class="space-y-6">
          <div>
            <div class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
              <GraduationCap class="size-4" />
              Education
            </div>
            {#if visibleSections?.education && profile?.education?.length}
              <div class="space-y-3">
                {#each profile.education as education, index (index)}
                  <div class="rounded-2xl border border-border bg-slate-50 px-4 py-3">
                    <p class="font-medium text-slate-950">{education.institution}</p>
                    <p class="mt-1 text-sm text-slate-600">
                      {[education.degree, education.field].filter(Boolean).join(' in ') || 'No degree details'}
                    </p>
                    {#if education.startYear || education.endYear}
                      <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {education.startYear ?? '—'} – {education.endYear ?? 'Present'}
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-slate-500">No education shared.</p>
            {/if}
          </div>

          <div>
            <div class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
              <Briefcase class="size-4" />
              Work history
            </div>
            {#if visibleSections?.workHistory && profile?.workHistory?.length}
              <div class="space-y-3">
                {#each profile.workHistory as workEntry, index (index)}
                  <div class="rounded-2xl border border-border bg-slate-50 px-4 py-3">
                    <p class="font-medium text-slate-950">{workEntry.title}</p>
                    <p class="mt-1 text-sm text-slate-600">{workEntry.organization}</p>
                    {#if workEntry.startDate || workEntry.endDate || workEntry.current}
                      <p class="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {workEntry.startDate ?? '—'} – {workEntry.current ? 'Present' : (workEntry.endDate ?? '—')}
                      </p>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-slate-500">No work history shared.</p>
            {/if}
          </div>

          <div>
            <div class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
              <Wrench class="size-4" />
              Skills
            </div>
            {#if visibleSections?.skills && profile?.skills?.length}
              <div class="flex flex-wrap gap-2">
                {#each profile.skills as skill}
                  <span class="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    {skill}
                  </span>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-slate-500">No skills shared.</p>
            {/if}
          </div>

          <div>
            <div class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
              <Target class="size-4" />
              Goals and interests
            </div>
            {#if visibleSections?.careerGoals && (profile?.careerGoals || profile?.seeking?.length || profile?.aiSafetyInterests?.length || profile?.enrichmentSummary)}
              <div class="space-y-3">
                {#if profile?.careerGoals}
                  <p class="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {profile.careerGoals}
                  </p>
                {/if}

                {#if profile?.seeking?.length}
                  <div class="flex flex-wrap gap-2">
                    {#each profile.seeking as seekingItem}
                      <span class="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                        {seekingItem}
                      </span>
                    {/each}
                  </div>
                {/if}

                {#if profile?.aiSafetyInterests?.length}
                  <div class="flex flex-wrap gap-2">
                    {#each profile.aiSafetyInterests as interest}
                      <span class="rounded-full border border-coral-200 bg-coral-50 px-3 py-1.5 text-xs font-medium text-coral-700">
                        {interest}
                      </span>
                    {/each}
                  </div>
                {/if}

                {#if profile?.enrichmentSummary}
                  <div class="rounded-2xl border border-border bg-slate-50 px-4 py-3">
                    <div class="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <Sparkles class="size-3.5" />
                      AI summary
                    </div>
                    <p class="text-sm leading-6 text-slate-700">{profile.enrichmentSummary}</p>
                  </div>
                {/if}
              </div>
            {:else}
              <p class="text-sm text-slate-500">No goals or interests shared.</p>
            {/if}
          </div>
        </div>
      </AdminSection>

      <div class="space-y-6">
        <AdminSection title="Engagement" subtitle="Computed status and manual override history.">
          {#if engagementHistory.data?.current}
            <div class="space-y-4">
              <div class="rounded-2xl border border-border bg-slate-50 px-4 py-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-slate-900">Current level</p>
                    <p class="mt-1 text-xl font-semibold text-slate-950">
                      {engagementHistory.data.current.level.replaceAll('_', ' ')}
                    </p>
                  </div>
                  {#if engagementHistory.data.current.hasOverride}
                    <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                      Override
                    </span>
                  {/if}
                </div>

                <p class="mt-3 text-sm leading-6 text-slate-600">
                  {engagementHistory.data.current.adminExplanation}
                </p>

                {#if engagementHistory.data.current.overrideNotes}
                  <p class="mt-3 text-sm leading-6 text-slate-600">
                    Notes: {engagementHistory.data.current.overrideNotes}
                  </p>
                {/if}
              </div>

              {#if engagementHistory.data.history.length}
                <div class="space-y-3">
                  {#each engagementHistory.data.history as entry}
                    <div class="rounded-2xl border border-border bg-white px-4 py-3">
                      <div class="flex items-center justify-between gap-4">
                        <p class="text-sm font-medium text-slate-900">
                          {entry.previousLevel} → {entry.newLevel}
                        </p>
                        <p class="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {new Date(entry.performedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p class="mt-2 text-sm text-slate-600">{entry.adminName}</p>
                      {#if entry.notes}
                        <p class="mt-2 text-sm leading-6 text-slate-600">{entry.notes}</p>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            <p class="text-sm text-slate-500">No engagement record exists yet for this member.</p>
          {/if}
        </AdminSection>

        <AdminSection title="Attendance history" subtitle="Participation records for events tied to this organization.">
          {#if attendanceHistory.data?.length}
            <div class="space-y-3">
              {#each attendanceHistory.data as record}
                <div class="rounded-2xl border border-border bg-slate-50 px-4 py-3">
                  <div class="flex items-center justify-between gap-4">
                    <p class="text-sm font-medium text-slate-900">{record.event?.title ?? 'Untitled event'}</p>
                    <span class="rounded-full border border-border px-3 py-1 text-xs font-medium text-slate-700">
                      {record.status}
                    </span>
                  </div>
                  {#if record.event?.startAt}
                    <p class="mt-2 text-sm text-slate-600">
                      {new Date(record.event.startAt).toLocaleString()}
                    </p>
                  {/if}
                  {#if record.event?.location}
                    <p class="mt-1 text-sm text-slate-600">{record.event.location}</p>
                  {/if}
                  {#if record.feedbackText}
                    <div class="mt-3 rounded-2xl border border-white/80 bg-white px-3 py-3">
                      <div class="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <History class="size-3.5" />
                        Feedback
                      </div>
                      <p class="text-sm leading-6 text-slate-700">{record.feedbackText}</p>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-slate-500">No attendance history for this member yet.</p>
          {/if}
        </AdminSection>
      </div>
    </div>
  </div>
{/if}
