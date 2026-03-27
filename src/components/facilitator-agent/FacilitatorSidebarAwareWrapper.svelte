<script lang="ts">
  import type { Snippet } from 'svelte'
  import { useMediaQuery } from '$lib/stores/media-query.svelte'
  import { getFacilitatorAgentContext } from '$lib/stores/facilitator-agent.svelte'

  let { children }: { children?: Snippet } = $props()

  const agent = getFacilitatorAgentContext()
  const hasRoomForSidebar = useMediaQuery('(min-width: 900px)')
  const shouldPush = $derived(agent.isOpen && $hasRoomForSidebar)
</script>

<div
  class={agent.isResizing ? '' : 'transition-[margin-right] duration-300 ease-in-out'}
  style:margin-right={shouldPush ? `${agent.sidebarWidth}px` : '0px'}
>
  {@render children?.()}
</div>
