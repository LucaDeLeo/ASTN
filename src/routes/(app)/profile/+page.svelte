<script lang="ts">
  import { goto } from '$app/navigation'
  import { useQuery } from 'convex-svelte'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import { useIsMobile } from '$lib/stores/media-query.svelte'
  import { api } from '$convex/_generated/api'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import MobileShell from '~/components/layout/mobile-shell.svelte'
  import UnifiedProfile from '~/components/profile/UnifiedProfile.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  const clerkContext = getClerkContext()
  const isMobile = useIsMobile()
  const profile = useQuery(
    api.profiles.getOrCreateProfile,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )

  const mobileUser = $derived(
    clerkContext.currentUser
      ? {
          name:
            clerkContext.currentUser.firstName ??
            clerkContext.currentUser.fullName ??
            'User',
        }
      : null,
  )

  $effect(() => {
    if (clerkContext.isClerkLoaded && !clerkContext.currentUser) {
      void goto('/login')
    }
  })

  $effect(() => {
    if (profile.data) {
      posthogStore.capture('profile_page_loaded', {
        profile_id: profile.data._id,
      })
    }
  })
</script>

<svelte:head>
  <title>Profile | ASTN</title>
</svelte:head>

{#snippet content()}
  {#if !clerkContext.isClerkLoaded}
    <div class="flex min-h-[calc(100vh-65px)] items-center justify-center">
      <Spinner />
    </div>
  {:else}
    <main class="container mx-auto px-4 py-8">
      <UnifiedProfile />
    </main>
  {/if}
{/snippet}

{#if $isMobile}
  <MobileShell user={mobileUser}>
    <GradientBg variant="subtle">
      {@render content()}
    </GradientBg>
  </MobileShell>
{:else}
  <GradientBg variant="subtle">
    <AuthHeader />
    {@render content()}
  </GradientBg>
{/if}
