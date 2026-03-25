<script lang="ts">
  import { onMount } from 'svelte'
  import {
    Check,
    CheckCircle2,
    Copy,
    Send,
    ShieldAlert,
    Terminal,
    Trash2,
    XCircle,
  } from 'lucide-svelte'
  import { getAdminAgentContext } from '$lib/stores/admin-agent.svelte'
  import { renderMarkdownToHtml } from '$lib/render-markdown'
  import Spinner from '~/components/ui/spinner.svelte'

  const agent = getAdminAgentContext()

  let input = $state('')
  let messagesContainer = $state<HTMLDivElement | undefined>(undefined)
  let textarea = $state<HTMLTextAreaElement | undefined>(undefined)

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const send = () => {
    const text = input.trim()
    if (!text || agent.isStreaming) {
      return
    }

    agent.sendMessage(text, agent.model, agent.thinking)
    input = ''
  }

  $effect(() => {
    messagesContainer?.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth',
    })
  })

  $effect(() => {
    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
  })

  onMount(() => {
    textarea?.focus()
  })

  const command = $derived(`bun agent/cli.ts --org=${agent.orgSlug}`)
</script>

{#if agent.status === 'disconnected'}
  <div class="flex h-full flex-col items-center justify-center px-6 text-center">
    <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <Terminal class="size-6" />
    </div>
    <h3 class="mt-5 text-lg font-semibold text-slate-950">Agent disconnected</h3>
    <p class="mt-2 max-w-sm text-sm text-slate-600">
      Start the org admin agent from your terminal to connect this sidebar.
    </p>
    <div class="mt-5 w-full max-w-sm rounded-2xl bg-slate-100 p-4">
      <code class="block break-all text-sm text-slate-900">{command}</code>
      <button
        type="button"
        class="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-accent"
        onclick={() => void copyText(command)}
      >
        <Copy class="size-3.5" />
        Copy
      </button>
    </div>
  </div>
{:else if agent.status === 'connecting'}
  <div class="flex h-full flex-col items-center justify-center gap-3">
    <Spinner />
    <p class="text-sm text-slate-500">Connecting…</p>
  </div>
{:else}
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex items-center gap-2 border-b border-border/70 px-3 py-2">
      <div class="size-2 rounded-full bg-emerald-500"></div>
      <select
        bind:value={agent.model}
        class="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 outline-none"
      >
        <option value="claude-opus-4-6">Opus</option>
        <option value="claude-sonnet-4-6">Sonnet</option>
        <option value="claude-haiku-4-5-20251001">Haiku</option>
      </select>
      <select
        bind:value={agent.thinking}
        class="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 outline-none"
      >
        <option value="off">No thinking</option>
        <option value="adaptive">Adaptive</option>
        <option value="high">High</option>
        <option value="max">Max</option>
      </select>
      {#if agent.messages.length}
        <button
          type="button"
          class="ml-auto inline-flex size-7 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-rose-600"
          onclick={() => agent.clearChat()}
          disabled={agent.isStreaming}
          title="Clear chat"
        >
          <Trash2 class="size-3.5" />
        </button>
      {/if}
    </div>

    <div bind:this={messagesContainer} class="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      {#if !agent.messages.length && !agent.isStreaming}
        <div class="flex h-full items-center justify-center text-center">
          <p class="max-w-sm text-sm leading-6 text-slate-500">
            Ask about members, operations, engagement, or admin workflows for this org.
          </p>
        </div>
      {/if}

      <div class="space-y-3">
        {#each agent.messages as message, index (`${message.role}-${index}`)}
          {#if message.role === 'user'}
            <div class="flex justify-end">
              <div class="max-w-[85%] rounded-2xl rounded-br-sm bg-slate-950 px-4 py-2.5 text-sm text-white">
                {message.content}
              </div>
            </div>
          {:else}
            <div class="flex justify-start">
              <div class="max-w-[85%]">
                {#each message.parts as part, partIndex (`${index}-${partIndex}`)}
                  {#if part.type === 'text'}
                    <div class="prose prose-sm mb-2 max-w-none rounded-2xl rounded-bl-sm border border-border/60 bg-slate-50 px-4 py-3 text-slate-800 prose-p:text-inherit prose-li:text-inherit prose-strong:text-inherit">
                      {@html renderMarkdownToHtml(part.content)}
                    </div>
                  {:else if part.type === 'tool_call'}
                    <details class="mb-2 rounded-2xl border border-border/60 bg-slate-50 text-sm">
                      <summary class="cursor-pointer px-3 py-2 font-medium text-slate-600">
                        {part.name}
                      </summary>
                      <div class="space-y-2 border-t border-border/60 px-3 py-2">
                        {#if part.input != null && Object.keys(part.input as object).length > 0}
                          <pre class="overflow-auto rounded-xl bg-white p-2 text-xs text-slate-700">{typeof part.input === 'string' ? part.input : JSON.stringify(part.input, null, 2)}</pre>
                        {/if}
                        {#if part.output != null}
                          <pre class="overflow-auto rounded-xl bg-white p-2 text-xs text-slate-700">{part.output}</pre>
                        {:else}
                          <div class="inline-flex items-center gap-2 text-xs text-slate-500">
                            <Spinner size="sm" />
                            Running…
                          </div>
                        {/if}
                      </div>
                    </details>
                  {:else}
                    <div class={`mb-2 rounded-2xl border p-3 text-sm ${
                      part.status === 'pending'
                        ? 'border-amber-200 bg-amber-50/70'
                        : part.status === 'approved'
                          ? 'border-emerald-200 bg-emerald-50/70'
                          : 'border-rose-200 bg-rose-50/70'
                    }`}>
                      <div class="flex items-start gap-2">
                        <ShieldAlert class="mt-0.5 size-4 text-amber-600" />
                        <div class="min-w-0 flex-1">
                          <p class="font-medium text-slate-900">{part.action}</p>
                          <p class="mt-1 text-slate-600">{part.description}</p>
                          {#if Object.keys(part.details).length > 0}
                            <div class="mt-2 space-y-1 text-xs text-slate-500">
                              {#each Object.entries(part.details) as [key, value]}
                                <div><span class="font-medium">{key}:</span> {typeof value === 'string' ? value : JSON.stringify(value)}</div>
                              {/each}
                            </div>
                          {/if}
                        </div>
                      </div>

                      {#if part.status === 'pending'}
                        <div class="mt-3 flex gap-2 pl-6">
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                            onclick={() => void agent.sendConfirmResponse(part.confirmId, true)}
                          >
                            <Check class="size-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            class="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                            onclick={() => void agent.sendConfirmResponse(part.confirmId, false)}
                          >
                            <XCircle class="size-3.5" />
                            Reject
                          </button>
                        </div>
                      {:else if part.status === 'approved'}
                        <div class="mt-3 inline-flex items-center gap-1.5 pl-6 text-xs text-emerald-700">
                          <CheckCircle2 class="size-3.5" />
                          Approved
                        </div>
                      {:else}
                        <div class="mt-3 inline-flex items-center gap-1.5 pl-6 text-xs text-rose-700">
                          <XCircle class="size-3.5" />
                          Rejected
                        </div>
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        {/each}

        {#if agent.isStreaming && agent.streamParts.length}
          <div class="flex justify-start">
            <div class="max-w-[85%]">
              {#each agent.streamParts as part, index (`stream-${index}`)}
                {#if part.type === 'text'}
                  <div class="prose prose-sm mb-2 max-w-none rounded-2xl rounded-bl-sm border border-border/60 bg-slate-50 px-4 py-3 text-slate-800 prose-p:text-inherit prose-li:text-inherit prose-strong:text-inherit">
                    {@html renderMarkdownToHtml(part.content)}
                    {#if index === agent.streamParts.length - 1}
                      <span class="ml-1 inline-block h-4 w-2 animate-pulse bg-slate-400 align-text-bottom"></span>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="border-t border-border/70 px-4 py-3">
      <div class="flex items-end gap-2">
        <textarea
          bind:this={textarea}
          bind:value={input}
          rows="1"
          class="max-h-[150px] min-h-[44px] flex-1 resize-none rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
          placeholder="Ask the org agent..."
          disabled={agent.isStreaming}
          onkeydown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              send()
            }
          }}
        ></textarea>
        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-full bg-coral-500 text-white transition hover:bg-coral-600 disabled:opacity-60"
          onclick={send}
          disabled={agent.isStreaming || !input.trim()}
        >
          {#if agent.isStreaming}
            <Spinner class="border-white/30 border-t-white" size="sm" />
          {:else}
            <Send class="size-4" />
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
