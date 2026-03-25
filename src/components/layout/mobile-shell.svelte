<script lang="ts">
  import { getContext, setContext } from 'svelte'
  import BottomTabBar from '~/components/layout/bottom-tab-bar.svelte'
  import MobileHeader from '~/components/layout/mobile-header.svelte'

  const MOBILE_SHELL_CONTEXT = 'astn-mobile-shell'

  let {
    children,
    user = null,
  }: {
    children?: import('svelte').Snippet
    user?: { name: string; avatarUrl?: string } | null
  } = $props()

  const alreadyInShell = getContext<boolean>(MOBILE_SHELL_CONTEXT) ?? false

  if (!alreadyInShell) {
    setContext(MOBILE_SHELL_CONTEXT, true)
  }
</script>

{#if alreadyInShell}
  {@render children?.()}
{:else}
  <div class="fixed inset-0 flex w-full flex-col overflow-hidden">
    <MobileHeader {user} />
    <main
      class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-cream-100"
    >
      <div class="w-full pb-safe-bottom">
        {@render children?.()}
      </div>
    </main>
    <BottomTabBar />
  </div>
{/if}
