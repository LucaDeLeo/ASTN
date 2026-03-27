<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import {
    Building2,
    Calendar,
    CheckCircle2,
    Clock3,
    GraduationCap,
    Lock,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import {
    moduleStatusColors,
    programStatusColors,
    programTypeLabels,
    rsvpPreferenceColors,
    slotLabels,
  } from '$lib/program-constants'
  import AISidebar from '~/components/course/AISidebar.svelte'
  import AISidebarProvider from '~/components/course/AISidebarProvider.svelte'
  import AISidebarToggle from '~/components/course/AISidebarToggle.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import {
    daysUntilSession,
    formatProgramDateRange,
  } from '~/components/public-org/utils'
  const slug = $derived(page.params.slug ?? null)
  const programSlug = $derived(page.params.programSlug ?? null)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const programData = useQuery(api.programs.getProgramBySlug, () =>
    org.data && programSlug
      ? {
          orgId: org.data._id,
          programSlug,
        }
      : 'skip',
  )

  const promptProgressMap = $derived.by(() => {
    const map = new Map<string, { totalPrompts: number; completedPrompts: number }>()
    for (const item of programData.data?.promptCompletionByModule ?? []) {
      map.set(item.moduleId, item)
    }
    return map
  })

  const rsvpMap = $derived.by(() => {
    const map = new Map<string, 'morning' | 'afternoon' | 'either'>()
    for (const item of programData.data?.myRsvps ?? []) {
      map.set(item.sessionId, item.preference)
    }
    return map
  })

  const attendanceMap = $derived.by(() => {
    const map = new Map<string, 'morning' | 'afternoon'>()
    for (const item of programData.data?.myAttendance ?? []) {
      map.set(item.sessionId, item.slot)
    }
    return map
  })

  const materialProgressMap = $derived.by(() => {
    const map = new Map<string, Set<number>>()
    for (const item of programData.data?.myMaterialProgress ?? []) {
      const existing = map.get(item.moduleId) ?? new Set<number>()
      existing.add(item.materialIndex)
      map.set(item.moduleId, existing)
    }
    return map
  })

  const formatSessionDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

  const pageTitle = $derived(
    programData.data && org.data
      ? `${programData.data.program.name} | ${org.data.name} | ASTN`
      : 'Program | ASTN',
  )

  let activeModuleId = $state<Id<'programModules'> | null>(null)

  const effectiveModuleId = $derived.by(() => {
    if (activeModuleId) {
      return activeModuleId
    }

    const modules = programData.data?.modules ?? []
    return (
      modules.find((module) => module.status === 'available' || module.status === 'completed')
        ?._id ?? null
    )
  })
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<AISidebarProvider moduleId={programData.data?.participation ? effectiveModuleId : null}>
  <GradientBg>
    <AuthHeader />
    <AISidebar />

    <main class="container mx-auto px-4 py-8">
    {#if org.isLoading || programData.isLoading}
      <div class="mx-auto max-w-5xl space-y-6">
        <div class="h-24 animate-pulse rounded-[2rem] bg-slate-100"></div>
        <div class="h-72 animate-pulse rounded-[2rem] bg-slate-100"></div>
      </div>
    {:else if !org.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Building2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
      </div>
    {:else if !programData.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Lock class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Program unavailable</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This program doesn’t exist or you don’t have access to it.
        </p>
        <a
          href={`/org/${page.params.slug}/programs`}
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          Back to Programs
        </a>
      </div>
    {:else}
      {@const program = programData.data.program}
      {@const participation = programData.data.participation}

      <div class="mx-auto max-w-5xl space-y-6">
        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm text-slate-500">
                <a href={`/org/${page.params.slug}`} class="transition hover:text-slate-700">
                  {org.data.name}
                </a>
                <span>/</span>
                <a
                  href={`/org/${page.params.slug}/programs`}
                  class="transition hover:text-slate-700"
                >
                  Programs
                </a>
                <span>/</span>
                <span class="text-slate-700">{program.name}</span>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <h1 class="font-display text-3xl text-slate-950">{program.name}</h1>
                <span class={`rounded-full px-3 py-1 text-xs font-medium ${programStatusColors[program.status]}`}>
                  {program.status}
                </span>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {programTypeLabels[program.type]}
                </span>
              </div>

              {#if program.description}
                <p class="max-w-3xl text-sm leading-6 text-slate-600">
                  {program.description}
                </p>
              {/if}

              {#if formatProgramDateRange(program.startDate, program.endDate)}
                <div class="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Calendar class="size-4" />
                  <span>{formatProgramDateRange(program.startDate, program.endDate)}</span>
                </div>
              {/if}
            </div>

            {#if participation}
              <div class="min-w-[240px] space-y-3">
                <div class="rounded-[1.5rem] border border-coral-100 bg-coral-50/70 p-4">
                  <p class="text-xs font-medium uppercase tracking-[0.18em] text-coral-700">
                    Your Participation
                  </p>
                  <p class="mt-2 text-lg font-semibold text-slate-950">
                    {participation.status === 'completed' ? 'Completed' : 'Active participant'}
                  </p>
                  <p class="mt-2 text-sm text-slate-600">
                    Enrolled {new Date(participation.enrolledAt).toLocaleDateString()}
                  </p>
                  {#if participation.completedAt}
                    <p class="mt-1 text-sm text-slate-600">
                      Completed {new Date(participation.completedAt).toLocaleDateString()}
                    </p>
                  {/if}
                </div>

                <div class="flex justify-end">
                  <AISidebarToggle />
                </div>
              </div>
            {/if}
          </div>
        </section>

        <section class="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div class="space-y-6">
            <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
              <div class="mb-4 flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
                  <GraduationCap class="size-5" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-950">Modules</h2>
                  <p class="text-sm text-slate-600">
                    Readings, exercises, and progression through the program.
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                {#if !programData.data.modules.length}
                  <p class="text-sm text-slate-600">No modules have been published yet.</p>
                {:else}
                  {#each programData.data.modules as module (module._id)}
                    {@const promptProgress = promptProgressMap.get(module._id)}
                    {@const completedMaterials = materialProgressMap.get(module._id)?.size ?? 0}
                    <div class={`rounded-[1.5rem] border bg-white p-4 ${
                      effectiveModuleId === module._id
                        ? 'border-coral-300 shadow-[0_0_0_1px_rgba(255,123,92,0.18)]'
                        : 'border-border/60'
                    }`}>
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div class="flex flex-wrap items-center gap-2">
                            <h3 class="text-base font-semibold text-slate-950">
                              Week {module.weekNumber}: {module.title}
                            </h3>
                            <span class={`rounded-full px-2.5 py-1 text-xs font-medium ${moduleStatusColors[module.status]}`}>
                              {module.status}
                            </span>
                          </div>
                          {#if module.description}
                            <p class="mt-2 text-sm leading-6 text-slate-600">
                              {module.description}
                            </p>
                          {/if}
                        </div>
                        {#if participation}
                          <button
                            type="button"
                            class="rounded-full border border-coral-200 bg-coral-50 px-3 py-1.5 text-xs font-medium text-coral-700 transition hover:bg-coral-100"
                            onclick={() => {
                              activeModuleId = module._id
                            }}
                          >
                            {effectiveModuleId === module._id ? 'AI focused here' : 'Focus AI here'}
                          </button>
                        {/if}
                      </div>

                      <div class="mt-4 grid gap-3 sm:grid-cols-3">
                        <div class="rounded-2xl bg-slate-50 px-3 py-3">
                          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Materials
                          </p>
                          <p class="mt-1 text-sm font-medium text-slate-900">
                            {completedMaterials}/{module.materials?.length ?? 0} completed
                          </p>
                        </div>
                        <div class="rounded-2xl bg-slate-50 px-3 py-3">
                          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Prompts
                          </p>
                          <p class="mt-1 text-sm font-medium text-slate-900">
                            {promptProgress ? `${promptProgress.completedPrompts}/${promptProgress.totalPrompts}` : '0/0'}
                          </p>
                        </div>
                        <div class="rounded-2xl bg-slate-50 px-3 py-3">
                          <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
                            Session Link
                          </p>
                          <p class="mt-1 text-sm font-medium text-slate-900">
                            {module.linkedSessionId ? 'Attached' : 'Not linked'}
                          </p>
                        </div>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            </section>

            <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
              <div class="mb-4 flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Calendar class="size-5" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-slate-950">Sessions</h2>
                  <p class="text-sm text-slate-600">
                    Upcoming meetings and your RSVP / attendance state.
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                {#if !programData.data.sessions.length}
                  <p class="text-sm text-slate-600">No sessions are scheduled yet.</p>
                {:else}
                  {#each programData.data.sessions as session (session._id)}
                    {@const rsvp = rsvpMap.get(session._id)}
                    {@const attendance = attendanceMap.get(session._id)}
                    <div class="rounded-[1.5rem] border border-border/60 bg-white p-4">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 class="text-base font-semibold text-slate-950">{session.title}</h3>
                          <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            <span class="inline-flex items-center gap-1.5">
                              <Calendar class="size-4" />
                              {formatSessionDate(session.date)}
                            </span>
                            <span class="inline-flex items-center gap-1.5">
                              <Clock3 class="size-4" />
                              {session.morningStartTime} / {session.afternoonStartTime}
                            </span>
                            {#if daysUntilSession(session.date) >= 0}
                              <span>{daysUntilSession(session.date)} days away</span>
                            {/if}
                          </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                          {#if rsvp}
                            <span class={`rounded-full px-2.5 py-1 text-xs font-medium ${rsvpPreferenceColors[rsvp]}`}>
                              RSVP: {slotLabels[rsvp]}
                            </span>
                          {/if}
                          {#if attendance}
                            <span class="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                              Attended: {slotLabels[attendance]}
                            </span>
                          {/if}
                        </div>
                      </div>

                      {#if session.lumaUrl}
                        <a
                          href={session.lumaUrl}
                          target="_blank"
                          rel="noreferrer"
                          class="mt-4 inline-flex text-sm font-medium text-coral-700 transition hover:text-coral-800"
                        >
                          Open event registration
                        </a>
                      {/if}
                    </div>
                  {/each}
                {/if}
              </div>
            </section>
          </div>

          <div class="space-y-6">
            <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
              <h2 class="text-lg font-semibold text-slate-950">AI Learning Partner</h2>
              <div class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>
                  This page includes your program timeline, module progress, session status, and a module-aware AI sidebar for enrolled participants.
                </p>
                <p>
                  Use the AI toggle in the header to ask for summaries, explanations, or study help about the currently focused module.
                </p>
                {#if participation}
                  <p>
                    Choose “Focus AI here” on any module card to retarget the sidebar before you open it.
                  </p>
                {/if}
              </div>
            </section>

            {#if programData.data.events.length}
              <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
                <h2 class="text-lg font-semibold text-slate-950">Linked Events</h2>
                <div class="mt-4 space-y-3">
                  {#each programData.data.events as event (event._id)}
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noreferrer"
                      class="block rounded-[1.25rem] border border-border/60 bg-white px-4 py-3 transition hover:border-coral-200 hover:bg-coral-50/40"
                    >
                      <p class="font-medium text-slate-950">{event.title}</p>
                      <p class="mt-1 text-sm text-slate-600">
                        {new Date(event.startAt).toLocaleString()}
                      </p>
                      {#if event.location}
                        <p class="mt-1 text-sm text-slate-500">{event.location}</p>
                      {/if}
                    </a>
                  {/each}
                </div>
              </section>
            {/if}

            {#if participation?.status === 'completed'}
              <section class="rounded-[2rem] border border-blue-200 bg-blue-50/70 p-6 shadow-warm-sm">
                <div class="flex items-center gap-3">
                  <div class="flex size-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <CheckCircle2 class="size-5" />
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-slate-950">Completed</h2>
                    <p class="text-sm text-slate-600">
                      You’ve completed this program.
                    </p>
                  </div>
                </div>
              </section>
            {/if}
          </div>
        </section>
      </div>
    {/if}
    </main>
  </GradientBg>
</AISidebarProvider>
