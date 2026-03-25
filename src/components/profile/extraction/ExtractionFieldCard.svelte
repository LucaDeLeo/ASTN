<script lang="ts">
  import { Check, Pencil, X } from 'lucide-svelte'
  import type { ResumeReviewStatus } from './types'
  import { cn } from '~/lib/utils'

  let {
    label,
    value,
    editedValue,
    status,
    onAccept,
    onReject,
    onEdit,
    displayOnly = false,
    placeholder = 'Not found in document',
  }: {
    label: string
    value: string | undefined
    editedValue?: string
    status: ResumeReviewStatus
    onAccept: () => void
    onReject: () => void
    onEdit: (value: string) => void
    displayOnly?: boolean
    placeholder?: string
  } = $props()

  let isEditing = $state(false)
  let editValue = $state('')
  let inputElement = $state<HTMLInputElement | null>(null)

  const displayValue = $derived(editedValue ?? value)
  const hasValue = $derived(displayValue !== undefined && displayValue !== '')

  const handleStartEdit = () => {
    editValue = displayValue ?? ''
    isEditing = true
  }

  const handleSaveEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed) {
      onEdit(trimmed)
    }
    isEditing = false
    editValue = ''
  }

  const handleCancelEdit = () => {
    isEditing = false
    editValue = ''
  }

  const handleBlur = () => {
    if (editValue.trim() && editValue.trim() !== displayValue) {
      handleSaveEdit()
      return
    }

    handleCancelEdit()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSaveEdit()
    } else if (event.key === 'Escape') {
      handleCancelEdit()
    }
  }

  $effect(() => {
    if (isEditing && inputElement) {
      inputElement.focus()
    }
  })
</script>

{#if displayOnly}
  <article class="rounded-lg border border-slate-300 bg-white p-3 shadow-sm transition-all duration-200">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-center gap-2">
          <h4 class="font-medium text-foreground">{label}</h4>
          <span
            class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
          >
            For verification only
          </span>
        </div>
        <p class="text-sm text-slate-700">
          {#if hasValue}
            {displayValue}
          {:else}
            <span class="italic text-slate-400">{placeholder}</span>
          {/if}
        </p>
      </div>
    </div>
  </article>
{:else if !hasValue && (status === 'pending' || status === 'accepted')}
  <article class="rounded-lg border border-slate-300 bg-white p-3 shadow-sm transition-all duration-200">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h4 class="mb-2 font-medium text-foreground">{label}</h4>
        <p class="text-sm italic text-slate-400">{placeholder}</p>
      </div>
    </div>
  </article>
{:else}
  <article
    class={cn(
      'rounded-lg p-3 shadow-sm transition-all duration-200',
      status === 'accepted' && 'border border-slate-300 bg-white',
      status === 'edited' && 'border border-amber-400 bg-amber-50',
      status === 'rejected' && 'border border-slate-300 bg-slate-100 opacity-60',
      status === 'pending' && 'border border-slate-300 bg-white',
    )}
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-center gap-2">
          <h4 class="font-medium text-foreground">{label}</h4>
          {#if status === 'edited' || status === 'rejected'}
            <span
              class={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                status === 'rejected'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-amber-100 text-amber-800',
              )}
            >
              {#if status === 'edited'}
                <Pencil class="mr-1 size-3" />
                Edited
              {:else}
                Rejected
              {/if}
            </span>
          {/if}
        </div>

        {#if isEditing}
          <div class="space-y-2">
            <input
              bind:value={editValue}
              bind:this={inputElement}
              placeholder="Enter value"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              onblur={handleBlur}
              onkeydown={handleKeyDown}
            />
            <div class="flex gap-2">
              <button
                type="button"
                class="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                onclick={handleSaveEdit}
              >
                Save
              </button>
              <button
                type="button"
                class="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                onclick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </div>
        {:else}
          <p
            class={cn(
              'text-sm',
              status === 'rejected'
                ? 'text-slate-400 line-through'
                : 'text-slate-700',
            )}
          >
            {displayValue}
          </p>
        {/if}
      </div>

      {#if !isEditing}
        <div class="flex gap-1">
          <button
            type="button"
            class={cn(
              'inline-flex size-8 items-center justify-center rounded-md transition-colors',
              'text-slate-400 hover:bg-green-50 hover:text-green-600',
              status === 'accepted' && 'bg-green-100 text-green-600',
            )}
            disabled={status === 'accepted'}
            onclick={onAccept}
          >
            <Check class="size-4" />
          </button>
          <button
            type="button"
            class={cn(
              'inline-flex size-8 items-center justify-center rounded-md transition-colors',
              'text-slate-400 hover:bg-red-50 hover:text-red-600',
              status === 'rejected' && 'bg-red-100 text-red-600',
            )}
            disabled={status === 'rejected'}
            onclick={onReject}
          >
            <X class="size-4" />
          </button>
          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
            onclick={handleStartEdit}
          >
            <Pencil class="size-4" />
          </button>
        </div>
      {/if}
    </div>
  </article>
{/if}
