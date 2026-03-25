<script lang="ts">
  import { goto } from '$app/navigation'
  import { format } from 'date-fns'
  import { useQuery } from 'convex-svelte'
  import {
    ArrowLeft,
    CalendarCheck,
    MapPin,
    MessageSquare,
    Monitor,
    Star,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  const clerkContext = getClerkContext()
  const attendance = useQuery(
    api.attendance.queries.getMyAttendanceHistory,
    () => (clerkContext.currentUser ? { limit: 50 } : 'skip'),
  )

  $effect(() => {
    if (clerkContext.isClerkLoaded && !clerkContext.currentUser) {
      void goto('/login')
    }
  })
</script>

<svelte:head>
  <title>Attendance History | ASTN</title>
</svelte:head>

<GradientBg variant="subtle">
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if attendance.isLoading}
      <div class="flex min-h-[calc(100vh-65px)] items-center justify-center">
        <Spinner />
      </div>
    {:else}
      <div class="mx-auto max-w-3xl">
        <a
          href="/profile"
          class="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft class="size-4" />
          Back to profile
        </a>

        <div class="mb-6 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-full bg-coral-100 text-coral-700">
            <CalendarCheck class="size-5" />
          </div>
          <h1 class="font-display text-3xl text-slate-950">Attendance history</h1>
        </div>

        {#if !attendance.data?.length}
          <section class="rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
            <CalendarCheck class="mx-auto mb-4 size-12 text-slate-300" />
            <h2 class="text-lg font-medium text-foreground">No events attended yet</h2>
            <p class="mt-2 text-slate-500">
              Your attendance history will appear here after you attend events
              from organizations you follow.
            </p>
            <a
              href="/orgs"
              class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
            >
              Browse organizations
            </a>
          </section>
        {:else}
          <div class="space-y-4">
            {#each attendance.data as record}
              <section class="rounded-[1.5rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate font-semibold text-foreground">
                      {record.event.title}
                    </h3>
                    {#if record.org}
                      <p class="mt-0.5 text-sm text-slate-500">{record.org.name}</p>
                    {/if}

                    <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span>{format(record.event.startAt, 'EEE, MMM d, yyyy')}</span>
                      <span class="flex items-center gap-1">
                        {#if record.event.isVirtual}
                          <Monitor class="size-3.5" />
                          Online
                        {:else}
                          <MapPin class="size-3.5" />
                          {record.event.location || 'In person'}
                        {/if}
                      </span>
                    </div>

                    {#if record.feedbackRating}
                      <div class="mt-3 border-t border-slate-100 pt-3">
                        <div class="flex items-center gap-2">
                          <div class="flex items-center gap-0.5">
                            {#each [1, 2, 3, 4, 5] as star}
                              <Star
                                class={`size-4 ${
                                  star <= record.feedbackRating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            {/each}
                          </div>
                          {#if record.feedbackText}
                            <MessageSquare class="size-4 text-slate-400" />
                          {/if}
                        </div>

                        {#if record.feedbackText}
                          <p class="mt-1.5 line-clamp-2 text-sm text-slate-600">
                            {record.feedbackText}
                          </p>
                        {/if}
                      </div>
                    {/if}
                  </div>

                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {record.status}
                  </span>
                </div>
              </section>
            {/each}
          </div>
        {/if}

        {#if attendance.data?.length}
          <div class="mt-8 text-center text-sm text-slate-500">
            Attendance visibility is controlled in
            {' '}
            <a href="/settings" class="text-coral-700 hover:underline">Settings</a>.
          </div>
        {/if}
      </div>
    {/if}
  </main>
</GradientBg>
