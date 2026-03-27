<script lang="ts">
  import { useConvexClient } from 'convex-svelte'
  import { MessageCircleHeart, X } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'

  const convex = useConvexClient()

  let open = $state(false)
  let featureRequests = $state('')
  let bugReports = $state('')
  let submitting = $state(false)

  const close = () => {
    open = false
  }

  $effect(() => {
    const openDialog = () => {
      open = true
    }

    window.addEventListener('astn:open-feedback', openDialog)

    return () => {
      window.removeEventListener('astn:open-feedback', openDialog)
    }
  })

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault()

    if (!featureRequests.trim() && !bugReports.trim()) {
      toast.error('Please fill in at least one field')
      return
    }

    submitting = true

    try {
      await convex.mutation(api.feedback.submit, {
        featureRequests: featureRequests || undefined,
        bugReports: bugReports || undefined,
        page: window.location.pathname,
      })
      toast.success('Thanks for your feedback!')
      featureRequests = ''
      bugReports = ''
      close()
    } catch {
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      submitting = false
    }
  }
</script>

<button
  type="button"
  onclick={() => (open = true)}
  class="fixed right-5 z-50 flex size-12 items-center justify-center rounded-full bg-coral-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
  style="bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px))"
  aria-label="Share feedback"
>
  <MessageCircleHeart class="size-5" />
</button>

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-[60] bg-black/40"
    aria-label="Close feedback dialog"
    onclick={close}
  ></button>
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-foreground">Share Feedback</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Help us improve ASTN. All feedback is anonymous.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-md border border-border"
          aria-label="Close feedback dialog"
          onclick={close}
        >
          <X class="size-4" />
        </button>
      </div>

      <form class="mt-4 space-y-4" onsubmit={handleSubmit}>
        <label class="block space-y-2">
          <span class="text-sm font-medium text-foreground">Feature requests</span>
          <textarea
            bind:value={featureRequests}
            rows="3"
            placeholder="What would you like to see?"
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral-400"
          ></textarea>
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-foreground">Bug reports</span>
          <textarea
            bind:value={bugReports}
            rows="3"
            placeholder="What's not working?"
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-coral-400"
          ></textarea>
        </label>

        <div class="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            class="rounded-md bg-coral-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
