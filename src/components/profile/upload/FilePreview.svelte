<script lang="ts">
  import { FileText, RefreshCw, X } from 'lucide-svelte'
  import { cn } from '~/lib/utils'

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  let {
    file,
    onRemove,
    onReplace,
    disabled = false,
  }: {
    file: File
    onRemove: () => void
    onReplace?: () => void
    disabled?: boolean
  } = $props()
</script>

<div
  class={cn(
    'animate-in fade-in-0 slide-in-from-bottom-2 flex items-center gap-3 rounded-lg bg-muted/50 p-4 duration-200',
    disabled && 'opacity-50',
  )}
>
  <div class="flex shrink-0 items-center justify-center rounded-md bg-primary/10 p-2">
    <FileText class="size-5 text-primary" />
  </div>

  <div class="min-w-0 flex-1">
    <p class="truncate text-sm font-medium" title={file.name}>{file.name}</p>
    <p class="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
  </div>

  <div class="flex shrink-0 items-center gap-1">
    {#if onReplace}
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled}
        title="Replace file"
        onclick={onReplace}
      >
        <RefreshCw class="size-4" />
        <span class="sr-only">Replace file</span>
      </button>
    {/if}

    <button
      type="button"
      class="inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      title="Remove file"
      onclick={onRemove}
    >
      <X class="size-4" />
      <span class="sr-only">Remove file</span>
    </button>
  </div>
</div>
