<script lang="ts">
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { Bot, CornerDownLeft, LoaderCircle, Square, User2 } from 'lucide-svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import { api } from '$convex/_generated/api'
  import {
    getAgentMessageArgs,
    optimisticallySendMessage,
    toAgentMessages,
  } from '$lib/convex-agent.svelte'
  import { getAgentPageContext } from '$lib/agent-page-context'
  import { getAgentSidebarContext } from '$lib/stores/agent-sidebar.svelte'
  import { renderMarkdownToHtml } from '$lib/render-markdown'
  import Spinner from '~/components/ui/spinner.svelte'

  let { profileId, threadId }: { profileId: Id<'profiles'>; threadId: string } = $props()

  const convex = useConvexClient()
  const sidebar = getAgentSidebarContext()
  const messageQuery = useQuery(
    api.agent.queries.listMessages,
    () => getAgentMessageArgs(threadId),
  )
  const toolCalls = useQuery(api.agent.queries.getToolCalls, () => ({ threadId }))

  let input = $state('')
  let sending = $state(false)

  const pathname = $derived(page.url.pathname)
  const messages = $derived(toAgentMessages(messageQuery.data))
  const pendingActions = $derived(
    (toolCalls.data ?? []).filter(
      (toolCall) => toolCall.status === 'pending' || toolCall.status === 'proposed',
    ),
  )
  const isStreaming = $derived(messages.some((message) => message.status === 'streaming'))

  const send = async (prompt: string) => {
    const text = prompt.trim()
    if (!text || sending) return

    sending = true

    try {
      const context = getAgentPageContext(pathname)
      await optimisticallySendMessage(convex, {
        threadId,
        prompt: text,
        profileId,
        pageContext: context?.type,
        pageContextEntityId: context?.entityId,
        browserLocale:
          typeof navigator !== 'undefined' ? navigator.language : undefined,
      })
      input = ''
      sidebar.clearPendingMessage()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      sending = false
    }
  }

  $effect(() => {
    if (sidebar.pendingMessage) {
      void send(sidebar.pendingMessage)
    }
  })

  const stopGeneration = async () => {
    try {
      await convex.mutation(api.agent.threadOps.abortGeneration, { threadId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stop generation')
    }
  }
</script>

<section class="flex h-full min-h-0 flex-col rounded-[1.75rem] border border-border/70 bg-white/92 shadow-warm-sm">
  <header class="border-b border-border/70 px-5 py-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-medium uppercase tracking-[0.18em] text-coral-700">
          AI Assistant
        </p>
        <h2 class="mt-1 text-lg font-semibold text-slate-950">
          Profile copilot
        </h2>
      </div>

      {#if isStreaming}
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-slate-700 transition hover:bg-accent"
          onclick={stopGeneration}
        >
          <Square class="size-3.5" />
          Stop
        </button>
      {/if}
    </div>
    {#if pendingActions.length}
      <p class="mt-3 text-xs text-amber-700">
        {pendingActions.length} profile change{pendingActions.length === 1 ? '' : 's'} awaiting review.
      </p>
    {/if}
  </header>

  <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5">
    {#if messageQuery.isLoading}
      <div class="flex h-full items-center justify-center">
        <Spinner />
      </div>
    {:else if !messages.length}
      <div class="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-6 text-sm text-slate-600">
        Ask the assistant to draft your profile, summarize your background, or suggest next steps.
      </div>
    {:else}
      {#each messages as message (message.key)}
        <article class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div class={`max-w-[88%] rounded-[1.5rem] px-4 py-3 shadow-sm ${
            message.role === 'user'
              ? 'bg-slate-950 text-white'
              : 'border border-border/60 bg-slate-50 text-slate-900'
          }`}>
            <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] opacity-70">
              {#if message.role === 'user'}
                <User2 class="size-3.5" />
                <span>You</span>
              {:else}
                <Bot class="size-3.5" />
                <span>ASTN AI</span>
              {/if}
            </div>

            {#if message.role === 'user'}
              <p class="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
            {:else}
              <div class="prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 prose-ul:my-2">
                {@html renderMarkdownToHtml(message.text)}
              </div>
            {/if}

            {#if message.status === 'streaming'}
              <div class="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
                <LoaderCircle class="size-3.5 animate-spin" />
                <span>Generating…</span>
              </div>
            {/if}
          </div>
        </article>
      {/each}
    {/if}
  </div>

  <form
    class="border-t border-border/70 px-5 py-4"
    onsubmit={(event) => {
      event.preventDefault()
      void send(input)
    }}
  >
    <label class="sr-only" for="agent-input">Message the AI assistant</label>
    <textarea
      id="agent-input"
      bind:value={input}
      rows="4"
      class="w-full rounded-[1.25rem] border border-border bg-white px-4 py-3 text-sm text-slate-900 shadow-inner outline-none transition focus:border-coral-400 focus:ring-2 focus:ring-coral-100"
      placeholder="Ask ASTN AI to improve your profile, summarize your background, or suggest next steps."
    ></textarea>

    <div class="mt-3 flex items-center justify-between gap-3">
      <p class="text-xs text-slate-500">
        <span class="font-medium text-slate-700">Shortcut:</span> {`Cmd/Ctrl + .`}
      </p>
      <button
        type="submit"
        class="inline-flex items-center gap-2 rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={sending || !input.trim()}
      >
        {#if sending}
          <Spinner class="size-4 border-white/30 border-t-white" size="sm" />
        {:else}
          <CornerDownLeft class="size-4" />
        {/if}
        Send
      </button>
    </div>
  </form>
</section>
