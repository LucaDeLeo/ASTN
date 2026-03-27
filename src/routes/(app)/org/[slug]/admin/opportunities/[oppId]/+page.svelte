<script lang="ts">
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { Link2 } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)
  const oppId = $derived(page.params.oppId as any)

  const opportunity = useQuery(api.orgOpportunities.get, () => ({ id: oppId }))
  const applicationCount = useQuery(api.opportunityApplications.getApplicationCount, () =>
    opportunity.data ? { opportunityId: opportunity.data._id } : 'skip',
  )

  let title = $state('')
  let description = $state('')
  let type = $state<'job' | 'course' | 'fellowship' | 'other'>('job')
  let status = $state<'active' | 'closed' | 'draft'>('draft')
  let deadline = $state('')
  let externalUrl = $state('')
  let featured = $state(false)

  $effect(() => {
    if (!opportunity.data) return
    title = opportunity.data.title
    description = opportunity.data.description
    type = opportunity.data.type
    status = opportunity.data.status
    deadline = opportunity.data.deadline
      ? new Date(opportunity.data.deadline).toISOString().slice(0, 10)
      : ''
    externalUrl = opportunity.data.externalUrl ?? ''
    featured = opportunity.data.featured
  })

  const save = async () => {
    if (!opportunity.data) return
    try {
      await convex.mutation(api.orgOpportunities.update, {
        id: opportunity.data._id,
        title: title.trim(),
        description: description.trim(),
        type,
        status,
        deadline: deadline ? new Date(`${deadline}T00:00:00`).getTime() : undefined,
        externalUrl: externalUrl.trim() || undefined,
        featured,
      })
      toast.success('Opportunity updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update opportunity')
    }
  }
</script>

{#if opportunity.data}
  <div class="space-y-6">
    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl text-slate-950">{opportunity.data.title}</h1>
          <p class="mt-2 text-sm text-slate-600">{applicationCount.data ?? 0} applications</p>
        </div>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          title="Copy application link"
          onclick={async () => {
            const opp = opportunity.data
            if (!opp) return
            const url = `${window.location.origin}/org/${slug}/apply/${opp._id}`
            try {
              await navigator.clipboard.writeText(url)
              toast.success('Application link copied')
            } catch {
              toast.error('Failed to copy link')
            }
          }}
        >
          <Link2 class="size-4" />
          Copy link
        </button>
        <a href={`/org/${slug}/admin/opportunities/${opportunity.data._id}/email`} class="rounded-full border border-border px-4 py-2 text-sm font-medium text-slate-700">Email applicants</a>
      </div>
    </section>

    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <div class="grid gap-4 md:grid-cols-2">
        <input bind:value={title} class="rounded-2xl border border-border px-4 py-3 text-sm" />
        <input bind:value={externalUrl} class="rounded-2xl border border-border px-4 py-3 text-sm" placeholder="External URL" />
        <select bind:value={type} class="rounded-2xl border border-border px-4 py-3 text-sm">
          <option value="job">Job</option>
          <option value="course">Course</option>
          <option value="fellowship">Fellowship</option>
          <option value="other">Other</option>
        </select>
        <select bind:value={status} class="rounded-2xl border border-border px-4 py-3 text-sm">
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <input bind:value={deadline} type="date" class="rounded-2xl border border-border px-4 py-3 text-sm" />
        <label class="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-slate-700">
          <input bind:checked={featured} type="checkbox" class="size-4" />
          <span>Featured</span>
        </label>
      </div>
      <textarea bind:value={description} rows="8" class="mt-4 w-full rounded-2xl border border-border px-4 py-3 text-sm"></textarea>
      <div class="mt-4 flex gap-3">
        <button type="button" class="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" onclick={save}>Save changes</button>
        <a href={`/org/${slug}/admin/applications`} class="rounded-full border border-border px-4 py-2 text-sm font-medium text-slate-700">Review applications</a>
      </div>
    </section>
  </div>
{:else}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">Opportunity not found.</div>
{/if}
