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
  const today = new Date().toISOString().slice(0, 10)
  const inThirtyDays = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
  const space = useQuery(api.coworkingSpaces.getSpaceByOrg, () =>
    org.data && membership.data?.role === 'admin' ? { orgId: org.data._id } : 'skip',
  )
  const utilization = useQuery(api.spaceBookings.admin.getSpaceUtilizationStats, () =>
    space.data
      ? {
          spaceId: space.data._id,
          startDate: today,
          endDate: inThirtyDays,
        }
      : 'skip',
  )

  const defaultHours = [
    { dayOfWeek: 0, isClosed: true, openMinutes: 540, closeMinutes: 1020 },
    { dayOfWeek: 1, isClosed: false, openMinutes: 540, closeMinutes: 1020 },
    { dayOfWeek: 2, isClosed: false, openMinutes: 540, closeMinutes: 1020 },
    { dayOfWeek: 3, isClosed: false, openMinutes: 540, closeMinutes: 1020 },
    { dayOfWeek: 4, isClosed: false, openMinutes: 540, closeMinutes: 1020 },
    { dayOfWeek: 5, isClosed: false, openMinutes: 540, closeMinutes: 1020 },
    { dayOfWeek: 6, isClosed: true, openMinutes: 540, closeMinutes: 1020 },
  ]

  let name = $state('')
  let capacity = $state(12)
  let timezone = $state('UTC')
  let description = $state('')
  let address = $state('')
  let guestAccessEnabled = $state(false)

  $effect(() => {
    if (!space.data) return
    name = space.data.name
    capacity = space.data.capacity
    timezone = space.data.timezone
    description = space.data.description ?? ''
    address = space.data.address ?? ''
    guestAccessEnabled = space.data.guestAccessEnabled ?? false
  })

  const save = async () => {
    try {
      if (space.data) {
        await convex.mutation(api.coworkingSpaces.updateSpace, {
          spaceId: space.data._id,
          name,
          capacity,
          timezone,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          guestAccessEnabled,
        })
      } else if (org.data) {
        await convex.mutation(api.coworkingSpaces.createSpace, {
          orgId: org.data._id,
          name,
          capacity,
          timezone,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          guestAccessEnabled,
          operatingHours: defaultHours,
        })
      }
      toast.success('Space saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save space')
    }
  }
</script>

<div class="space-y-6">
  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Co-working space</h1>
    <p class="mt-3 text-sm leading-6 text-slate-600">Configure the public space listing and review usage.</p>
  </section>

  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <div class="grid gap-4 md:grid-cols-2">
      <input bind:value={name} class="rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Space name" />
      <input bind:value={capacity} type="number" min="1" class="rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Capacity" />
      <input bind:value={timezone} class="rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Timezone" />
      <input bind:value={address} class="rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Address" />
    </div>
    <textarea bind:value={description} rows="6" class="mt-4 w-full rounded-2xl border border-border px-4 py-3 text-sm" placeholder="Description"></textarea>
    <label class="mt-4 flex items-center gap-3 text-sm text-slate-700">
      <input bind:checked={guestAccessEnabled} type="checkbox" class="size-4" />
      <span>Allow guest visits</span>
    </label>
    <button type="button" class="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" onclick={save}>
      {space.data ? 'Save space' : 'Create space'}
    </button>
  </section>

  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <h2 class="text-lg font-semibold text-slate-950">Usage snapshot</h2>
    <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(utilization.data ?? {}, null, 2)}</pre>
  </section>
</div>
