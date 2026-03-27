<script lang="ts">
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'

  const clerkContext = getClerkContext()

  $effect(() => {
    const currentUser = clerkContext.currentUser

    if (currentUser) {
      posthogStore.identify({
        id: currentUser.id,
        email: currentUser.primaryEmailAddress?.emailAddress ?? null,
        name: currentUser.fullName ?? null,
      })
      return
    }

    posthogStore.reset()
  })
</script>
