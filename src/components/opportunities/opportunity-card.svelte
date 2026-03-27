<script lang="ts">
  import { CalendarDays, MapPin, Wallet } from 'lucide-svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import { formatDeadline, getDeadlineUrgency } from '$lib/formatDeadline'
  import { formatLocation } from '$lib/formatLocation'
  import { EVENT_TYPE_COLORS, ROLE_TYPE_COLORS } from '$lib/roleTypes'

  type Opportunity = {
    _id: Id<'opportunities'>
    title: string
    organization: string
    location: string
    isRemote: boolean
    roleType: string
    experienceLevel?: string
    salaryRange?: string
    deadline?: number
    opportunityType?: string
    eventType?: string
    startDate?: number
  }

  const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior',
    lead: 'Lead',
  }

  let {
    opportunity,
    index = 0,
  }: {
    opportunity: Opportunity
    index?: number
  } = $props()

  const isEvent = $derived(opportunity.opportunityType === 'event')
  const roleColorClass = $derived(
    ROLE_TYPE_COLORS[opportunity.roleType] ?? ROLE_TYPE_COLORS.other,
  )
  const eventColorClass = $derived(
    opportunity.eventType
      ? EVENT_TYPE_COLORS[opportunity.eventType] ?? EVENT_TYPE_COLORS.conference
      : '',
  )
</script>

<a
  href={`/opportunities/${opportunity._id}`}
  class="block rounded-2xl border border-slate-200 bg-white/92 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-coral-200 hover:shadow-md"
  style={`animation-delay: ${Math.min(index, 19) * 50}ms; animation-fill-mode: backwards;`}
>
  <div class="mb-3 flex flex-wrap items-center gap-2">
    {#if isEvent}
      <span class={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${eventColorClass}`}>
        {opportunity.eventType ?? 'event'}
      </span>
      <span class="inline-flex rounded-full border border-teal-300 px-2.5 py-1 text-xs font-medium text-teal-700">
        Event
      </span>
    {:else}
      <span class={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${roleColorClass}`}>
        {opportunity.roleType}
      </span>
    {/if}

    {#if opportunity.isRemote}
      <span class="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
        Remote
      </span>
    {/if}

    {#if opportunity.experienceLevel && EXPERIENCE_LEVEL_LABELS[opportunity.experienceLevel]}
      <span class="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
        {EXPERIENCE_LEVEL_LABELS[opportunity.experienceLevel]}
      </span>
    {/if}
  </div>

  <h3 class="text-lg font-semibold leading-tight text-slate-950">
    {opportunity.title}
  </h3>
  <p class="mt-1 text-sm text-slate-600">
    {opportunity.organization} · {formatLocation(opportunity.location)}
  </p>

  {#if opportunity.salaryRange || opportunity.deadline || (isEvent && opportunity.startDate)}
    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {#if isEvent && opportunity.startDate}
        <span class="flex items-center gap-1.5 text-slate-600">
          <CalendarDays class="size-4" />
          {new Date(opportunity.startDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      {/if}

      {#if opportunity.salaryRange && opportunity.salaryRange !== 'Not Found'}
        <span class="flex items-center gap-1.5 text-slate-600">
          <Wallet class="size-4" />
          {opportunity.salaryRange}
        </span>
      {/if}

      {#if !isEvent}
        <span class="flex items-center gap-1.5 text-slate-600">
          <MapPin class="size-4" />
          {formatLocation(opportunity.location)}
        </span>
      {/if}

      {#if opportunity.deadline}
        <span class={`font-medium ${getDeadlineUrgency(opportunity.deadline)}`}>
          {formatDeadline(opportunity.deadline)}
        </span>
      {/if}
    </div>
  {/if}
</a>
