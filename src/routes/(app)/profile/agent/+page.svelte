<script lang="ts">
  import { goto } from '$app/navigation'
  import { getAgentSidebarContext } from '$lib/stores/agent-sidebar.svelte'

  const sidebar = getAgentSidebarContext()

  $effect(() => {
    sidebar.open()
    void goto('/profile')
  })
</script>
