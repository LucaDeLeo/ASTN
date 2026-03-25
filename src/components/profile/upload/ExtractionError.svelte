<script lang="ts">
  import { AlertCircle, Edit3, RotateCcw, Type } from 'lucide-svelte'

  let {
    error,
    onRetry,
    onPasteText,
    onManualEntry,
    canRetry,
  }: {
    error: string
    onRetry: () => void
    onPasteText: () => void
    onManualEntry: () => void
    canRetry: boolean
  } = $props()
</script>

<div class="space-y-4 rounded-lg border border-destructive/50 bg-destructive/10 p-6">
  <div class="flex items-start gap-3">
    <AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
    <div class="space-y-1">
      <p class="font-medium text-destructive">Extraction failed</p>
      <p class="text-sm text-muted-foreground">{error}</p>
    </div>
  </div>

  <div class="flex flex-col gap-2 sm:flex-row">
    {#if canRetry}
      <button
        type="button"
        class="inline-flex flex-1 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        onclick={onRetry}
      >
        <RotateCcw class="mr-2 h-4 w-4" />
        Try again
      </button>
    {/if}

    <button
      type="button"
      class="inline-flex flex-1 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
      onclick={onPasteText}
    >
      <Type class="mr-2 h-4 w-4" />
      Paste text instead
    </button>

    <button
      type="button"
      class="inline-flex flex-1 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
      onclick={onManualEntry}
    >
      <Edit3 class="mr-2 h-4 w-4" />
      Enter manually
    </button>
  </div>
</div>
