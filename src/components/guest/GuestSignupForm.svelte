<script lang="ts">
  import { onMount } from 'svelte'
  import { getClerkContext } from '$lib/stores/clerk.svelte'

  type MountedClerk = {
    mountSignIn?: (
      node: HTMLDivElement,
      options?: Record<string, unknown>,
    ) => void | Promise<void>
    unmountSignIn?: (node?: HTMLDivElement) => void
  }

  const clerkContext = getClerkContext()

  let signInElement = $state<HTMLDivElement | null>(null)

  onMount(() => {
    if (!signInElement || clerkContext.currentUser) {
      return
    }

    const mountedClerk = clerkContext.clerk as unknown as MountedClerk

    void mountedClerk.mountSignIn?.(signInElement, {
      routing: 'hash',
      afterSignInUrl: '/',
      afterSignUpUrl: '/',
    })

    return () => {
      mountedClerk.unmountSignIn?.(signInElement ?? undefined)
    }
  })
</script>

{#if clerkContext.currentUser}
  <div class="grid min-h-[24rem] place-items-center text-center text-sm text-muted-foreground">
    You are already signed in.
  </div>
{:else}
  <div bind:this={signInElement} class="min-h-[24rem]"></div>
{/if}
