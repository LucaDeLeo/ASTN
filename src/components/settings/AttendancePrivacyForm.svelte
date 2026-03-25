<script lang="ts">
  import { Building2, CalendarCheck2, Eye } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const privacyDefaults = useQuery(
    api.attendance.queries.getAttendancePrivacyDefaults,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )

  let showOnProfile = $state(true)
  let showToOtherOrgs = $state(false)
  let hasChanges = $state(false)
  let saving = $state(false)

  $effect(() => {
    if (!privacyDefaults.data) {
      return
    }

    showOnProfile = privacyDefaults.data.showOnProfile
    showToOtherOrgs = privacyDefaults.data.showToOtherOrgs
    hasChanges = false
  })

  const toggleShowOnProfile = () => {
    showOnProfile = !showOnProfile
    if (!showOnProfile) {
      showToOtherOrgs = false
    }
    hasChanges = true
  }

  const save = async () => {
    saving = true

    try {
      await convex.mutation(api.attendance.mutations.updateAttendancePrivacy, {
        showOnProfile,
        showToOtherOrgs,
        updateExisting: true,
      })
      hasChanges = false
      toast.success('Attendance privacy settings saved')
    } catch (error) {
      console.error('Failed to update attendance privacy:', error)
      toast.error('Failed to save attendance privacy settings')
    } finally {
      saving = false
    }
  }
</script>

<section class="rounded-[1.75rem] border border-border/70 bg-white/92 shadow-warm-sm">
  <div class="border-b border-border/70 px-6 py-5">
    <div class="flex items-center gap-3">
      <div class="flex size-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
        <CalendarCheck2 class="size-5" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-slate-950">Attendance Privacy</h2>
        <p class="mt-1 text-sm text-slate-600">
          Decide who can see your event attendance history.
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-6 px-6 py-6">
    {#if privacyDefaults.isLoading}
      <div class="flex items-center justify-center py-8">
        <Spinner />
      </div>
    {:else}
      <label class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-base font-medium text-slate-950">
            <Eye class="size-4 text-coral-600" />
            Show on Profile
          </div>
          <p class="text-sm text-slate-600">
            Other users can see your attendance history on your profile.
          </p>
        </div>
        <input
          type="checkbox"
          checked={showOnProfile}
          onchange={() => {
            toggleShowOnProfile()
          }}
          class="mt-1 size-5 rounded border-border text-coral-600 focus:ring-coral-500"
        />
      </label>

      <label class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-base font-medium text-slate-950">
            <Building2 class="size-4 text-coral-600" />
            Share with Other Organizations
          </div>
          <p class="text-sm text-slate-600">
            Organizations you are not a member of can see your attendance.
          </p>
        </div>
        <input
          type="checkbox"
          bind:checked={showToOtherOrgs}
          disabled={!showOnProfile}
          onchange={() => {
            hasChanges = true
          }}
          class="mt-1 size-5 rounded border-border text-coral-600 focus:ring-coral-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </label>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        The host organization always sees attendance at its own events. Saving
        here also updates your existing attendance records.
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

        {#if hasChanges}
          <p class="mt-2 text-xs text-slate-500">
            Changes will apply to all your attendance records.
          </p>
        {/if}
      </div>
    {/if}
  </div>
</section>
