<script lang="ts">
  import { TriangleAlert, Trash2, X } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { useConvexClient } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'

  const convex = useConvexClient()
  const clerkContext = getClerkContext()

  let confirmOpen = $state(false)
  let deleting = $state(false)

  const close = () => {
    if (!deleting) {
      confirmOpen = false
    }
  }

  const deleteAllData = async () => {
    deleting = true

    try {
      await convex.mutation(api.accountDeletion.deleteAllMyData, {})
      toast.success('All account data deleted')
      await clerkContext.clerk.signOut()
    } catch (error) {
      console.error('Failed to delete account data:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete data',
      )
      deleting = false
    }
  }
</script>

<section class="rounded-[1.75rem] border border-rose-200 bg-white/92 shadow-warm-sm">
  <div class="border-b border-rose-100 px-6 py-5">
    <div class="flex items-center gap-3">
      <div class="flex size-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
        <Trash2 class="size-5" />
      </div>
      <div>
        <h2 class="text-lg font-semibold text-rose-700">Delete All Data</h2>
        <p class="mt-1 text-sm text-slate-600">
          Permanently delete your profile, matches, uploads, bookings, and
          other account data. You will be signed out immediately.
        </p>
      </div>
    </div>
  </div>

  <div class="px-6 py-6">
    <button
      type="button"
      disabled={deleting}
      onclick={() => {
        confirmOpen = true
      }}
      class="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {#if deleting}
        Deleting...
      {:else}
        Delete all my data
      {/if}
    </button>
  </div>
</section>

{#if confirmOpen}
  <button
    type="button"
    class="fixed inset-0 z-[60] bg-black/45"
    aria-label="Close delete confirmation"
    onclick={close}
  ></button>

  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="w-full max-w-lg rounded-[1.75rem] border border-rose-200 bg-background p-6 shadow-2xl">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <div class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <TriangleAlert class="size-5" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-950">
              Delete all account data?
            </h3>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              This permanently deletes your profile, matches, career actions,
              uploaded documents, bookings, and notification history. This
              cannot be undone.
            </p>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex size-9 items-center justify-center rounded-md border border-border text-slate-500"
          aria-label="Close delete confirmation"
          onclick={close}
        >
          <X class="size-4" />
        </button>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={deleting}
          onclick={close}
          class="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={deleting}
          onclick={() => {
            void deleteAllData()
          }}
          class="inline-flex min-w-40 items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {#if deleting}
            Deleting...
          {:else}
            Yes, delete everything
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
