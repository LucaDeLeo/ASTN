<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'

  const convex = useConvexClient()
  let status = $state<'all' | 'pending' | 'approved' | 'rejected' | 'withdrawn'>('pending')

  const applications = useQuery(api.orgApplications.listAll, () => ({
    status: status === 'all' ? undefined : status,
  }))

  const approve = async (applicationId: Id<'orgApplications'>) => {
    try {
      await convex.mutation(api.orgApplications.approve, { applicationId })
      toast.success('Application approved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve')
    }
  }

  const reject = async (applicationId: Id<'orgApplications'>) => {
    const reason = window.prompt('Rejection reason')
    if (!reason) return
    try {
      await convex.mutation(api.orgApplications.reject, {
        applicationId,
        rejectionReason: reason,
      })
      toast.success('Application rejected')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject')
    }
  }
</script>

<section class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="font-display text-3xl text-slate-950">Organization applications</h1>
      <p class="mt-2 text-sm text-slate-600">Platform-wide review queue for new orgs.</p>
    </div>
    <select bind:value={status} class="rounded-full border border-border bg-white px-4 py-2 text-sm outline-none focus:border-coral-300">
      <option value="pending">Pending</option>
      <option value="all">All</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
      <option value="withdrawn">Withdrawn</option>
    </select>
  </div>

  <div class="space-y-3">
    {#each applications.data ?? [] as application (application._id)}
      <article class="rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-slate-950">{application.orgName}</h2>
              <span class="rounded-full border border-border px-3 py-1 text-xs font-medium text-slate-600">{application.status}</span>
            </div>
            <p class="text-sm text-slate-600">{application.description}</p>
            <p class="text-sm text-slate-500">
              {application.applicantName} · {application.applicantEmail} · {application.city}, {application.country}
            </p>
          </div>

          {#if application.status === 'pending'}
            <div class="flex gap-2">
              <button type="button" class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white" onclick={() => approve(application._id)}>
                Approve
              </button>
              <button type="button" class="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white" onclick={() => reject(application._id)}>
                Reject
              </button>
            </div>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</section>
