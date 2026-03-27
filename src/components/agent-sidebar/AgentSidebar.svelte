<script lang="ts">
  import { ChevronLeft } from 'lucide-svelte'
  import { useIsMobile } from '$lib/stores/media-query.svelte'
  import { getAgentSidebarContext } from '$lib/stores/agent-sidebar.svelte'
  import AgentFAB from '~/components/agent-sidebar/AgentFAB.svelte'
  import AgentProfileBuilder from '~/components/profile/agent/AgentProfileBuilder.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  const sidebar = getAgentSidebarContext()
  const isMobile = useIsMobile()
</script>

{#if !sidebar.isOpen}
  <AgentFAB />
{:else}
  {#if $isMobile}
    <div class="fixed inset-x-0 bottom-0 z-50 h-[84dvh] rounded-t-[2rem] border border-border/70 bg-background shadow-2xl">
      <div class="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.16em] text-coral-700">AI Assistant</p>
          <p class="text-sm text-slate-600">Profile copilot</p>
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
        {#if sidebar.profileId && sidebar.threadId}
          <AgentProfileBuilder profileId={sidebar.profileId} threadId={sidebar.threadId} />
        {:else}
          <div class="flex h-full items-center justify-center">
            <Spinner />
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div
      class="fixed inset-y-0 left-0 z-40 border-r border-border/70 bg-background shadow-2xl"
      style={`width:${sidebar.sidebarWidth}px`}
    >
      <button
        type="button"
        class="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-accent"
        onclick={() => sidebar.close()}
      >
        <ChevronLeft class="size-4" />
        Close
      </button>

      <div class="h-full p-4 pt-16">
        {#if sidebar.profileId && sidebar.threadId}
          <AgentProfileBuilder profileId={sidebar.profileId} threadId={sidebar.threadId} />
        {:else}
          <div class="flex h-full items-center justify-center">
            <Spinner />
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}
