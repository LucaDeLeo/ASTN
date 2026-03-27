<script lang="ts">
  import { page } from '$app/state'
  import { format, isBefore, startOfDay } from 'date-fns'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    ArrowLeft,
    Building2,
    Calendar,
    CalendarDays,
    LoaderCircle,
    MapPin,
    Shield,
    Trash2,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import type { Doc } from '$convex/_generated/dataModel'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const membership = useQuery(
    api.orgs.membership.getMembership,
    () =>
      org.data
        ? {
            orgId: org.data._id,
          }
        : 'skip',
  )

  const space = useQuery(
    api.coworkingSpaces.getSpaceByOrgPublic,
    () =>
      org.data && membership.data
        ? {
            orgId: org.data._id,
          }
        : 'skip',
  )

  const bookings = useQuery(
    api.spaceBookings.getMyBookings,
    () =>
      space.data
        ? {
            spaceId: space.data._id,
          }
        : 'skip',
  )

  let cancellingId = $state<string | null>(null)

  const today = startOfDay(new Date())
  const upcomingBookings = $derived(
    (bookings.data ?? []).filter((booking) => !isBefore(new Date(booking.date), today)),
  )
  const pastBookings = $derived(
    (bookings.data ?? []).filter((booking) => isBefore(new Date(booking.date), today)),
  )

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`
  }

  const cancelBooking = async (bookingId: Doc<'spaceBookings'>['_id']) => {
    cancellingId = bookingId
    try {
      await convex.mutation(api.spaceBookings.cancelBooking, { bookingId })
      toast.success('Booking cancelled')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking')
    } finally {
      cancellingId = null
    }
  }
</script>

<svelte:head>
  <title>{org.data ? `${org.data.name} Bookings | ASTN` : 'My Bookings | ASTN'}</title>
</svelte:head>

<GradientBg>
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if org.isLoading || membership.isLoading}
      <div class="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle class="size-8 animate-spin text-slate-400" />
      </div>
    {:else if !org.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Building2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
      </div>
    {:else if !membership.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Shield class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Membership required</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Join this organization to view and manage space bookings.
        </p>
      </div>
    {:else if !space.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400">
          <MapPin class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">No space configured</h1>
      </div>
    {:else}
      <div class="mx-auto max-w-4xl space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <a
              href={`/org/${slug}/space`}
              class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft class="size-4" />
              Back to {space.data.name}
            </a>
            <h1 class="mt-3 font-display text-3xl text-slate-950">My Bookings</h1>
          </div>
          <a
            href={`/org/${slug}/space`}
            class="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <CalendarDays class="size-4" />
            Book another day
          </a>
        </div>

        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <div class="mb-4 flex items-center gap-2">
            <Calendar class="size-5 text-coral-600" />
            <h2 class="text-lg font-semibold text-slate-950">Upcoming bookings</h2>
          </div>

          {#if upcomingBookings.length === 0}
            <p class="text-sm text-slate-600">You have no upcoming bookings.</p>
          {:else}
            <div class="space-y-3">
              {#each upcomingBookings as booking}
                <div class="rounded-[1.25rem] border border-border/70 bg-slate-50/70 px-4 py-4">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="space-y-1">
                      <div class="font-medium text-slate-900">
                        {format(new Date(booking.date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div class="text-sm text-slate-500">
                        {formatMinutes(booking.startMinutes)} - {formatMinutes(booking.endMinutes)}
                      </div>
                      {#if booking.workingOn}
                        <div class="pt-1 text-sm text-slate-700">
                          <strong>Can help with:</strong> {booking.workingOn}
                        </div>
                      {/if}
                      {#if booking.interestedInMeeting}
                        <div class="text-sm text-slate-700">
                          <strong>Looking to meet:</strong> {booking.interestedInMeeting}
                        </div>
                      {/if}
                    </div>

                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50"
                      disabled={cancellingId === booking._id}
                      onclick={() => {
                        void cancelBooking(booking._id)
                      }}
                    >
                      {#if cancellingId === booking._id}
                        <LoaderCircle class="size-4 animate-spin" />
                        Cancelling...
                      {:else}
                        <Trash2 class="size-4" />
                        Cancel
                      {/if}
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>

        {#if pastBookings.length > 0}
          <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <div class="mb-4 flex items-center gap-2">
              <Calendar class="size-5 text-slate-400" />
              <h2 class="text-lg font-semibold text-slate-950">Past bookings</h2>
            </div>

            <div class="space-y-3">
              {#each pastBookings as booking}
                <div class="rounded-[1.25rem] border border-border/70 bg-slate-50/70 px-4 py-4">
                  <div class="font-medium text-slate-900">
                    {format(new Date(booking.date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div class="mt-1 text-sm text-slate-500">
                    {formatMinutes(booking.startMinutes)} - {formatMinutes(booking.endMinutes)}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    {/if}
  </main>
</GradientBg>
