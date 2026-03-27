<script lang="ts">
  import type { Snippet } from 'svelte'
  import { onMount } from 'svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import { setCourseSidebarContext } from '$lib/stores/course-sidebar.svelte'
  import { useConvexClient } from 'convex-svelte'

  let {
    children,
    moduleId = null,
  }: {
    children?: Snippet
    moduleId?: Id<'programModules'> | null
  } = $props()

  const convex = useConvexClient()
  const sidebar = setCourseSidebarContext()

  let isCreatingThread = $state(false)

  onMount(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === '.') {
        event.preventDefault()
        sidebar.toggle()
      }
    }

    window.addEventListener('keydown', handleShortcut)

    return () => {
      window.removeEventListener('keydown', handleShortcut)
    }
  })

  $effect(() => {
    sidebar.syncModule(moduleId)
  })

  $effect(() => {
    if (!sidebar.isOpen || !sidebar.moduleId || sidebar.threadId || isCreatingThread) return

    isCreatingThread = true
    void convex
      .mutation(api.course.sidebar.getOrCreateThread, {
        moduleId: sidebar.moduleId,
      })
      .then((threadId) => {
        sidebar.threadId = threadId
      })
      .finally(() => {
        isCreatingThread = false
      })
  })
</script>

{@render children?.()}
