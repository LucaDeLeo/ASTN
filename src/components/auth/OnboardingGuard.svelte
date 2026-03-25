<script lang="ts">
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'

  const clerkContext = getClerkContext()
  const convex = useConvexClient()

  const profile = useQuery(
    api.profiles.getOrCreateProfile,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )

  let creating = $state(false)
  const { children } = $props()

  $effect(() => {
    if (
      !clerkContext.currentUser ||
      profile.isLoading ||
      creating ||
      profile.data !== null
    ) {
      return
    }

    creating = true
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    void convex
      .mutation(api.profiles.create, { timezone })
      .then(() => {
        posthogStore.capture('profile_created', { timezone })
      })
      .finally(() => {
        creating = false
      })
  })
</script>

{#if !clerkContext.currentUser}
  {@render children()}
{:else if profile.isLoading || creating || !profile.data}
  <div class="flex min-h-[calc(100vh-65px)] items-center justify-center">
    <div class="size-6 animate-spin rounded-full border-2 border-border border-t-coral-500"></div>
  </div>
{:else}
  {@render children()}
{/if}
