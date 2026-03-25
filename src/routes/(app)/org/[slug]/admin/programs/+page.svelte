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
  const programs = useQuery(api.programs.getOrgPrograms, () =>
    org.data && membership.data?.role === 'admin' ? { orgId: org.data._id } : 'skip',
  )

  let name = $state('')
  let description = $state('')
  let type = $state<'reading_group' | 'fellowship' | 'mentorship' | 'cohort' | 'workshop_series' | 'custom'>('reading_group')
  let enrollmentMethod = $state<'admin_only' | 'self_enroll' | 'approval_required'>('admin_only')
  let startDate = $state('')
  let endDate = $state('')

  const createProgram = async () => {
    if (!org.data) return
    try {
      await convex.mutation(api.programs.createProgram, {
        orgId: org.data._id,
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        enrollmentMethod,
        startDate: startDate ? new Date(`${startDate}T00:00:00`).getTime() : undefined,
        endDate: endDate ? new Date(`${endDate}T00:00:00`).getTime() : undefined,
      })
      toast.success('Program created')
      name = ''
      description = ''
      startDate = ''
      endDate = ''
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create program')
    }
  }
</script>

<div class="space-y-6">
  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Programs</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">Create cohorts, reading groups, and other structured programs.</p>
  </section>

  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <h2 class="text-lg font-semibold text-slate-950">Create program</h2>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <input bind:value={name} class="rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Program name" />
      <select bind:value={type} class="rounded-2xl border border-border px-4 py-3 text-sm">
        <option value="reading_group">Reading group</option>
        <option value="fellowship">Fellowship</option>
        <option value="mentorship">Mentorship</option>
        <option value="cohort">Cohort</option>
        <option value="workshop_series">Workshop series</option>
        <option value="custom">Custom</option>
      </select>
      <select bind:value={enrollmentMethod} class="rounded-2xl border border-border px-4 py-3 text-sm">
        <option value="admin_only">Admin only</option>
        <option value="self_enroll">Self enroll</option>
        <option value="approval_required">Approval required</option>
      </select>
      <input bind:value={startDate} type="date" class="rounded-2xl border border-border px-4 py-3 text-sm" />
      <input bind:value={endDate} type="date" class="rounded-2xl border border-border px-4 py-3 text-sm md:col-span-2" />
    </div>
    <textarea bind:value={description} rows="5" class="mt-4 w-full rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Program description"></textarea>
    <button type="button" class="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" onclick={createProgram}>Create program</button>
  </section>

  <div class="space-y-3">
    {#each programs.data ?? [] as program (program._id)}
      <a href={`/org/${slug}/admin/programs/${program._id}`} class="block rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-950">{program.name}</h2>
            <p class="mt-1 text-sm text-slate-600">{program.status} · {program.type}</p>
          </div>
          <span class="text-sm text-slate-500">Open</span>
        </div>
      </a>
    {/each}
  </div>
</div>
