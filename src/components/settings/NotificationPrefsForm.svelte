<script lang="ts">
  import { Bell, Clock3, Globe, Mail } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  const TIMEZONE_GROUPS = [
    {
      label: 'Americas',
      timezones: [
        { value: 'America/New_York', label: 'New York (EST/EDT)' },
        { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
        { value: 'America/Denver', label: 'Denver (MST/MDT)' },
        { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
        { value: 'America/Sao_Paulo', label: 'Sao Paulo (BRT)' },
        {
          value: 'America/Argentina/Buenos_Aires',
          label: 'Buenos Aires (ART)',
        },
      ],
    },
    {
      label: 'Europe',
      timezones: [
        { value: 'Europe/London', label: 'London (GMT/BST)' },
        { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
        { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
        { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
      ],
    },
    {
      label: 'Asia',
      timezones: [
        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
        { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
        { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
        { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
        { value: 'Asia/Dubai', label: 'Dubai (GST)' },
      ],
    },
    {
      label: 'Pacific',
      timezones: [
        { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
        { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
        { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
      ],
    },
  ]

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const preferences = useQuery(api.profiles.getNotificationPreferences, () =>
    clerkContext.currentUser ? {} : 'skip',
  )

  let matchAlerts = $state(false)
  let weeklyDigest = $state(false)
  let deadlineReminders = $state(true)
  let timezone = $state(Intl.DateTimeFormat().resolvedOptions().timeZone)
  let hasChanges = $state(false)
  let saving = $state(false)

  const isFirstTime = $derived(
    !preferences.isLoading && preferences.data === null,
  )

  $effect(() => {
    if (!preferences.data) {
      return
    }

    matchAlerts = preferences.data.matchAlerts.enabled
    weeklyDigest = preferences.data.weeklyDigest.enabled
    deadlineReminders = preferences.data.deadlineReminders.enabled
    timezone = preferences.data.timezone
    hasChanges = false
  })

  const save = async () => {
    saving = true

    try {
      await convex.mutation(api.profiles.updateNotificationPreferences, {
        matchAlertsEnabled: matchAlerts,
        weeklyDigestEnabled: weeklyDigest,
        deadlineRemindersEnabled: deadlineReminders,
        timezone,
      })
      hasChanges = false
      toast.success('Notification preferences saved')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      saving = false
    }
  }
</script>

<section class="rounded-[1.75rem] border border-border/70 bg-white/92 shadow-warm-sm">
  <div class="border-b border-border/70 px-6 py-5">
    <div class="flex items-center gap-3">
      <div class="flex size-10 items-center justify-center rounded-2xl bg-coral-100 text-coral-700">
        <Bell class="size-5" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-slate-950">
          Notification Preferences
        </h2>
        <p class="mt-1 text-sm text-slate-600">
          {#if isFirstTime}
            Set up your notifications so ASTN can reach you at the right cadence.
          {:else}
            Control how and when you receive updates about opportunities.
          {/if}
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-6 px-6 py-6">
    {#if preferences.isLoading}
      <div class="flex items-center justify-center py-8">
        <Spinner />
      </div>
    {:else}
      <label class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-base font-medium text-slate-950">
            <Bell class="size-4 text-coral-600" />
            Match Alerts
          </div>
          <p class="text-sm text-slate-600">
            Get notified when we find strong-fit opportunities for your profile.
          </p>
        </div>
        <input
          type="checkbox"
          bind:checked={matchAlerts}
          onchange={() => {
            hasChanges = true
          }}
          class="mt-1 size-5 rounded border-border text-coral-600 focus:ring-coral-500"
        />
      </label>

      <label class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-base font-medium text-slate-950">
            <Mail class="size-4 text-coral-600" />
            Weekly Digest
          </div>
          <p class="text-sm text-slate-600">
            Receive a weekly summary of new matches and profile suggestions.
          </p>
        </div>
        <input
          type="checkbox"
          bind:checked={weeklyDigest}
          onchange={() => {
            hasChanges = true
          }}
          class="mt-1 size-5 rounded border-border text-coral-600 focus:ring-coral-500"
        />
      </label>

      <label class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-base font-medium text-slate-950">
            <Clock3 class="size-4 text-coral-600" />
            Deadline Reminders
          </div>
          <p class="text-sm text-slate-600">
            Get reminded when saved or matched opportunities are close to
            closing.
          </p>
        </div>
        <input
          type="checkbox"
          bind:checked={deadlineReminders}
          onchange={() => {
            hasChanges = true
          }}
          class="mt-1 size-5 rounded border-border text-coral-600 focus:ring-coral-500"
        />
      </label>

      <div class="space-y-2">
        <label for="settings-timezone" class="flex items-center gap-2 text-base font-medium text-slate-950">
          <Globe class="size-4 text-coral-600" />
          Timezone
        </label>
        <p class="text-sm text-slate-600">
          We use this timezone when scheduling reminders and digests.
        </p>
        <select
          id="settings-timezone"
          bind:value={timezone}
          onchange={() => {
            hasChanges = true
          }}
          class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
        >
          {#each TIMEZONE_GROUPS as group}
            <optgroup label={group.label}>
              {#each group.timezones as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
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
