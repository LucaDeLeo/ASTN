<script lang="ts">
  import { MapPin } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const locationPrivacy = useQuery(api.profiles.getLocationPrivacy, () =>
    clerkContext.currentUser ? {} : 'skip',
  )

  let locationDiscoverable = $state(false)
  let saving = $state(false)

  $effect(() => {
    if (!locationPrivacy.data) {
      return
    }

    locationDiscoverable = locationPrivacy.data.locationDiscoverable ?? false
  })

  const toggle = async () => {
    const nextValue = !locationDiscoverable
    locationDiscoverable = nextValue
    saving = true

    try {
      await convex.mutation(api.profiles.updateLocationPrivacy, {
        locationDiscoverable: nextValue,
      })
      toast.success(
        nextValue
          ? 'Location-based suggestions enabled'
          : 'Location-based suggestions disabled',
      )
    } catch (error) {
      console.error('Failed to update location privacy:', error)
      locationDiscoverable = !nextValue
      toast.error('Failed to update location privacy setting')
    } finally {
      saving = false
    }
  }
</script>

<section class="rounded-[1.75rem] border border-border/70 bg-white/92 shadow-warm-sm">
  <div class="border-b border-border/70 px-6 py-5">
    <div class="flex items-center gap-3">
      <div class="flex size-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
        <MapPin class="size-5" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-slate-950">Location Privacy</h2>
        <p class="mt-1 text-sm text-slate-600">
          Control whether ASTN uses your city to suggest nearby organizations.
        </p>
      </div>
    </div>
  </div>

  <div class="space-y-6 px-6 py-6">
    {#if locationPrivacy.isLoading}
      <div class="flex items-center justify-center py-8">
        <Spinner />
      </div>
    {:else}
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2 text-base font-medium text-slate-950">
            <MapPin class="size-4 text-coral-600" />
            Location-Based Suggestions
          </div>
          <p class="text-sm text-slate-600">
            When enabled, ASTN can use your city to recommend organizations.
            Your exact address is never stored or shared.
          </p>
        </div>
        <input
          type="checkbox"
          checked={locationDiscoverable}
          disabled={saving}
          onchange={() => {
            void toggle()
          }}
          class="mt-1 size-5 rounded border-border text-coral-600 focus:ring-coral-500 disabled:cursor-not-allowed"
        />
      </div>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Suggestions use city-level location only. Organizations do not see your
        precise location from this setting.
      </div>
    {/if}
  </div>
</section>
