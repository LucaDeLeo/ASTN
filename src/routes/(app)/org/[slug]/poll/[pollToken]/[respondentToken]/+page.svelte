<script lang="ts">
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { Check, CheckCircle2, Clock, LoaderCircle, Lock } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import AvailabilityGrid from '~/components/public-org/AvailabilityGrid.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'

  type SlotStatus = 'available' | 'maybe'

  const convex = useConvexClient()
  const respondentToken = $derived(page.params.respondentToken ?? null)

  const pollData = useQuery(api.availabilityPolls.getPollByRespondentToken, () =>
    respondentToken
      ? {
          respondentToken,
        }
      : 'skip',
  )

  const existingResponse = useQuery(
    api.availabilityPolls.getResponseByRespondent,
    () =>
      pollData.data
        ? {
            pollId: pollData.data.poll._id,
            respondentId: pollData.data.respondentId,
          }
        : 'skip',
  )

  let slots = $state<Record<string, SlotStatus>>({})
  let slotsInitialized = $state(false)
  let saveStatus = $state<'idle' | 'saving' | 'saved'>('idle')
  let saveTimeout: ReturnType<typeof setTimeout> | undefined
  let hasUserEdited = $state(false)

  $effect(() => {
    if (!slotsInitialized && existingResponse.data !== undefined) {
      slots = (existingResponse.data?.slots as Record<string, SlotStatus> | undefined) ?? {}
      slotsInitialized = true
    }
  })

  const handleSlotsChange = (nextSlots: Record<string, SlotStatus>) => {
    hasUserEdited = true
    slots = nextSlots
  }

  const saveSlots = async (slotsToSave: Record<string, SlotStatus>) => {
    if (!pollData.data) return
    saveStatus = 'saving'

    try {
      await convex.mutation(api.availabilityPolls.submitResponse, {
        pollId: pollData.data.poll._id,
        respondentId: pollData.data.respondentId,
        slots: slotsToSave,
      })
      saveStatus = 'saved'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save response')
      saveStatus = 'idle'
    }
  }

  $effect(() => {
    if (!slotsInitialized || !hasUserEdited) return

    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    const nextSlots = { ...slots }
    saveTimeout = setTimeout(() => {
      void saveSlots(nextSlots)
    }, 800)

    return () => {
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  })

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return m === 0
      ? `${h12}:00 ${period}`
      : `${h12}:${String(m).padStart(2, '0')} ${period}`
  }

  const pageTitle = $derived(
    pollData.data
      ? `${pollData.data.poll.title} | ${pollData.data.org.name} | ASTN`
      : 'Availability Poll | ASTN',
  )
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<GradientBg>
  <main class="container mx-auto px-4 py-8">
    {#if pollData.isLoading}
      <div class="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle class="size-8 animate-spin text-slate-400" />
      </div>
    {:else if !pollData.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <Clock class="mx-auto mb-4 size-8 text-slate-400" />
        <h1 class="font-display text-3xl text-slate-950">Poll not found</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This poll link may be invalid or expired.
        </p>
      </div>
    {:else if pollData.data.poll.status === 'finalized' && pollData.data.poll.finalizedSlot}
      <div class="mx-auto max-w-3xl space-y-6">
        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <p class="text-sm text-slate-500">{pollData.data.org.name}</p>
          <h1 class="mt-1 font-display text-3xl text-slate-950">
            {pollData.data.poll.title}
          </h1>
          <p class="mt-2 text-sm text-slate-600">{pollData.data.opportunity.title}</p>
        </section>

        <section class="rounded-[2rem] border border-blue-200 bg-blue-50 p-5">
          <div class="flex items-center gap-2 font-semibold text-blue-900">
            <CheckCircle2 class="size-5" />
            Time finalized
          </div>
          <p class="mt-2 text-sm text-blue-800">
            {pollData.data.poll.finalizedSlot.date} at
            {' '}
            {formatTime(pollData.data.poll.finalizedSlot.startMinutes)} -
            {formatTime(pollData.data.poll.finalizedSlot.endMinutes)}
            {' '}({pollData.data.poll.timezone})
          </p>
        </section>

        <AvailabilityGrid
          startDate={pollData.data.poll.startDate}
          endDate={pollData.data.poll.endDate}
          startMinutes={pollData.data.poll.startMinutes}
          endMinutes={pollData.data.poll.endMinutes}
          slotDurationMinutes={pollData.data.poll.slotDurationMinutes}
          slots={slots}
          onSlotsChange={() => {}}
          readOnly
          finalizedSlot={pollData.data.poll.finalizedSlot}
        />
      </div>
    {:else if pollData.data.poll.status === 'closed'}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <Lock class="mx-auto mb-4 size-8 text-slate-400" />
        <h1 class="font-display text-3xl text-slate-950">Poll closed</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This availability poll is no longer accepting responses.
        </p>
      </div>
    {:else}
      <div class="mx-auto max-w-4xl space-y-6">
        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <p class="text-sm text-slate-500">{pollData.data.org.name}</p>
          <h1 class="mt-1 font-display text-3xl text-slate-950">
            {pollData.data.poll.title}
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            {pollData.data.opportunity.title} · Timezone:
            {' '}
            {pollData.data.poll.timezone.replace(/_/g, ' ')}
          </p>
          <p class="mt-2 text-sm text-slate-800">
            Responding as: <strong>{pollData.data.respondentName}</strong>
          </p>
        </section>

        <AvailabilityGrid
          startDate={pollData.data.poll.startDate}
          endDate={pollData.data.poll.endDate}
          startMinutes={pollData.data.poll.startMinutes}
          endMinutes={pollData.data.poll.endMinutes}
          slotDurationMinutes={pollData.data.poll.slotDurationMinutes}
          slots={slots}
          onSlotsChange={handleSlotsChange}
        />

        <div class="flex items-center justify-end text-sm text-slate-500">
          {#if saveStatus === 'saving'}
            <span class="flex items-center gap-1.5">
              <LoaderCircle class="size-3.5 animate-spin" />
              Saving...
            </span>
          {:else if saveStatus === 'saved'}
            <span class="flex items-center gap-1.5 text-green-600">
              <Check class="size-3.5" />
              Saved
            </span>
          {/if}
        </div>
      </div>
    {/if}
  </main>
</GradientBg>
