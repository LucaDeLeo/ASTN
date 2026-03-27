<script lang="ts">
  import { ChevronLeft, ChevronRight } from 'lucide-svelte'
  import { useIsMobile, useMediaQuery } from '$lib/stores/media-query.svelte'
  import { getFacilitatorAgentContext } from '$lib/stores/facilitator-agent.svelte'
  import FacilitatorAgentChat from './FacilitatorAgentChat.svelte'

  const agent = getFacilitatorAgentContext()
  const isMobile = useIsMobile()
  const hasRoomForSidebar = useMediaQuery('(min-width: 900px)')

  const startResize = (event: MouseEvent) => {
    event.preventDefault()
    agent.isResizing = true

    const handleMove = (moveEvent: MouseEvent) => {
      agent.setSidebarWidth(window.innerWidth - moveEvent.clientX)
    }

    const handleUp = () => {
      agent.isResizing = false
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }
</script>

{#if $isMobile}
  {#if agent.isOpen}
    <div
      class="fixed inset-0 z-40 bg-black/30"
      onclick={() => agent.close()}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          agent.close()
        }
      }}
      role="button"
      tabindex="0"
      aria-label="Close facilitator agent overlay"
    ></div>
    <div class="fixed inset-x-0 bottom-0 z-50 h-[84dvh] rounded-t-[2rem] border border-border/70 bg-background shadow-2xl">
      <div class="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.16em] text-coral-700">
            Facilitator Agent
          </p>
          <p class="text-sm text-slate-600">Program operations copilot</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-border px-3 py-1.5 text-sm text-slate-700 transition hover:bg-accent"
          onclick={() => agent.close()}
        >
          Close
        </button>
      </div>
      <div class="h-[calc(84dvh-73px)]">
        <FacilitatorAgentChat />
      </div>
    </div>
  {/if}
{:else}
  <button
    type="button"
    class={`fixed top-1/2 z-50 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-border/70 bg-white shadow-md ${
      agent.isResizing ? '' : 'transition-[right] duration-300 ease-in-out'
    }`}
    onclick={() => agent.toggle()}
    style:right={agent.isOpen ? `${agent.sidebarWidth}px` : '0px'}
    aria-label={agent.isOpen ? 'Close facilitator agent' : 'Open facilitator agent'}
  >
    {#if agent.isOpen}
      <ChevronRight class="size-4 text-slate-500" />
    {:else}
      <ChevronLeft class="size-4 text-slate-500" />
    {/if}
  </button>

  {#if agent.isOpen && !$hasRoomForSidebar}
    <div
      class="fixed inset-0 z-30 bg-black/20"
      onclick={() => agent.close()}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          agent.close()
        }
      }}
      role="button"
      tabindex="0"
      aria-label="Close facilitator agent overlay"
    ></div>
  {/if}

  <aside
    class={`fixed inset-y-0 right-0 z-40 border-l border-border/70 bg-background shadow-2xl ${
      agent.isResizing ? '' : 'transition-transform duration-300 ease-in-out'
    } ${agent.isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    style={`width:${agent.sidebarWidth}px`}
  >
    <FacilitatorAgentChat />

    {#if agent.isOpen}
      <div
        class="absolute -left-px top-0 h-full w-1 cursor-col-resize hover:bg-coral-200"
        onmousedown={startResize}
        role="presentation"
      ></div>
    {/if}
  </aside>
{/if}
