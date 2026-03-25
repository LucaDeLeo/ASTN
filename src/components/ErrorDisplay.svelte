<script lang="ts">
  let {
    error,
    reset = () => window.location.reload(),
  }: {
    error: Partial<App.Error> & { message?: string }
    reset?: () => void
  } = $props()

  const getFriendlyMessage = () =>
    error.message ??
    'An unexpected error occurred. Please try again or go back to the home page.'
</script>

<main class="container mx-auto px-4 py-16">
  <div class="mx-auto max-w-md text-center">
    <h1 class="text-2xl font-bold text-slate-900">Something went wrong</h1>
    <p class="mt-2 text-slate-600">{getFriendlyMessage()}</p>
    {#if import.meta.env.DEV && error.message}
      <pre
        class="mt-4 overflow-auto rounded bg-slate-100 p-4 text-left text-xs text-slate-700"
      >
{error.message}
      </pre>
    {/if}
    <div class="mt-6 flex justify-center gap-3">
      <button
        onclick={reset}
        class="rounded-md bg-coral-500 px-4 py-2 text-sm font-medium text-white hover:bg-coral-600"
      >
        Try again
      </button>
      <a
        href="/"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Go home
      </a>
    </div>
  </div>
</main>
