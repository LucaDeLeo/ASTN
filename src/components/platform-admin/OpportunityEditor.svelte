<script lang="ts">
  import { goto } from '$app/navigation'
  import { toast } from 'svelte-sonner'
  import { useConvexClient } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'

  type OpportunityRecord = {
    _id?: Id<'opportunities'>
    title?: string
    organization?: string
    location?: string
    isRemote?: boolean
    roleType?: string
    experienceLevel?: string
    description?: string
    requirements?: string[]
    salaryRange?: string
    deadline?: number
    sourceUrl?: string
    organizationLogoUrl?: string
    status?: 'active' | 'archived'
  }

  let {
    mode,
    initialData = {},
  }: {
    mode: 'create' | 'edit'
    initialData?: OpportunityRecord
  } = $props()

  const convex = useConvexClient()

  let title = $state('')
  let organization = $state('')
  let location = $state('')
  let isRemote = $state(false)
  let roleType = $state('research')
  let experienceLevel = $state('')
  let description = $state('')
  let requirements = $state('')
  let salaryRange = $state('')
  let deadline = $state('')
  let sourceUrl = $state('')
  let organizationLogoUrl = $state('')
  let status = $state<'active' | 'archived'>('active')
  let saving = $state(false)

  $effect(() => {
    title = initialData.title ?? ''
    organization = initialData.organization ?? ''
    location = initialData.location ?? ''
    isRemote = initialData.isRemote ?? false
    roleType = initialData.roleType ?? 'research'
    experienceLevel = initialData.experienceLevel ?? ''
    description = initialData.description ?? ''
    requirements = (initialData.requirements ?? []).join('\n')
    salaryRange = initialData.salaryRange ?? ''
    deadline = initialData.deadline
      ? new Date(initialData.deadline).toISOString().slice(0, 10)
      : ''
    sourceUrl = initialData.sourceUrl ?? ''
    organizationLogoUrl = initialData.organizationLogoUrl ?? ''
    status = initialData.status ?? 'active'
  })

  const save = async () => {
    saving = true
    try {
      const payload = {
        title: title.trim(),
        organization: organization.trim(),
        location: location.trim(),
        isRemote,
        roleType,
        experienceLevel: experienceLevel.trim() || undefined,
        description: description.trim(),
        requirements: requirements
          .split('\n')
          .map((value) => value.trim())
          .filter(Boolean),
        salaryRange: salaryRange.trim() || undefined,
        deadline: deadline ? new Date(`${deadline}T00:00:00`).getTime() : undefined,
        sourceUrl: sourceUrl.trim(),
        organizationLogoUrl: organizationLogoUrl.trim() || undefined,
      }

      if (mode === 'create') {
        await convex.mutation(api.admin.createOpportunity, payload)
        toast.success('Opportunity created')
      } else if (initialData._id) {
        await convex.mutation(api.admin.updateOpportunity, {
          id: initialData._id,
          ...payload,
          status,
        })
        toast.success('Opportunity updated')
      }

      void goto('/admin/opportunities')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save opportunity')
    } finally {
      saving = false
    }
  }
</script>

<section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
  <div class="grid gap-4 md:grid-cols-2">
    <label class="space-y-2">
      <span class="text-sm font-medium text-slate-700">Title</span>
      <input bind:value={title} class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
    </label>
    <label class="space-y-2">
      <span class="text-sm font-medium text-slate-700">Organization</span>
      <input bind:value={organization} class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
    </label>
    <label class="space-y-2">
      <span class="text-sm font-medium text-slate-700">Location</span>
      <input bind:value={location} class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
    </label>
    <label class="space-y-2">
      <span class="text-sm font-medium text-slate-700">Role type</span>
      <input bind:value={roleType} class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
    </label>
    <label class="space-y-2">
      <span class="text-sm font-medium text-slate-700">Experience level</span>
      <input bind:value={experienceLevel} class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
    </label>
    <label class="space-y-2">
      <span class="text-sm font-medium text-slate-700">Deadline</span>
      <input bind:value={deadline} type="date" class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
    </label>
    <label class="space-y-2">
      <span class="text-sm font-medium text-slate-700">Source URL</span>
      <input bind:value={sourceUrl} class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
    </label>
    <label class="space-y-2">
      <span class="text-sm font-medium text-slate-700">Salary range</span>
      <input bind:value={salaryRange} class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
    </label>
  </div>

  <label class="mt-4 flex items-center gap-3 text-sm text-slate-700">
    <input bind:checked={isRemote} type="checkbox" class="size-4 rounded border-border" />
    <span>Remote friendly</span>
  </label>

  {#if mode === 'edit'}
    <label class="mt-4 block space-y-2">
      <span class="text-sm font-medium text-slate-700">Status</span>
      <select bind:value={status} class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100">
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
    </label>
  {/if}

  <label class="mt-4 block space-y-2">
    <span class="text-sm font-medium text-slate-700">Description</span>
    <textarea bind:value={description} rows="8" class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100"></textarea>
  </label>

  <label class="mt-4 block space-y-2">
    <span class="text-sm font-medium text-slate-700">Requirements</span>
    <textarea bind:value={requirements} rows="6" class="w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" placeholder="One requirement per line"></textarea>
  </label>

  <div class="mt-5 flex gap-3">
    <button type="button" class="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60" disabled={saving} onclick={save}>
      {mode === 'create' ? 'Create opportunity' : 'Save changes'}
    </button>
    <a href="/admin/opportunities" class="rounded-full border border-border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
      Cancel
    </a>
  </div>
</section>
