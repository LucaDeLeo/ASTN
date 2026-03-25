<script lang="ts">
  import { page } from '$app/state'
  import { format } from 'date-fns'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    AlertCircle,
    Building2,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    Coffee,
    LoaderCircle,
    LogIn,
    MapPin,
    Monitor,
    Printer,
    ScrollText,
    ShowerHead,
    Sparkles,
    Users,
    Wifi,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'

  const AMENITY_ICONS = {
    WiFi: Wifi,
    'External Monitors': Monitor,
    'Coffee/Tea': Coffee,
    Printer,
    Showers: ShowerHead,
  } as const

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  const spaceLanding = useQuery(api.coworkingSpaces.getSpaceLanding, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const membership = useQuery(
    api.orgs.membership.getMembership,
    () =>
      clerkContext.currentUser && spaceLanding.data
        ? {
            orgId: spaceLanding.data.orgId,
          }
        : 'skip',
  )

  const memberSpace = useQuery(
    api.coworkingSpaces.getSpaceByOrgPublic,
    () =>
      clerkContext.currentUser && spaceLanding.data
        ? {
            orgId: spaceLanding.data.orgId,
          }
        : 'skip',
  )

  let selectedDate = $state('')
  let startMinutes = $state(540)
  let endMinutes = $state(1020)
  let workingOn = $state('')
  let interestedInMeeting = $state('')
  let consentChecked = $state(false)
  let isBooking = $state(false)

  const selectedDateObj = $derived(
    selectedDate ? new Date(`${selectedDate}T12:00:00`) : null,
  )
  const selectedDayHours = $derived.by(() => {
    if (!selectedDateObj || !spaceLanding.data) {
      return null
    }
    return (
      spaceLanding.data.operatingHours.find(
        (hours) => hours.dayOfWeek === selectedDateObj.getDay(),
      ) ?? null
    )
  })

  const selectedMonthRange = $derived.by(() => {
    const base = selectedDateObj ?? new Date()
    const start = new Date(base.getFullYear(), base.getMonth(), 1)
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    }
  })

  const capacityData = useQuery(
    api.spaceBookings.getCapacityForDateRange,
    () =>
      memberSpace.data
        ? {
            spaceId: memberSpace.data._id,
            startDate: selectedMonthRange.startDate,
            endDate: selectedMonthRange.endDate,
          }
        : 'skip',
  )

  const attendees = useQuery(
    api.spaceBookings.getBookingAttendees,
    () =>
      memberSpace.data && selectedDate
        ? {
            spaceId: memberSpace.data._id,
            date: selectedDate,
          }
        : 'skip',
  )

  $effect(() => {
    if (!selectedDayHours || selectedDayHours.isClosed) {
      return
    }

    startMinutes = selectedDayHours.openMinutes
    endMinutes = Math.min(selectedDayHours.closeMinutes, selectedDayHours.openMinutes + 480)
  })

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const period = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`
  }

  const timeOptions = $derived.by(() => {
    if (!selectedDayHours || selectedDayHours.isClosed) {
      return []
    }

    const values: Array<number> = []
    for (
      let minutes = selectedDayHours.openMinutes;
      minutes <= selectedDayHours.closeMinutes;
      minutes += 30
    ) {
      values.push(minutes)
    }
    return values
  })

  const selectedCapacity = $derived(
    selectedDate ? capacityData.data?.dates[selectedDate] : undefined,
  )

  const handleBooking = async () => {
    if (!memberSpace.data || !selectedDate || !consentChecked) {
      return
    }

    isBooking = true

    try {
      const result = await convex.mutation(api.spaceBookings.createMemberBooking, {
        spaceId: memberSpace.data._id,
        date: selectedDate,
        startMinutes,
        endMinutes,
        workingOn: workingOn.trim() || undefined,
        interestedInMeeting: interestedInMeeting.trim() || undefined,
        consentToProfileSharing: true,
      })

      if (result.capacityWarning === 'at_capacity') {
        toast.success('Booking confirmed. The space is now at capacity.')
      } else if (result.capacityWarning === 'nearing') {
        toast.success('Booking confirmed. The space is filling up.')
      } else {
        toast.success('Booking confirmed')
      }

      selectedDate = ''
      workingOn = ''
      interestedInMeeting = ''
      consentChecked = false
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to book space')
    } finally {
      isBooking = false
    }
  }
</script>

<svelte:head>
  <title>{spaceLanding.data ? `${spaceLanding.data.spaceName} | ASTN` : 'Space | ASTN'}</title>
</svelte:head>

<GradientBg>
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if spaceLanding.isLoading}
      <div class="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle class="size-8 animate-spin text-slate-400" />
      </div>
    {:else if !spaceLanding.data || !slug}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Building2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Space not found</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This organization doesn’t have a co-working space configured.
        </p>
      </div>
    {:else}
      <div class="mx-auto max-w-5xl space-y-8">
        {#if spaceLanding.data.coverImageUrl}
          <div class="relative overflow-hidden rounded-[2rem]">
            <img
              src={spaceLanding.data.coverImageUrl}
              alt={spaceLanding.data.spaceName}
              class="h-72 w-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent"></div>
            <div class="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p class="text-sm text-white/75">{spaceLanding.data.orgName}</p>
              <h1 class="mt-1 font-display text-3xl">{spaceLanding.data.spaceName}</h1>
              {#if spaceLanding.data.address}
                <p class="mt-2 text-sm text-white/80">
                  {spaceLanding.data.address}
                  {#if spaceLanding.data.addressNote}
                    {' '}• {spaceLanding.data.addressNote}
                  {/if}
                </p>
              {/if}
            </div>
          </div>
        {:else}
          <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <p class="text-sm text-slate-500">{spaceLanding.data.orgName}</p>
            <h1 class="mt-1 font-display text-3xl text-slate-950">{spaceLanding.data.spaceName}</h1>
            {#if spaceLanding.data.address}
              <p class="mt-3 text-sm text-slate-600">
                {spaceLanding.data.address}
                {#if spaceLanding.data.addressNote}
                  {' '}• {spaceLanding.data.addressNote}
                {/if}
              </p>
            {/if}
          </section>
        {/if}

        {#if spaceLanding.data.description}
          <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <p class="text-sm leading-6 text-slate-600">{spaceLanding.data.description}</p>
          </section>
        {/if}

        {#if spaceLanding.data.amenities?.length}
          <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <h2 class="text-lg font-semibold text-slate-950">Amenities</h2>
            <div class="mt-4 flex flex-wrap gap-2">
              {#each spaceLanding.data.amenities as amenity}
                {@const Icon = AMENITY_ICONS[amenity as keyof typeof AMENITY_ICONS] ?? Sparkles}
                <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                  <Icon class="size-4" />
                  {amenity}
                </span>
              {/each}
            </div>
          </section>
        {/if}

        <div class="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <div class="mb-4 flex items-center gap-2">
              <Clock class="size-5 text-coral-600" />
              <h2 class="text-lg font-semibold text-slate-950">Operating hours</h2>
            </div>

            <div class="grid grid-cols-2 gap-2">
              {#each spaceLanding.data.operatingHours.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek) as hours}
                <div class="rounded-xl border border-border/70 bg-slate-50/80 px-3 py-2 text-sm">
                  <div class="font-medium text-slate-800">{DAY_NAMES[hours.dayOfWeek]}</div>
                  <div class="text-slate-500">
                    {#if hours.isClosed}
                      Closed
                    {:else}
                      {formatMinutes(hours.openMinutes)} - {formatMinutes(hours.closeMinutes)}
                    {/if}
                  </div>
                </div>
              {/each}
            </div>

            {#if spaceLanding.data.houseRules}
              <div class="mt-6">
                <div class="mb-2 flex items-center gap-2">
                  <ScrollText class="size-4 text-coral-600" />
                  <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">House rules</h3>
                </div>
                <div class="space-y-2 text-sm leading-6 text-slate-600">
                  {#each spaceLanding.data.houseRules.split('\n').filter(Boolean) as rule}
                    <p>{rule}</p>
                  {/each}
                </div>
              </div>
            {/if}
          </section>

          <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <Calendar class="size-5 text-coral-600" />
                <h2 class="text-lg font-semibold text-slate-950">Book a spot</h2>
              </div>
              {#if clerkContext.currentUser && membership.data}
                <a
                  href={`/org/${slug}/space/bookings`}
                  class="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <CalendarDays class="size-4" />
                  My bookings
                </a>
              {/if}
            </div>

            {#if !clerkContext.isClerkLoaded}
              <div class="flex min-h-[16rem] items-center justify-center">
                <LoaderCircle class="size-6 animate-spin text-slate-400" />
              </div>
            {:else if !clerkContext.currentUser}
              <div class="space-y-4 text-center">
                <p class="text-sm leading-6 text-slate-600">Sign in to book a spot at this space.</p>
                <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <a
                    href="/login"
                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
                  >
                    <LogIn class="size-4" />
                    Sign in
                  </a>
                  {#if spaceLanding.data.guestAccessEnabled}
                    <a
                      href={`/org/${slug}/visit`}
                      class="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Request a visit
                    </a>
                  {/if}
                </div>
              </div>
            {:else if !membership.data}
              <div class="space-y-4 text-center">
                <p class="text-sm leading-6 text-slate-600">
                  Join {spaceLanding.data.orgName} to book a spot.
                </p>
                <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <a
                    href={`/org/${slug}/join`}
                    class="inline-flex items-center justify-center rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
                  >
                    Join organization
                  </a>
                  {#if spaceLanding.data.guestAccessEnabled}
                    <a
                      href={`/org/${slug}/visit`}
                      class="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Request a visit
                    </a>
                  {/if}
                </div>
              </div>
            {:else if !memberSpace.data}
              <div class="text-sm text-slate-600">Unable to load member booking details.</div>
            {:else}
              <div class="space-y-4">
                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-slate-800">Date</span>
                  <input
                    type="date"
                    bind:value={selectedDate}
                    class="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  />
                </label>

                {#if selectedDate && selectedDayHours?.isClosed}
                  <div class="flex items-start gap-2 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <AlertCircle class="mt-0.5 size-4 shrink-0" />
                    <span>This space is closed on the selected date.</span>
                  </div>
                {/if}

                {#if selectedCapacity}
                  <div class="flex items-center gap-2 rounded-[1.25rem] border border-border/70 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <Users class="size-4 text-slate-500" />
                    <span>
                      {selectedCapacity.count} / {capacityData.data?.capacity ?? spaceLanding.data.capacity} booked
                    </span>
                    {#if selectedCapacity.status !== 'available'}
                      <span class={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                        selectedCapacity.status === 'at_capacity'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {selectedCapacity.status === 'at_capacity' ? 'At capacity' : 'Filling up'}
                      </span>
                    {/if}
                  </div>
                {/if}

                <div class="grid gap-4 sm:grid-cols-2">
                  <label class="block">
                    <span class="mb-1 block text-sm font-medium text-slate-800">Start time</span>
                    <select
                      bind:value={startMinutes}
                      class="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                    >
                      {#each timeOptions as option}
                        <option value={option}>{formatMinutes(option)}</option>
                      {/each}
                    </select>
                  </label>

                  <label class="block">
                    <span class="mb-1 block text-sm font-medium text-slate-800">End time</span>
                    <select
                      bind:value={endMinutes}
                      class="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                    >
                      {#each timeOptions.filter((option) => option > startMinutes) as option}
                        <option value={option}>{formatMinutes(option)}</option>
                      {/each}
                    </select>
                  </label>
                </div>

                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-slate-800">Can help with</span>
                  <textarea
                    bind:value={workingOn}
                    rows={2}
                    maxlength={140}
                    placeholder="e.g. ML expertise, grant writing, research feedback"
                    class="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  ></textarea>
                </label>

                <label class="block">
                  <span class="mb-1 block text-sm font-medium text-slate-800">Looking to meet</span>
                  <textarea
                    bind:value={interestedInMeeting}
                    rows={2}
                    maxlength={140}
                    placeholder="e.g. policy collaborators, startup operators, other researchers"
                    class="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  ></textarea>
                </label>

                <label class="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    bind:checked={consentChecked}
                    class="mt-0.5 rounded border-slate-300"
                  />
                  <span>I agree that others booked that day can view my profile details.</span>
                </label>

                <button
                  type="button"
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600 disabled:pointer-events-none disabled:opacity-50"
                  disabled={!selectedDate || !consentChecked || isBooking || !!selectedDayHours?.isClosed}
                  onclick={() => {
                    void handleBooking()
                  }}
                >
                  {#if isBooking}
                    <LoaderCircle class="size-4 animate-spin" />
                    Booking...
                  {:else}
                    <CheckCircle2 class="size-4" />
                    Confirm booking
                  {/if}
                </button>

                {#if attendees.data?.length}
                  <div class="rounded-[1.25rem] border border-border/70 bg-slate-50 px-4 py-4">
                    <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Others booked that day
                    </h3>
                    <div class="space-y-3">
                      {#each attendees.data as attendee}
                        <div class="rounded-xl border border-border/70 bg-white px-4 py-3 text-sm">
                          <div class="font-medium text-slate-900">
                            {attendee.profile?.name ?? 'Anonymous member'}
                          </div>
                          {#if attendee.profile?.headline}
                            <div class="mt-1 text-slate-500">{attendee.profile.headline}</div>
                          {/if}
                          {#if attendee.workingOn}
                            <div class="mt-2 text-slate-700">
                              <strong>Can help with:</strong> {attendee.workingOn}
                            </div>
                          {/if}
                          {#if attendee.interestedInMeeting}
                            <div class="mt-1 text-slate-700">
                              <strong>Looking to meet:</strong> {attendee.interestedInMeeting}
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </section>
        </div>
      </div>
    {/if}
  </main>
</GradientBg>
