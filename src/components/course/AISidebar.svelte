<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'
  import { useIsMobile, useMediaQuery } from '$lib/stores/media-query.svelte'
  import { getCourseSidebarContext } from '$lib/stores/course-sidebar.svelte'
  import AISidebarChat from '~/components/course/AISidebarChat.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  const sidebar = getCourseSidebarContext()
  const isMobile = useIsMobile()
  const hasRoomForSidebar = useMediaQuery('(min-width: 900px)')

  const startResize = (event: MouseEvent) => {
    event.preventDefault()
    sidebar.isResizing = true

    const handleMove = (moveEvent: MouseEvent) => {
      sidebar.setSidebarWidth(window.innerWidth - moveEvent.clientX)
    }

    const handleUp = () => {
      sidebar.isResizing = false
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }
</script>

{#if $isMobile}
  {#if sidebar.isOpen}
    <div
      class="fixed inset-0 z-40 bg-black/30"
      onclick={() => sidebar.close()}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          sidebar.close()
        }
      }}
      role="button"
      tabindex="0"
      aria-label="Close sidebar overlay"
    ></div>
    <div class="fixed inset-x-0 bottom-0 z-50 h-[84dvh] rounded-t-[2rem] border border-border/70 bg-background shadow-2xl">
      <div class="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.16em] text-coral-700">
            Learning Partner
          </p>
          <p class="text-sm text-slate-600">Module guidance</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-border px-3 py-1.5 text-sm text-slate-700 transition hover:bg-accent"
          onclick={() => sidebar.close()}
        >
          Close
        </button>
      </div>

      <div class="h-[calc(84dvh-73px)] p-4">
        {#if sidebar.moduleId && sidebar.threadId}
          <AISidebarChat moduleId={sidebar.moduleId} threadId={sidebar.threadId} />
        {:else}
          <div class="flex h-full items-center justify-center">
            <Spinner />
          </div>
        {/if}
      </div>
    </div>
  {/if}
{:else}
  <button
    type="button"
    class={`fixed top-1/2 z-50 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-border/70 bg-white shadow-md ${
      sidebar.isResizing ? '' : 'transition-[right] duration-300 ease-in-out'
    }`}
    onclick={() => sidebar.toggle()}
    style:right={sidebar.isOpen ? `${sidebar.sidebarWidth}px` : '0px'}
  >
    {#if sidebar.isOpen}
      <ChevronRight class="size-4 text-slate-500" />
    {:else}
      <ChevronLeft class="size-4 text-slate-500" />
    {/if}
  </button>

  {#if sidebar.isOpen && !$hasRoomForSidebar}
    <div
      class="fixed inset-0 z-30 bg-black/20"
      onclick={() => sidebar.close()}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          sidebar.close()
        }
      }}
      role="button"
      tabindex="0"
      aria-label="Close sidebar overlay"
    ></div>
  {/if}

  <aside
    class={`fixed inset-y-0 right-0 z-40 border-l border-border/70 bg-background shadow-2xl ${
      sidebar.isResizing ? '' : 'transition-transform duration-300 ease-in-out'
    } ${sidebar.isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    style={`width:${sidebar.sidebarWidth}px`}
  >
    <div class="h-full p-4">
      {#if sidebar.moduleId && sidebar.threadId}
        <AISidebarChat moduleId={sidebar.moduleId} threadId={sidebar.threadId} />
      {:else}
        <div class="flex h-full items-center justify-center">
          <Spinner />
        </div>
      {/if}
    </div>

    {#if sidebar.isOpen}
      <div
        class="absolute -left-px top-0 h-full w-1 cursor-col-resize hover:bg-coral-200"
        onmousedown={startResize}
        role="presentation"
      ></div>
    {/if}
  </aside>
{/if}
