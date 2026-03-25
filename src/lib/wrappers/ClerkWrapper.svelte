<script lang="ts">
  import { setClerkContext } from '$lib/stores/clerk.svelte'

  const { children } = $props()

  const clerkContext = setClerkContext()
</script>

{#if clerkContext.isClerkLoaded}
  {@render children()}
{:else}
  <div class="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
    Loading authentication…
  </div>
{/if}
