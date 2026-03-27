<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  const slug = $derived(page.params.slug ?? null)
  const today = new Date().toISOString().slice(0, 10)
  const inThirtyDays = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () => (slug ? { slug } : 'skip'))
  const membership = useQuery(api.orgs.membership.getMembership, () =>
    org.data ? { orgId: org.data._id } : 'skip',
  )
  const space = useQuery(api.coworkingSpaces.getSpaceByOrg, () =>
    org.data && membership.data?.role === 'admin' ? { orgId: org.data._id } : 'skip',
  )
  const bookings = useQuery(api.spaceBookings.admin.getAdminBookingsForDateRange, () =>
    space.data
      ? {
          spaceId: space.data._id,
          startDate: today,
          endDate: inThirtyDays,
          status: 'all' as const,
        }
      : 'skip',
  )
</script>

<section class="space-y-6">
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Bookings</h1>
    <p class="mt-2 text-sm text-slate-600">Upcoming bookings over the next 30 days.</p>
  </div>

  <pre class="overflow-x-auto rounded-[1.75rem] border border-border/70 bg-white/92 p-6 text-xs text-slate-700 shadow-warm-sm">{JSON.stringify(bookings.data ?? {}, null, 2)}</pre>
</section>
