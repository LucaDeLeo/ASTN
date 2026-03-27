<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    LoaderCircle,
    MapPin,
  } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import {
    buildTimeOptions,
    formatDateLabel,
    formatMinutes,
    getDayOfWeek,
    todayDateString,
  } from '~/components/public-org/utils'

  type SpaceInfo = {
    spaceId: Id<'coworkingSpaces'>
    spaceName: string
    orgId: Id<'organizations'>
    orgName: string
    orgSlug?: string
    capacity: number
    timezone: string
    operatingHours: Array<{
      dayOfWeek: number
      openMinutes: number
      closeMinutes: number
      isClosed: boolean
    }>
    customVisitFields: Array<{
      fieldId: string
      label: string
      type: 'text' | 'textarea' | 'select' | 'checkbox'
      required: boolean
      options?: Array<string>
      placeholder?: string
    }>
  }

  let { spaceInfo }: { spaceInfo: SpaceInfo } = $props()

  const convex = useConvexClient()
  const existingGuestProfile = useQuery(api.guestProfiles.getGuestProfile)

  let selectedDate = $state('')
  let startMinutes = $state(540)
  let endMinutes = $state(1020)
  let consentChecked = $state(false)
  let isSubmitting = $state(false)
  let isSuccess = $state(false)
  let guestName = $state('')
  let guestEmail = $state('')
  let guestPhone = $state('')
  let guestOrganization = $state('')
  let guestTitle = $state('')
  let customResponses = $state<Record<string, string>>({})
  let hasPrefilled = $state(false)

  const minDate = todayDateString()

  const selectedDayHours = $derived.by(() => {
    if (!selectedDate) return null
    return (
      spaceInfo.operatingHours.find(
        (hours) => hours.dayOfWeek === getDayOfWeek(selectedDate),
      ) ?? null
    )
  })

  const timeOptions = $derived.by(() => {
    if (!selectedDayHours || selectedDayHours.isClosed) return []
    return buildTimeOptions(
      selectedDayHours.openMinutes,
      selectedDayHours.closeMinutes,
    )
  })

  $effect(() => {
    if (hasPrefilled || existingGuestProfile.data === undefined) {
      return
    }

    const profile = existingGuestProfile.data
    if (profile) {
      guestName = profile.name ?? ''
      guestEmail = profile.email ?? ''
      guestPhone = profile.phone ?? ''
      guestOrganization = profile.organization ?? ''
      guestTitle = profile.title ?? ''
    }

    hasPrefilled = true
  })

  $effect(() => {
    if (!selectedDayHours || selectedDayHours.isClosed) {
      return
    }

    startMinutes = selectedDayHours.openMinutes
    endMinutes = selectedDayHours.closeMinutes
  })

  const updateCustomResponse = (fieldId: string, value: string) => {
    customResponses = {
      ...customResponses,
      [fieldId]: value,
    }
  }

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()

    if (!selectedDate || !guestName.trim() || !guestEmail.trim()) {
      toast.error('Please fill in the required fields')
      return
    }

    if (!selectedDayHours || selectedDayHours.isClosed) {
      toast.error('Please choose a date when the space is open')
      return
    }

    if (!consentChecked) {
      toast.error('Please confirm profile sharing consent')
      return
    }

    for (const field of spaceInfo.customVisitFields) {
      const response = customResponses[field.fieldId]
      if (field.required && (!response || !response.trim())) {
        toast.error(`Please fill in "${field.label}"`)
        return
      }
    }

    isSubmitting = true

    try {
      await convex.mutation(api.guestBookings.submitVisitApplication, {
        spaceId: spaceInfo.spaceId,
        date: selectedDate,
        startMinutes,
        endMinutes,
        consentToProfileSharing: consentChecked,
        customFieldResponses: Object.entries(customResponses).map(
          ([fieldId, value]) => ({
            fieldId,
            value,
          }),
        ),
        guestInfo: {
          name: guestName.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim() || undefined,
          organization: guestOrganization.trim() || undefined,
          title: guestTitle.trim() || undefined,
        },
      })

      isSuccess = true
      toast.success('Visit application submitted')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit application',
      )
    } finally {
      isSubmitting = false
    }
  }
</script>

{#if !hasPrefilled}
  <div class="flex min-h-[24rem] items-center justify-center">
    <LoaderCircle class="size-8 animate-spin text-slate-400" />
  </div>
{:else if isSuccess}
  <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
    <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-50 text-green-600">
      <CheckCircle2 class="size-8" />
    </div>
    <h2 class="font-display text-3xl text-slate-950">Application Submitted</h2>
    <p class="mt-3 text-sm leading-6 text-slate-600">
      Your visit request for {spaceInfo.spaceName} is pending review. We’ll
      notify you when it’s approved.
    </p>
    {#if selectedDate}
      <div class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div class="font-medium">{formatDateLabel(selectedDate)}</div>
        <div class="mt-1 text-slate-500">
          {formatMinutes(startMinutes)} - {formatMinutes(endMinutes)}
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="mx-auto max-w-5xl">
    <section class="mb-6 rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <div class="flex items-center gap-4">
        <div class="flex size-12 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
          <Building2 class="size-6" />
        </div>
        <div>
          <h1 class="font-display text-2xl text-slate-950">
            Visit {spaceInfo.orgName}
          </h1>
          <p class="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <MapPin class="size-4" />
            {spaceInfo.spaceName}
          </p>
        </div>
      </div>
    </section>

    <form class="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" onsubmit={submit}>
      <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-5 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Calendar class="size-4 text-coral-600" />
          Choose your visit
        </div>

        <div class="space-y-5">
          <div>
            <label for="visit-date" class="mb-2 block text-sm font-medium text-slate-900">
              Visit date
            </label>
            <input
              id="visit-date"
              bind:value={selectedDate}
              type="date"
              min={minDate}
              class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              required
            />
            {#if selectedDate && (!selectedDayHours || selectedDayHours.isClosed)}
              <p class="mt-2 text-sm text-rose-600">
                The space is closed on that day. Please choose another date.
              </p>
            {/if}
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="visit-start" class="mb-2 block text-sm font-medium text-slate-900">
                Start time
              </label>
              <select
                id="visit-start"
                bind:value={startMinutes}
                class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                disabled={!timeOptions.length}
              >
                {#each timeOptions.slice(0, Math.max(timeOptions.length - 1, 0)) as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="visit-end" class="mb-2 block text-sm font-medium text-slate-900">
                End time
              </label>
              <select
                id="visit-end"
                bind:value={endMinutes}
                class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                disabled={!timeOptions.length}
              >
                {#each timeOptions.slice(1) as option (option.value)}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>

          {#if selectedDate && selectedDayHours && !selectedDayHours.isClosed}
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Operating hours for that day:
              <span class="font-medium text-slate-900">
                {formatMinutes(selectedDayHours.openMinutes)} - {formatMinutes(selectedDayHours.closeMinutes)}
              </span>
            </div>
          {/if}
        </div>
      </section>

      <section class="space-y-6">
        <div class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <h2 class="text-lg font-semibold text-slate-950">Your information</h2>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label for="guest-name" class="mb-2 block text-sm font-medium text-slate-900">
                Name *
              </label>
              <input
                id="guest-name"
                bind:value={guestName}
                type="text"
                required
                class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label for="guest-email" class="mb-2 block text-sm font-medium text-slate-900">
                Email *
              </label>
              <input
                id="guest-email"
                bind:value={guestEmail}
                type="email"
                required
                class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label for="guest-phone" class="mb-2 block text-sm font-medium text-slate-900">
                Phone
              </label>
              <input
                id="guest-phone"
                bind:value={guestPhone}
                type="tel"
                class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label for="guest-organization" class="mb-2 block text-sm font-medium text-slate-900">
                Organization
              </label>
              <input
                id="guest-organization"
                bind:value={guestOrganization}
                type="text"
                class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                placeholder="Your institution"
              />
            </div>
          </div>

          <div class="mt-4">
            <label for="guest-title" class="mb-2 block text-sm font-medium text-slate-900">
              Title or role
            </label>
            <input
              id="guest-title"
              bind:value={guestTitle}
              type="text"
              class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              placeholder="Researcher, student, founder, etc."
            />
          </div>
        </div>

        {#if spaceInfo.customVisitFields.length > 0}
          <div class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <h2 class="text-lg font-semibold text-slate-950">
              Additional information
            </h2>

            <div class="mt-5 space-y-4">
              {#each spaceInfo.customVisitFields as field (field.fieldId)}
                <div>
                  <label class="mb-2 block text-sm font-medium text-slate-900" for={field.fieldId}>
                    {field.label}{field.required ? ' *' : ''}
                  </label>

                  {#if field.type === 'textarea'}
                    <textarea
                      id={field.fieldId}
                      rows="4"
                      value={customResponses[field.fieldId] ?? ''}
                      oninput={(event) =>
                        updateCustomResponse(
                          field.fieldId,
                          (event.currentTarget as HTMLTextAreaElement).value,
                        )}
                      class="min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                      placeholder={field.placeholder}
                    ></textarea>
                  {:else if field.type === 'select'}
                    <select
                      id={field.fieldId}
                      value={customResponses[field.fieldId] ?? ''}
                      onchange={(event) =>
                        updateCustomResponse(
                          field.fieldId,
                          (event.currentTarget as HTMLSelectElement).value,
                        )}
                      class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                    >
                      <option value="">Select an option</option>
                      {#each field.options ?? [] as option (option)}
                        <option value={option}>{option}</option>
                      {/each}
                    </select>
                  {:else if field.type === 'checkbox'}
                    <label class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={customResponses[field.fieldId] === 'true'}
                        onchange={(event) =>
                          updateCustomResponse(
                            field.fieldId,
                            (event.currentTarget as HTMLInputElement).checked
                              ? 'true'
                              : '',
                          )}
                        class="mt-0.5 size-4 rounded border-slate-300 text-coral-500"
                      />
                      <span>{field.placeholder || field.label}</span>
                    </label>
                  {:else}
                    <input
                      id={field.fieldId}
                      type="text"
                      value={customResponses[field.fieldId] ?? ''}
                      oninput={(event) =>
                        updateCustomResponse(
                          field.fieldId,
                          (event.currentTarget as HTMLInputElement).value,
                        )}
                      class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                      placeholder={field.placeholder}
                    />
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label class="flex items-start gap-3 text-sm leading-6 text-slate-700">
              <input
                bind:checked={consentChecked}
                type="checkbox"
                class="mt-1 size-4 rounded border-slate-300 text-coral-500"
              />
              <span>
                I agree that my name and basic info may be shared with other
                visitors on the same day.
              </span>
            </label>
          </div>

          <button
            type="submit"
            class="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-coral-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <LoaderCircle class="size-4 animate-spin" />
              Submitting...
            {:else}
              <CheckCircle2 class="size-4" />
              Submit application
            {/if}
          </button>
        </div>
      </section>
    </form>
  </div>
{/if}
