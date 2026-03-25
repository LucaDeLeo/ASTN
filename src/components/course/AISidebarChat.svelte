<script lang="ts">
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import {
    getAgentMessageArgs,
    optimisticallySendCourseMessage,
    toAgentMessages,
  } from '$lib/convex-agent.svelte'
  import { renderMarkdownToHtml } from '$lib/render-markdown'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { Bot, CornerDownLeft, LoaderCircle, Square, User2 } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'

  let {
    threadId,
    moduleId,
  }: {
    threadId: string
    moduleId: Id<'programModules'>
  } = $props()

  const convex = useConvexClient()
  const messageQuery = useQuery(api.course.sidebarQueries.listMessages, () =>
    getAgentMessageArgs(threadId),
  )

  let input = $state('')
  let sending = $state(false)

  const messages = $derived(toAgentMessages(messageQuery.data))
  const isStreaming = $derived(messages.some((message) => message.status === 'streaming'))

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    sending = true
    try {
      await optimisticallySendCourseMessage(convex, {
        moduleId,
        prompt: text,
        threadId,
      })
      input = ''
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      sending = false
    }
  }

  const stopGeneration = async () => {
    try {
      await convex.mutation(api.course.sidebar.abortGeneration, { threadId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stop generation')
    }
  }
</script>

<div class="flex h-full min-h-0 flex-col">
  <div class="border-b border-border/70 px-4 py-3">
    <div class="flex items-center gap-2">
      <div class="flex size-8 items-center justify-center rounded-full bg-coral-100 text-coral-700">
        <Bot class="size-4" />
      </div>
      <div>
        <p class="text-sm font-medium text-slate-950">AI Learning Partner</p>
        <p class="text-xs text-slate-500">Ask about the module and your progress.</p>
      </div>
    </div>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
    {#if !messages.length}
      <div class="flex h-full items-center justify-center">
        <div class="max-w-sm text-center">
          <div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-coral-50 text-coral-600">
            <Bot class="size-6" />
          </div>
          <p class="text-sm font-medium text-slate-900">Your AI learning partner is ready</p>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Ask for study guidance, summaries, or help understanding the current module.
          </p>
        </div>
      </div>
    {:else}
      <div class="space-y-4">
        {#each messages as message (message.key)}
          <div class={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              class={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                message.role === 'user'
                  ? 'rounded-br-sm bg-slate-950 text-white'
                  : 'rounded-bl-sm border border-border/70 bg-slate-50 text-slate-800'
              }`}
            >
              <div class="mb-2 flex items-center gap-2 text-xs opacity-70">
                {#if message.role === 'user'}
                  <User2 class="size-3.5" />
                  <span>You</span>
                {:else}
                  <Bot class="size-3.5" />
                  <span>Learning partner</span>
                {/if}
              </div>

              {#if message.role === 'assistant'}
                <div class="prose prose-sm max-w-none text-inherit prose-p:text-inherit prose-li:text-inherit prose-strong:text-inherit prose-headings:text-inherit">
                  {@html renderMarkdownToHtml(message.text)}
                </div>
              {:else}
                <p class="whitespace-pre-wrap">{message.text}</p>
              {/if}
            </div>
          </div>
        {/each}

        {#if isStreaming}
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <LoaderCircle class="size-3.5 animate-spin" />
            Generating…
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="border-t border-border/70 bg-slate-50 px-4 py-3">
    <div class="flex items-end gap-3">
      <textarea
        bind:value={input}
        class="min-h-[44px] flex-1 resize-none rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
        onkeydown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void send()
          }
        }}
        placeholder="Ask about the module…"
        rows="1"
      ></textarea>

      {#if isStreaming}
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
          onclick={stopGeneration}
        >
          <Square class="size-4" />
        </button>
      {:else}
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full bg-coral-500 text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!input.trim() || sending}
          onclick={() => void send()}
        >
          <CornerDownLeft class="size-4" />
        </button>
      {/if}
    </div>
  </div>
</div>
