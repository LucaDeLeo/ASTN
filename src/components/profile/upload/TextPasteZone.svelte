<script lang="ts">
  import { AlertCircle, ChevronDown, ClipboardPaste } from 'lucide-svelte'
  import { cn } from '~/lib/utils'

  const SOFT_LIMIT = 10000

  let {
    onTextSubmit,
    disabled = false,
    defaultExpanded = false,
  }: {
    onTextSubmit: (text: string) => void
    disabled?: boolean
    defaultExpanded?: boolean
  } = $props()

  let isExpanded = $state(false)
  let text = $state('')
  let textareaElement = $state<HTMLTextAreaElement | null>(null)

  const charCount = $derived(text.length)
  const showWarning = $derived(charCount > SOFT_LIMIT)

  $effect(() => {
    if (defaultExpanded && !isExpanded) {
      isExpanded = true
    }
  })

  $effect(() => {
    if (isExpanded && !disabled && textareaElement) {
      textareaElement.focus()
    }
  })

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (trimmed) {
      onTextSubmit(trimmed)
    }
  }

  const handleCancel = () => {
    isExpanded = false
    text = ''
  }

  const handleExpand = () => {
    if (!disabled) {
      isExpanded = true
    }
  }
</script>

{#if !isExpanded}
  <button
    type="button"
    disabled={disabled}
    class={cn(
      'flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary',
      disabled && 'cursor-not-allowed opacity-50',
    )}
    onclick={handleExpand}
  >
    <ClipboardPaste class="size-4" />
    <span>Or paste text instead</span>
    <ChevronDown class="size-3" />
  </button>
{:else}
  <div class="w-full animate-reveal">
    <div class="space-y-4 rounded-xl border bg-card p-4">
      <div class="flex items-center gap-2 text-sm font-medium">
        <ClipboardPaste class="size-4 text-primary" />
        <span>Paste your career info</span>
      </div>

      <textarea
        bind:value={text}
        bind:this={textareaElement}
        placeholder="Paste your resume, LinkedIn summary, career bio, or anything career-related..."
        disabled={disabled}
        class="min-h-[150px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      ></textarea>

      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          {#if showWarning}
            <div
              class="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500"
            >
              <AlertCircle class="size-4" />
              <span>That's quite a lot! We'll do our best.</span>
            </div>
          {/if}
        </div>

        <span
          class={cn(
            'text-sm tabular-nums',
            showWarning
              ? 'text-amber-600 dark:text-amber-500'
              : 'text-muted-foreground',
          )}
        >
          {charCount.toLocaleString()} characters
        </span>
      </div>

      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          disabled={disabled}
          onclick={handleCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          disabled={disabled || !text.trim()}
          onclick={handleSubmit}
        >
          Continue
        </button>
      </div>
    </div>
  </div>
{/if}
