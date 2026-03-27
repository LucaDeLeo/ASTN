<script lang="ts">
  import { page } from '$app/state'
  import { Sparkles } from 'lucide-svelte'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { getAgentSidebarContext } from '$lib/stores/agent-sidebar.svelte'

  const clerkContext = getClerkContext()
  const sidebar = getAgentSidebarContext()

  const pathname = $derived(page.url.pathname)
  const isProgramPage = $derived(/\/org\/[^/]+\/program\//.test(pathname))
  const shouldShow = $derived(
    !!clerkContext.currentUser && !sidebar.isOpen && !isProgramPage,
  )
</script>

{#if shouldShow}
  <button
    aria-label="Open AI assistant"
    class="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-4 z-30 flex size-12 items-center justify-center rounded-full bg-coral-500 text-white shadow-lg transition hover:bg-coral-600"
    onclick={() => sidebar.open()}
    type="button"
  >
    <Sparkles class="size-5" />
  </button>
{/if}
