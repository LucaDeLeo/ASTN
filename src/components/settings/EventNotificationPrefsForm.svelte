<script lang="ts">
  import { BellOff, Calendar } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  type Frequency = 'all' | 'daily' | 'weekly' | 'none'

  const FREQUENCY_OPTIONS: Array<{
    value: Frequency
    label: string
    description: string
  }> = [
    {
      value: 'all',
      label: 'All new events',
      description: 'Get notified immediately, with rate limiting.',
    },
    {
      value: 'daily',
      label: 'Daily digest',
      description: 'One email per day with new events.',
    },
    {
      value: 'weekly',
      label: 'Weekly digest',
      description: 'One email per week with new events.',
    },
    {
      value: 'none',
      label: 'None',
      description: 'Disable new event notifications.',
    },
  ]

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const preferences = useQuery(api.profiles.getEventNotificationPreferences, () =>
    clerkContext.currentUser ? {} : 'skip',
  )
  const memberships = useQuery(api.orgs.membership.getUserMemberships, () =>
    clerkContext.currentUser ? {} : 'skip',
  )

  let frequency = $state<Frequency>('weekly')
  let oneWeekBefore = $state(false)
  let oneDayBefore = $state(true)
  let oneHourBefore = $state(true)
  let mutedOrgIds = $state<Array<Id<'organizations'>>>([])
  let hasChanges = $state(false)
  let saving = $state(false)

  $effect(() => {
    if (!preferences.data) {
      return
    }

    frequency = preferences.data.frequency
    oneWeekBefore = preferences.data.reminderTiming?.oneWeekBefore ?? false
    oneDayBefore = preferences.data.reminderTiming?.oneDayBefore ?? true
    oneHourBefore = preferences.data.reminderTiming?.oneHourBefore ?? true
    mutedOrgIds = [...preferences.data.mutedOrgIds] as Array<Id<'organizations'>>
    hasChanges = false
  })

  const toggleMutedOrg = (orgId: Id<'organizations'>) => {
    mutedOrgIds = mutedOrgIds.includes(orgId)
      ? mutedOrgIds.filter((id) => id !== orgId)
      : [...mutedOrgIds, orgId]
    hasChanges = true
  }

  const save = async () => {
    saving = true

    try {
      await convex.mutation(api.profiles.updateEventNotificationPreferences, {
        frequency,
        reminderTiming: {
          oneWeekBefore,
          oneDayBefore,
          oneHourBefore,
        },
        mutedOrgIds,
      })
      hasChanges = false
      toast.success('Event notification preferences saved')
    } catch (error) {
      console.error('Failed to save event notification preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      saving = false
    }
  }
</script>

<section class="rounded-[1.75rem] border border-border/70 bg-white/92 shadow-warm-sm">
  <div class="border-b border-border/70 px-6 py-5">
    <div class="flex items-center gap-3">
      <div class="flex size-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
        <Calendar class="size-5" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-slate-950">Event Notifications</h2>
        <p class="mt-1 text-sm text-slate-600">
          Control how ASTN updates you about events from organizations you've
          joined.
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-6 px-6 py-6">
    {#if preferences.isLoading || memberships.isLoading}
      <div class="flex items-center justify-center py-8">
        <Spinner />
      </div>
    {:else}
      <div class="space-y-2">
        <label for="event-frequency" class="text-base font-medium text-slate-950">
          Notification Frequency
        </label>
        <p class="text-sm text-slate-600">
          Choose how often we should notify you about new events.
        </p>
        <select
          id="event-frequency"
          bind:value={frequency}
          onchange={() => {
            hasChanges = true
          }}
          class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
        >
          {#each FREQUENCY_OPTIONS as option}
            <option value={option.value}>
              {option.label} - {option.description}
            </option>
          {/each}
        </select>
      </div>

      <fieldset class="space-y-3">
        <legend class="text-base font-medium text-slate-950">
          Event Reminders
        </legend>
        <p class="text-sm text-slate-600">
          Receive reminders before events you've viewed or saved.
        </p>

        <label class="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            bind:checked={oneWeekBefore}
            onchange={() => {
              hasChanges = true
            }}
            class="size-4 rounded border-border text-coral-600 focus:ring-coral-500"
          />
          <span>1 week before</span>
        </label>

        <label class="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            bind:checked={oneDayBefore}
            onchange={() => {
              hasChanges = true
            }}
            class="size-4 rounded border-border text-coral-600 focus:ring-coral-500"
          />
          <span>1 day before</span>
        </label>

        <label class="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            bind:checked={oneHourBefore}
            onchange={() => {
              hasChanges = true
            }}
            class="size-4 rounded border-border text-coral-600 focus:ring-coral-500"
          />
          <span>1 hour before</span>
        </label>
      </fieldset>

      <div class="space-y-3">
        <div class="flex items-center gap-2 text-base font-medium text-slate-950">
          <BellOff class="size-4 text-coral-600" />
          Organization Notifications
        </div>
        <p class="text-sm text-slate-600">
          Mute event notifications from individual organizations without leaving
          them.
        </p>

        {#if !(memberships.data?.length)}
          <div class="rounded-xl border border-dashed border-border bg-slate-50 px-4 py-3 text-sm text-slate-500">
            You haven't joined any organizations yet.
          </div>
        {:else}
          <div class="space-y-3">
            {#each memberships.data ?? [] as membership (membership._id)}
              {@const notificationsEnabled = !mutedOrgIds.includes(membership.orgId)}
              <div class="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-slate-50/80 px-4 py-3">
                <div class="flex min-w-0 items-center gap-3">
                  {#if membership.org.logoUrl}
                    <img
                      src={membership.org.logoUrl}
                      alt={membership.org.name}
                      class="size-10 rounded-full object-cover"
                    />
                  {:else}
                    <div class="flex size-10 items-center justify-center rounded-full bg-coral-100 text-sm font-semibold text-coral-700">
                      {membership.org.name.charAt(0).toUpperCase()}
                    </div>
                  {/if}
                  <div class="min-w-0">
                    <div class="truncate font-medium text-slate-950">
                      {membership.org.name}
                    </div>
                    <p class="text-xs text-slate-500">
                      {#if notificationsEnabled}
                        Notifications enabled
                      {:else}
                        Notifications muted
                      {/if}
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onchange={() => {
                    toggleMutedOrg(membership.orgId)
                  }}
                  aria-label={`Toggle notifications for ${membership.org.name}`}
                  class="size-5 rounded border-border text-coral-600 focus:ring-coral-500"
                />
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="border-t border-border/70 pt-4">
        <button
          type="button"
          disabled={!hasChanges || saving}
          onclick={save}
          class="inline-flex min-w-32 items-center justify-center rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {#if saving}
            Saving...
          {:else}
            Save Changes
          {/if}
        </button>
      </div>
    {/if}
  </div>
</section>
