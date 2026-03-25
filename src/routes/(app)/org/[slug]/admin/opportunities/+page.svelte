<script lang="ts">
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () => (slug ? { slug } : 'skip'))
  const membership = useQuery(api.orgs.membership.getMembership, () =>
    org.data ? { orgId: org.data._id } : 'skip',
  )
  const opportunities = useQuery(api.orgOpportunities.listAllByOrg, () =>
    org.data && membership.data?.role === 'admin' ? { orgId: org.data._id } : 'skip',
  )

  let title = $state('')
  let description = $state('')
  let type = $state<'job' | 'course' | 'fellowship' | 'other'>('job')
  let status = $state<'active' | 'closed' | 'draft'>('draft')
  let deadline = $state('')
  let externalUrl = $state('')
  let featured = $state(false)
  let creating = $state(false)

  const createOpportunity = async () => {
    if (!org.data) return
    creating = true
    try {
      await convex.mutation(api.orgOpportunities.create, {
        orgId: org.data._id,
        title: title.trim(),
        description: description.trim(),
        type,
        status,
        deadline: deadline ? new Date(`${deadline}T00:00:00`).getTime() : undefined,
        externalUrl: externalUrl.trim() || undefined,
        featured,
      })
      title = ''
      description = ''
      deadline = ''
      externalUrl = ''
      featured = false
      status = 'draft'
      type = 'job'
      toast.success('Opportunity created')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create opportunity')
    } finally {
      creating = false
    }
  }
</script>

<div class="space-y-6">
  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Org opportunities</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">Create and manage the opportunities attached to this organization.</p>
  </section>

  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <h2 class="text-lg font-semibold text-slate-950">Create opportunity</h2>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <input bind:value={title} class="rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Title" />
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
        <span>Featured opportunity</span>
      </label>
    </div>
    <textarea bind:value={description} rows="6" class="mt-4 w-full rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Description"></textarea>
    <button type="button" class="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={creating || !title.trim()} onclick={createOpportunity}>
      Create
    </button>
  </section>

  <div class="space-y-3">
    {#each opportunities.data ?? [] as opportunity (opportunity._id)}
      <article class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-slate-950">{opportunity.title}</h2>
              <span class="rounded-full border border-border px-3 py-1 text-xs font-medium text-slate-600">{opportunity.status}</span>
            </div>
            <p class="mt-2 text-sm text-slate-600">{opportunity.description}</p>
          </div>
          <div class="flex gap-2">
            <a href={`/org/${slug}/admin/opportunities/${opportunity._id}`} class="rounded-full border border-border px-4 py-2 text-sm font-medium text-slate-700">Manage</a>
            <a href={`/org/${slug}/admin/opportunities/${opportunity._id}/email`} class="rounded-full border border-border px-4 py-2 text-sm font-medium text-slate-700">Email</a>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>
