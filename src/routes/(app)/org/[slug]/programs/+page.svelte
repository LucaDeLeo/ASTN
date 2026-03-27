<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { Building2, GraduationCap } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { programStatusColors, programTypeLabels } from '$lib/program-constants'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import { formatProgramDateRange } from '~/components/public-org/utils'

  const clerkContext = getClerkContext()
  const slug = $derived(page.params.slug ?? null)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const myPrograms = useQuery(api.programs.getMyPrograms, () =>
    clerkContext.currentUser && org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )
</script>

<svelte:head>
  <title>{org.data ? `${org.data.name} Programs | ASTN` : 'Programs | ASTN'}</title>
</svelte:head>

<GradientBg>
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if org.isLoading || !clerkContext.isClerkLoaded}
      <div class="mx-auto max-w-4xl space-y-6">
        <div class="h-20 animate-pulse rounded-[2rem] bg-slate-100"></div>
        <div class="h-72 animate-pulse rounded-[2rem] bg-slate-100"></div>
      </div>
    {:else if !org.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Building2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
      </div>
    {:else}
      <div class="mx-auto max-w-4xl space-y-6">
        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <div class="flex items-center gap-4">
            {#if org.data.logoUrl}
              <img
                src={org.data.logoUrl}
                alt={org.data.name}
                class="size-12 rounded-2xl object-cover"
              />
            {:else}
              <div class="flex size-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
                <Building2 class="size-6" />
              </div>
            {/if}

            <div>
              <div class="flex items-center gap-2 text-sm text-slate-500">
                <a href={`/org/${page.params.slug}`} class="transition hover:text-slate-700">
                  {org.data.name}
                </a>
                <span>/</span>
                <span class="text-slate-700">Programs</span>
              </div>
              <h1 class="mt-1 font-display text-2xl text-slate-950">
                <GraduationCap class="mr-2 inline-block size-5 -translate-y-0.5" />
                My Programs
              </h1>
            </div>
          </div>
        </section>

        {#if !clerkContext.currentUser}
          <div class="rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
            <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-coral-50 text-coral-600">
              <GraduationCap class="size-8" />
            </div>
            <h2 class="font-display text-3xl text-slate-950">Sign in to view programs</h2>
            <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Program pages are only available to signed-in participants and
              organization members.
            </p>
            <a
              href="/login"
              class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
            >
              Sign in
            </a>
          </div>
        {:else if myPrograms.isLoading}
          <div class="space-y-3">
            {#each Array.from({ length: 2 }) as _, index (`loading-${index}`)}
              <div class="h-24 animate-pulse rounded-[1.5rem] bg-slate-100"></div>
            {/each}
          </div>
        {:else if !myPrograms.data?.length}
          <div class="rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
            <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <GraduationCap class="size-8" />
            </div>
            <h2 class="text-xl font-semibold text-slate-950">No programs yet</h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              You’re not enrolled in any programs for this organization.
            </p>
          </div>
        {:else}
          <div class="grid gap-4 sm:grid-cols-2">
            {#each myPrograms.data as program (program._id)}
              <a
                href={`/org/${page.params.slug}/program/${program.slug}`}
                class="group rounded-[1.5rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm transition hover:-translate-y-0.5 hover:shadow-warm-md"
              >
                <div class="flex items-start justify-between gap-3">
                  <h2 class="text-base font-semibold text-slate-950 transition group-hover:text-coral-700">
                    {program.name}
                  </h2>
                  <span class={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${programStatusColors[program.status]}`}>
                    {program.status}
                  </span>
                </div>

                <p class="mt-2 text-sm text-slate-500">
                  {programTypeLabels[program.type]}
                </p>

                {#if formatProgramDateRange(program.startDate, program.endDate)}
                  <p class="mt-2 text-sm text-slate-500">
                    {formatProgramDateRange(program.startDate, program.endDate)}
                  </p>
                {/if}

                {#if program.description}
                  <p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {program.description}
                  </p>
                {/if}

                {#if program.participationStatus === 'completed'}
                  <div class="mt-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Completed
                  </div>
                {/if}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </main>
</GradientBg>
