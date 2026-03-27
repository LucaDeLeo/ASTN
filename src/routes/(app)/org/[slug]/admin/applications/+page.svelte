<script lang="ts">
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import AdminSection from '~/components/org-admin/core/AdminSection.svelte'

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  let selectedOpportunityId = $state<string | null>(null)
  let statusFilter = $state<'all' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted'>('all')

  const org = useQuery(api.orgs.directory.getOrgBySlug, () => (slug ? { slug } : 'skip'))
  const membership = useQuery(api.orgs.membership.getMembership, () =>
    org.data ? { orgId: org.data._id } : 'skip',
  )
  const opportunities = useQuery(api.orgOpportunities.listAllByOrg, () =>
    org.data && membership.data?.role === 'admin' ? { orgId: org.data._id } : 'skip',
  )

  $effect(() => {
    if (!selectedOpportunityId && opportunities.data?.length) {
      selectedOpportunityId = opportunities.data[0]._id
    }
  })

  const applications = useQuery(api.opportunityApplications.listByOpportunity, () =>
    selectedOpportunityId
      ? {
          opportunityId: selectedOpportunityId as any,
          statusFilter: statusFilter === 'all' ? undefined : statusFilter,
        }
      : 'skip',
  )

  const updateStatus = async (applicationId: string, nextStatus: typeof statusFilter) => {
    if (nextStatus === 'all') return
    try {
      await convex.mutation(api.opportunityApplications.updateStatus, {
        applicationId: applicationId as any,
        status: nextStatus,
      })
      toast.success('Application updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update application')
    }
  }
</script>

<div class="space-y-6">
  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
    <p class="text-xs font-semibold uppercase tracking-[0.22em] text-coral-600">Applications</p>
    <h1 class="mt-2 font-display text-3xl text-slate-950">Opportunity applications</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">Review applicant responses and update decisions for each opportunity.</p>
  </section>

  <AdminSection title="Queue controls">
    <div class="grid gap-4 md:grid-cols-2">
      <label class="space-y-2">
        <span class="text-sm font-medium text-slate-700">Opportunity</span>
        <select bind:value={selectedOpportunityId} class="w-full rounded-2xl border border-border px-4 py-3 text-sm">
          {#each opportunities.data ?? [] as opportunity}
            <option value={opportunity._id}>{opportunity.title}</option>
          {/each}
        </select>
      </label>
      <label class="space-y-2">
        <span class="text-sm font-medium text-slate-700">Status</span>
        <select bind:value={statusFilter} class="w-full rounded-2xl border border-border px-4 py-3 text-sm">
          <option value="all">All</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="waitlisted">Waitlisted</option>
        </select>
      </label>
    </div>
  </AdminSection>

  <div class="space-y-3">
    {#each applications.data ?? [] as application (application._id)}
      <article class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-950">{application.guestEmail || application.userId || 'Applicant'}</h2>
            <p class="mt-1 text-sm text-slate-600">Submitted {new Date(application.submittedAt).toLocaleString()}</p>
            <pre class="mt-3 overflow-x-auto rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(application.responses, null, 2)}</pre>
          </div>
          <div class="space-y-2">
            <span class="block rounded-full border border-border px-3 py-1 text-center text-xs font-medium text-slate-600">{application.status}</span>
            <select
              class="w-full rounded-full border border-border px-3 py-2 text-sm"
              value={application.status}
              onchange={(event) => updateStatus(application._id, event.currentTarget.value as any)}
            >
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="waitlisted">Waitlisted</option>
            </select>
          </div>
        </div>
      </article>
    {/each}
  </div>
</div>
