<script lang="ts">
  import { Globe, LoaderCircle } from 'lucide-svelte'

  const LINKEDIN_URL_PATTERN = /linkedin\.com\/in\//i

  function isValidLinkedInUrl(url: string): boolean {
    return LINKEDIN_URL_PATTERN.test(url.trim())
  }

  let {
    onSubmit,
    isLoading,
    error,
    onCancel,
  }: {
    onSubmit: (url: string) => void
    isLoading: boolean
    error?: string
    onCancel: () => void
  } = $props()

  let url = $state('')
  let validationError = $state<string | null>(null)
  let inputElement = $state<HTMLInputElement | null>(null)

  const displayError = $derived(validationError ?? error)

  $effect(() => {
    if (!isLoading && inputElement) {
      inputElement.focus()
    }
  })

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()

    const trimmed = url.trim()
    if (!trimmed) {
      validationError = 'Please enter a LinkedIn URL'
      return
    }

    if (!isValidLinkedInUrl(trimmed)) {
      validationError =
        'Please enter a valid LinkedIn profile URL (e.g. linkedin.com/in/your-name)'
      return
    }

    validationError = null
    onSubmit(trimmed)
  }
</script>

<div class="space-y-4">
  <div class="mb-2 flex items-center gap-3">
    <div
      class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]"
    >
      <Globe class="size-5" />
    </div>
    <div>
      <h3 class="font-medium">Import from LinkedIn</h3>
      <p class="text-sm text-muted-foreground">
        Paste your LinkedIn profile URL to import your experience
      </p>
    </div>
  </div>

  <form class="space-y-3" onsubmit={handleSubmit}>
    <div>
      <input
        type="text"
        bind:value={url}
        placeholder="https://linkedin.com/in/your-name"
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isLoading}
        bind:this={inputElement}
        oninput={() => {
          validationError = null
        }}
      />

      {#if displayError}
        <p class="mt-1.5 text-sm text-destructive">{displayError}</p>
      {/if}
    </div>

    <div class="flex gap-2">
      <button
        type="submit"
        class="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        disabled={isLoading || !url.trim()}
      >
        {#if isLoading}
          <LoaderCircle class="mr-2 size-4 animate-spin" />
          Importing profile...
        {:else}
          Import Profile
        {/if}
      </button>

      <button
        type="button"
        class="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        disabled={isLoading}
        onclick={onCancel}
      >
        Cancel
      </button>
    </div>
  </form>

  <p class="text-xs text-muted-foreground">
    Your LinkedIn profile must be public for import to work.
  </p>
</div>
