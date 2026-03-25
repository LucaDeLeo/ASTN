<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import {
    Building2,
    Calendar,
    Clock,
    ExternalLink,
    MapPin,
    Video,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import { formatEventDate } from '$lib/format-event-date'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  const slug = $derived(page.params.slug ?? null)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const events = useQuery(api.events.queries.getOrgEvents, () =>
    org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const hasEvents = $derived(
    Boolean(
      events.data &&
        (events.data.upcoming.length > 0 || events.data.past.length > 0),
    ),
  )
</script>

<svelte:head>
  <title>{org.data ? `${org.data.name} Events | ASTN` : 'Events | ASTN'}</title>
</svelte:head>

<GradientBg>
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if org.isLoading}
      <div class="mx-auto max-w-4xl space-y-6">
        <div class="h-20 animate-pulse rounded-[2rem] bg-slate-100"></div>
        <div class="h-[34rem] animate-pulse rounded-[2rem] bg-slate-100"></div>
      </div>
    {:else if !org.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Building2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This organization doesn’t exist or the link is incorrect.
        </p>
      </div>
    {:else}
      <div class="mx-auto max-w-4xl space-y-6">
        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                  <span class="text-slate-700">Events</span>
                </div>
                <h1 class="mt-1 font-display text-2xl text-slate-950">
                  <Calendar class="mr-2 inline-block size-5 -translate-y-0.5" />
                  Events Calendar
                </h1>
              </div>
            </div>

            {#if org.data.lumaCalendarUrl}
              <a
                href={org.data.lumaCalendarUrl}
                target="_blank"
                rel="noreferrer"
                class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                View on lu.ma
                <ExternalLink class="size-4" />
              </a>
            {/if}
          </div>
        </section>

        {#if events.isLoading}
          <div class="space-y-3">
            {#each Array.from({ length: 3 }) as _, index (`loading-${index}`)}
              <div class="h-24 animate-pulse rounded-[1.5rem] bg-slate-100"></div>
            {/each}
          </div>
        {:else if hasEvents}
          <div class="space-y-8">
            {#if events.data?.upcoming.length}
              <section>
                <h2 class="mb-3 text-lg font-semibold text-slate-950">
                  Upcoming events
                </h2>
                <div class="space-y-3">
                  {#each events.data.upcoming as event (event._id)}
                    <a
                      href={`https://lu.ma/${event.url}`}
                      target="_blank"
                      rel="noreferrer"
                      class="group block rounded-[1.5rem] border border-border/70 bg-white/92 p-4 shadow-warm-sm transition hover:-translate-y-0.5 hover:shadow-warm-md"
                    >
                      <div class="flex gap-4">
                        {#if event.coverUrl}
                          <img
                            src={event.coverUrl}
                            alt=""
                            class="size-20 rounded-2xl object-cover"
                          />
                        {/if}

                        <div class="min-w-0 flex-1">
                          <div class="flex items-start justify-between gap-3">
                            <h3 class="text-base font-semibold text-slate-950 transition group-hover:text-coral-700">
                              {event.title}
                            </h3>
                            <ExternalLink class="mt-0.5 size-4 shrink-0 text-slate-400" />
                          </div>
                          <div class="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                            <Clock class="size-3.5 shrink-0" />
                            <span>{formatEventDate(event.startAt, event.endAt, event.timezone)}</span>
                          </div>
                          {#if event.location}
                            <div class="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                              <MapPin class="size-3.5 shrink-0" />
                              <span class="truncate">{event.location}</span>
                            </div>
                          {/if}
                          {#if event.isVirtual}
                            <div class="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                              <Video class="size-3.5 shrink-0" />
                              <span>Online event</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                    </a>
                  {/each}
                </div>
              </section>
            {/if}

            {#if events.data?.past.length}
              <section>
                <h2 class="mb-3 text-lg font-semibold text-slate-500">
                  Past events
                </h2>
                <div class="space-y-3 opacity-80">
                  {#each events.data.past as event (event._id)}
                    <a
                      href={`https://lu.ma/${event.url}`}
                      target="_blank"
                      rel="noreferrer"
                      class="group block rounded-[1.5rem] border border-border/70 bg-white/92 p-4 shadow-warm-sm transition hover:shadow-warm-md"
                    >
                      <div class="flex gap-4">
                        {#if event.coverUrl}
                          <img
                            src={event.coverUrl}
                            alt=""
                            class="size-20 rounded-2xl object-cover"
                          />
                        {/if}

                        <div class="min-w-0 flex-1">
                          <div class="flex items-start justify-between gap-3">
                            <h3 class="text-base font-semibold text-slate-950">
                              {event.title}
                            </h3>
                            <ExternalLink class="mt-0.5 size-4 shrink-0 text-slate-400" />
                          </div>
                          <div class="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                            <Clock class="size-3.5 shrink-0" />
                            <span>{formatEventDate(event.startAt, event.endAt, event.timezone)}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  {/each}
                </div>
              </section>
            {/if}
          </div>
        {:else}
          <div class="rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
            <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Calendar class="size-8" />
            </div>
            <h2 class="text-xl font-semibold text-slate-950">No events yet</h2>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              This organization hasn’t set up their event calendar yet.
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</GradientBg>
