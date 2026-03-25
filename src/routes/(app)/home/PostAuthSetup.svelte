<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { useConvexClient } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import {
    clearPendingGuestApplication,
    getPendingGuestApplication,
  } from '$lib/pendingGuestApplication'
  import { clearPendingInvite, getPendingInvite } from '$lib/pendingInvite'

  const clerkContext = getClerkContext()
  const convex = useConvexClient()

  let hasRun = $state(false)

  $effect(() => {
    if (!clerkContext.currentUser || !clerkContext.currentSession || hasRun) {
      return
    }

    hasRun = true

    void convex.mutation(api.opportunityApplications.claimGuestApplications, {}).catch(() => {
      // Claiming guest applications is best-effort during the auth bootstrap.
    })

    const pendingGuestApplication = getPendingGuestApplication()
    if (pendingGuestApplication) {
      clearPendingGuestApplication()
    }

    const pendingInvite = getPendingInvite()
    if (!pendingInvite) {
      return
    }

    clearPendingInvite()

    void convex
      .mutation(api.orgs.membership.joinOrgBySlug, {
        slug: pendingInvite.slug,
        inviteToken: pendingInvite.token,
      })
      .then((result) => {
        if (result.success) {
          toast.success(`Joined ${result.orgSlug}`)
        }
      })
      .catch(() => {
        toast.error('We could not apply your invite automatically.')
      })
  })
</script>
