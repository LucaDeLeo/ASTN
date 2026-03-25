<script lang="ts">
  import { api } from '$convex/_generated/api'
  import { CONVEX_URL } from '$lib/convex-env'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { setupConvex, useConvexClient } from 'convex-svelte'

  const clerkContext = getClerkContext()

  const getClerkAuthToken = async () => {
    if (!clerkContext.currentSession) {
      return null
    }

    return clerkContext.currentSession.getToken({
      template: 'convex',
    })
  }

  setupConvex(CONVEX_URL)

  const convex = useConvexClient()
  convex.setAuth(getClerkAuthToken)

  let hasRunUserBootstrap = $state(false)

  $effect(() => {
    if (!clerkContext.currentUser || hasRunUserBootstrap) {
      return
    }

    hasRunUserBootstrap = true

    void convex.mutation(api.userMigration.migrateUserIfNeeded, {}).catch(() => {
      // User migration is best effort during the auth bootstrap.
    })

    void convex.mutation(api.profiles.ensureIdentityFields, {}).catch(() => {
      // Identity backfill is best effort during the auth bootstrap.
    })
  })

  const { children } = $props()
</script>

{@render children()}
