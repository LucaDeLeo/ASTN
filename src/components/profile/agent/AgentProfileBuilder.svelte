<script lang="ts">
  import type { Id } from '$convex/_generated/dataModel'
  import { useIsMobile } from '$lib/stores/media-query.svelte'
  import AgentChat from '~/components/profile/agent/AgentChat.svelte'
  import LiveProfileView from '~/components/profile/agent/LiveProfileView.svelte'

  let {
    profileId,
    threadId,
  }: {
    profileId: Id<'profiles'>
    threadId: string
  } = $props()

  const isMobile = useIsMobile()
  let activeTab = $state<'chat' | 'profile'>('chat')
</script>

{#if $isMobile}
  <div class="flex h-full min-h-0 flex-col gap-3">
    <div class="grid grid-cols-2 rounded-full border border-border/70 bg-white/80 p-1">
      <button
        type="button"
        class={`rounded-full px-4 py-2 text-sm font-medium transition ${
          activeTab === 'chat' ? 'bg-slate-950 text-white' : 'text-slate-600'
        }`}
        onclick={() => (activeTab = 'chat')}
      >
        Chat
      </button>
      <button
        type="button"
        class={`rounded-full px-4 py-2 text-sm font-medium transition ${
          activeTab === 'profile' ? 'bg-slate-950 text-white' : 'text-slate-600'
        }`}
        onclick={() => (activeTab = 'profile')}
      >
        Profile
      </button>
    </div>

    <div class="min-h-0 flex-1">
      {#if activeTab === 'chat'}
        <AgentChat {profileId} {threadId} />
      {:else}
        <LiveProfileView />
      {/if}
    </div>
  </div>
{:else}
  <div class="grid h-full min-h-0 grid-cols-[1.1fr_0.9fr] gap-4">
    <AgentChat {profileId} {threadId} />
    <LiveProfileView />
  </div>
{/if}
