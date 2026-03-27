<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import FacilitatorAgentProvider from '~/components/facilitator-agent/FacilitatorAgentProvider.svelte'
  import FacilitatorAgentSidebar from '~/components/facilitator-agent/FacilitatorAgentSidebar.svelte'
  import FacilitatorSidebarAwareWrapper from '~/components/facilitator-agent/FacilitatorSidebarAwareWrapper.svelte'
  import { getAdminAgentContext } from '$lib/stores/admin-agent.svelte'

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)
  const programId = $derived(page.params.programId as any)
  const adminAgent = getAdminAgentContext()

  const program = useQuery(api.programs.getProgram, () => ({ programId }))
  const participants = useQuery(api.programs.getProgramParticipants, () => ({ programId }))
  const modules = useQuery(api.programs.getProgramModules, () => ({ programId }))
  const sessions = useQuery(api.programs.getProgramSessions, () => ({ programId }))
  const attendance = useQuery(api.course.facilitatorQueries.getAttendanceSummary, () => ({ programId }))
  const responseCounts = useQuery(api.course.facilitatorQueries.getResponseCounts, () => ({ programId }))

  let name = $state('')
  let description = $state('')
  let status = $state<'planning' | 'active' | 'completed' | 'archived'>('planning')

  $effect(() => {
    if (!program.data) return
    name = program.data.name
    description = program.data.description ?? ''
    status = program.data.status
  })

  const save = async () => {
    try {
      await convex.mutation(api.programs.updateProgram, {
        programId,
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      })
      toast.success('Program updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update program')
    }
  }

  onMount(() => {
    adminAgent.close()
  })
</script>

<FacilitatorAgentProvider orgSlug={slug ?? ''} programId={programId}>
  <FacilitatorSidebarAwareWrapper>
    {#if program.data}
      <div class="space-y-6">
        <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 class="font-display text-3xl text-slate-950">{program.data.name}</h1>
              <p class="mt-2 text-sm text-slate-600">{participants.data?.length ?? 0} participants · {modules.data?.length ?? 0} modules · {sessions.data?.length ?? 0} sessions</p>
            </div>
            <div class="flex flex-wrap gap-2">
              {#if sessions.data?.length}
                <a href={`/org/${slug}/admin/programs/${program.data._id}/session-runner?sessionId=${sessions.data[0]._id}`} class="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white">Open session runner</a>
              {/if}
            </div>
          </div>
        </section>

        <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <div class="grid gap-4 md:grid-cols-2">
            <input bind:value={name} class="rounded-2xl border border-border px-4 py-3 text-sm" />
            <select bind:value={status} class="rounded-2xl border border-border px-4 py-3 text-sm">
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <textarea bind:value={description} rows="6" class="mt-4 w-full rounded-2xl border border-border px-4 py-3 text-sm"></textarea>
          <button type="button" class="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" onclick={save}>Save changes</button>
        </section>

        <div class="grid gap-6 xl:grid-cols-2">
          <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <h2 class="text-lg font-semibold text-slate-950">Participants</h2>
            <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(participants.data ?? [], null, 2)}</pre>
          </section>
          <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <h2 class="text-lg font-semibold text-slate-950">Modules</h2>
            <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(modules.data ?? [], null, 2)}</pre>
          </section>
        </div>

        <div class="grid gap-6 xl:grid-cols-2">
          <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <h2 class="text-lg font-semibold text-slate-950">Attendance summary</h2>
            <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(attendance.data ?? [], null, 2)}</pre>
          </section>
          <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
            <h2 class="text-lg font-semibold text-slate-950">Prompt response counts</h2>
            <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(responseCounts.data ?? [], null, 2)}</pre>
          </section>
        </div>
      </div>
    {:else}
      <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">Program not found.</div>
    {/if}
  </FacilitatorSidebarAwareWrapper>
  <FacilitatorAgentSidebar />
</FacilitatorAgentProvider>
