<script lang="ts">
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  const convex = useConvexClient()
  const oppId = $derived(page.params.oppId as any)

  const opportunity = useQuery(api.orgOpportunities.get, () => ({ id: oppId }))

  let subject = $state('')
  let markdownBody = $state('')
  let includeSubmitted = $state(true)
  let includeUnderReview = $state(true)
  let includeAccepted = $state(true)
  let includeWaitlisted = $state(false)
  let sending = $state(false)

  const send = async () => {
    if (!opportunity.data) return

    const statuses = [
      includeSubmitted ? 'submitted' : null,
      includeUnderReview ? 'under_review' : null,
      includeAccepted ? 'accepted' : null,
      includeWaitlisted ? 'waitlisted' : null,
    ].filter(Boolean)

    sending = true
    try {
      const result = await convex.action(api.emails.adminBroadcastAction.sendBroadcastToApplicants, {
        opportunityId: opportunity.data._id,
        statuses: statuses as any,
        subject: subject.trim(),
        markdownBody: markdownBody.trim(),
      })
      toast.success(`Sent ${result.sent} emails`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send broadcast')
    } finally {
      sending = false
    }
  }
</script>

<section class="space-y-6">
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Email applicants</h1>
    <p class="mt-2 text-sm text-slate-600">{opportunity.data?.title || 'Opportunity'} broadcast composer.</p>
  </div>

  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <label class="block space-y-2">
      <span class="text-sm font-medium text-slate-700">Subject</span>
      <input bind:value={subject} class="w-full rounded-2xl border border-border px-4 py-3 text-sm" />
    </label>

    <div class="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
      <label class="flex items-center gap-2"><input bind:checked={includeSubmitted} type="checkbox" class="size-4" /> Submitted</label>
      <label class="flex items-center gap-2"><input bind:checked={includeUnderReview} type="checkbox" class="size-4" /> Under review</label>
      <label class="flex items-center gap-2"><input bind:checked={includeAccepted} type="checkbox" class="size-4" /> Accepted</label>
      <label class="flex items-center gap-2"><input bind:checked={includeWaitlisted} type="checkbox" class="size-4" /> Waitlisted</label>
    </div>

    <label class="mt-4 block space-y-2">
      <span class="text-sm font-medium text-slate-700">Markdown body</span>
      <textarea bind:value={markdownBody} rows="14" class="w-full rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Write the broadcast in Markdown"></textarea>
    </label>

    <button type="button" class="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={sending || !subject.trim() || !markdownBody.trim()} onclick={send}>
      Send broadcast
    </button>
  </section>
</section>
