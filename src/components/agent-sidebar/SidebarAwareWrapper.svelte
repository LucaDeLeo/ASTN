<script lang="ts">
  import { getAgentSidebarContext } from '$lib/stores/agent-sidebar.svelte'
  import { useMediaQuery } from '$lib/stores/media-query.svelte'
  import { cn } from '~/lib/utils'

  const { children } = $props<{ children?: () => unknown }>()

  const sidebar = getAgentSidebarContext()
  const hasRoomForSidebar = useMediaQuery('(min-width: 900px)')
</script>

<div
  class={cn(!sidebar.isResizing && 'transition-[margin-left] duration-300 ease-in-out')}
  style:margin-left={sidebar.isOpen && $hasRoomForSidebar ? `${sidebar.sidebarWidth}px` : '0px'}
>
  {@render children?.()}
</div>
