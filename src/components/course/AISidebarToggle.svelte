<script lang="ts">
  import { Bot } from 'lucide-svelte'
  import { getCourseSidebarContext } from '$lib/stores/course-sidebar.svelte'

  const sidebar = getCourseSidebarContext()
</script>

{#if !sidebar.isOpen}
  <button
    type="button"
    class="inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-white text-slate-700 shadow-sm transition hover:bg-accent"
    onclick={() => sidebar.toggle()}
    title="AI Learning Partner (Cmd+Shift+.)"
  >
    <Bot class="size-4" />
  </button>
{/if}
