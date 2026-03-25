<script lang="ts">
  import { api } from '$convex/_generated/api'
  import { useConvexClient } from 'convex-svelte'

  let { open = false, onConsented = () => {} }: {
    open?: boolean
    onConsented?: () => void
  } = $props()

  const convex = useConvexClient()

  let agreed = $state(false)
  let submitting = $state(false)

  const handleConsent = async () => {
    if (!agreed || submitting) return

    submitting = true
    try {
      await convex.mutation(api.consent.recordConsent, {})
      onConsented()
      agreed = false
    } finally {
      submitting = false
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm">
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="w-full max-w-xl rounded-[1.75rem] border border-border/70 bg-white p-6 shadow-2xl">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-slate-950">Before we begin</h2>
          <p class="text-sm leading-6 text-slate-600">
            ASTN uses AI to help build your profile and match you with opportunities.
            Please review how we handle your data.
          </p>
        </div>

        <div class="mt-5 space-y-3 text-sm leading-6 text-slate-600">
          <p>
            We process your profile information, authentication data, and uploaded
            documents to power profile enrichment, career matching, and personalized
            recommendations.
          </p>
          <p>
            We use Convex for data, Clerk for authentication, and Anthropic for AI.
            We do not sell your data.
          </p>
          <p>
            Full details are available in the
            <a class="font-medium text-coral-700 hover:text-coral-800" href="/privacy" target="_blank" rel="noreferrer">
              privacy policy
            </a>
            and
            <a class="font-medium text-coral-700 hover:text-coral-800" href="/terms" target="_blank" rel="noreferrer">
              terms of use
            </a>.
          </p>
        </div>

        <label class="mt-6 flex items-start gap-3 rounded-2xl border border-border/70 bg-slate-50 px-4 py-3">
          <input bind:checked={agreed} class="mt-1 size-4" type="checkbox" />
          <span class="text-sm text-slate-700">
            I have read and agree to the Privacy Policy and Terms of Use.
          </span>
        </label>

        <div class="mt-5 flex justify-end gap-3">
          <button
            class="rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!agreed || submitting}
            onclick={handleConsent}
            type="button"
          >
            {submitting ? 'Saving...' : 'I agree and continue'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
