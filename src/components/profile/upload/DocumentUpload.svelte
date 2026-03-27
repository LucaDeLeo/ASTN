<script lang="ts">
  import { AlertCircle, FileText, Sparkles, Upload, X } from 'lucide-svelte'
  import { cn } from '~/lib/utils'

  const MAX_SIZE = 10 * 1024 * 1024
  const ACCEPTED_TYPE = 'application/pdf'

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getValidationError(file: File): string | null {
    if (file.size > MAX_SIZE) {
      return `File exceeds 10MB limit (yours: ${formatBytes(file.size)})`
    }

    const isPdf =
      file.type === ACCEPTED_TYPE || file.name.toLowerCase().endsWith('.pdf')

    return isPdf ? null : 'Please upload a PDF file'
  }

  function hasInvalidDragType(event: DragEvent): boolean {
    const items = event.dataTransfer?.items
    if (!items?.length) {
      return false
    }

    return Array.from(items).some((item) => {
      if (item.kind !== 'file') {
        return true
      }

      return item.type !== '' && item.type !== ACCEPTED_TYPE
    })
  }

  let {
    onFileSelect,
    error = null,
    onErrorDismiss,
    disabled = false,
  }: {
    onFileSelect: (file: File) => void
    error?: string | null
    onErrorDismiss?: () => void
    disabled?: boolean
  } = $props()

  let fileInput = $state<HTMLInputElement | null>(null)
  let localError = $state<string | null>(null)
  let showShake = $state(false)
  let isDragActive = $state(false)
  let isDragReject = $state(false)
  let dragDepth = 0

  const displayError = $derived(error ?? localError)

  $effect(() => {
    if (!displayError) {
      return
    }

    showShake = true
    const timer = setTimeout(() => {
      showShake = false
    }, 150)

    return () => clearTimeout(timer)
  })

  const openPicker = () => {
    if (!disabled) {
      fileInput?.click()
    }
  }

  const resetDragState = () => {
    dragDepth = 0
    isDragActive = false
    isDragReject = false
  }

  const processFiles = (files: Array<File>) => {
    localError = null

    const [file] = files
    if (!file) {
      return
    }

    const validationError = getValidationError(file)
    if (validationError) {
      localError = validationError
      return
    }

    onFileSelect(file)
  }

  const handleInputChange = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement
    processFiles(Array.from(target.files ?? []))
    target.value = ''
  }

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault()
    if (disabled) {
      return
    }

    dragDepth += 1
    isDragActive = true
    isDragReject = hasInvalidDragType(event)
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (disabled) {
      return
    }

    isDragActive = true
    isDragReject = hasInvalidDragType(event)
  }

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    if (disabled) {
      return
    }

    dragDepth = Math.max(0, dragDepth - 1)
    if (dragDepth === 0) {
      isDragActive = false
      isDragReject = false
    }
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    if (disabled) {
      return
    }

    resetDragState()
    processFiles(Array.from(event.dataTransfer?.files ?? []))
  }

  const handleDismissError = () => {
    localError = null
    onErrorDismiss?.()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openPicker()
    }
  }
</script>

<div class="w-full">
  <div
    aria-label="File upload drop zone"
    class={cn(
      'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      !isDragActive &&
        !isDragReject &&
        !disabled &&
        'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5',
      isDragActive &&
        !isDragReject &&
        'border-primary bg-primary/10 scale-[1.02]',
      isDragReject && 'border-destructive bg-destructive/10',
      displayError && showShake && 'animate-shake',
      displayError && 'border-destructive/50',
      disabled && 'cursor-not-allowed opacity-50',
    )}
    role="button"
    tabindex={disabled ? -1 : 0}
    onkeydown={handleKeyDown}
    onclick={openPicker}
    ondragenter={handleDragEnter}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <input
      bind:this={fileInput}
      type="file"
      accept=".pdf,application/pdf"
      class="hidden"
      disabled={disabled}
      onchange={handleInputChange}
    />

    {#if isDragActive && !isDragReject}
      <div
        role="status"
        class="absolute inset-0 flex items-center justify-center animate-reveal"
      >
        <div class="flex flex-col items-center gap-2">
          <div class="rounded-full bg-primary/20 p-4">
            <Sparkles class="size-8 animate-pulse text-primary" />
          </div>
          <span class="text-lg font-medium text-primary">Drop it here!</span>
        </div>
      </div>
    {/if}

    {#if isDragReject}
      <div role="alert" class="absolute inset-0 flex items-center justify-center">
        <div class="flex flex-col items-center gap-2">
          <div class="rounded-full bg-destructive/20 p-4">
            <X class="size-8 text-destructive" />
          </div>
          <span class="text-lg font-medium text-destructive">PDF files only</span>
        </div>
      </div>
    {/if}

    <div
      class={cn(
        'flex flex-col items-center gap-4 transition-opacity duration-200',
        (isDragActive || isDragReject) && 'invisible opacity-0',
      )}
    >
      <div class="rounded-full bg-primary/10 p-4">
        <Upload class="size-8 text-primary" />
      </div>

      <div class="space-y-1">
        <h3 class="text-lg font-semibold">Drop your resume here</h3>
        <p class="text-sm text-muted-foreground">PDF up to 10MB</p>
      </div>

      <button
        type="button"
        class="mt-2 inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={disabled}
        onclick={(event) => {
          event.stopPropagation()
          openPicker()
        }}
      >
        <FileText class="mr-2 size-4" />
        Browse files
      </button>
    </div>
  </div>

  {#if displayError}
    <div
      role="alert"
      class={cn(
        'mt-3 flex items-center gap-2 text-sm text-destructive',
        showShake && 'animate-shake',
      )}
    >
      <AlertCircle class="size-4 shrink-0" />
      <span class="flex-1">{displayError}</span>
      <button
        type="button"
        class="inline-flex size-6 items-center justify-center rounded-sm transition-colors hover:bg-destructive/10"
        onclick={handleDismissError}
      >
        <X class="size-3" />
        <span class="sr-only">Dismiss error</span>
      </button>
    </div>
  {/if}
</div>
